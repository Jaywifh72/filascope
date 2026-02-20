/**
 * FilaScope Cloudflare Pages Worker
 *
 * Intercepts incoming requests and proxies bot/crawler User-Agents to the
 * Supabase prerender edge function, which returns full HTML with JSON-LD
 * schema, meta tags, and crawlable content.
 *
 * Human visitors bypass this entirely and receive the normal SPA.
 *
 * Deployment: place this file at public/_worker.js
 * Cloudflare Pages automatically picks it up as the Pages Function worker.
 */

const PRERENDER_URL =
  "https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/prerender";

/** Lower-cased substrings that identify bot User-Agents */
const CRAWLER_AGENTS = [
  // Search engines
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "yandex",
  "baiduspider",
  "applebot",
  "petalbot",
  "bytespider",
  "archive.org_bot",
  "msnbot",
  "sogou",
  "exabot",
  "seznambot",
  // Extended Google variants
  "googlebot-image",
  "googlebot-news",
  "googlebot-video",
  "google-inspectiontool",
  "storebot-google",
  "apis-google",
  "adsbot-google",
  "mediapartners-google",
  // Social / messaging crawlers
  "twitterbot",
  "facebookexternalhit",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsappbot",
  "ia_archiver",
  // SEO tools
  "semrushbot",
  "ahrefsbot",
  // AI crawlers
  "gptbot",           // OpenAI GPTBot
  "chatgpt-user",     // ChatGPT browsing
  "claudebot",        // Anthropic Claude
  "anthropic-ai",     // Anthropic generic
  "perplexitybot",    // Perplexity AI
  "google-extended",  // Google AI training
  "ccbot",            // Common Crawl (used for AI training)
  "amazonbot",        // Amazon Alexa / AI
  "cohere-ai",        // Cohere AI
  "diffbot",          // Diffbot
  "youbot",           // You.com
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

/** Paths that should always be served as static files, never prerendered */
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|json|xml|txt|map|mp4|webm|pdf|zip)$/i;

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith("/assets/");
}

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
Crawl-delay: 2
`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get("User-Agent") || "";

    // 0. Serve robots.txt directly from worker — never depends on asset binding
    if (pathname === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          "X-Robots-Tag": "noindex",
        },
      });
    }

    // 1. Always serve static files directly — never prerender
    if (isStaticAsset(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // 2. If not a crawler, serve the SPA normally
    if (!isCrawler(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    // 3. Bot detected — proxy to prerender edge function
    //    Pass the original path + query string as the ?path= parameter
    const prerenderTarget = new URL(PRERENDER_URL);
    prerenderTarget.searchParams.set(
      "path",
      pathname + (url.search ? url.search : "")
    );

    try {
      const prerenderReq = new Request(prerenderTarget.toString(), {
        method: "GET",
        headers: {
          // Forward the original User-Agent so the edge function can log it
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      const prerenderRes = await fetch(prerenderReq);

      // If prerender returned a redirect (301/302), follow it once
      if (prerenderRes.status === 301 || prerenderRes.status === 302) {
        const location = prerenderRes.headers.get("Location");
        if (location) {
          return Response.redirect(location, prerenderRes.status);
        }
      }

      // Clone headers and add diagnostic header
      const responseHeaders = new Headers(prerenderRes.headers);
      responseHeaders.set("X-Prerender-Worker", "true");

      return new Response(prerenderRes.body, {
        status: prerenderRes.status,
        headers: responseHeaders,
      });
    } catch (err) {
      // Fallback to SPA on prerender error — never break for users
      console.error("[_worker.js] Prerender fetch failed:", err);
      return env.ASSETS.fetch(request);
    }
  },
};
