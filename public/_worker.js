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
  "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/prerender";


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
  "oai-searchbot",    // OpenAI SearchBot
  "claudebot",        // Anthropic Claude
  "anthropic-ai",     // Anthropic generic
  "claude-web",       // Claude web browsing
  "perplexitybot",    // Perplexity AI
  "google-extended",  // Google AI training
  "ccbot",            // Common Crawl (used for AI training)
  "amazonbot",        // Amazon Alexa / AI
  "cohere-ai",        // Cohere AI
  "diffbot",          // Diffbot
  "youbot",           // You.com
  "deepseekbot",      // DeepSeek AI
  "ai2bot",           // Allen AI
  "meta-externalagent", // Meta AI
  "bytedance",        // ByteDance / TikTok AI
  "grokbot",          // xAI Grok
  "gemini",           // Google Gemini
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

/** Paths that should always be served as static files, never prerendered */
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|json|xml|txt|map|mp4|webm|pdf|zip)$/i;

/** Paths that should always be served as static files, bypassing prerender */
const STATIC_PATHS = new Set([
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
]);

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith("/assets/") || STATIC_PATHS.has(pathname);
}


export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get("User-Agent") || "";

    // 0. Redirect www to root domain (canonical URL consolidation)
    if (url.hostname === "www.filascope.com") {
      url.hostname = "filascope.com";
      return Response.redirect(url.toString(), 301);
    }

    // 1a. Route dynamic sitemap.xml to Supabase edge function
    if (pathname === "/sitemap.xml") {
      try {
        const sitemapRes = await fetch(
          "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/sitemap-generator",
          { headers: { Accept: "application/xml" } }
        );
        if (sitemapRes.ok) {
          const headers = new Headers(sitemapRes.headers);
          headers.set("Content-Type", "application/xml; charset=utf-8");
          headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
          return new Response(sitemapRes.body, { status: 200, headers });
        }
      } catch (e) {
        console.error("[_worker.js] Sitemap fetch failed:", e);
      }
      // Fall through to static sitemap.xml if edge function fails
      return env.ASSETS.fetch(request);
    }

    // 1b. Always serve machine-readable/static files directly from assets
    if (
      STATIC_PATHS.has(pathname) ||
      pathname.startsWith("/sitemap-") ||
      pathname.startsWith("/public/")
    ) {
      return env.ASSETS.fetch(request);
    }

    if (isStaticAsset(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // 2. If not a crawler, serve the SPA normally
    if (!isCrawler(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    // 3. Bot detected — proxy to prerender edge function
    const prerenderPath = pathname + (url.search ? url.search : "");
    const prerenderUrl = PRERENDER_URL + "?path=" + encodeURIComponent(prerenderPath);

    try {
      const prerenderRes = await fetch(prerenderUrl, {
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html",
        },
      });

      // Handle redirects
      if (prerenderRes.status === 301 || prerenderRes.status === 302) {
        const location = prerenderRes.headers.get("Location");
        if (location) return Response.redirect(location, prerenderRes.status);
      }

      // If prerender succeeded, return its HTML
      if (prerenderRes.ok) {
        const html = await prerenderRes.text();
        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Prerender": "true",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }

      // Non-OK — fall back to SPA
      return env.ASSETS.fetch(request);
    } catch (err) {
      // Fallback to SPA on error
      return env.ASSETS.fetch(request);
    }
  },
};
