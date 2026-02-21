import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      query,
      region = "US",
      limit = 48,
      offset = 0,
      materialFilter = null,
      propertySortCol = null,
      propertySortDir = null,
    } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ results: [], expandedQuery: "", materialHint: null, totalCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Sanitize: truncate + strip special chars for safety
    const sanitized = query.trim().slice(0, 200);

    // Tokenize
    const tokens = sanitized.toLowerCase().split(/\s+/).filter(Boolean);

    // Look up synonyms for each token (fallback when no client-side intent)
    let materialHint: string | null = materialFilter;
    let tagHint: string | null = null;
    const expandedTerms: string[] = [];

    if (tokens.length > 0 && !materialFilter) {
      const { data: synonymRows } = await supabase
        .from("search_synonyms")
        .select("term, synonyms, maps_to_material, maps_to_tag");

      if (synonymRows && synonymRows.length > 0) {
        for (const token of tokens) {
          for (const row of synonymRows) {
            const allTerms = [row.term, ...(row.synonyms || [])].map((t: string) => t.toLowerCase());
            if (allTerms.includes(token)) {
              if (row.maps_to_material && !materialHint) {
                materialHint = row.maps_to_material;
                expandedTerms.push(`${token} → ${row.maps_to_material}`);
              }
              if (row.maps_to_tag && !tagHint) {
                tagHint = row.maps_to_tag;
                expandedTerms.push(`${token} → ${row.maps_to_tag}`);
              }
              break;
            }
          }
        }
      }
    }

    // If client provided materialFilter, note it as an expansion
    if (materialFilter) {
      expandedTerms.push(`intent: ${materialFilter}`);
    }

    // Build query string for FTS
    let searchQuery = sanitized;
    if (materialHint && !sanitized.toLowerCase().includes(materialHint.toLowerCase())) {
      searchQuery = `${sanitized} ${materialHint}`;
    }

    // Call the ranked search RPC with new property sort params
    const { data: result, error } = await supabase.rpc("search_filaments_ranked", {
      p_query: searchQuery,
      p_material_hint: materialHint,
      p_region: region,
      p_limit: Math.min(limit, 100),
      p_offset: Math.max(offset, 0),
      p_property_sort_col: propertySortCol || null,
      p_property_sort_dir: propertySortDir || "desc",
    });

    if (error) {
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = result as any;

    return new Response(
      JSON.stringify({
        results: json?.items || [],
        expandedQuery: expandedTerms.length > 0 ? searchQuery : sanitized,
        materialHint,
        tagHint,
        totalCount: json?.total || 0,
        expansions: expandedTerms,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Smart search error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
