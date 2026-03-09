/**
 * sitemap-generator edge function
 *
 * Dynamically generates a complete sitemap.xml by querying the database
 * for filament products, brands, printers, and including static/guide routes.
 *
 * Reached via _redirects:
 *   /sitemap.xml → this function (302)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://filascope.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/filaments", priority: "0.9", changefreq: "daily" },
  { path: "/printers", priority: "0.8", changefreq: "weekly" },
  { path: "/brands", priority: "0.8", changefreq: "weekly" },
  { path: "/deals", priority: "0.8", changefreq: "daily" },
  { path: "/learn", priority: "0.7", changefreq: "weekly" },
  { path: "/hueforge-td-database", priority: "0.9", changefreq: "weekly" },
  { path: "/color-finder", priority: "0.7", changefreq: "monthly" },
  { path: "/compare", priority: "0.7", changefreq: "monthly" },
  { path: "/methodology", priority: "0.5", changefreq: "monthly" },
  { path: "/colors", priority: "0.7", changefreq: "monthly" },
  { path: "/accessories", priority: "0.6", changefreq: "weekly" },
  { path: "/wizard", priority: "0.6", changefreq: "monthly" },
];

const MATERIAL_ROUTES = [
  "pla", "petg", "abs", "tpu", "asa", "nylon",
  "pla-plus", "silk-pla", "high-speed-pla", "polycarbonate",
  "petg-cf", "wood", "carbon-fiber", "glow-in-the-dark",
].map((slug) => ({
  path: `/filaments/${slug}`,
  priority: "0.8",
  changefreq: "weekly" as const,
}));

const CORNERSTONE_GUIDES = new Set([
  "/guides/best-pla-filaments",
  "/guides/best-petg-filaments",
  "/guides/best-abs-filaments",
  "/guides/best-filaments-for-hueforge",
]);
const COMPARISON_GUIDES = new Set([
  "/guides/pla-vs-petg",
  "/guides/silk-pla-comparison",
  "/guides/asa-vs-abs-outdoor-printing",
  "/guides/pla-plus-vs-pla-pro",
  "/guides/what-is-hueforge-td",
  "/guides/how-to-measure-filament-td",
]);
function guideRoutePriority(path: string): string {
  if (CORNERSTONE_GUIDES.has(path)) return "0.9";
  if (COMPARISON_GUIDES.has(path)) return "0.8";
  return "0.7";
}

const GUIDE_ROUTES = [
  "/guides/best-pla-filaments",
  "/guides/best-petg-filaments",
  "/guides/best-abs-filaments",
  "/guides/pla-vs-petg",
  "/guides/best-filaments-hueforge",
  "/guides/best-filaments-hueforge-lithophanes",
  "/guides/complete-beginners-guide-filaments",
  "/guides/pla-plus-vs-pla-pro",
  "/guides/best-white-filaments-for-hueforge",
  "/guides/what-is-hueforge-td",
  "/guides/how-to-measure-filament-td",
  "/guides/best-filaments-for-hueforge",
  "/guides/best-filaments-for-beginners",
  "/best-white-filaments",
  "/guides/pla-vs-petg",
  "/filament-temperature-guide",
  "/filament-storage-guide",
  "/guides/hueforge-beginners-guide",
  "/guides/understanding-td-values",
  "/guides/hueforge-color-selection",
  "/guides/best-filament-for-prusa-mk4",
  "/guides/best-filament-for-creality-k1",
  "/guides/best-filaments-for-hueforge-lithophanes",
  "/guides/how-to-choose-filament",
  "/guides/strongest-3d-printer-filament",
  "/guides/how-to-store-filament",
  "/guides/how-to-dry-filament",
  "/guides/food-safe-filament",
  "/guides/silk-pla-comparison",
  "/guides/asa-vs-abs-outdoor-printing",
].map((path) => ({ path, priority: guideRoutePriority(path), changefreq: "weekly" as const }));

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Parallel DB queries
    const [filamentRes, brandRes, printerRes] = await Promise.all([
      supabase
        .from("filaments")
        .select("product_handle, updated_at")
        .not("product_handle", "is", null)
        .order("updated_at", { ascending: false }),
      supabase
        .from("automated_brands")
        .select("brand_slug, updated_at")
        .eq("is_visible", true)
        .order("brand_slug"),
      supabase
        .from("printers")
        .select("printer_id, updated_at")
        .not("printer_id", "is", null)
        .order("updated_at", { ascending: false }),
    ]);

    const entries: string[] = [];

    // Static routes
    for (const r of STATIC_ROUTES) {
      entries.push(urlEntry(`${BASE_URL}${r.path}`, today, r.changefreq, r.priority));
    }

    // Material category routes
    for (const r of MATERIAL_ROUTES) {
      entries.push(urlEntry(`${BASE_URL}${r.path}`, today, r.changefreq, r.priority));
    }

    // Guide routes
    for (const r of GUIDE_ROUTES) {
      entries.push(urlEntry(`${BASE_URL}${r.path}`, today, r.changefreq, r.priority));
    }

    // Filament product pages
    if (filamentRes.data) {
      // Deduplicate by product_handle
      const seen = new Set<string>();
      for (const f of filamentRes.data) {
        if (f.product_handle && !seen.has(f.product_handle)) {
          seen.add(f.product_handle);
          const lastmod = f.updated_at
            ? f.updated_at.split("T")[0]
            : today;
          entries.push(
            urlEntry(`${BASE_URL}/filament/${f.product_handle}`, lastmod, "weekly", "0.7")
          );
        }
      }
    }

    // Brand pages
    if (brandRes.data) {
      for (const b of brandRes.data) {
        if (b.brand_slug) {
          const lastmod = b.updated_at
            ? b.updated_at.split("T")[0]
            : today;
          entries.push(
            urlEntry(`${BASE_URL}/brands/${b.brand_slug}`, lastmod, "weekly", "0.7")
          );
        }
      }
    }

    // Printer pages (normalize slugs to lowercase-hyphenated)
    if (printerRes.data) {
      for (const p of printerRes.data) {
        if (p.printer_id) {
          const slug = p.printer_id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
          const lastmod = p.updated_at
            ? p.updated_at.split("T")[0]
            : today;
          entries.push(
            urlEntry(`${BASE_URL}/printers/${slug}`, lastmod, "weekly", "0.7")
          );
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    console.log(
      `[sitemap-generator] Generated sitemap with ${entries.length} URLs ` +
      `(${filamentRes.data?.length || 0} filaments, ${brandRes.data?.length || 0} brands, ${printerRes.data?.length || 0} printers)`
    );

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[sitemap-generator] Error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
