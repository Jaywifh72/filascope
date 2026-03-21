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
const ENGINES = ["perplexity", "chatgpt", "gemini", "copilot"] as const;

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

async function checkWithAnthropic(query: string, engine: string, apiKey: string): Promise<CitationResult> {
  // Use Claude to simulate what other AI engines would do — check if FilaScope
  // data/content would be relevant for this query
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
        max_tokens: 300,
        system: `You are checking whether the website filascope.com would likely be cited by the AI search engine "${engine}" for the given query. Consider: Does filascope.com have relevant, authoritative content for this query? Would an AI search engine find and cite it? Respond with JSON only: {"cited": true/false, "confidence": "high"/"medium"/"low", "reason": "brief explanation"}`,
        messages: [{ role: "user", content: `Query: "${query}"\n\nWould ${engine} cite filascope.com for this query?` }],
      }),
    });

    if (!response.ok) {
      return { engine, query, cited: false, notes: `Anthropic API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "{}";

    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      return {
        engine,
        query,
        cited: result.cited ?? false,
        notes: `${result.confidence ?? "unknown"} confidence: ${result.reason ?? "no reason"}`,
      };
    } catch {
      return { engine, query, cited: false, notes: `Parse error: ${text.substring(0, 100)}` };
    }
  } catch (e) {
    return { engine, query, cited: false, notes: `Error: ${e}` };
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

    console.log(`Citation tracker: checking ${selectedQueries.length} queries across ${selectedEngines.length} engines`);

    const results: CitationResult[] = [];
    const now = new Date().toISOString();

    // Check each query against each engine
    // Rate limit: max 3 concurrent requests
    for (let i = 0; i < selectedQueries.length; i++) {
      const query = selectedQueries[i];

      for (const engine of selectedEngines) {
        let result: CitationResult;

        if (engine === "perplexity" && perplexityKey) {
          result = await checkPerplexity(query, perplexityKey);
        } else {
          result = await checkWithAnthropic(query, engine, anthropicKey);
        }

        results.push(result);

        // Rate limit: 500ms between requests
        await new Promise(r => setTimeout(r, 500));
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
