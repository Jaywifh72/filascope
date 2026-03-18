import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INDEXNOW_API_KEY = Deno.env.get("INDEXNOW_API_KEY")!;
const HOST = "filascope.com";
const BASE_URL = `https://${HOST}`;
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_API_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10_000;
const DB_FETCH_SIZE = 1_000;

// Static pages
const STATIC_URLS = [
  "/", "/deals", "/printers", "/brands", "/brands/compare", "/compare",
  "/wizard", "/color-finder", "/hueforge-td-database", "/hueforge-filaments",
  "/accessories", "/diagnose", "/reference/slicers", "/reference/repos",
  "/matrix", "/about", "/methodology", "/guides", "/affiliate-disclosure",
  "/privacy", "/terms",
].map((p) => `${BASE_URL}${p}`);

// Guide pages
const GUIDE_URLS = [
  "best-pla-filaments", "best-petg-filaments", "best-abs-filaments",
  "pla-vs-petg", "beginners-guide", "hueforge-filaments",
  "best-filaments-for-hueforge-lithophanes", "pla-plus-vs-pla-pro",
  "best-filament-for-bambu-lab-p1s", "silk-pla-comparison",
  "asa-vs-abs-outdoor-printing",
].map((slug) => `${BASE_URL}/guides/${slug}`);

type SubmitResult = { batch: number; success: boolean; status: number; urls: number };

async function submitBatch(
  urls: string[],
  batchIndex: number,
  supabase: ReturnType<typeof createClient>
): Promise<SubmitResult> {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_API_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    }),
  });

  const success = response.ok;
  const responseCode = response.status;
  const errorMessage = !success ? await response.text() : null;

  await supabase.from("indexnow_submissions").insert({
    url_count: urls.length,
    status: success ? "success" : "error",
    response_code: responseCode,
    error_message: errorMessage,
    batch_type: "scheduled",
    urls_sample: urls.slice(0, 10),
  });

  console.log(`Batch ${batchIndex}: ${urls.length} URLs → HTTP ${responseCode}`);
  return { batch: batchIndex, success, status: responseCode, urls: urls.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const allUrls: string[] = [...STATIC_URLS, ...GUIDE_URLS];

    // --- Filament URLs ---
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("filaments")
        .select("product_handle, id")
        .not("product_handle", "is", null)
        .order("id")
        .range(offset, offset + DB_FETCH_SIZE - 1);

      if (error) { console.error("Filaments query error:", error.message); break; }
      if (!data || data.length === 0) break;

      for (const f of data) {
        allUrls.push(`${BASE_URL}/filament/${f.product_handle || f.id}`);
      }
      if (data.length < DB_FETCH_SIZE) break;
      offset += DB_FETCH_SIZE;
    }

    // --- Printer URLs ---
    offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("printers")
        .select("printer_id, id")
        .order("id")
        .range(offset, offset + DB_FETCH_SIZE - 1);

      if (error) { console.error("Printers query error:", error.message); break; }
      if (!data || data.length === 0) break;

      for (const p of data) {
        allUrls.push(`${BASE_URL}/printers/${p.printer_id || p.id}`);
      }
      if (data.length < DB_FETCH_SIZE) break;
      offset += DB_FETCH_SIZE;
    }

    // --- Brand URLs ---
    const { data: brands, error: brandsError } = await supabase
      .from("automated_brands")
      .select("brand_slug")
      .eq("is_visible", true)
      .order("brand_slug");

    if (!brandsError && brands) {
      for (const b of brands) {
        allUrls.push(`${BASE_URL}/brands/${b.brand_slug}`);
      }
    }

    console.log(`IndexNow batch: ${allUrls.length} total URLs to submit`);

    // Submit in batches of 10,000
    const results: SubmitResult[] = [];
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
      const batch = allUrls.slice(i, i + BATCH_SIZE);
      const result = await submitBatch(batch, Math.floor(i / BATCH_SIZE) + 1, supabase);
      results.push(result);
    }

    const allSuccess = results.every((r) => r.success);

    return new Response(
      JSON.stringify({
        success: allSuccess,
        total_urls: allUrls.length,
        batches_submitted: results.length,
        batches: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("IndexNow batch error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
