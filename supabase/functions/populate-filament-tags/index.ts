import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { extractAllTags, type ExtractedTags } from '../_shared/tag-extraction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PopulateOptions {
  dryRun?: boolean;
  forceOverwrite?: boolean;
  vendorFilter?: string;
  limit?: number;
}

interface PopulateResult {
  success: boolean;
  dryRun: boolean;
  stats: {
    scanned: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  tagBreakdown: Record<string, number>;
  sampleUpdates: Array<{
    id: string;
    title: string;
    oldTags: Partial<ExtractedTags>;
    newTags: ExtractedTags;
  }>;
  errorDetails: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    let options: PopulateOptions = {};
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }

    const { 
      dryRun = true, 
      forceOverwrite = false, 
      vendorFilter = null,
      limit = 10000 
    } = options;

    console.log(`Starting tag population: dryRun=${dryRun}, forceOverwrite=${forceOverwrite}, vendor=${vendorFilter}`);

    // Build query for filaments that need tag updates
    let query = supabase
      .from('filaments')
      .select('id, product_title, material, vendor, finish_type, high_speed_capable, is_nozzle_abrasive, carbon_fiber_percentage, glass_fiber_percentage, wood_powder_percentage')
      .limit(limit);

    // Filter by vendor if specified
    if (vendorFilter) {
      query = query.ilike('vendor', vendorFilter);
    }

    // If not forcing overwrite, only get filaments with missing tags
    if (!forceOverwrite) {
      query = query.or('finish_type.is.null,finish_type.eq.Standard,high_speed_capable.is.null');
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        dryRun,
        stats: { scanned: 0, updated: 0, skipped: 0, errors: 0 },
        tagBreakdown: {},
        sampleUpdates: [],
        errorDetails: [],
        message: 'No filaments found that need tag updates'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result: PopulateResult = {
      success: true,
      dryRun,
      stats: {
        scanned: filaments.length,
        updated: 0,
        skipped: 0,
        errors: 0,
      },
      tagBreakdown: {},
      sampleUpdates: [],
      errorDetails: [],
    };

    // Process filaments in batches
    const BATCH_SIZE = 100;
    const updates: Array<{ id: string; updates: Partial<ExtractedTags> }> = [];

    for (const filament of filaments) {
      const title = filament.product_title || '';
      const material = filament.material || '';
      
      const newTags = extractAllTags(title, material);
      
      // Determine what needs to be updated
      const updateFields: Record<string, unknown> = {};
      let needsUpdate = false;
      
      // Check finish_type
      if (forceOverwrite || !filament.finish_type || filament.finish_type === 'Standard') {
        if (newTags.finish_type !== 'Standard') {
          updateFields.finish_type = newTags.finish_type;
          needsUpdate = true;
        }
      }
      
      // Check high_speed_capable
      if (forceOverwrite || filament.high_speed_capable === null) {
        if (newTags.high_speed_capable) {
          updateFields.high_speed_capable = true;
          needsUpdate = true;
        }
      }
      
      // Check is_nozzle_abrasive
      if (forceOverwrite || filament.is_nozzle_abrasive === null) {
        if (newTags.is_nozzle_abrasive) {
          updateFields.is_nozzle_abrasive = true;
          needsUpdate = true;
        }
      }
      
      // Check carbon_fiber_percentage
      if (forceOverwrite || filament.carbon_fiber_percentage === null) {
        if (newTags.carbon_fiber_percentage !== null) {
          updateFields.carbon_fiber_percentage = newTags.carbon_fiber_percentage;
          needsUpdate = true;
        }
      }
      
      // Check glass_fiber_percentage
      if (forceOverwrite || filament.glass_fiber_percentage === null) {
        if (newTags.glass_fiber_percentage !== null) {
          updateFields.glass_fiber_percentage = newTags.glass_fiber_percentage;
          needsUpdate = true;
        }
      }
      
      // Check wood_powder_percentage
      if (forceOverwrite || filament.wood_powder_percentage === null) {
        if (newTags.wood_powder_percentage !== null) {
          updateFields.wood_powder_percentage = newTags.wood_powder_percentage;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        updates.push({ id: filament.id, updates: updateFields as Partial<ExtractedTags> });
        
        // Track tag breakdown
        if (updateFields.finish_type) {
          const ft = updateFields.finish_type as string;
          result.tagBreakdown[ft] = (result.tagBreakdown[ft] || 0) + 1;
        }
        if (updateFields.high_speed_capable) {
          result.tagBreakdown['High Speed'] = (result.tagBreakdown['High Speed'] || 0) + 1;
        }
        if (updateFields.is_nozzle_abrasive) {
          result.tagBreakdown['Abrasive'] = (result.tagBreakdown['Abrasive'] || 0) + 1;
        }
        
        // Collect sample updates (first 10)
        if (result.sampleUpdates.length < 10) {
          result.sampleUpdates.push({
            id: filament.id,
            title: title.substring(0, 80),
            oldTags: {
              finish_type: filament.finish_type,
              high_speed_capable: filament.high_speed_capable,
              is_nozzle_abrasive: filament.is_nozzle_abrasive,
            },
            newTags,
          });
        }
      } else {
        result.stats.skipped++;
      }
    }

    // Apply updates if not dry run
    if (!dryRun && updates.length > 0) {
      console.log(`Applying ${updates.length} updates in batches of ${BATCH_SIZE}...`);
      
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        
        for (const { id, updates: updateData } of batch) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);
          
          if (updateError) {
            result.stats.errors++;
            if (result.errorDetails.length < 10) {
              result.errorDetails.push(`Failed to update ${id}: ${updateError.message}`);
            }
          } else {
            result.stats.updated++;
          }
        }
        
        console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updates.length / BATCH_SIZE)}`);
      }
    } else if (dryRun) {
      result.stats.updated = updates.length;
      console.log(`DRY RUN: Would update ${updates.length} filaments`);
    }

    // Summary log
    console.log(`Tag population complete: scanned=${result.stats.scanned}, updated=${result.stats.updated}, skipped=${result.stats.skipped}, errors=${result.stats.errors}`);
    console.log(`Tag breakdown:`, result.tagBreakdown);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fatal error in populate-filament-tags:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
