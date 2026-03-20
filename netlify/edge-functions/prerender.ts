/**
 * FilaScope Netlify Edge Function — Crawler Prerender Proxy
 *
 * Intercepts incoming requests and proxies bot/crawler User-Agents to the
 * Supabase prerender edge function, which returns full HTML with JSON-LD
 * schema, meta tags, and crawlable content.
 *
 * Human visitors bypass this entirely and receive the normal SPA.
 */

import type { Context } from "https://edge.netlify.com";

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
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "anthropic-ai",
  "claude-web",
  "perplexitybot",
  "google-extended",
  "ccbot",
  "amazonbot",
  "cohere-ai",
  "diffbot",
  "youbot",
  "deepseekbot",
  "ai2bot",
  "meta-externalagent",
];

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

/** Paths that should never be prerendered (static assets) */
const STATIC_EXTENSIONS =
  /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|json|xml|txt|map|mp4|webm|pdf|zip)$/i;

const STATIC_PATHS = new Set([
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/favicon.png",
  "/favicon.ico",
]);

function isStaticAsset(pathname: string): boolean {
  return (
    STATIC_EXTENSIONS.test(pathname) ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/lovable-uploads/") ||
    pathname.startsWith("/sitemap-") ||
    STATIC_PATHS.has(pathname)
  );
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get("User-Agent") || "";

  // 1. Never prerender static assets — let Netlify serve them directly
  if (isStaticAsset(pathname)) {
    return context.next();
  }

  // 2. Not a crawler? Pass through to SPA
  if (!isCrawler(userAgent)) {
    return context.next();
  }

  // 3. Crawler detected — proxy to Supabase prerender edge function
  const prerenderTarget = new URL(PRERENDER_URL);
  prerenderTarget.searchParams.set(
    "path",
    pathname + (url.search || "")
  );

  try {
    const prerenderRes = await fetch(prerenderTarget.toString(), {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    // Follow redirects from prerender
    if (prerenderRes.status === 301 || prerenderRes.status === 302) {
      const location = prerenderRes.headers.get("Location");
      if (location) {
        return Response.redirect(location, prerenderRes.status);
      }
    }

    // If prerender fails (non-2xx), fall back to SPA
    if (!prerenderRes.ok) {
      console.error(
        `[prerender] Returned ${prerenderRes.status} for ${pathname} — falling back to SPA`
      );
      return context.next();
    }

    // Return prerendered HTML with correct headers
    // Note: Supabase gateway may return text/plain even for HTML content,
    // so we force the correct Content-Type for crawler responses
    const headers = new Headers(prerenderRes.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("X-Prerender", "true");
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");

    return new Response(prerenderRes.body, {
      status: prerenderRes.status,
      headers,
    });
  } catch (err) {
    // Never break for users — fall back to SPA
    console.error("[prerender] Fetch failed:", err);
    return context.next();
  }
}

export const config = {
  path: "/*",
};
