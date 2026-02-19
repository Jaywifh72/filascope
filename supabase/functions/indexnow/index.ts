import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INDEXNOW_API_KEY = Deno.env.get("INDEXNOW_API_KEY")!;
const HOST = "filascope.com";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_API_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const urls: string[] = body?.urls ?? [];
    const batch_type: string = body?.batch_type ?? "manual";

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "urls array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IndexNow limit is 10,000 URLs per request
    const batch = urls.slice(0, 10_000);

    const indexNowResponse = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_API_KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      }),
    });

    const success = indexNowResponse.ok;
    const responseCode = indexNowResponse.status;
    const errorMessage = !success ? await indexNowResponse.text() : null;

    // Log submission
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("indexnow_submissions").insert({
      url_count: batch.length,
      status: success ? "success" : "error",
      response_code: responseCode,
      error_message: errorMessage,
      batch_type,
      urls_sample: batch.slice(0, 10),
    });

    console.log(
      `IndexNow: submitted ${batch.length} URLs, status ${responseCode}, type ${batch_type}`
    );

    return new Response(
      JSON.stringify({ success, status: responseCode, url_count: batch.length, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("IndexNow error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
