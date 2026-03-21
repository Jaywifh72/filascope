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
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
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
      .select("id, ai_engine, query, cited, notes, checked_at")
      .order("checked_at", { ascending: false })
      .limit(20);

    if (citationsError) {
      console.warn(`Citation log query failed (table may not exist): ${citationsError.message}`);
    }

    // 4b. Regional/international breakdown from GSC
    const { data: countryRows } = await supabase
      .from("search_console_data")
      .select("country, clicks, impressions, position")
      .not("country", "is", null);

    const countryStats: Record<string, { clicks: number; impressions: number; queries: number; avgPos: number }> = {};
    for (const r of countryRows ?? []) {
      const c = r.country;
      if (!countryStats[c]) countryStats[c] = { clicks: 0, impressions: 0, queries: 0, avgPos: 0 };
      countryStats[c].clicks += r.clicks ?? 0;
      countryStats[c].impressions += r.impressions ?? 0;
      countryStats[c].queries++;
      countryStats[c].avgPos += r.position ?? 0;
    }
    // Calculate avg position and sort by impressions
    const topCountries = Object.entries(countryStats)
      .map(([code, s]) => ({
        country: code,
        clicks: s.clicks,
        impressions: s.impressions,
        queries: s.queries,
        avg_position: s.queries > 0 ? +(s.avgPos / s.queries).toFixed(1) : 0,
        ctr: s.impressions > 0 ? +((s.clicks / s.impressions) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);

    // 4c. Device breakdown from GSC
    const { data: deviceRows } = await supabase
      .from("search_console_data")
      .select("device, clicks, impressions")
      .not("device", "is", null);

    const deviceStats: Record<string, { clicks: number; impressions: number }> = {};
    for (const r of deviceRows ?? []) {
      const d = r.device ?? "unknown";
      if (!deviceStats[d]) deviceStats[d] = { clicks: 0, impressions: 0 };
      deviceStats[d].clicks += r.clicks ?? 0;
      deviceStats[d].impressions += r.impressions ?? 0;
    }

    // 5. Count total filaments
    const { count: filamentCount, error: filamentError } = await supabase
      .from("filaments")
      .select("id", { count: "exact", head: true });

    if (filamentError) {
      throw new Error(`Failed to count filaments: ${filamentError.message}`);
    }

    // 5b. Fetch GA4 traffic data for richer analysis
    let ga4TopPages: any[] = [];
    let ga4TrafficSources: any = null;
    let ga4Devices: any = null;
    let ga4DailySummary: any[] = [];

    const { data: ga4Pages } = await supabase
      .from("ga4_metrics")
      .select("data")
      .eq("metric_type", "top_pages")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (ga4Pages?.data) {
      ga4TopPages = (ga4Pages.data as any[]).slice(0, 20);
    }

    const { data: ga4Sources } = await supabase
      .from("ga4_metrics")
      .select("data")
      .eq("metric_type", "traffic_sources")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (ga4Sources?.data) {
      ga4TrafficSources = ga4Sources.data;
    }

    const { data: ga4DeviceData } = await supabase
      .from("ga4_metrics")
      .select("data")
      .eq("metric_type", "devices")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (ga4DeviceData?.data) {
      ga4Devices = ga4DeviceData.data;
    }

    const { data: ga4Daily } = await supabase
      .from("ga4_metrics")
      .select("date, data")
      .eq("metric_type", "daily_summary")
      .order("date", { ascending: false })
      .limit(14);

    if (ga4Daily) {
      ga4DailySummary = ga4Daily.map((r: any) => ({ date: r.date, ...r.data }));
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

Analyze the following Search Console data, Google Analytics (GA4) traffic data, and AI citation data, then provide 7-10 prioritized SEO/AEO actions.

## Site Overview
- Total filaments in database: ${filamentCount ?? 0}
- Indexed pages (pages with impressions in GSC): ${indexedPageCount}
- Multi-regional pricing: USD, CAD, EUR, GBP, AUD, JPY, CNY
- Countries with GSC data: ${topCountries.length}
- Total clicks (all time in GSC): ${totalClicks}
- Total impressions (all time in GSC): ${totalImpressions}
- Average CTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%

## Position Distribution (query count per bucket)
${JSON.stringify(positionBuckets, null, 2)}

## Top 25 Queries by Clicks
${JSON.stringify(topQueriesSummary, null, 2)}

## Recent AI Citation Log
${citations && citations.length > 0 ? JSON.stringify(citations.slice(0, 10), null, 2) : "No citation data available yet."}

## GSC Regional Breakdown (Top 15 Countries by Impressions)
${topCountries.length > 0 ? JSON.stringify(topCountries, null, 2) : "No country data available."}

## GSC Device Breakdown
${Object.keys(deviceStats).length > 0 ? JSON.stringify(deviceStats, null, 2) : "No device data available."}

## GA4 Traffic Data (Last 14 Days)
${ga4DailySummary.length > 0 ? `Daily traffic trend:\n${JSON.stringify(ga4DailySummary, null, 2)}` : "No GA4 daily data available yet."}

## GA4 Top Pages by Sessions
${ga4TopPages.length > 0 ? JSON.stringify(ga4TopPages, null, 2) : "No GA4 page data available yet."}

## GA4 Traffic Sources
${ga4TrafficSources ? JSON.stringify(ga4TrafficSources, null, 2) : "No traffic source data available yet."}

## GA4 Device Breakdown
${ga4Devices ? JSON.stringify(ga4Devices, null, 2) : "No device data available yet."}

## Instructions
Return a JSON array of 5-7 SEO actions. Each action must have:
- priority: "P0" (critical/do now), "P1" (important/do soon), or "P2" (nice to have)
- title: short action title (under 80 chars)
- description: 2-3 sentence explanation of what to do and why
- effort: "low", "medium", or "high"
- impact: "low", "medium", or "high"

Focus on actionable, specific recommendations based on ALL data provided (GSC + GA4 + citations). Consider:
- Quick wins (high impression queries with low CTR or positions 4-20)
- Content gaps (queries where we rank but have no dedicated page)
- Technical SEO issues suggested by the data
- AI/AEO optimization opportunities based on citation patterns
- GA4 insights: pages with high bounce rates that need content improvement
- GA4 insights: traffic source gaps (e.g., low organic %, high direct = branding issue)
- GA4 insights: device breakdown issues (mobile vs desktop performance gaps)
- GA4 insights: pages with declining traffic trends that need refreshing
- Cross-reference GSC queries with GA4 top pages to find mismatches (ranking pages that don't get actual traffic)
- International SEO: identify top countries by impressions and recommend hreflang, regional content, or localization
- International SEO: flag countries with high impressions but 0% CTR (may need localized meta descriptions)
- International SEO: suggest currency/region-specific landing pages for top non-English markets
- Device optimization: compare mobile vs desktop performance and flag gaps

Return ONLY the JSON array, no markdown formatting or explanation.`;

    // 7. Call Anthropic API (Claude)
    console.log("Calling Anthropic API for SEO analysis...");

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "You are an expert SEO analyst for a 3D printer filament comparison website. Always respond with valid JSON arrays only, no markdown formatting.",
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${anthropicResponse.status} ${errorText}`);
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent = anthropicData.content?.[0]?.text ?? "[]";

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
    const insertRows = actions.map((action) => ({
      priority: action.priority,
      title: action.title,
      description: action.description,
      effort: action.effort,
      impact: action.impact,
      completed: false,
      generated_at: now,
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
