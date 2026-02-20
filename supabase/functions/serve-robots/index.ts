/**
 * serve-robots edge function
 *
 * Serves two static files that Lovable's SPA hosting cannot serve natively:
 *   - robots.txt  (Content-Type: text/plain)
 *   - IndexNow key file (via ?file=indexnow-key)
 *
 * Reached via _redirects rules:
 *   /robots.txt                            → this function (302)
 *   /a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c.txt → this function?file=indexnow-key (302)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ROBOTS_TXT = `# FilaScope robots.txt — AI & Search Engine Crawler Policy
# Updated: 2026-02-20

User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin/
Disallow: /_/

# Sitemaps
Sitemap: https://filascope.com/sitemap.xml

# AI Crawlers - Explicitly Allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Diffbot
Allow: /

User-agent: FacebookExternalHit
Allow: /

User-agent: YouBot
Allow: /

# Crawl-delay for AI bots (be polite)
User-agent: GPTBot
Crawl-delay: 2

User-agent: ClaudeBot
Crawl-delay: 2

User-agent: PerplexityBot
Crawl-delay: 2`;

const INDEXNOW_KEY = "a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (file === "indexnow-key" || file === "indexnow") {
    return new Response(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...corsHeaders,
      },
    });
  }

  // Default: serve robots.txt
  return new Response(ROBOTS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...corsHeaders,
    },
  });
});
