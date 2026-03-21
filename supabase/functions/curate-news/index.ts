import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsArticle {
  title: string;
  source_name: string;
  source_url: string;
  summary: string;
  published_date: string;
  tags: string[];
  relevance_score: number;
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

    console.log("Starting news curation...");

    // 1. Query existing news_articles URLs from last 14 days for deduplication
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: existingArticles, error: existingError } = await supabase
      .from("news_articles")
      .select("source_url")
      .gte("published_date", fourteenDaysAgo.toISOString().split("T")[0]);

    if (existingError) {
      throw new Error(`Failed to fetch existing articles: ${existingError.message}`);
    }

    const existingUrls = (existingArticles ?? []).map((a) => a.source_url);

    console.log(`Found ${existingUrls.length} existing articles from last 14 days`);

    // 2. Build prompt for Claude
    const today = new Date().toISOString().split("T")[0];

    const prompt = `Today's date is ${today}. You are a 3D printing news curator for FilaScope, a filament and 3D printer comparison platform.

Generate 5-8 recent 3D printing news article recommendations from the past 1-2 weeks. Focus on articles from these major outlets:
- All3DP (all3dp.com)
- Tom's Hardware (tomshardware.com)
- 3DPrint.com (3dprint.com)
- Hackaday (hackaday.com)
- 3D Printing Industry (3dprintingindustry.com)
- Prusa blog (blog.prusa3d.com)
- Bambu Lab blog (blog.bambulab.com)

Topics of interest (in priority order):
1. New filament releases or material innovations
2. New 3D printer announcements or reviews
3. HueForge or multi-color printing news
4. Firmware updates for major printer brands
5. Industry trends, mergers, or company news
6. Notable 3D printing projects or applications

SKIP these URLs that we already have:
${existingUrls.length > 0 ? existingUrls.join("\n") : "(none)"}

Return a JSON array of articles. Each article must have:
- title: string (the article headline)
- source_name: string (e.g., "All3DP", "Tom's Hardware")
- source_url: string (full URL to the article)
- summary: string (2-3 sentence summary of the article)
- published_date: string (YYYY-MM-DD format, your best estimate)
- tags: string[] (e.g., ["filament", "PLA", "new-release"] or ["printer", "Bambu Lab", "review"])
- relevance_score: number (1-10, where 10 = extremely relevant to FilaScope users)

Return ONLY the JSON array, no markdown formatting or explanation.`;

    // 3. Call Anthropic API (Claude)
    console.log("Calling Anthropic API for news curation...");

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
        system: "You are a 3D printing news curator. Always respond with valid JSON arrays only, no markdown formatting. Only recommend real articles that you are confident exist. Use accurate URLs.",
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

    // 4. Parse and validate the response
    let articles: NewsArticle[];
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      articles = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Anthropic response:", rawContent);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }

    // Validate each article has required fields
    articles = articles.filter(
      (a: Record<string, unknown>) =>
        a.title &&
        a.source_name &&
        a.source_url &&
        a.summary &&
        a.published_date &&
        Array.isArray(a.tags) &&
        typeof a.relevance_score === "number"
    );

    if (articles.length === 0) {
      throw new Error("AI returned no valid articles");
    }

    console.log(`Parsed ${articles.length} valid articles from AI response`);

    // 5. Insert into news_articles with ON CONFLICT deduplication
    const insertRows = articles.map((article) => ({
      title: article.title,
      source_name: article.source_name,
      source_url: article.source_url,
      summary: article.summary,
      published_date: article.published_date,
      tags: article.tags,
      relevance_score: article.relevance_score,
      is_visible: true,
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from("news_articles")
      .upsert(insertRows, {
        onConflict: "source_url",
        ignoreDuplicates: true,
      })
      .select("id");

    if (insertError) {
      throw new Error(`Failed to insert articles: ${insertError.message}`);
    }

    const newCount = insertedData?.length ?? 0;
    console.log(`News curation completed: ${newCount} new articles inserted`);

    return new Response(
      JSON.stringify({
        new_articles_count: newCount,
        total_candidates: articles.length,
        articles: articles,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in curate-news:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
