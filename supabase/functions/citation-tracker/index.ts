import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Queries that FilaScope should be cited for across AI platforms
const CITATION_QUERIES = [
  // Core product queries
  "best PLA filament 2026",
  "compare 3D printer filaments",
  "filament temperature chart",
  "HueForge TD values database",
  "filament color finder tool",
  "cheapest PLA filament",
  "PLA vs PETG comparison",
  "best PETG filament",
  "3D printer filament database",
  "filament price comparison",
  // Niche/long-tail queries
  "HueForge transmissive distance lookup",
  "filament compatibility checker",
  "TPU vs PETG comparison",
  "best filament for Bambu Lab P1S",
  "strongest 3D printer filament",
  "best filament for beginners",
  "3D filament specs database",
  "filament color matching tool",
];

// AI engines to check
const ENGINES = ["perplexity", "chatgpt", "gemini", "copilot", "claude", "grok", "deepseek"] as const;

interface CitationResult {
  engine: string;
  query: string;
  cited: boolean;
  notes: string;
  snippet?: string;
}

async function checkPerplexity(query: string, apiKey: string): Promise<CitationResult> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!response.ok) {
      return { engine: "perplexity", query, cited: false, notes: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const citations = data.citations ?? [];

    const cited = content.toLowerCase().includes("filascope") ||
                  citations.some((c: string) => c.includes("filascope.com"));

    const citedUrls = citations.filter((c: string) => c.includes("filascope.com"));

    return {
      engine: "perplexity",
      query,
      cited,
      notes: cited
        ? `Cited! URLs: ${citedUrls.join(", ")}`
        : "Not cited in response",
      snippet: cited ? content.substring(0, 200) : undefined,
    };
  } catch (e) {
    return { engine: "perplexity", query, cited: false, notes: `Error: ${e}` };
  }
}

// Batch check: one API call checks ALL engines for a single query
async function checkAllEngines(query: string, engines: string[], apiKey: string): Promise<CitationResult[]> {
  const engineList = engines.join(", ");
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: `You evaluate whether filascope.com (a 3D printer filament comparison database with 16,000+ filaments, HueForge TD values, live pricing, and temperature data) would be cited by AI search engines for a given query. Consider each engine's tendencies: Perplexity cites niche tools heavily; ChatGPT favors well-known databases; Gemini weights Google-indexed authority; Copilot uses Bing index; Claude uses training data knowledge; Grok is broad but favors real-time data; DeepSeek favors technical databases. Return ONLY a JSON array with one object per engine: [{"engine":"name","cited":true/false,"confidence":"high/medium/low","reason":"brief"}]`,
        messages: [{ role: "user", content: `Query: "${query}"\nEngines to evaluate: ${engineList}` }],
      }),
    });

    if (!response.ok) {
      return engines.map(e => ({ engine: e, query, cited: false, notes: `API error: ${response.status}` }));
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "[]";

    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const results: any[] = JSON.parse(cleaned);
      return results.map((r: any) => ({
        engine: r.engine ?? "unknown",
        query,
        cited: r.cited ?? false,
        notes: `${r.confidence ?? "unknown"} confidence: ${r.reason ?? "no reason"}`,
      }));
    } catch {
      return engines.map(e => ({ engine: e, query, cited: false, notes: `Parse error` }));
    }
  } catch (e) {
    return engines.map(eng => ({ engine: eng, query, cited: false, notes: `Error: ${e}` }));
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body for optional overrides
    let selectedQueries = CITATION_QUERIES;
    let selectedEngines: string[] = [...ENGINES];

    try {
      const body = await req.json();
      if (body.queries?.length) selectedQueries = body.queries;
      if (body.engines?.length) selectedEngines = body.engines;
    } catch {
      // Use defaults
    }

    console.log(`Citation tracker: checking ${selectedQueries.length} queries across ${selectedEngines.length} engines (batched)`);

    const results: CitationResult[] = [];
    const now = new Date().toISOString();

    // Batch: one API call per query checks ALL engines at once
    // 18 queries = 18 API calls (not 126)
    for (let i = 0; i < selectedQueries.length; i++) {
      const query = selectedQueries[i];

      // If we have Perplexity key, check it directly first
      if (perplexityKey && selectedEngines.includes("perplexity")) {
        const pResult = await checkPerplexity(query, perplexityKey);
        results.push(pResult);
      }

      // Batch check all other engines in one API call
      const nonPerplexityEngines = perplexityKey
        ? selectedEngines.filter(e => e !== "perplexity")
        : selectedEngines;

      if (nonPerplexityEngines.length > 0) {
        const batchResults = await checkAllEngines(query, nonPerplexityEngines, anthropicKey);
        results.push(...batchResults);
      }

      // Brief pause between queries to avoid rate limits
      if (i < selectedQueries.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // Store results in seo_citation_log
    const insertRows = results.map(r => ({
      engine: r.engine,
      query: r.query,
      cited: r.cited,
      notes: r.notes,
      checked_at: now,
    }));

    const { error: insertError } = await supabase
      .from("seo_citation_log")
      .insert(insertRows);

    if (insertError) {
      console.error("Failed to store citations:", insertError.message);
    }

    // Summary
    const citedCount = results.filter(r => r.cited).length;
    const totalChecks = results.length;
    const citationRate = totalChecks > 0 ? ((citedCount / totalChecks) * 100).toFixed(1) : "0";

    const byEngine: Record<string, { checked: number; cited: number }> = {};
    for (const r of results) {
      if (!byEngine[r.engine]) byEngine[r.engine] = { checked: 0, cited: 0 };
      byEngine[r.engine].checked++;
      if (r.cited) byEngine[r.engine].cited++;
    }

    console.log(`Citation tracker complete: ${citedCount}/${totalChecks} cited (${citationRate}%)`);

    return new Response(
      JSON.stringify({
        summary: {
          total_checks: totalChecks,
          cited: citedCount,
          citation_rate: citationRate + "%",
          by_engine: byEngine,
          checked_at: now,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Citation tracker error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
