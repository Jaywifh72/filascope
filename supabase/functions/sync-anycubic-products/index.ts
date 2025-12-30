/**
 * ANYCUBIC BRAND-SPECIFIC SYNC WRAPPER
 * 
 * A dedicated sync function for Anycubic that:
 * 1. Calls the generic sync-brand-products function
 * 2. Applies Anycubic-specific post-processing:
 *    - Auto-assign TDS URLs via pattern matching
 *    - Apply default print settings for known materials
 *    - Extract finish types from titles
 *    - Fix color hex inconsistencies
 *    - Validate and fix duplicate hex codes
 * 
 * This ensures Anycubic products meet all schema and data quality standards.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  enrichAnycubicProduct,
  matchAnycubicTds,
  getAnycubicPrintSettings,
  extractFinishType,
  normalizeAnycubicMaterial,
  getAnycubicColorHex,
} from '../_shared/anycubic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  dryRun?: boolean;
  limit?: number;
  regions?: string[];
  forceEnrichment?: boolean;
  tasks?: ('sync' | 'enrich' | 'tds' | 'colors' | 'settings')[];
}

interface EnrichmentResult {
  id: string;
  title: string;
  changes: string[];
  tdsFound: boolean;
  settingsApplied: boolean;
  colorFixed: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-SYNC] 🚀 ANYCUBIC BRAND SYNC STARTED');
  console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    const {
      dryRun = false,
      limit = 500,
      forceEnrichment = false,
      tasks = ['sync', 'enrich'],
    } = body;

    let syncResult: any = null;
    const enrichmentResults: EnrichmentResult[] = [];
    let tdsFound = 0;
    let settingsApplied = 0;
    let colorsFixed = 0;
    let duplicatesFixed = 0;

    // =========================================================================
    // STEP 1: Run base sync (if requested)
    // =========================================================================
    if (tasks.includes('sync')) {
      console.log('[ANYCUBIC-SYNC] Step 1: Running base sync via sync-brand-products...');
      
      try {
        // Call the generic sync function
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-brand-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            brandSlug: 'anycubic',
            dryRun,
            limit,
            regions: body.regions || ['US'],
          }),
        });

        if (syncResponse.ok) {
          syncResult = await syncResponse.json();
          console.log(`[ANYCUBIC-SYNC] Base sync complete:`, syncResult.summary);
        } else {
          const errorText = await syncResponse.text();
          console.error('[ANYCUBIC-SYNC] Base sync failed:', errorText);
        }
      } catch (err) {
        console.error('[ANYCUBIC-SYNC] Base sync error:', err);
      }
    }

    // =========================================================================
    // STEP 2: Apply Anycubic-specific enrichments
    // =========================================================================
    if (tasks.includes('enrich') || tasks.includes('tds') || tasks.includes('colors') || tasks.includes('settings')) {
      console.log('[ANYCUBIC-SYNC] Step 2: Applying Anycubic-specific enrichments...');

      // Fetch Anycubic filaments that need enrichment
      let query = supabase
        .from('filaments')
        .select('id, product_title, tds_url, material, finish_type, color_hex, color_family, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, high_speed_capable, is_nozzle_abrasive')
        .ilike('vendor', '%anycubic%')
        .limit(limit);

      // If not forcing, only get products that need enrichment
      if (!forceEnrichment) {
        query = query.or('tds_url.is.null,nozzle_temp_min_c.is.null,color_hex.is.null,finish_type.is.null');
      }

      const { data: filaments, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
      }

      console.log(`[ANYCUBIC-SYNC] Found ${filaments?.length || 0} filaments to enrich`);

      for (const filament of filaments || []) {
        const changes: string[] = [];
        const updateData: Record<string, any> = {};

        // Apply enrichment
        const enrichment = enrichAnycubicProduct(
          filament.product_title,
          filament.material,
          filament.tds_url,
          filament.nozzle_temp_min_c,
          filament.nozzle_temp_max_c,
          filament.bed_temp_min_c,
          filament.bed_temp_max_c
        );

        // TDS URL
        if (!filament.tds_url && enrichment.tdsUrl && (tasks.includes('enrich') || tasks.includes('tds'))) {
          updateData.tds_url = enrichment.tdsUrl;
          changes.push(`TDS: ${enrichment.tdsSource}`);
          tdsFound++;
        }

        // Print settings
        if (tasks.includes('enrich') || tasks.includes('settings')) {
          if (!filament.nozzle_temp_min_c && enrichment.nozzleTempMin) {
            updateData.nozzle_temp_min_c = enrichment.nozzleTempMin;
            changes.push(`nozzle_min: ${enrichment.nozzleTempMin}`);
          }
          if (!filament.nozzle_temp_max_c && enrichment.nozzleTempMax) {
            updateData.nozzle_temp_max_c = enrichment.nozzleTempMax;
            changes.push(`nozzle_max: ${enrichment.nozzleTempMax}`);
          }
          if (!filament.bed_temp_min_c && enrichment.bedTempMin) {
            updateData.bed_temp_min_c = enrichment.bedTempMin;
            changes.push(`bed_min: ${enrichment.bedTempMin}`);
          }
          if (!filament.bed_temp_max_c && enrichment.bedTempMax) {
            updateData.bed_temp_max_c = enrichment.bedTempMax;
            changes.push(`bed_max: ${enrichment.bedTempMax}`);
          }
          
          if (Object.keys(updateData).some(k => k.includes('temp'))) {
            settingsApplied++;
          }
        }

        // Finish type
        if (!filament.finish_type && enrichment.finishType !== 'Standard' && (tasks.includes('enrich'))) {
          updateData.finish_type = enrichment.finishType;
          changes.push(`finish: ${enrichment.finishType}`);
        }

        // Material normalization
        if (!filament.material && enrichment.material && (tasks.includes('enrich'))) {
          updateData.material = enrichment.material;
          changes.push(`material: ${enrichment.material}`);
        }

        // High speed flag
        if (enrichment.highSpeedCapable && !filament.high_speed_capable) {
          updateData.high_speed_capable = true;
          changes.push('high_speed: true');
        }

        // Abrasive nozzle flag
        if (enrichment.isAbrasive && !filament.is_nozzle_abrasive) {
          updateData.is_nozzle_abrasive = true;
          changes.push('abrasive: true');
        }

        // Color hex fix
        if (!filament.color_hex && (tasks.includes('enrich') || tasks.includes('colors'))) {
          // Try Anycubic-specific colors first
          const colorName = extractColorFromTitle(filament.product_title);
          if (colorName) {
            const anycubicHex = getAnycubicColorHex(colorName);
            const genericHex = anycubicHex || getColorHex(colorName);
            if (genericHex) {
              updateData.color_hex = `#${genericHex}`;
              changes.push(`color: ${colorName} → #${genericHex}`);
              colorsFixed++;
            }
          }
        }

        // Color family fix
        if (!filament.color_family && filament.color_hex && (tasks.includes('enrich') || tasks.includes('colors'))) {
          const colorName = extractColorFromTitle(filament.product_title);
          if (colorName) {
            const family = getColorFamily(colorName);
            if (family) {
              updateData.color_family = family;
              changes.push(`family: ${family}`);
            }
          }
        }

        // Apply updates if not dry run
        if (Object.keys(updateData).length > 0) {
          if (!dryRun) {
            updateData.updated_at = new Date().toISOString();
            
            const { error: updateError } = await supabase
              .from('filaments')
              .update(updateData)
              .eq('id', filament.id);

            if (updateError) {
              console.error(`[ANYCUBIC-SYNC] Update failed for ${filament.id}:`, updateError.message);
              changes.push(`ERROR: ${updateError.message}`);
            }
          }

          enrichmentResults.push({
            id: filament.id,
            title: filament.product_title,
            changes,
            tdsFound: !!updateData.tds_url,
            settingsApplied: Object.keys(updateData).some(k => k.includes('temp')),
            colorFixed: !!updateData.color_hex,
          });
        }
      }
    }

    // =========================================================================
    // STEP 3: Fix duplicate hex codes
    // =========================================================================
    if (!dryRun && (tasks.includes('enrich') || tasks.includes('colors'))) {
      console.log('[ANYCUBIC-SYNC] Step 3: Validating and fixing duplicate hex codes...');
      
      try {
        const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
          p_vendor: 'Anycubic',
        });

        if (duplicates && duplicates.length > 0) {
          console.log(`[ANYCUBIC-SYNC] Found ${duplicates.length} products with duplicate hex codes`);
          
          // Group by product_line_id
          const grouped = new Map<string, typeof duplicates>();
          for (const dup of duplicates) {
            const key = dup.product_line_id;
            if (!grouped.has(key)) {
              grouped.set(key, []);
            }
            grouped.get(key)!.push(dup);
          }

          // Fix each group
          for (const [productLineId, products] of grouped) {
            for (let i = 0; i < products.length; i++) {
              if (i === 0) continue; // Keep first one as-is
              
              const product = products[i];
              const originalHex = product.color_hex || '#CCCCCC';
              
              // Generate deterministic hash-based hex
              const hash = simpleHash(product.id + product.product_title);
              const newHex = `#${hash.slice(0, 6).toUpperCase()}`;
              
              const { error } = await supabase
                .from('filaments')
                .update({ color_hex: newHex })
                .eq('id', product.id);

              if (!error) {
                duplicatesFixed++;
                console.log(`[ANYCUBIC-SYNC] Fixed duplicate: ${product.product_title.slice(0, 40)} ${originalHex} → ${newHex}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('[ANYCUBIC-SYNC] Duplicate fix error:', err);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-SYNC] ✅ COMPLETED in ${duration}s`);
    console.log(`[ANYCUBIC-SYNC] TDS Found: ${tdsFound}, Settings Applied: ${settingsApplied}`);
    console.log(`[ANYCUBIC-SYNC] Colors Fixed: ${colorsFixed}, Duplicates Fixed: ${duplicatesFixed}`);
    console.log('[ANYCUBIC-SYNC] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      duration,
      sync: syncResult?.summary || null,
      enrichment: {
        processed: enrichmentResults.length,
        tdsFound,
        settingsApplied,
        colorsFixed,
        duplicatesFixed,
        details: enrichmentResults.slice(0, 50), // Limit response size
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANYCUBIC-SYNC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract color name from product title
 */
function extractColorFromTitle(title: string): string | null {
  if (!title) return null;
  
  // Common patterns: "PLA Black", "PETG - Blue", "Silk PLA Gold"
  const titleLower = title.toLowerCase();
  
  // Remove material types to find color
  const withoutMaterial = titleLower
    .replace(/\b(pla|petg|abs|tpu|asa|nylon|pa|pc)\+?\b/gi, '')
    .replace(/\b(silk|matte|glow|marble|high\s*speed|hs)\b/gi, '')
    .replace(/\b(basic|pro|plus)\b/gi, '')
    .replace(/\b(1\.75|2\.85)\s*mm\b/gi, '')
    .replace(/\b\d+\s*(kg|g)\b/gi, '')
    .replace(/[-–]/g, ' ')
    .trim();
  
  // Get the remaining words as potential color
  const words = withoutMaterial.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length > 0) {
    return words.join(' ').trim();
  }
  
  return null;
}

/**
 * Simple hash function for generating deterministic hex codes
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(6, '0');
}
