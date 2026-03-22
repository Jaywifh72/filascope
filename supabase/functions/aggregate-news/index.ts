import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedSource {
  name: string;
  url: string;
  tier: number;
}

interface RawArticle {
  title: string;
  source_url: string;
  source_name: string;
  summary: string;
  image_url: string | null;
  published_date: string;
  tier: number;
}

interface ScoredArticle {
  index: number;
  relevance_score: number;
  category: "filament" | "printer" | "software" | "industry" | "community";
  brand_mentions: string[];
  region_relevance: { US: number; EU: number; UK: number; CA: number; AU: number };
  tags: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RSS_FEEDS: FeedSource[] = [
  // Tier 1 — reliable RSS feeds (no Cloudflare blocking)
  { name: "3DPrint.com", url: "https://3dprint.com/feed/", tier: 1 },
  { name: "Hackaday", url: "https://hackaday.com/tag/3d-printer-hacks/feed/", tier: 1 },
  { name: "Prusa Blog", url: "https://blog.prusa3d.com/feed/", tier: 1 },
  // Tier 2 — brand blogs
  { name: "Bambu Lab Blog", url: "https://blog.bambulab.com/rss/", tier: 2 },
  // Tier 3 — community
  { name: "Reddit r/3Dprinting", url: "https://www.reddit.com/r/3Dprinting/top/.rss?t=week", tier: 3 },
  // Note: All3DP, Tom's Hardware, 3D Printing Industry are Cloudflare-protected
  // and block server-side RSS fetches. They can be re-added if a proxy is set up.
];

const SOURCE_LOGOS: Record<string, string> = {
  "All3DP": "https://all3dp.com/favicon.ico",
  "3DPrint.com": "https://3dprint.com/favicon.ico",
  "Tom's Hardware": "https://www.tomshardware.com/favicon.ico",
  "Hackaday": "https://hackaday.com/favicon.ico",
  "3D Printing Industry": "https://3dprintingindustry.com/favicon.ico",
  "Prusa Blog": "https://blog.prusa3d.com/favicon.ico",
  "Bambu Lab Blog": "https://blog.bambulab.com/favicon.ico",
  "Reddit r/3Dprinting": "https://www.reddit.com/favicon.ico",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function estimateReadTimeMin(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

// ---------------------------------------------------------------------------
// RSS Fetching & Parsing
// ---------------------------------------------------------------------------

// Regex-based XML tag extraction (no DOM parser needed)
function getTagContent(xml: string, tag: string): string | null {
  // Try CDATA first, then regular content
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

function getAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, "i");
  const match = xml.match(re);
  return match ? match[1] : null;
}

function splitItems(xml: string): string[] {
  // Split on <item> or <entry> tags
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  const items = xml.match(itemRe);
  if (items && items.length > 0) return items;

  const entryRe = /<entry[\s>][\s\S]*?<\/entry>/gi;
  return xml.match(entryRe) || [];
}

async function fetchFeed(feed: FeedSource): Promise<RawArticle[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FilaScope/1.0; +https://filascope.com)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`Feed ${feed.name} returned HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();

    // Check if we got HTML (Cloudflare block) instead of XML
    if (xml.includes("<!DOCTYPE html") || xml.includes("Attention Required")) {
      console.warn(`Feed ${feed.name}: blocked by Cloudflare`);
      return [];
    }

    const items = splitItems(xml);
    console.log(`Feed ${feed.name}: found ${items.length} items`);

    const articles: RawArticle[] = [];

    for (const item of items) {
      const title = getTagContent(item, "title");

      // Link: RSS uses <link> text, Atom uses href attribute on <link>
      let link = getTagContent(item, "link");
      if (!link || link.startsWith("<")) {
        // Atom-style: <link href="..."/>
        link = getAttr(item, "link", "href");
      }

      const pubDate = getTagContent(item, "pubDate")
        || getTagContent(item, "published")
        || getTagContent(item, "updated");

      const description = getTagContent(item, "description")
        || getTagContent(item, "content")
        || getTagContent(item, "summary");

      // Image: try enclosure, media:content, then HTML img in description
      const imageUrl = getAttr(item, "enclosure", "url")
        || getAttr(item, "media:content", "url")
        || extractFirstImageFromHtml(description || "");

      if (!title || !link) continue;

      const pubDateParsed = pubDate ? new Date(pubDate) : new Date();
      const daysSincePublished = (Date.now() - pubDateParsed.getTime()) / 86400000;
      if (daysSincePublished > 14) continue; // Last 14 days (wider window)

      articles.push({
        title,
        source_url: link,
        source_name: feed.name,
        summary: stripHtml(description || "").slice(0, 500),
        image_url: imageUrl || null,
        published_date: pubDateParsed.toISOString().split("T")[0],
        tier: feed.tier,
      });

      if (articles.length >= 5) break; // Max 5 per source
    }

    console.log(`Feed ${feed.name}: fetched ${articles.length} articles`);
    return articles;
  } catch (e) {
    console.error(`Failed to fetch ${feed.name}:`, (e as Error).message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Claude Scoring
// ---------------------------------------------------------------------------

async function scoreArticlesWithClaude(
  articles: RawArticle[],
  anthropicApiKey: string,
): Promise<ScoredArticle[]> {
  const articlesForScoring = articles.map((a, i) => ({
    index: i,
    title: a.title,
    summary: a.summary,
    source_name: a.source_name,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.1,
      system:
        "You are a 3D printing news editor for FilaScope.com. Score and classify each article. " +
        "Respond ONLY with a valid JSON array, no markdown formatting or explanation.",
      messages: [
        {
          role: "user",
          content:
            `Score and classify each of these 3D printing articles. For each article return an object with:\n` +
            `- index: number (the article's index from the input)\n` +
            `- relevance_score: number 1-100 (how relevant to 3D printing filament/printer enthusiasts)\n` +
            `- category: one of "filament", "printer", "software", "industry", "community"\n` +
            `- brand_mentions: string[] (any 3D printing brands mentioned, e.g. ["Bambu Lab", "Prusa"])\n` +
            `- region_relevance: object with keys US, EU, UK, CA, AU each valued 0-100\n` +
            `- tags: string[] (max 5 descriptive tags)\n\n` +
            `Articles:\n${JSON.stringify(articlesForScoring, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic API error: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();
  const rawContent = data.content?.[0]?.text ?? "[]";

  try {
    const cleaned = rawContent
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const scored: ScoredArticle[] = JSON.parse(cleaned);
    return scored;
  } catch (parseError) {
    console.error("Failed to parse Claude scoring response:", rawContent);
    throw new Error(`Failed to parse scoring response: ${parseError}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting news aggregation from RSS feeds...");

    // 1. Fetch all RSS feeds in parallel
    const feedResults = await Promise.allSettled(
      RSS_FEEDS.map((feed) => fetchFeed(feed)),
    );

    const allArticles: RawArticle[] = [];
    const feedErrors: string[] = [];

    for (let i = 0; i < feedResults.length; i++) {
      const result = feedResults[i];
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      } else {
        feedErrors.push(`${RSS_FEEDS[i].name}: ${result.reason}`);
      }
    }

    console.log(
      `Fetched ${allArticles.length} articles from ${RSS_FEEDS.length} feeds (${feedErrors.length} feed errors)`,
    );

    if (allArticles.length === 0) {
      return new Response(
        JSON.stringify({
          new_articles_count: 0,
          total_fetched: 0,
          errors: feedErrors,
          message: "No articles fetched from any feed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Deduplicate against existing articles from last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: existingArticles, error: existingError } = await supabase
      .from("news_articles")
      .select("source_url")
      .gte("published_date", fourteenDaysAgo.toISOString().split("T")[0]);

    if (existingError) {
      throw new Error(
        `Failed to fetch existing articles: ${existingError.message}`,
      );
    }

    const existingUrls = new Set(
      (existingArticles ?? []).map((a: { source_url: string }) => a.source_url),
    );

    const newArticles = allArticles.filter(
      (a) => !existingUrls.has(a.source_url),
    );

    console.log(
      `After dedup: ${newArticles.length} new articles (${existingUrls.size} already in DB)`,
    );

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({
          new_articles_count: 0,
          total_fetched: allArticles.length,
          already_known: existingUrls.size,
          errors: feedErrors,
          message: "All fetched articles already exist in the database",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Score new articles with Claude
    console.log(`Scoring ${newArticles.length} articles with Claude...`);

    let scoredArticles: ScoredArticle[] = [];
    try {
      scoredArticles = await scoreArticlesWithClaude(
        newArticles,
        anthropicApiKey,
      );
    } catch (scoreError) {
      console.error("Claude scoring failed, using defaults:", scoreError);
      // Fallback: assign default scores so we still insert articles
      scoredArticles = newArticles.map((_, i) => ({
        index: i,
        relevance_score: 50,
        category: "industry" as const,
        brand_mentions: [],
        region_relevance: { US: 50, EU: 50, UK: 50, CA: 50, AU: 50 },
        tags: [],
      }));
    }

    // Build a map of index -> score data
    const scoreMap = new Map<number, ScoredArticle>();
    for (const s of scoredArticles) {
      scoreMap.set(s.index, s);
    }

    // 4. Prepare rows for upsert
    const insertRows = newArticles.map((article, i) => {
      const score = scoreMap.get(i) ?? {
        relevance_score: 50,
        category: "industry",
        brand_mentions: [],
        region_relevance: { US: 50, EU: 50, UK: 50, CA: 50, AU: 50 },
        tags: [],
      };

      return {
        title: article.title,
        source_name: article.source_name,
        source_url: article.source_url,
        summary: article.summary,
        image_url: article.image_url,
        published_date: article.published_date,
        relevance_score: score.relevance_score,
        category: score.category,
        brand_mentions: score.brand_mentions,
        region_scores: score.region_relevance,
        tags: score.tags,
        source_logo_url: SOURCE_LOGOS[article.source_name] || null,
        read_time_min: estimateReadTimeMin(article.summary),
        is_visible: true,
      };
    });

    // 5. Upsert into news_articles
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

    // 6. Get total article count
    const { count: totalCount } = await supabase
      .from("news_articles")
      .select("*", { count: "exact", head: true });

    console.log(
      `News aggregation completed: ${newCount} new articles inserted, ${totalCount ?? "?"} total in DB`,
    );

    return new Response(
      JSON.stringify({
        new_articles_count: newCount,
        total_fetched: allArticles.length,
        total_in_db: totalCount ?? null,
        errors: feedErrors.length > 0 ? feedErrors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error in aggregate-news:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
