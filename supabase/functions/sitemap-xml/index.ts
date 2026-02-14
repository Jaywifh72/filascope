import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://filascope.com";

// Static pages with their priority and change frequency
const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changefreq: string;
}> = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/deals", priority: 0.9, changefreq: "daily" },
  { path: "/printers", priority: 0.8, changefreq: "weekly" },
  { path: "/brands", priority: 0.7, changefreq: "weekly" },
  { path: "/brands/compare", priority: 0.6, changefreq: "monthly" },
  { path: "/compare", priority: 0.6, changefreq: "monthly" },
  { path: "/wizard", priority: 0.7, changefreq: "monthly" },
  { path: "/color-finder", priority: 0.7, changefreq: "monthly" },
  { path: "/hueforge-td-database", priority: 0.7, changefreq: "weekly" },
  { path: "/hueforge-filaments", priority: 0.7, changefreq: "weekly" },
  { path: "/accessories", priority: 0.6, changefreq: "weekly" },
  { path: "/diagnose", priority: 0.6, changefreq: "monthly" },
  { path: "/reference/slicers", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/repos", priority: 0.5, changefreq: "monthly" },
  { path: "/matrix", priority: 0.6, changefreq: "weekly" },
  { path: "/about", priority: 0.3, changefreq: "monthly" },
  { path: "/methodology", priority: 0.4, changefreq: "monthly" },
  { path: "/learn", priority: 0.6, changefreq: "weekly" },
  { path: "/affiliate-disclosure", priority: 0.2, changefreq: "yearly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

// Guide pages
const GUIDE_SLUGS = [
  "best-pla-filaments",
  "best-petg-filaments",
  "best-abs-filaments",
  "pla-vs-petg",
  "beginners-guide",
  "hueforge-filaments",
  "best-filaments-for-hueforge-lithophanes",
  "pla-plus-vs-pla-pro",
  "best-filament-for-bambu-lab-p1s",
  "silk-pla-comparison",
  "asa-vs-abs-outdoor-printing",
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toW3CDate(date: string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function buildUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
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
    const entries: string[] = [];

    // 1. Static pages
    for (const page of STATIC_PAGES) {
      entries.push(
        buildUrlEntry(
          `${BASE_URL}${page.path}`,
          today,
          page.changefreq,
          page.priority
        )
      );
    }

    // 2. Guide pages
    for (const slug of GUIDE_SLUGS) {
      entries.push(
        buildUrlEntry(`${BASE_URL}/guides/${slug}`, today, "weekly", 0.7)
      );
    }

    // 3. Filament detail pages — fetch slugs in batches
    let filamentOffset = 0;
    const BATCH = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: filaments, error } = await supabase
        .from("filaments")
        .select("product_handle, id, updated_at")
        .not("product_handle", "is", null)
        .order("id")
        .range(filamentOffset, filamentOffset + BATCH - 1);

      if (error) {
        console.error("Filament query error:", error.message);
        break;
      }

      if (!filaments || filaments.length === 0) {
        hasMore = false;
        break;
      }

      for (const f of filaments) {
        const slug = f.product_handle || f.id;
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/filament/${escapeXml(slug)}`,
            toW3CDate(f.updated_at),
            "weekly",
            0.8
          )
        );
      }

      if (filaments.length < BATCH) {
        hasMore = false;
      } else {
        filamentOffset += BATCH;
      }
    }

    // 4. Printer detail pages
    let printerOffset = 0;
    hasMore = true;

    while (hasMore) {
      const { data: printers, error } = await supabase
        .from("printers")
        .select("printer_id, id, updated_at")
        .order("id")
        .range(printerOffset, printerOffset + BATCH - 1);

      if (error) {
        console.error("Printer query error:", error.message);
        break;
      }

      if (!printers || printers.length === 0) {
        hasMore = false;
        break;
      }

      for (const p of printers) {
        const slug = p.printer_id || p.id;
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/printers/${escapeXml(slug)}`,
            toW3CDate(p.updated_at),
            "weekly",
            0.7
          )
        );
      }

      if (printers.length < BATCH) {
        hasMore = false;
      } else {
        printerOffset += BATCH;
      }
    }

    // 5. Brand pages
    let brandOffset = 0;
    hasMore = true;

    while (hasMore) {
      const { data: brands, error } = await supabase
        .from("automated_brands")
        .select("brand_slug, updated_at")
        .eq("is_visible", true)
        .order("brand_slug")
        .range(brandOffset, brandOffset + BATCH - 1);

      if (error) {
        console.error("Brand query error:", error.message);
        break;
      }

      if (!brands || brands.length === 0) {
        hasMore = false;
        break;
      }

      for (const b of brands) {
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/brands/${escapeXml(b.brand_slug)}`,
            toW3CDate(b.updated_at),
            "monthly",
            0.6
          )
        );
      }

      if (brands.length < BATCH) {
        hasMore = false;
      } else {
        brandOffset += BATCH;
      }
    }

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
