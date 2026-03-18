/**
 * generate-sitemap edge function
 *
 * Generates a comprehensive XML sitemap including:
 * - Static routes (homepage, tool pages, reference pages)
 * - Guide pages (from hardcoded GUIDE_DATES)
 * - All individual filament pages (from database)
 * - Brand pages, printer pages, color pages (from database)
 *
 * Cached for 12 hours via Cache-Control headers.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://filascope.com";

function escXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function w3c(d: string | null | undefined): string {
  if (!d) return new Date().toISOString().split("T")[0];
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number
): string {
  return `  <url>
    <loc>${escXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

// ── Static routes ──
const STATIC_ROUTES: { path: string; priority: number; changefreq: string }[] =
  [
    { path: "/", priority: 1.0, changefreq: "weekly" },
    { path: "/filaments", priority: 0.9, changefreq: "daily" },
    { path: "/hueforge-td-database", priority: 0.9, changefreq: "weekly" },
    { path: "/colors", priority: 0.8, changefreq: "weekly" },
    { path: "/printers", priority: 0.8, changefreq: "weekly" },
    { path: "/brands", priority: 0.8, changefreq: "weekly" },
    { path: "/deals", priority: 0.8, changefreq: "daily" },
    { path: "/compare", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-tools", priority: 0.7, changefreq: "weekly" },
    { path: "/reference/materials", priority: 0.7, changefreq: "monthly" },
    { path: "/reference/slicers", priority: 0.7, changefreq: "monthly" },
    // Additional tool/category pages
    { path: "/filaments/pla", priority: 0.8, changefreq: "daily" },
    { path: "/filaments/petg", priority: 0.8, changefreq: "daily" },
    { path: "/filaments/abs", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/tpu", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/asa", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/nylon", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/silk-pla", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/pla-plus", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/high-speed-pla", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/polycarbonate", priority: 0.8, changefreq: "weekly" },
    { path: "/filaments/petg-cf", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-filaments", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-palette-builder", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-layer-preview", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-color-matcher", priority: 0.7, changefreq: "weekly" },
    { path: "/hueforge-project-planner", priority: 0.7, changefreq: "weekly" },
    { path: "/wizard", priority: 0.7, changefreq: "monthly" },
    { path: "/guides", priority: 0.7, changefreq: "weekly" },
    { path: "/about", priority: 0.3, changefreq: "monthly" },
    { path: "/methodology", priority: 0.3, changefreq: "monthly" },
  ];

// ── Guide dates (keep in sync with prerender) ──
const GUIDE_DATES: Record<string, string> = {
  "best-pla-filaments": "2026-01-10",
  "best-petg-filaments": "2026-01-10",
  "best-abs-filaments": "2026-01-10",
  "pla-vs-petg": "2026-01-15",
  "best-filaments-for-hueforge": "2026-01-20",
  "best-filaments-for-beginners": "2026-01-08",
  "best-filament-for-bambu-lab-p1s": "2026-01-14",
  "silk-pla-comparison": "2026-01-18",
  "asa-vs-abs-outdoor-printing": "2026-01-16",
  "pla-plus-vs-pla-pro": "2026-01-12",
  "what-is-hueforge-td": "2026-02-20",
  "best-white-filaments-for-hueforge": "2026-02-20",
  "how-to-measure-filament-td": "2026-02-20",
  "best-filaments-for-outdoor-use": "2026-02-20",
  "best-filaments-for-lithophanes": "2026-02-20",
  "best-filaments-for-miniatures": "2026-02-28",
  "best-filaments-for-cosplay": "2026-02-28",
  "best-food-safe-filaments": "2026-02-28",
  "best-filaments-for-functional-parts": "2026-02-28",
  "best-tpu-filaments": "2026-02-28",
  "pla-vs-abs": "2026-02-28",
  "petg-vs-abs": "2026-02-28",
  "tpu-vs-petg": "2026-02-28",
  "nylon-vs-petg": "2026-02-28",
  "how-to-choose-3d-printer-filament": "2026-02-28",
  "best-filament-for-bambu-lab-a1-mini": "2026-02-28",
  "best-filament-for-creality-ender-3-v3": "2026-02-28",
  "best-filament-for-bambu-lab-x1-carbon": "2026-02-28",
  "best-filament-for-creality-k1-max": "2026-02-28",
  "filament-temperature-guide": "2026-02-28",
  "3d-printer-filament-types-explained": "2026-02-28",
  "best-budget-filaments": "2026-02-28",
  "best-asa-filaments": "2026-02-28",
  "best-nylon-filaments": "2026-02-28",
  "best-pc-filaments": "2026-02-28",
  "best-high-speed-pla-filaments": "2026-02-28",
  "how-to-choose-filament": "2026-02-28",
  "strongest-3d-printer-filament": "2026-02-28",
  "how-to-store-filament": "2026-02-28",
  "how-to-dry-filament": "2026-02-28",
  "food-safe-filament": "2026-02-28",
  "hueforge-beginners-guide": "2026-02-20",
  "understanding-td-values": "2026-02-20",
  "hueforge-color-selection": "2026-02-20",
  "best-filament-for-prusa-mk4": "2026-02-20",
  "best-filament-for-creality-k1": "2026-02-20",
  "best-filaments-for-hueforge-lithophanes": "2026-02-20",
};

const HIGH_PRI_GUIDES = new Set([
  "best-pla-filaments",
  "best-petg-filaments",
  "best-abs-filaments",
  "best-filaments-for-hueforge",
]);

function guideP(slug: string): number {
  return HIGH_PRI_GUIDES.has(slug) ? 0.8 : 0.6;
}

function normSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const entries: string[] = [];

    console.log("[generate-sitemap] Starting sitemap generation");

    // 1. Static routes
    for (const r of STATIC_ROUTES) {
      entries.push(urlEntry(`${BASE_URL}${r.path}`, today, r.changefreq, r.priority));
    }
    console.log(`[generate-sitemap] Added ${STATIC_ROUTES.length} static routes`);

    // 2. Guide pages
    for (const [slug, date] of Object.entries(GUIDE_DATES)) {
      entries.push(
        urlEntry(`${BASE_URL}/guides/${slug}`, date || today, "monthly", guideP(slug))
      );
    }
    console.log(`[generate-sitemap] Added ${Object.keys(GUIDE_DATES).length} guide pages`);

    // 3. Database-backed pages
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3a. Individual filament pages (paginated — critical for long-tail SEO)
    let filamentCount = 0;
    let offset = 0;
    const BATCH = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await sb
        .from("filaments")
        .select("product_handle,id,updated_at,last_scraped_at")
        .not("product_handle", "is", null)
        .order("id")
        .range(offset, offset + BATCH - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const f of data) {
        const lastmod = w3c(
          [f.last_scraped_at, f.updated_at].filter(Boolean).sort().pop() as
            | string
            | undefined
        );
        entries.push(
          urlEntry(
            `${BASE_URL}/filament/${f.product_handle || f.id}`,
            lastmod,
            "daily",
            0.5
          )
        );
        filamentCount++;
      }

      hasMore = data.length >= BATCH;
      offset += BATCH;
    }
    console.log(`[generate-sitemap] Added ${filamentCount} filament pages`);

    // 3b. Brand pages
    let brandCount = 0;
    offset = 0;
    hasMore = true;
    while (hasMore) {
      const { data, error } = await sb
        .from("automated_brands")
        .select("brand_slug,updated_at,last_scrape_at")
        .eq("is_visible", true)
        .order("brand_slug")
        .range(offset, offset + BATCH - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const b of data) {
        const lastmod = w3c(
          [b.last_scrape_at, b.updated_at].filter(Boolean).sort().pop() as
            | string
            | undefined
        );
        entries.push(
          urlEntry(`${BASE_URL}/brands/${b.brand_slug}`, lastmod, "weekly", 0.6)
        );
        brandCount++;
      }

      hasMore = data.length >= BATCH;
      offset += BATCH;
    }
    console.log(`[generate-sitemap] Added ${brandCount} brand pages`);

    // 3c. Printer pages
    let printerCount = 0;
    offset = 0;
    hasMore = true;
    while (hasMore) {
      const { data, error } = await sb
        .from("printers")
        .select("printer_id,id,updated_at")
        .order("id")
        .range(offset, offset + BATCH - 1);

      if (error || !data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of data) {
        const slug = normSlug(p.printer_id || "") || normSlug(p.id);
        entries.push(
          urlEntry(
            `${BASE_URL}/printers/${slug}`,
            w3c(p.updated_at),
            "weekly",
            0.5
          )
        );
        printerCount++;
      }

      hasMore = data.length >= BATCH;
      offset += BATCH;
    }
    console.log(`[generate-sitemap] Added ${printerCount} printer pages`);

    // 3d. Color family pages
    const { data: colorFamilies } = await sb
      .from("color_families")
      .select("name")
      .order("display_order", { ascending: true });

    if (colorFamilies) {
      for (const c of colorFamilies) {
        entries.push(
          urlEntry(
            `${BASE_URL}/colors/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
            today,
            "weekly",
            0.5
          )
        );
      }
      console.log(
        `[generate-sitemap] Added ${colorFamilies.length} color family pages`
      );
    }

    const totalUrls = entries.length;
    console.log(`[generate-sitemap] Total URLs: ${totalUrls}`);

    const xml = wrapUrlset(entries);

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Cache for 12 hours
        "Cache-Control": "public, max-age=43200, s-maxage=43200",
        "X-Sitemap-Urls": String(totalUrls),
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[generate-sitemap] Error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc></url>
</urlset>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-cache",
          ...corsHeaders,
        },
      }
    );
  }
});
