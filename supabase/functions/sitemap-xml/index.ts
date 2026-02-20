/**
 * sitemap-xml edge function
 *
 * Returns a sitemap INDEX pointing to 6 sub-sitemaps, all hosted at
 * https://filascope.com/ so Google accepts them as same-domain.
 *
 * The sub-sitemaps themselves are served by the `prerender` edge function,
 * which is proxied via public/_redirects:
 *   /sitemap-pages.xml  → prerender?path=/sitemap-pages.xml
 *   etc.
 *
 * This function is reached via:
 *   /sitemap.xml → _redirects → prerender?path=/sitemap.xml
 * but is kept here as a standalone fallback / direct-call endpoint.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://filascope.com";
const FUNCTIONS_URL = "https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1";

const SUB_SITEMAPS = [
  "sitemap-pages.xml",
  "sitemap-filaments.xml",
  "sitemap-brands.xml",
  "sitemap-printers.xml",
  "sitemap-guides.xml",
  "sitemap-colors.xml",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Build sitemap index — <loc> entries use filascope.com domain URLs.
    // The _redirects file proxies these /*.xml paths to the prerender edge function,
    // so crawlers receive real XML while Google sees same-domain sub-sitemap URLs.
    const items = SUB_SITEMAPS.map(
      (s) =>
        `  <sitemap>\n    <loc>${BASE_URL}/${s}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
    ).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Sitemap index error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
