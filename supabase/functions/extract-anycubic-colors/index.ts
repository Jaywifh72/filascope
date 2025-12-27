/**
 * ANYCUBIC COLOR EXTRACTION FUNCTION
 * 
 * Extracts color information from Anycubic product titles and updates the database.
 * Anycubic products typically have colors in their titles like:
 * - "PLA Black"
 * - "PETG White"
 * - "Silk Gold PLA"
 * 
 * Uses the shared color-mapping module for consistent hex values.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getColorHex, getColorFamily, extractColorFromTitle, COLOR_HEX_MAP } from "../_shared/color-mapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractionResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'no_color';
  colorName?: string | null;
  colorHex?: string | null;
  colorFamily?: string | null;
}

/**
 * Enhanced color extraction for Anycubic products
 * Handles special Anycubic naming conventions
 */
function extractAnycubicColor(title: string): { colorName: string | null; colorHex: string | null; colorFamily: string | null } {
  const titleLower = title.toLowerCase();
  
  // Anycubic special patterns
  const anycubicPatterns = [
    // "Material Color" pattern (e.g., "PLA Black", "PETG White")
    /(?:pla|petg|abs|tpu|silk|matte|high\s*speed)\s+([a-z]+(?:\s+[a-z]+)?)/i,
    // "Color Material" pattern (e.g., "Black PLA", "White PETG")
    /^([a-z]+(?:\s+[a-z]+)?)\s+(?:pla|petg|abs|tpu)/i,
    // Silk colors (e.g., "Silk Gold", "Silk Silver")
    /silk\s+([a-z]+)/i,
    // Matte colors (e.g., "Matte Black", "Matte White")
    /matte\s+([a-z]+)/i,
    // Color at end after dash or comma
    /[-,]\s*([a-z]+(?:\s+[a-z]+)?)\s*$/i,
  ];
  
  for (const pattern of anycubicPatterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const potentialColor = match[1].toLowerCase().trim();
      // Check if it's a valid color
      const hex = getColorHex(potentialColor);
      if (hex) {
        const family = getColorFamily(potentialColor);
        // Handle silk/matte prefix
        let fullColorName = potentialColor;
        if (titleLower.includes('silk ')) {
          fullColorName = `silk ${potentialColor}`;
        } else if (titleLower.includes('matte ')) {
          fullColorName = `matte ${potentialColor}`;
        }
        const fullHex = getColorHex(fullColorName) || hex;
        return { colorName: fullColorName, colorHex: `#${fullHex}`, colorFamily: family };
      }
    }
  }
  
  // Fallback to standard extraction
  const standard = extractColorFromTitle(title);
  if (standard.colorName) {
    return { 
      colorName: standard.colorName, 
      colorHex: standard.colorHex ? `#${standard.colorHex}` : null, 
      colorFamily: standard.colorFamily 
    };
  }
  
  // Direct color word search as last resort
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const color of sortedColors) {
    if (titleLower.includes(color)) {
      const hex = COLOR_HEX_MAP[color];
      const family = getColorFamily(color);
      return { colorName: color, colorHex: `#${hex}`, colorFamily: family };
    }
  }
  
  return { colorName: null, colorHex: null, colorFamily: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ANYCUBIC-COLORS] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-COLORS] 🎨 ANYCUBIC COLOR EXTRACTION STARTED');
  console.log('[ANYCUBIC-COLORS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 200;
    let forceUpdate = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 200;
      forceUpdate = body.forceUpdate ?? false;
    } catch { /* defaults */ }

    // Fetch Anycubic filaments without color_hex (or all if forceUpdate)
    let query = supabase
      .from('filaments')
      .select('id, product_title, color_hex, color_family')
      .eq('vendor', 'Anycubic');
    
    if (!forceUpdate) {
      query = query.is('color_hex', null);
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    console.log(`[ANYCUBIC-COLORS] Found ${filaments?.length || 0} filaments to process`);

    const results: ExtractionResult[] = [];
    let updated = 0, skipped = 0, noColor = 0;

    for (const filament of filaments || []) {
      const { colorName, colorHex, colorFamily } = extractAnycubicColor(filament.product_title);
      
      if (!colorName && !colorHex) {
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'no_color' 
        });
        noColor++;
        continue;
      }
      
      // Skip if already has color and not forcing update
      if (filament.color_hex && !forceUpdate) {
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'skipped',
          colorName,
          colorHex,
          colorFamily,
        });
        skipped++;
        continue;
      }
      
      // Update the filament
      const updateData: Record<string, unknown> = {};
      if (colorHex) updateData.color_hex = colorHex;
      if (colorFamily) updateData.color_family = colorFamily;
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[ANYCUBIC-COLORS] Update error for ${filament.id}:`, updateError);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'skipped' 
          });
          skipped++;
        } else {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            colorName,
            colorHex,
            colorFamily,
          });
          updated++;
          console.log(`[ANYCUBIC-COLORS] ✅ ${filament.product_title} → ${colorName} (${colorHex})`);
        }
      } else {
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'no_color' 
        });
        noColor++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[ANYCUBIC-COLORS] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-COLORS] ✅ COMPLETE: ${updated} updated, ${skipped} skipped, ${noColor} no color in ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      summary: { updated, skipped, noColor, total: filaments?.length || 0, duration },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANYCUBIC-COLORS] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
