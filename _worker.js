/**
 * FilaScope Cloudflare Pages Worker
 * 
 * Responsibilities:
 * 1. Route crawler requests to Supabase prerender function
 * 2. Add HSTS header to all responses
 * 3. Clean up any Cloudflare-managed robots.txt injection
 */

const CRAWLER_AGENTS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "yandex", "baiduspider",
  "applebot", "petalbot", "bytespider", "archive.org_bot", "msnbot",
  "googlebot-image", "googlebot-news", "googlebot-video",
  "google-inspectiontool", "storebot-google", "apis-google", "adsbot-google",
  "mediapartners-google", "twitterbot", "facebookexternalhit", "linkedinbot",
  "slackbot", "discordbot", "telegrambot", "whatsappbot",
  "gptbot", "chatgpt-user", "claudebot", "anthropic-ai", "perplexitybot",
  "google-extended", "applebot-extended", "ccbot", "amazonbot",
  "cohere-ai", "diffbot", "youbot", "ai2bot", "meta-externalagent",
  "semrushbot", "ahrefsbot", "dotbot",
];

const PRERENDER_BASE = "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/prerender";
const HSTS_VALUE = "max-age=31536000; includeSubDomains; preload";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

    // Always add HSTS to every response
    const addHsts = (response: Response): Response => {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Strict-Transport-Security", HSTS_VALUE);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    };

    // Serve static assets directly (don't prerender JS/CSS/images/fonts)
    const ext = url.pathname.split(".").pop()?.toLowerCase() || "";
    const staticExts = ["js", "css", "woff2", "woff", "ttf", "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "webmanifest", "json", "xml", "txt", "map"];
    
    if (staticExts.includes(ext)) {
      // For robots.txt, serve from static assets
      if (url.pathname === "/robots.txt") {
        const resp = await fetch(request);
        return addHsts(resp);
      }
      const resp = await fetch(request);
      return addHsts(resp);
    }

    // Check if this is a crawler
    const isCrawler = CRAWLER_AGENTS.some(agent => userAgent.includes(agent));

    if (isCrawler) {
      // Route to prerender function
      try {
        const prerenderUrl = `${PRERENDER_BASE}?path=${encodeURIComponent(url.pathname)}`;
        const prerenderResp = await fetch(prerenderUrl, {
          headers: {
            "User-Agent": request.headers.get("user-agent") || "",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (prerenderResp.ok) {
          const html = await prerenderResp.text();
          return new Response(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Strict-Transport-Security": HSTS_VALUE,
              "X-Prerendered": "true",
              "Cache-Control": "public, max-age=3600, s-maxage=86400",
              "Vary": "User-Agent",
            },
          });
        }
      } catch (e) {
        // Prerender failed — fall through to SPA
        console.error(`Prerender failed for ${url.pathname}:`, e);
      }
    }

    // Regular users (and failed prerender) → serve SPA
    const resp = await fetch(request);
    return addHsts(resp);
  },
};
