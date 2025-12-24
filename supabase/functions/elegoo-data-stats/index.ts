import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DataQualityStats {
  total: number;
  withImages: number;
  withUniqueImages: number;
  withTds: number;
  withTempSpecs: number;
  withDensity: number;
  withColorHex: number;
  withMpn: number;
  // Regional coverage
  withUsPrice: number;
  withCaPrice: number;
  withEuPrice: number;
  withUkPrice: number;
  withAuPrice: number;
  withJpPrice: number;
  // Issues
  missingImages: number;
  missingTds: number;
  missingTempSpecs: number;
  missingAllRegionalPrices: number;
}

interface ProductLineStats {
  productLine: string;
  count: number;
  withImages: number;
  withTds: number;
  withTempSpecs: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await authClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== ELEGOO DATA QUALITY STATS ===");

    // Fetch all Elegoo filaments with relevant fields
    const { data: filaments, error: fetchError } = await supabase
      .from("filaments")
      .select(`
        id, product_title, featured_image, tds_url, color_hex, mpn,
        nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, density_g_cm3,
        variant_price, price_eur, price_gbp, price_cad, price_aud, price_jpy,
        product_url, product_url_eu, product_url_uk, product_url_ca, product_url_au, product_url_jp
      `)
      .eq("vendor", "Elegoo");

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    const total = filaments?.length || 0;
    console.log(`Total Elegoo filaments: ${total}`);

    if (!filaments || total === 0) {
      return new Response(JSON.stringify({
        success: true,
        stats: { total: 0 },
        message: "No Elegoo filaments found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count unique images to detect duplicates
    const imageUrls = new Set<string>();
    const duplicateImages: string[] = [];
    
    for (const f of filaments) {
      if (f.featured_image) {
        if (imageUrls.has(f.featured_image)) {
          duplicateImages.push(f.featured_image);
        }
        imageUrls.add(f.featured_image);
      }
    }

    // Calculate stats
    const stats: DataQualityStats = {
      total,
      withImages: filaments.filter(f => f.featured_image).length,
      withUniqueImages: imageUrls.size,
      withTds: filaments.filter(f => f.tds_url).length,
      withTempSpecs: filaments.filter(f => 
        f.nozzle_temp_min_c !== null || f.nozzle_temp_max_c !== null ||
        f.bed_temp_min_c !== null || f.bed_temp_max_c !== null
      ).length,
      withDensity: filaments.filter(f => f.density_g_cm3 !== null).length,
      withColorHex: filaments.filter(f => f.color_hex).length,
      withMpn: filaments.filter(f => f.mpn).length,
      // Regional prices
      withUsPrice: filaments.filter(f => f.variant_price !== null).length,
      withCaPrice: filaments.filter(f => f.price_cad !== null).length,
      withEuPrice: filaments.filter(f => f.price_eur !== null).length,
      withUkPrice: filaments.filter(f => f.price_gbp !== null).length,
      withAuPrice: filaments.filter(f => f.price_aud !== null).length,
      withJpPrice: filaments.filter(f => f.price_jpy !== null).length,
      // Issues
      missingImages: filaments.filter(f => !f.featured_image).length,
      missingTds: filaments.filter(f => !f.tds_url).length,
      missingTempSpecs: filaments.filter(f => 
        f.nozzle_temp_min_c === null && f.nozzle_temp_max_c === null &&
        f.bed_temp_min_c === null && f.bed_temp_max_c === null
      ).length,
      missingAllRegionalPrices: filaments.filter(f => 
        f.variant_price === null && f.price_eur === null && f.price_gbp === null &&
        f.price_cad === null && f.price_aud === null && f.price_jpy === null
      ).length,
    };

    // Group by product line
    const productLineStats: Record<string, ProductLineStats> = {};
    
    for (const f of filaments) {
      const productLine = getProductLine(f.product_title);
      if (!productLineStats[productLine]) {
        productLineStats[productLine] = {
          productLine,
          count: 0,
          withImages: 0,
          withTds: 0,
          withTempSpecs: 0,
        };
      }
      
      productLineStats[productLine].count++;
      if (f.featured_image) productLineStats[productLine].withImages++;
      if (f.tds_url) productLineStats[productLine].withTds++;
      if (f.nozzle_temp_min_c !== null || f.bed_temp_min_c !== null) {
        productLineStats[productLine].withTempSpecs++;
      }
    }

    // Find filaments with issues for detailed report
    const missingImagesList = filaments
      .filter(f => !f.featured_image)
      .map(f => ({ id: f.id, title: f.product_title }))
      .slice(0, 20);
    
    const missingTdsList = filaments
      .filter(f => !f.tds_url)
      .map(f => ({ id: f.id, title: f.product_title }))
      .slice(0, 20);

    const duplicateImageFilaments = filaments
      .filter(f => duplicateImages.includes(f.featured_image || ''))
      .map(f => ({ id: f.id, title: f.product_title, image: f.featured_image }))
      .slice(0, 20);

    // Calculate percentages
    const percentages = {
      images: ((stats.withImages / total) * 100).toFixed(1),
      uniqueImages: ((stats.withUniqueImages / total) * 100).toFixed(1),
      tds: ((stats.withTds / total) * 100).toFixed(1),
      tempSpecs: ((stats.withTempSpecs / total) * 100).toFixed(1),
      colorHex: ((stats.withColorHex / total) * 100).toFixed(1),
      usPrice: ((stats.withUsPrice / total) * 100).toFixed(1),
      euPrice: ((stats.withEuPrice / total) * 100).toFixed(1),
      ukPrice: ((stats.withUkPrice / total) * 100).toFixed(1),
    };

    console.log(`\n=== DATA QUALITY SUMMARY ===`);
    console.log(`Images: ${stats.withImages}/${total} (${percentages.images}%) - Unique: ${stats.withUniqueImages}`);
    console.log(`TDS URLs: ${stats.withTds}/${total} (${percentages.tds}%)`);
    console.log(`Temp Specs: ${stats.withTempSpecs}/${total} (${percentages.tempSpecs}%)`);
    console.log(`US Prices: ${stats.withUsPrice}/${total} (${percentages.usPrice}%)`);
    console.log(`EU Prices: ${stats.withEuPrice}/${total} (${percentages.euPrice}%)`);
    console.log(`Duplicate images detected: ${duplicateImages.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats,
      percentages,
      productLines: Object.values(productLineStats).sort((a, b) => b.count - a.count),
      issues: {
        duplicateImageCount: duplicateImages.length,
        sampleMissingImages: missingImagesList,
        sampleMissingTds: missingTdsList,
        sampleDuplicateImages: duplicateImageFilaments,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Determine product line from title
function getProductLine(title: string): string {
  const titleLower = title.toLowerCase();

  // Check specific product lines first (order matters - most specific first)
  if (titleLower.includes("pla-cf") || titleLower.includes("pla cf")) return "PLA-CF";
  if (titleLower.includes("petg-cf") || titleLower.includes("petg cf")) return "PETG-CF";
  if (titleLower.includes("abs-cf") || titleLower.includes("abs cf")) return "ABS-CF";
  if (titleLower.includes("pa-cf") || titleLower.includes("pa cf")) return "PA-CF";
  if (titleLower.includes("silk pla")) return "Silk PLA";
  if (titleLower.includes("matte pla")) return "Matte PLA";
  if (titleLower.includes("glow pla")) return "Glow PLA";
  if (titleLower.includes("dual color pla")) return "Dual Color PLA";
  if (titleLower.includes("galaxy pla")) return "Galaxy PLA";
  if (titleLower.includes("marble pla")) return "Marble PLA";
  if (titleLower.includes("wood pla")) return "Wood PLA";
  if (titleLower.includes("sparkle pla")) return "Sparkle PLA";
  if (titleLower.includes("high speed petg+") || titleLower.includes("high speed petg plus")) return "High Speed PETG+";
  if (titleLower.includes("high speed petg")) return "High Speed PETG";
  if (titleLower.includes("high speed pla+") || titleLower.includes("high speed pla plus")) return "High Speed PLA+";
  if (titleLower.includes("high speed pla")) return "High Speed PLA";
  if (titleLower.includes("rapid pla+") || titleLower.includes("rapid pla plus")) return "Rapid PLA+";
  if (titleLower.includes("rapid pla")) return "Rapid PLA";
  if (titleLower.includes("pla+") || titleLower.includes("pla plus")) return "PLA+";
  if (titleLower.includes("petg+") || titleLower.includes("petg plus")) return "PETG+";
  if (titleLower.includes("abs filament 10 kg") || titleLower.includes("abs 10kg")) return "ABS 10 kg";
  if (titleLower.includes("abs filament 5 kg") || titleLower.includes("abs 5kg")) return "ABS 5 kg";
  if (titleLower.includes("pla filament 10 kg") || titleLower.includes("pla 10kg")) return "PLA 10 kg";
  if (titleLower.includes("pla filament 5 kg") || titleLower.includes("pla 5kg")) return "PLA 5 kg";
  if (titleLower.includes("asa")) return "ASA";
  if (titleLower.includes("tpu")) return "TPU";
  if (titleLower.includes("petg")) return "PETG";
  if (titleLower.includes("abs")) return "ABS";
  if (titleLower.includes("pla")) return "PLA";
  if (titleLower.includes("pa") || titleLower.includes("nylon")) return "PA";
  if (titleLower.includes("pc")) return "PC";

  return "Unknown";
}
