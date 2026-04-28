/**
 * FilaScope Cloudflare Pages Worker
 * Routes crawler requests to Supabase prerender function.
 * Adds HSTS header to all responses.
 */

const CRAWLER_AGENTS = [
  "googlebot","bingbot","slurp","duckduckbot","yandex","baiduspider",
  "applebot","petalbot","bytespider","archive.org_bot","msnbot",
  "googlebot-image","googlebot-news","googlebot-video",
  "google-inspectiontool","storebot-google","apis-google","adsbot-google",
  "mediapartners-google","twitterbot","facebookexternalhit","linkedinbot",
  "slackbot","discordbot","telegrambot","whatsappbot",
  "gptbot","chatgpt-user","claudebot","anthropic-ai","perplexitybot",
  "google-extended","applebot-extended","ccbot","amazonbot",
  "cohere-ai","diffbot","youbot","ai2bot","meta-externalagent",
  "semrushbot","ahrefsbot","dotbot",
];

const PRERENDER_BASE = "https://fytxfdvbzstnimzhjgth.supabase.co/functions/v1/prerender";
const HSTS_VALUE = "max-age=31536000; includeSubDomains; preload";
const STATIC_EXTS = new Set(["js","css","woff2","woff","ttf","png","jpg","jpeg","gif","svg","ico","webp","webmanifest","json","xml","txt","map"]);

function addHsts(response) {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", HSTS_VALUE);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    const ext = url.pathname.split(".").pop()?.toLowerCase() || "";

    // Static assets → serve directly with HSTS
    if (STATIC_EXTS.has(ext) || url.pathname === "/robots.txt" || url.pathname === "/sitemap.xml" || url.pathname.startsWith("/sitemap-")) {
      return addHsts(await env.ASSETS.fetch(request));
    }

    // Check if crawler
    const isCrawler = CRAWLER_AGENTS.some(a => userAgent.includes(a));

    if (isCrawler) {
      try {
        const prerenderUrl = PRERENDER_BASE + "?path=" + encodeURIComponent(url.pathname);
        const prerenderResp = await fetch(prerenderUrl, {
          headers: { "User-Agent": request.headers.get("user-agent") || "" },
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
        // Fall through to SPA
      }
    }

    // Regular users → serve SPA with HSTS
    return addHsts(await env.ASSETS.fetch(request));
  },
};
