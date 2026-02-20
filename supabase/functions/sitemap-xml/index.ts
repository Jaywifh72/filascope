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
  { path: "/filaments", priority: 0.9, changefreq: "daily" },
  { path: "/printers", priority: 0.9, changefreq: "weekly" },
  { path: "/brands", priority: 0.9, changefreq: "weekly" },
  { path: "/deals", priority: 0.9, changefreq: "daily" },
  { path: "/brands/compare", priority: 0.6, changefreq: "monthly" },
  { path: "/compare", priority: 0.6, changefreq: "monthly" },
  { path: "/wizard", priority: 0.7, changefreq: "monthly" },
  { path: "/colors", priority: 0.7, changefreq: "weekly" },
  { path: "/hueforge-td-database", priority: 0.7, changefreq: "weekly" },
  { path: "/hueforge-filaments", priority: 0.7, changefreq: "weekly" },
  { path: "/accessories", priority: 0.7, changefreq: "weekly" },
  { path: "/diagnose", priority: 0.6, changefreq: "monthly" },
  { path: "/matrix", priority: 0.6, changefreq: "weekly" },
  { path: "/learn", priority: 0.5, changefreq: "weekly" },
  { path: "/reference/slicers", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/repos", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/cad", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/influencers", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/specialty", priority: 0.5, changefreq: "monthly" },
  { path: "/about", priority: 0.5, changefreq: "monthly" },
  { path: "/methodology", priority: 0.4, changefreq: "monthly" },
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

/**
 * Convert a material name to a URL-safe slug.
 * Mirrors the logic used in the front-end FilamentCategoryPage / MaterialHub.
 * e.g. "PLA+" → "pla-plus", "ABS-CF" → "abs-cf", "PETG" → "petg"
 */
function materialToSlug(material: string): string {
  return material
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Convert a color family name to a URL-safe slug.
 * e.g. "Glow in the Dark" → "glow-in-the-dark"
 */
function colorToSlug(color: string): string {
  return color
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

    // 3. Dynamic /filaments/{material-slug} and /materials/{material-slug}
    // Fetch all distinct materials with product counts to filter thin content
    const { data: materials, error: materialsError } = await supabase
      .from("filaments")
      .select("material")
      .not("material", "is", null)
      .not("material", "eq", "Unknown")
      .not("material", "eq", "Other");

    if (materialsError) {
      console.error("Materials query error:", materialsError.message);
    } else if (materials) {
      // Aggregate counts per material
      const materialCounts = new Map<string, number>();
      for (const row of materials) {
        const m = row.material as string;
        materialCounts.set(m, (materialCounts.get(m) ?? 0) + 1);
      }

      // Only include materials with >= 3 products to avoid thin content
      const validMaterials = Array.from(materialCounts.entries())
        .filter(([, count]) => count >= 3)
        .map(([material]) => material)
        .sort();

      // Deduplicate slugs (different material names can produce the same slug)
      const seenSlugs = new Set<string>();
      for (const material of validMaterials) {
        const slug = materialToSlug(material);
        if (!slug || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        // /filaments/{material} — filtered listing page
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/filaments/${escapeXml(slug)}`,
            today,
            "weekly",
            0.8
          )
        );

        // /materials/{material} — material hub page
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/materials/${escapeXml(slug)}`,
            today,
            "weekly",
            0.8
          )
        );
      }
    }

    // 4. Dynamic /colors/{color} pages from color_families table
    const { data: colorFamilies, error: colorsError } = await supabase
      .from("color_families")
      .select("name")
      .order("display_order");

    if (colorsError) {
      console.error("Color families query error:", colorsError.message);
    } else if (colorFamilies) {
      for (const cf of colorFamilies) {
        const slug = colorToSlug(cf.name as string);
        if (!slug) continue;
        entries.push(
          buildUrlEntry(
            `${BASE_URL}/colors/${escapeXml(slug)}`,
            today,
            "weekly",
            0.7
          )
        );
      }
    }

    // 5. Filament detail pages — fetch slugs in batches
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

    // 6. Printer detail pages
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

    // 7. Brand pages
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
