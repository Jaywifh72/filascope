import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// VERIFIED PETG IMAGE MAPPINGS
// Format: { colorName: "s5/default image URL" }
// These are the actual product spool images from Bambu Lab's CDN
// ============================================================================
const PETG_IMAGE_MAPPINGS: Record<string, Record<string, string>> = {
  // PETG HF - 14 colors (partially verified)
  "petg-hf": {
    "Black": "https://store.bblcdn.com/s5/default/6583fc4c677b47c78a79b5af54707241.jpg",
    // Add more as you verify them from the store:
    // "White": "https://store.bblcdn.com/s5/default/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.jpg",
  },
  
  // PETG Translucent - 9 colors
  "petg-translucent": {
    "Translucent Light Blue": "https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg",
    // Add more as you verify them from the store
  },
  
  // PETG-CF - 1 color (Black)
  "petg-cf": {
    // "Black": "https://store.bblcdn.com/s5/default/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.jpg",
  },
};

// Color hex codes for PETG products (used for matching)
const PETG_COLORS: Record<string, Record<string, string>> = {
  "petg-hf": {
    "Black": "#000000",
    "White": "#FFFFFF",
    "Red": "#EB3A3A",
    "Gray": "#ADB1B2",
    "Dark Gray": "#515151",
    "Cream": "#F9DFB9",
    "Yellow": "#FFD00B",
    "Orange": "#F75403",
    "Peanut Brown": "#875718",
    "Lime Green": "#6EE53C",
    "Green": "#00AE42",
    "Forest Green": "#39541A",
    "Lake Blue": "#1F79E5",
    "Blue": "#002E96",
  },
  "petg-translucent": {
    "Translucent Teal": "#77EDD7",
    "Translucent Light Blue": "#61B0FF",
    "Clear": "#E8E8E8",
    "Translucent Gray": "#8E8E8E",
    "Translucent Olive": "#748C45",
    "Translucent Brown": "#C9A381",
    "Translucent Orange": "#FF911A",
    "Translucent Pink": "#F9C1BD",
    "Translucent Purple": "#D6ABFF",
  },
  "petg-cf": {
    "Black": "#1A1A1A",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { 
      dryRun = true,
      // Optional: manually provide image mappings to add
      customMappings = null,  // { "petg-hf": { "White": "https://..." } }
    } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`Starting PETG image update (dryRun=${dryRun})`);
    
    // Merge custom mappings with known mappings
    const mappingsToApply = { ...PETG_IMAGE_MAPPINGS };
    if (customMappings) {
      for (const [slug, colors] of Object.entries(customMappings as Record<string, Record<string, string>>)) {
        mappingsToApply[slug] = { ...mappingsToApply[slug], ...colors };
      }
      console.log("Custom mappings provided:", Object.keys(customMappings));
    }

    const results: Record<string, { updated: number; skipped: number; errors: string[] }> = {};
    
    // Process each PETG product
    for (const [productSlug, imageMap] of Object.entries(mappingsToApply)) {
      const productResults = { updated: 0, skipped: 0, errors: [] as string[] };
      
      console.log(`\nProcessing ${productSlug}...`);
      
      for (const [colorName, imageUrl] of Object.entries(imageMap)) {
        if (!imageUrl || imageUrl.includes('XXXXXXXX')) {
          productResults.skipped++;
          continue;
        }
        
        console.log(`  Looking for: ${colorName}`);
        
        // Find filaments matching this product and color
        // Try multiple matching strategies
        const { data: filaments, error } = await supabase
          .from('filaments')
          .select('id, product_title, vendor, featured_image, product_url')
          .eq('vendor', 'Bambu Lab')
          .or(`product_title.ilike.%${colorName}%,product_title.ilike.%${colorName.replace(/ /g, '-')}%`)
          .limit(10);
        
        if (error) {
          productResults.errors.push(`Query error for ${colorName}: ${error.message}`);
          continue;
        }
        
        // Filter to find the exact PETG product
        const matchingFilaments = (filaments || []).filter(f => {
          const title = f.product_title.toLowerCase();
          const url = (f.product_url || '').toLowerCase();
          
          // Check if it's the right PETG product
          if (productSlug === 'petg-hf') {
            return (title.includes('petg hf') || title.includes('petg-hf') || url.includes('petg-hf')) 
                   && title.includes(colorName.toLowerCase());
          } else if (productSlug === 'petg-translucent') {
            return (title.includes('translucent') || url.includes('petg-translucent'))
                   && title.toLowerCase().includes(colorName.toLowerCase().replace('translucent ', ''));
          } else if (productSlug === 'petg-cf') {
            return (title.includes('petg-cf') || title.includes('petg cf') || url.includes('petg-cf'));
          }
          return false;
        });
        
        if (matchingFilaments.length === 0) {
          console.log(`    No matching filament found for ${colorName}`);
          productResults.skipped++;
          continue;
        }
        
        for (const filament of matchingFilaments) {
          console.log(`    Found: ${filament.product_title} (id: ${filament.id})`);
          console.log(`    Current image: ${filament.featured_image || 'none'}`);
          console.log(`    New image: ${imageUrl}`);
          
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('filaments')
              .update({ 
                featured_image: imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', filament.id);
            
            if (updateError) {
              productResults.errors.push(`Update error for ${filament.id}: ${updateError.message}`);
            } else {
              productResults.updated++;
              console.log(`    ✅ Updated!`);
            }
          } else {
            productResults.updated++;
            console.log(`    (dry run - would update)`);
          }
        }
      }
      
      results[productSlug] = productResults;
    }

    // Summary
    const summary = {
      success: true,
      dryRun,
      totalUpdated: Object.values(results).reduce((sum, r) => sum + r.updated, 0),
      totalSkipped: Object.values(results).reduce((sum, r) => sum + r.skipped, 0),
      totalErrors: Object.values(results).reduce((sum, r) => sum + r.errors.length, 0),
      results,
      // Include the current known mappings for reference
      knownMappings: PETG_IMAGE_MAPPINGS,
      missingMappings: Object.fromEntries(
        Object.entries(PETG_COLORS).map(([slug, colors]) => [
          slug,
          Object.keys(colors).filter(color => !mappingsToApply[slug]?.[color])
        ])
      ),
    };

    console.log("\n========== SUMMARY ==========");
    console.log(JSON.stringify(summary, null, 2));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
