/**
 * FilaScope Cloudflare Pages Middleware
 *
 * Runs on EVERY request before static assets are served.
 * Detects crawler/bot User-Agents and proxies them to the
 * Supabase prerender edge function for full SEO HTML.
 *
 * Human visitors pass through to the SPA.
 */

const PRERENDER_URL =
  "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/prerender";

const CRAWLER_AGENTS = [
  // Search engines
  "googlebot", "bingbot", "slurp", "duckduckbot", "yandex",
  "baiduspider", "applebot", "petalbot", "bytespider",
  "archive.org_bot", "msnbot", "sogou", "exabot", "seznambot",
  // Google variants
  "googlebot-image", "googlebot-news", "googlebot-video",
  "google-inspectiontool", "storebot-google", "apis-google",
  "adsbot-google", "mediapartners-google",
  // Social crawlers
  "twitterbot", "facebookexternalhit", "linkedinbot",
  "slackbot", "discordbot", "telegrambot", "whatsappbot",
  // SEO tools
  "semrushbot", "ahrefsbot",
  // AI crawlers — CRITICAL for AEO
  "gptbot", "chatgpt-user", "oai-searchbot",     // OpenAI
  "claudebot", "anthropic-ai", "claude-web",       // Anthropic
  "perplexitybot",                                  // Perplexity
  "google-extended", "gemini",                      // Google AI
  "ccbot",                                          // Common Crawl
  "amazonbot",                                      // Amazon
  "cohere-ai",                                      // Cohere
  "diffbot",                                        // Diffbot
  "youbot",                                         // You.com
  "deepseekbot",                                    // DeepSeek
  "ai2bot",                                         // Allen AI
  "meta-externalagent",                             // Meta AI
  "bytedance",                                      // ByteDance
  "grokbot",                                        // xAI Grok
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|json|xml|txt|map|mp4|webm|pdf|zip)$/i;

function isStaticAsset(pathname) {
  return (
    STATIC_EXT.test(pathname) ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/images/")
  );
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get("User-Agent") || "";

  // 0. Redirect www to root domain
  if (url.hostname === "www.filascope.com") {
    url.hostname = "filascope.com";
    return Response.redirect(url.toString(), 301);
  }

  // 1. Dynamic sitemap.xml — route to Supabase edge function
  if (pathname === "/sitemap.xml") {
    try {
      const sitemapRes = await fetch(
        "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/sitemap-generator",
        { headers: { Accept: "application/xml" } }
      );
      if (sitemapRes.ok) {
        return new Response(sitemapRes.body, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      }
    } catch (e) {
      // Fall through to static file
    }
    return next();
  }

  // 2. Static assets — always pass through
  if (isStaticAsset(pathname)) {
    return next();
  }

  // 3. Not a crawler — serve SPA
  if (!isCrawler(userAgent)) {
    return next();
  }

  // 4. CRAWLER DETECTED — proxy to Supabase prerender
  const prerenderTarget = new URL(PRERENDER_URL);
  prerenderTarget.searchParams.set("path", pathname + (url.search || ""));

  try {
    const prerenderRes = await fetch(prerenderTarget.toString(), {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    // Handle redirects
    if (prerenderRes.status === 301 || prerenderRes.status === 302) {
      const location = prerenderRes.headers.get("Location");
      if (location) return Response.redirect(location, prerenderRes.status);
    }

    // If prerender fails, fall back to SPA
    if (!prerenderRes.ok) {
      return next();
    }

    // Return prerendered HTML
    return new Response(prerenderRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Prerender": "true",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    // Never break — fall back to SPA
    return next();
  }
}
