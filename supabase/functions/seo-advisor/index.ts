import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SeoAction {
  priority: "P0" | "P1" | "P2";
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting SEO advisor analysis...");

    // 1. Read top queries from search_console_data (last 28 days, by clicks)
    const { data: topQueries, error: queriesError } = await supabase
      .from("search_console_data")
      .select("query, clicks, impressions, ctr, position")
      .not("query", "is", null)
      .order("clicks", { ascending: false })
      .limit(50);

    if (queriesError) {
      throw new Error(`Failed to fetch top queries: ${queriesError.message}`);
    }

    // 2. Get position distribution
    const { data: allRows, error: allRowsError } = await supabase
      .from("search_console_data")
      .select("position, clicks, impressions")
      .not("query", "is", null);

    if (allRowsError) {
      throw new Error(`Failed to fetch position data: ${allRowsError.message}`);
    }

    const positionBuckets = { "1-3": 0, "4-10": 0, "11-20": 0, "21-50": 0, "50+": 0 };
    let totalClicks = 0;
    let totalImpressions = 0;

    for (const row of allRows ?? []) {
      const pos = row.position ?? 100;
      totalClicks += row.clicks ?? 0;
      totalImpressions += row.impressions ?? 0;

      if (pos <= 3) positionBuckets["1-3"]++;
      else if (pos <= 10) positionBuckets["4-10"]++;
      else if (pos <= 20) positionBuckets["11-20"]++;
      else if (pos <= 50) positionBuckets["21-50"]++;
      else positionBuckets["50+"]++;
    }

    // 3. Count indexed pages (distinct pages with impressions)
    const indexedPages = new Set(
      (allRows ?? [])
        .filter((r) => (r.impressions ?? 0) > 0)
        .map((r) => (r as Record<string, unknown>).page as string)
    );

    // We need page data too - fetch distinct pages
    const { data: pageRows, error: pageError } = await supabase
      .from("search_console_data")
      .select("page, impressions")
      .not("page", "is", null)
      .gt("impressions", 0);

    if (pageError) {
      throw new Error(`Failed to fetch page data: ${pageError.message}`);
    }

    const indexedPageCount = new Set((pageRows ?? []).map((r) => r.page)).size;

    // 4. Read citation log
    const { data: citations, error: citationsError } = await supabase
      .from("seo_citation_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (citationsError) {
      console.warn(`Citation log query failed (table may not exist): ${citationsError.message}`);
    }

    // 5. Count total filaments
    const { count: filamentCount, error: filamentError } = await supabase
      .from("filaments")
      .select("id", { count: "exact", head: true });

    if (filamentError) {
      throw new Error(`Failed to count filaments: ${filamentError.message}`);
    }

    // 6. Build the prompt
    const topQueriesSummary = (topQueries ?? []).slice(0, 25).map((q) => ({
      query: q.query,
      clicks: q.clicks,
      impressions: q.impressions,
      ctr: (q.ctr * 100).toFixed(1) + "%",
      position: q.position?.toFixed(1),
    }));

    const prompt = `You are an SEO expert for FilaScope (https://filascope.com), a 3D printer filament comparison platform.

Analyze the following Search Console and site data, then provide 5-7 prioritized SEO actions.

## Site Overview
- Total filaments in database: ${filamentCount ?? 0}
- Indexed pages (pages with impressions in GSC): ${indexedPageCount}
- Total clicks (all time in GSC): ${totalClicks}
- Total impressions (all time in GSC): ${totalImpressions}
- Average CTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%

## Position Distribution (query count per bucket)
${JSON.stringify(positionBuckets, null, 2)}

## Top 25 Queries by Clicks
${JSON.stringify(topQueriesSummary, null, 2)}

## Recent AI Citation Log
${citations && citations.length > 0 ? JSON.stringify(citations.slice(0, 10), null, 2) : "No citation data available yet."}

## Instructions
Return a JSON array of 5-7 SEO actions. Each action must have:
- priority: "P0" (critical/do now), "P1" (important/do soon), or "P2" (nice to have)
- title: short action title (under 80 chars)
- description: 2-3 sentence explanation of what to do and why
- effort: "low", "medium", or "high"
- impact: "low", "medium", or "high"

Focus on actionable, specific recommendations based on the data provided. Consider:
- Quick wins (high impression queries with low CTR or positions 4-20)
- Content gaps (queries where we rank but have no dedicated page)
- Technical SEO issues suggested by the data
- AI/AEO optimization opportunities based on citation patterns

Return ONLY the JSON array, no markdown formatting or explanation.`;

    // 7. Call OpenAI API
    console.log("Calling OpenAI API for SEO analysis...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert SEO analyst. Always respond with valid JSON arrays only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices?.[0]?.message?.content ?? "[]";

    // 8. Parse the response into structured actions
    let actions: SeoAction[];
    try {
      // Strip markdown code fences if present
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      actions = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", rawContent);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }

    // Validate structure
    actions = actions.filter(
      (a: Record<string, unknown>) =>
        a.priority && a.title && a.description && a.effort && a.impact
    );

    if (actions.length === 0) {
      throw new Error("AI returned no valid actions");
    }

    // 9. Store actions in seo_advisor_actions table
    const now = new Date().toISOString();
    const insertRows = actions.map((action, index) => ({
      priority: action.priority,
      title: action.title,
      description: action.description,
      effort: action.effort,
      impact: action.impact,
      sort_order: index,
      created_at: now,
      status: "pending",
    }));

    const { error: insertError } = await supabase
      .from("seo_advisor_actions")
      .insert(insertRows);

    if (insertError) {
      console.error("Failed to store actions:", insertError.message);
      // Don't throw - still return the actions even if storage fails
    }

    console.log(`SEO advisor completed: ${actions.length} actions generated`);

    return new Response(
      JSON.stringify({
        actions,
        metadata: {
          generated_at: now,
          total_clicks: totalClicks,
          total_impressions: totalImpressions,
          indexed_pages: indexedPageCount,
          filament_count: filamentCount ?? 0,
          actions_stored: !insertError,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in seo-advisor:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
