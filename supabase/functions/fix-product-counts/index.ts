import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SQL = `
CREATE OR REPLACE FUNCTION public.update_brand_product_counts(p_brand_slug text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    UPDATE automated_brands ab
    SET 
      product_count = COALESCE(counts.total, 0),
      product_line_count = COALESCE(counts.unique_lines, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0),
      products_with_prices = COALESCE(counts.with_prices, 0),
      products_with_images = COALESCE(counts.with_images, 0),
      products_with_tds = COALESCE(counts.with_tds, 0),
      products_with_color_hex = COALESCE(counts.with_color_hex, 0),
      products_with_mpn = COALESCE(counts.with_mpn, 0)
    FROM (
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT product_line_id) as unique_lines,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL OR product_url_eu IS NOT NULL OR product_url_ca IS NOT NULL OR product_url_uk IS NOT NULL OR product_url_au IS NOT NULL OR product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN variant_price IS NOT NULL OR price_eur IS NOT NULL OR price_cad IS NOT NULL OR price_gbp IS NOT NULL OR price_aud IS NOT NULL OR price_jpy IS NOT NULL THEN 1 END) as with_prices,
        COUNT(CASE WHEN featured_image IS NOT NULL AND featured_image != '' THEN 1 END) as with_images,
        COUNT(CASE WHEN tds_url IS NOT NULL AND tds_url != '' THEN 1 END) as with_tds,
        COUNT(CASE WHEN color_hex IS NOT NULL AND color_hex != '' THEN 1 END) as with_color_hex,
        COUNT(CASE WHEN mpn IS NOT NULL AND mpn != '' THEN 1 END) as with_mpn
      FROM filaments
      WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
    ) counts
    WHERE ab.brand_slug = p_brand_slug;
  ELSE
    UPDATE automated_brands ab
    SET 
      product_count = COALESCE(counts.total, 0),
      product_line_count = COALESCE(counts.unique_lines, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0),
      products_with_prices = COALESCE(counts.with_prices, 0),
      products_with_images = COALESCE(counts.with_images, 0),
      products_with_tds = COALESCE(counts.with_tds, 0),
      products_with_color_hex = COALESCE(counts.with_color_hex, 0),
      products_with_mpn = COALESCE(counts.with_mpn, 0)
    FROM (
      SELECT 
        ab2.id,
        COUNT(f.*) as total,
        COUNT(DISTINCT f.product_line_id) as unique_lines,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL OR f.product_url_eu IS NOT NULL OR f.product_url_ca IS NOT NULL OR f.product_url_uk IS NOT NULL OR f.product_url_au IS NOT NULL OR f.product_url_jp IS NOT NULL THEN 1 END) as with_urls,
        COUNT(CASE WHEN f.variant_price IS NOT NULL OR f.price_eur IS NOT NULL OR f.price_cad IS NOT NULL OR f.price_gbp IS NOT NULL OR f.price_aud IS NOT NULL OR f.price_jpy IS NOT NULL THEN 1 END) as with_prices,
        COUNT(CASE WHEN f.featured_image IS NOT NULL AND f.featured_image != '' THEN 1 END) as with_images,
        COUNT(CASE WHEN f.tds_url IS NOT NULL AND f.tds_url != '' THEN 1 END) as with_tds,
        COUNT(CASE WHEN f.color_hex IS NOT NULL AND f.color_hex != '' THEN 1 END) as with_color_hex,
        COUNT(CASE WHEN f.mpn IS NOT NULL AND f.mpn != '' THEN 1 END) as with_mpn
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$function$;
`;

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!authHeader.includes(serviceKey.substring(0, 20))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "No SUPABASE_DB_URL" }), { status: 500 });
    }

    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1);
    const client = await pool.connect();

    try {
      await client.queryObject(SQL);

      // Run the function for all brands to populate counts
      await client.queryObject("SELECT update_brand_product_counts(NULL);");

      // Verify
      const verify = await client.queryObject(`
        SELECT brand_slug, product_count, products_with_images, products_with_tds, products_with_color_hex, products_with_mpn
        FROM automated_brands
        WHERE product_count > 0
        ORDER BY product_count DESC
        LIMIT 10;
      `);

      return new Response(JSON.stringify({
        success: true,
        message: "update_brand_product_counts updated and run for all brands",
        sample_results: verify.rows
      }), { headers: { "Content-Type": "application/json" } });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
