import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bambu Lab ABS Color variants with official hex codes from their product page
const BAMBU_ABS_COLORS: Record<string, { hex: string; colorFamily: string }> = {
  "Olive": { hex: "#789D4A", colorFamily: "Green" },
  "Tangerine Yellow": { hex: "#FFC72C", colorFamily: "Yellow" },
  "Azure": { hex: "#489FDF", colorFamily: "Blue" },
  "Navy Blue": { hex: "#0C2340", colorFamily: "Blue" },
  "White": { hex: "#FFFFFF", colorFamily: "White" },
  "Silver": { hex: "#87909A", colorFamily: "Gray" },
  "Red": { hex: "#D32941", colorFamily: "Red" },
  "Orange": { hex: "#FF6A13", colorFamily: "Orange" },
  "Bambu Green": { hex: "#00AE42", colorFamily: "Green" },
  "Blue": { hex: "#0A2CA5", colorFamily: "Blue" },
  "Purple": { hex: "#AF1685", colorFamily: "Purple" },
  "Black": { hex: "#000000", colorFamily: "Black" },
};

// Base product data extracted from Bambu Lab's ABS product page
const BAMBU_ABS_BASE_DATA = {
  vendor: "Bambu Lab",
  material: "ABS",
  product_url: "https://us.store.bambulab.com/products/abs-filament",
  nozzle_temp_min_c: 240,
  nozzle_temp_max_c: 270,
  bed_temp_min_c: 80,
  bed_temp_max_c: 100,
  print_speed_max_mms: 300,
  density_g_cm3: 1.05,
  tensile_strength_xy_mpa: 33,
  elongation_break_xy_percent: 10.5,
  flexural_strength_mpa: 62,
  tds_url: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_ABS_Technical_Data_Sheet_V3.pdf",
  drying_temp_c: 80,
  drying_time_hours: 8,
  diameter_nominal_mm: 1.75,
  net_weight_g: 1000,
};

// Image URLs for each color - these would need to be scraped or manually mapped
// For now, using the generic ABS spool image
const DEFAULT_ABS_IMAGE = "https://store.bblcdn.com/s7/default/614be9028953458392685cdf4af319f3/High_temp_spol_ABS.png";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await authClient.rpc("has_role", { _role: "admin", _user_id: user.id });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options: { dryRun?: boolean; material?: string } = {};
    try {
      options = await req.json();
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    const dryRun = options.dryRun ?? false;
    const targetMaterial = options.material ?? "ABS";

    console.log(`Starting Bambu Lab color sync for ${targetMaterial} (dryRun: ${dryRun})`);

    // Get existing Bambu Lab filaments
    const { data: existingFilaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, color_hex, color_family, featured_image")
      .eq("vendor", "Bambu Lab")
      .ilike("product_title", `%${targetMaterial}%`);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${existingFilaments?.length || 0} existing Bambu Lab ${targetMaterial} filaments`);

    const results: Array<{
      color: string;
      action: "created" | "updated" | "skipped";
      filamentId?: string;
      title: string;
    }> = [];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Find the base product to clone from
    const baseFilament = existingFilaments?.find(f => 
      f.product_title === `Bambu Lab ${targetMaterial}` || 
      f.product_title.includes(`Bambu Lab ${targetMaterial}`)
    );

    if (!baseFilament && !dryRun) {
      console.log(`No base filament found for Bambu Lab ${targetMaterial}`);
    }

    // Process each color variant
    for (const [colorName, colorData] of Object.entries(BAMBU_ABS_COLORS)) {
      const productTitle = `Bambu Lab ${targetMaterial} - ${colorName}`;
      
      // Check if this specific color variant already exists
      const existing = existingFilaments?.find(f => 
        f.product_title === productTitle ||
        (f.product_title === `Bambu Lab ${targetMaterial}` && f.color_hex === colorData.hex)
      );

      if (existing) {
        // Check if we need to update
        const needsUpdate = 
          existing.color_hex !== colorData.hex || 
          existing.color_family !== colorData.colorFamily;

        if (needsUpdate && !dryRun) {
          const { error: updateError } = await supabase
            .from("filaments")
            .update({
              color_hex: colorData.hex,
              color_family: colorData.colorFamily,
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error(`Failed to update ${productTitle}:`, updateError.message);
          } else {
            updated++;
            results.push({
              color: colorName,
              action: "updated",
              filamentId: existing.id,
              title: productTitle,
            });
            console.log(`Updated ${productTitle} with hex: ${colorData.hex}`);
          }
        } else if (needsUpdate && dryRun) {
          results.push({
            color: colorName,
            action: "updated",
            filamentId: existing.id,
            title: productTitle,
          });
        } else {
          skipped++;
          results.push({
            color: colorName,
            action: "skipped",
            filamentId: existing.id,
            title: existing.product_title,
          });
        }
      } else {
        // Create new color variant
        if (!dryRun) {
          const newFilament = {
            product_title: productTitle,
            vendor: BAMBU_ABS_BASE_DATA.vendor,
            material: BAMBU_ABS_BASE_DATA.material,
            product_url: BAMBU_ABS_BASE_DATA.product_url,
            color_hex: colorData.hex,
            color_family: colorData.colorFamily,
            nozzle_temp_min_c: BAMBU_ABS_BASE_DATA.nozzle_temp_min_c,
            nozzle_temp_max_c: BAMBU_ABS_BASE_DATA.nozzle_temp_max_c,
            bed_temp_min_c: BAMBU_ABS_BASE_DATA.bed_temp_min_c,
            bed_temp_max_c: BAMBU_ABS_BASE_DATA.bed_temp_max_c,
            print_speed_max_mms: BAMBU_ABS_BASE_DATA.print_speed_max_mms,
            density_g_cm3: BAMBU_ABS_BASE_DATA.density_g_cm3,
            tensile_strength_xy_mpa: BAMBU_ABS_BASE_DATA.tensile_strength_xy_mpa,
            elongation_break_xy_percent: BAMBU_ABS_BASE_DATA.elongation_break_xy_percent,
            flexural_strength_mpa: BAMBU_ABS_BASE_DATA.flexural_strength_mpa,
            tds_url: BAMBU_ABS_BASE_DATA.tds_url,
            drying_temp_c: BAMBU_ABS_BASE_DATA.drying_temp_c,
            drying_time_hours: BAMBU_ABS_BASE_DATA.drying_time_hours,
            diameter_nominal_mm: BAMBU_ABS_BASE_DATA.diameter_nominal_mm,
            net_weight_g: BAMBU_ABS_BASE_DATA.net_weight_g,
            featured_image: DEFAULT_ABS_IMAGE,
            auto_created: true,
            variant_available: true,
          };

          const { data: inserted, error: insertError } = await supabase
            .from("filaments")
            .insert(newFilament)
            .select("id")
            .single();

          if (insertError) {
            console.error(`Failed to create ${productTitle}:`, insertError.message);
          } else {
            created++;
            results.push({
              color: colorName,
              action: "created",
              filamentId: inserted.id,
              title: productTitle,
            });
            console.log(`Created ${productTitle} with hex: ${colorData.hex}`);
          }
        } else {
          results.push({
            color: colorName,
            action: "created",
            title: productTitle,
          });
        }
      }
    }

    // Update the original "Bambu Lab ABS" entry if it exists and has wrong color
    if (baseFilament && !dryRun) {
      const firstColor = Object.entries(BAMBU_ABS_COLORS)[0];
      if (baseFilament.color_hex !== firstColor[1].hex) {
        // The original entry likely represents one specific color
        // We should either update it or mark it as the base product
        console.log(`Base filament "${baseFilament.product_title}" has color_hex: ${baseFilament.color_hex}`);
      }
    }

    const summary = {
      success: true,
      dryRun,
      material: targetMaterial,
      existingCount: existingFilaments?.length || 0,
      colorsProcessed: Object.keys(BAMBU_ABS_COLORS).length,
      created,
      updated,
      skipped,
      results,
    };

    console.log(`Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in sync-bambulab-colors:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
