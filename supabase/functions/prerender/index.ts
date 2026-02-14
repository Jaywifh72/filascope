import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS
// ============================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// Constants
// ============================================================
const CRAWLER_AGENTS = [
  "googlebot", "bingbot", "twitterbot", "facebookexternalhit",
  "linkedinbot", "slackbot", "whatsapp", "discordbot", "applebot",
  "duckduckbot", "yandex", "archive.org_bot", "slurp",
];

const BASE_URL = "https://filascope.lovable.app";

const GUIDE_META: Record<string, { title: string; description: string }> = {
  "best-pla-filaments": {
    title: "Best PLA Filaments 2025",
    description: "Top-rated PLA filaments for 3D printing. Compare brands, prices, and print quality across Bambu Lab, Polymaker, eSUN & more.",
  },
  "best-petg-filaments": {
    title: "Best PETG Filaments 2025",
    description: "Top PETG filaments ranked by print quality, strength & value. Find the best PETG for your 3D printer.",
  },
  "best-abs-filaments": {
    title: "Best ABS Filaments 2025",
    description: "Top ABS filaments for strength and heat resistance. Compare specs, warping behavior & price across brands.",
  },
  "pla-vs-petg": {
    title: "PLA vs PETG — Which Filament Is Right?",
    description: "PLA vs PETG compared: strength, ease of printing, heat resistance, cost. Choose the right filament for your project.",
  },
  "beginners-guide": {
    title: "3D Printing Filament Beginner's Guide",
    description: "Everything beginners need to know about 3D printer filament: materials, temperatures, storage, and choosing the right filament.",
  },
  "hueforge-filaments": {
    title: "Best Filaments for HueForge",
    description: "Find the best filaments for HueForge lithophanes. TD values, color recommendations & tested filaments for multicolor prints.",
  },
};

// ============================================================
// Types
// ============================================================
interface PageData {
  type: string;
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType: string;
  jsonLd: Record<string, unknown>[];
  breadcrumbs: { name: string; url: string }[];
  h1: string;
  bodyText: string;
}

// ============================================================
// HTML Builder
// ============================================================
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(data: PageData): string {
  const canonicalUrl = `${BASE_URL}${data.canonical}`;
  const ogImage = data.ogImage || `${BASE_URL}/og-image.png`;

  const jsonLdScripts = data.jsonLd
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n    ");

  const breadcrumbNav = data.breadcrumbs
    .map((b, i) =>
      i === data.breadcrumbs.length - 1
        ? `<span>${escapeHtml(b.name)}</span>`
        : `<a href="${escapeHtml(b.url)}">${escapeHtml(b.name)}</a>`
    )
    .join(" › ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(data.title)}</title>
    <meta name="description" content="${escapeHtml(data.description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(data.title)}" />
    <meta property="og:description" content="${escapeHtml(data.description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="${data.ogType}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:site_name" content="FilaScope" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(data.title)}" />
    <meta name="twitter:description" content="${escapeHtml(data.description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    ${jsonLdScripts}
  </head>
  <body>
    <div id="root">
      <header><nav aria-label="Breadcrumb">${breadcrumbNav}</nav></header>
      <main>
        <h1>${escapeHtml(data.h1)}</h1>
        <p>${escapeHtml(data.bodyText)}</p>
      </main>
      <noscript><p>FilaScope requires JavaScript to display full interactive content.</p></noscript>
    </div>
  </body>
</html>`;
}

// ============================================================
// Schema helpers
// ============================================================
function breadcrumbSchema(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

// ============================================================
// Route handlers
// ============================================================
async function getPageData(path: string, supabase: SupabaseClient): Promise<PageData> {
  if (path === "/" || path === "") return homepage();

  const fm = path.match(/^\/filament\/(.+)$/);
  if (fm) return await filamentPage(fm[1], supabase);

  const bm = path.match(/^\/brands\/(.+)$/);
  if (bm) return await brandPage(bm[1], supabase);
  if (path === "/brands") return await brandsListing(supabase);

  const pm = path.match(/^\/printers\/(.+)$/);
  if (pm) return await printerPage(pm[1], supabase);
  if (path === "/printers") return await printersListing(supabase);

  if (path === "/deals") return await dealsPage(supabase);

  const gm = path.match(/^\/guides\/(.+)$/);
  if (gm) return guidePage(gm[1]);
  if (path === "/learn") return learnPage();
  if (path === "/compare") return comparePage();

  return fallback(path);
}

function homepage(): PageData {
  return {
    type: "homepage",
    title: "FilaScope — 3D Printer Filament Database & Price Comparison",
    description: "Compare 3D printer filaments across 50+ brands. Find specs, prices, HueForge TD values & printer compatibility.",
    canonical: "/",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "WebSite",
        name: "FilaScope", url: BASE_URL,
        description: "The most comprehensive 3D printer filament database.",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/?search={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      { "@context": "https://schema.org", "@type": "Organization", name: "FilaScope", url: BASE_URL, logo: `${BASE_URL}/og-image.png` },
    ],
    breadcrumbs: [{ name: "Home", url: "/" }],
    h1: "FilaScope — 3D Printer Filament Database",
    bodyText: "Compare 3D printer filaments across 50+ brands. Find specs, prices, HueForge TD values and printer compatibility.",
  };
}

async function filamentPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  const cols = "id, product_handle, product_title, display_name, vendor, material, color, variant_price, featured_image, diameter_nominal_mm, net_weight_g, nozzle_temp_min_c, nozzle_temp_max_c, td_value";
  let { data } = await supabase.from("filaments").select(cols).eq("product_handle", slug).limit(1).maybeSingle();
  if (!data && slug.match(/^[0-9a-f-]{36}$/i)) {
    const r = await supabase.from("filaments").select(cols).eq("id", slug).limit(1).maybeSingle();
    data = r.data;
  }
  if (!data) return fallback(`/filament/${slug}`);

  const name = data.display_name || data.product_title || "Filament";
  const brand = data.vendor || "";
  const material = data.material || "";
  const color = data.color || "";
  const price = data.variant_price;
  const td = data.td_value;
  const canonicalSlug = data.product_handle || data.id;
  const canonical = `/filament/${canonicalSlug}`;

  let title = `${brand} ${name}`;
  if (material && title.length + material.length < 50) title += ` — ${material}`;
  title += " | FilaScope";
  if (title.length > 60) title = `${brand} ${name} | FilaScope`;

  const dp: string[] = [`${brand} ${name}${color ? ` in ${color}` : ""}.`];
  if (material) dp.push(`${material}${data.diameter_nominal_mm ? `, ${data.diameter_nominal_mm}mm` : ""}.`);
  if (data.nozzle_temp_min_c && data.nozzle_temp_max_c) dp.push(`Nozzle: ${data.nozzle_temp_min_c}-${data.nozzle_temp_max_c}°C.`);
  if (td) dp.push(`TD: ${td}.`);
  if (price) dp.push(`From $${price}.`);
  dp.push("Compare specs & find best price.");
  let description = dp.join(" ");
  if (description.length > 160) description = description.slice(0, 157) + "...";

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product",
    name: `${brand} ${name}`, description,
    ...(data.featured_image && { image: data.featured_image }),
    ...(brand && { brand: { "@type": "Brand", name: brand } }),
    sku: canonicalSlug,
    category: `3D Printer Filament${material ? ` - ${material}` : ""}`,
    ...(material && { material }), ...(color && { color }),
    url: `${BASE_URL}${canonical}`,
  };
  if (price) {
    productSchema.offers = {
      "@type": "Offer", priceCurrency: "USD", price: price.toFixed(2),
      availability: "https://schema.org/InStock", url: `${BASE_URL}${canonical}`,
    };
  }

  const crumbs = [
    { name: "Home", url: "/" }, { name: "Filaments", url: "/" },
    ...(brand ? [{ name: brand, url: `/brands/${brand.toLowerCase().replace(/\s+/g, "-")}` }] : []),
    { name, url: canonical },
  ];

  return {
    type: "product", title, description, canonical,
    ogImage: data.featured_image || undefined, ogType: "product",
    jsonLd: [productSchema, breadcrumbSchema(crumbs)],
    breadcrumbs: crumbs, h1: `${brand} ${name}${color ? ` — ${color}` : ""}`, bodyText: description,
  };
}

async function brandPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  const { data } = await supabase.from("automated_brands")
    .select("brand_name, display_name, brand_slug, description, logo_url, product_count, website_url")
    .eq("brand_slug", slug).limit(1).maybeSingle();
  if (!data) return fallback(`/brands/${slug}`);

  const brandName = data.display_name || data.brand_name;
  const count = data.product_count || 0;
  const canonical = `/brands/${data.brand_slug}`;

  let title = `${brandName} Filaments — ${count} Products | FilaScope`;
  if (title.length > 60) title = `${brandName} Filaments | FilaScope`;

  const description = `Explore ${count} ${brandName} filaments. Specs, reviews & printer compatibility on FilaScope.`;

  const crumbs = [{ name: "Home", url: "/" }, { name: "Brands", url: "/brands" }, { name: brandName, url: canonical }];
  return {
    type: "brand", title, description, canonical, ogImage: data.logo_url || undefined, ogType: "profile",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Organization", name: brandName, url: data.website_url || `${BASE_URL}${canonical}`, ...(data.logo_url && { logo: data.logo_url }), ...(data.description && { description: data.description }) },
      breadcrumbSchema(crumbs),
    ],
    breadcrumbs: crumbs, h1: `${brandName} 3D Printer Filaments`,
    bodyText: data.description || `Browse all ${count} ${brandName} filament products with specs, prices, and compatibility info.`,
  };
}

async function brandsListing(supabase: SupabaseClient): Promise<PageData> {
  const { count } = await supabase.from("automated_brands").select("id", { count: "exact", head: true }).eq("is_visible", true);
  const n = count || 50;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Brands", url: "/brands" }];
  return {
    type: "listing", title: `3D Filament Brands — ${n} Manufacturers | FilaScope`,
    description: `Browse ${n} 3D printer filament brands. Compare product ranges, pricing and availability.`,
    canonical: "/brands", ogType: "website",
    jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Printer Filament Brands", bodyText: `Browse ${n} filament brands and manufacturers.`,
  };
}

async function printerPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  const cols = "id, printer_id, model_name, display_name, brand_id, msrp_usd, build_volume_x_mm, build_volume_y_mm, build_volume_z_mm";
  let { data } = await supabase.from("printers").select(cols).eq("printer_id", slug).limit(1).maybeSingle();
  if (!data && slug.match(/^[0-9a-f-]{36}$/i)) {
    const r = await supabase.from("printers").select(cols).eq("id", slug).limit(1).maybeSingle();
    data = r.data;
  }
  if (!data) return fallback(`/printers/${slug}`);

  let brandName = "";
  if (data.brand_id) {
    const { data: b } = await supabase.from("printer_brands").select("brand").eq("id", data.brand_id).limit(1).maybeSingle();
    brandName = b?.brand || "";
  }

  const pName = data.display_name || data.model_name || "3D Printer";
  const full = brandName ? `${brandName} ${pName}` : pName;
  const canonSlug = data.printer_id || data.id;
  const canonical = `/printers/${canonSlug}`;

  let title = `${full} — Specs & Price | FilaScope`;
  if (title.length > 60) title = `${full} | FilaScope`;

  const dp = [full + "."];
  if (data.build_volume_x_mm && data.build_volume_y_mm && data.build_volume_z_mm)
    dp.push(`Build: ${data.build_volume_x_mm}×${data.build_volume_y_mm}×${data.build_volume_z_mm}mm.`);
  if (data.msrp_usd) dp.push(`From $${data.msrp_usd}.`);
  dp.push("Full specs, filament compatibility & best prices.");
  let description = dp.join(" ");
  if (description.length > 160) description = description.slice(0, 157) + "...";

  const ps: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product", name: full, description,
    ...(brandName && { brand: { "@type": "Brand", name: brandName } }),
    sku: canonSlug, category: "3D Printer", url: `${BASE_URL}${canonical}`,
  };
  if (data.msrp_usd) ps.offers = { "@type": "Offer", priceCurrency: "USD", price: data.msrp_usd.toFixed(2), availability: "https://schema.org/InStock", url: `${BASE_URL}${canonical}` };

  const crumbs = [{ name: "Home", url: "/" }, { name: "Printers", url: "/printers" }, { name: full, url: canonical }];
  return { type: "product", title, description, canonical, ogType: "product", jsonLd: [ps, breadcrumbSchema(crumbs)], breadcrumbs: crumbs, h1: full, bodyText: description };
}

async function printersListing(supabase: SupabaseClient): Promise<PageData> {
  const { count } = await supabase.from("printers").select("id", { count: "exact", head: true });
  const n = count || 100;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Printers", url: "/printers" }];
  return {
    type: "listing", title: "3D Printer Database — Specs & Compatibility | FilaScope",
    description: `Compare ${n} 3D printers. Build volumes, print speeds, filament compatibility & prices.`,
    canonical: "/printers", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Printer Database", bodyText: `Compare ${n} 3D printers by build volume, print speed, filament compatibility and price.`,
  };
}

async function dealsPage(supabase: SupabaseClient): Promise<PageData> {
  const { count } = await supabase.from("filaments").select("id", { count: "exact", head: true })
    .not("variant_compare_at_price", "is", null).not("variant_price", "is", null);
  const n = count || 0;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Deals", url: "/deals" }];
  return {
    type: "deals", title: `3D Filament Deals — ${n} Active Offers | FilaScope`,
    description: `${n} active 3D printer filament deals. Compare discounts across brands and materials.`,
    canonical: "/deals", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Printer Filament Deals", bodyText: `Browse ${n} active deals on 3D printer filament.`,
  };
}

function guidePage(slug: string): PageData {
  const meta = GUIDE_META[slug];
  if (!meta) return fallback(`/guides/${slug}`);
  let title = `${meta.title} | FilaScope`;
  if (title.length > 60) title = meta.title;
  const canonical = `/guides/${slug}`;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Learn", url: "/learn" }, { name: meta.title, url: canonical }];
  return {
    type: "guide", title, description: meta.description, canonical, ogType: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", headline: meta.title, description: meta.description, publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL }, url: `${BASE_URL}${canonical}` },
      breadcrumbSchema(crumbs),
    ],
    breadcrumbs: crumbs, h1: meta.title, bodyText: meta.description,
  };
}

function learnPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Learn", url: "/learn" }];
  return {
    type: "learn", title: "3D Printing Knowledge Base | FilaScope",
    description: "Learn about 3D printing filaments: material guides, comparison charts, temperature settings, and tips.",
    canonical: "/learn", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Printing Knowledge Base", bodyText: "Guides, comparisons, and tips for choosing and using 3D printer filaments.",
  };
}

function comparePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Compare", url: "/compare" }];
  return {
    type: "compare", title: "Compare 3D Filaments Side by Side | FilaScope",
    description: "Compare 3D printer filaments side by side. Specs, prices, materials, and compatibility in one view.",
    canonical: "/compare", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Compare 3D Printer Filaments", bodyText: "Compare filaments side by side across specs, prices, materials and printer compatibility.",
  };
}

function fallback(path: string): PageData {
  return {
    type: "fallback", title: "FilaScope — 3D Printer Filament Database",
    description: "The most comprehensive 3D printer filament database. Compare specs, prices, and compatibility across 50+ brands.",
    canonical: path, ogType: "website", jsonLd: [], breadcrumbs: [{ name: "Home", url: "/" }],
    h1: "FilaScope", bodyText: "The most comprehensive 3D printer filament database.",
  };
}

// ============================================================
// Main handler
// ============================================================
function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => lower.includes(bot));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get("user-agent");
    let path = url.searchParams.get("path") || "/";
    path = path.replace(/\/+$/, "") || "/";

    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${BASE_URL}${path}` },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const pageData = await getPageData(path, supabase);
    const html = buildHtml(pageData);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Robots-Tag": "all",
      },
    });
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
