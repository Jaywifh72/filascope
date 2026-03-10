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

const SERVE_ROBOTS_URL =
  "https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/serve-robots";

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

/** Paths that should always be served as static files, bypassing prerender */
const STATIC_PATHS = new Set(["/sitemap.xml"]);

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.test(pathname) || pathname.startsWith("/assets/");
}


export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get("User-Agent") || "";

    // 1. Intercept /robots.txt and /llms.txt — proxy to serve-robots edge function
    if (pathname === "/robots.txt") {
      try {
        const res = await fetch(SERVE_ROBOTS_URL + "?file=robots", {
          headers: { Accept: "text/plain" },
        });
        const body = await res.text();

        if (!res.ok || /<!doctype html|<html[\s>]/i.test(body)) {
          throw new Error(`Unexpected robots response: ${res.status}`);
        }

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      } catch (err) {
        console.error("[_worker.js] robots.txt fetch failed:", err);
        return new Response(
          "User-agent: *\nAllow: /\nSitemap: https://filascope.com/sitemap.xml\n",
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    if (pathname === "/llms.txt") {
      try {
        const res = await fetch(SERVE_ROBOTS_URL + "?file=llms", {
          headers: { Accept: "text/plain" },
        });
        const body = await res.text();

        if (!res.ok || /<!doctype html|<html[\s>]/i.test(body)) {
          throw new Error(`Unexpected llms response: ${res.status}`);
        }

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      } catch (err) {
        console.error("[_worker.js] llms.txt fetch failed:", err);
        return new Response(
          "# FilaScope\n\nThe llms.txt endpoint is temporarily unavailable.\n",
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    // llms-full.txt is served as a static file from public/ — no edge function proxy
    if (pathname === "/llms-full.txt") {
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
