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

const BASE_URL = "https://filascope.com";
const FUNCTIONS_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

function buildOgImageUrl(params: {
  type: string; title: string; subtitle?: string; price?: string; color?: string; image?: string;
}): string {
  const url = new URL(`${FUNCTIONS_URL}/og-image`);
  url.searchParams.set("type", params.type);
  url.searchParams.set("title", params.title.slice(0, 60));
  if (params.subtitle) url.searchParams.set("subtitle", params.subtitle.slice(0, 80));
  if (params.price) url.searchParams.set("price", params.price);
  if (params.color) url.searchParams.set("color", params.color);
  if (params.image) url.searchParams.set("image", params.image);
  return url.toString();
}

const GUIDE_META: Record<string, { title: string; description: string }> = {
  "best-pla-filaments": {
    title: "Best PLA Filaments 2026",
    description: "Top-rated PLA filaments for 3D printing. Compare brands, prices, and print quality across Bambu Lab, Polymaker, eSUN & more.",
  },
  "best-petg-filaments": {
    title: "Best PETG Filaments 2026",
    description: "Top PETG filaments ranked by print quality, strength & value. Find the best PETG for your 3D printer.",
  },
  "best-abs-filaments": {
    title: "Best ABS Filaments 2026",
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
  "best-filaments-for-hueforge-lithophanes": {
    title: "Best Filaments for HueForge Lithophanes",
    description: "Top 10 filaments for HueForge lithophanes ranked by TD value. Compare opacity, prices, and settings for stunning lithophane prints.",
  },
  "pla-plus-vs-pla-pro": {
    title: "PLA+ vs PLA Pro — What's the Difference?",
    description: "PLA+ and PLA Pro compared: actual material differences, brand naming conventions, strength tests, and top product picks for each.",
  },
  "best-filament-for-bambu-lab-p1s": {
    title: "Best Filaments for Bambu Lab P1S",
    description: "Top filament picks for the Bambu Lab P1S. PLA, PETG, ABS, and TPU recommendations with AMS compatibility notes and print settings.",
  },
  "silk-pla-comparison": {
    title: "Best Silk PLA Filaments Compared",
    description: "Top 10 silk PLA filaments ranked. Compare sheen quality, color options, print settings, and prices for the shiniest prints.",
  },
  "asa-vs-abs-outdoor-printing": {
    title: "ASA vs ABS for Outdoor 3D Prints",
    description: "ASA vs ABS for outdoor use: UV resistance, heat tolerance, print difficulty, and weathering compared. Find the best filament for outdoor parts.",
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

function build404Html(data: PageData): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(data.title)}</title>
    <meta name="description" content="${escapeHtml(data.description)}" />
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <div id="root">
      <main>
        <h1>${escapeHtml(data.h1)}</h1>
        <p>${escapeHtml(data.bodyText)}</p>
        <nav>
          <a href="${BASE_URL}/">Browse Filaments</a>
          <a href="${BASE_URL}/printers">Browse Printers</a>
          <a href="${BASE_URL}/deals">Today's Deals</a>
          <a href="${BASE_URL}/brands">Browse Brands</a>
        </nav>
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

  // /brands/compare must come BEFORE /brands/:slug
  if (path === "/brands/compare") return brandComparePage();
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

  if (path === "/color-finder" || path === "/colors") return colorFinderPage();
  if (path === "/hueforge-td-database" || path === "/td-database") return hueforgeDbPage();
  if (path === "/hueforge-filaments") return hueforgeFinderPage();
  if (path === "/about") return aboutPage();
  if (path === "/methodology") return methodologyPage();
  if (path === "/affiliate-disclosure") return affiliateDisclosurePage();
  if (path === "/privacy") return privacyPage();
  if (path === "/terms") return termsPage();
  if (path === "/wizard") return wizardPage();
  if (path === "/diagnose") return diagnosePage();
  if (path === "/accessories") return accessoriesPage();

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
    ogImage: buildOgImageUrl({
      type: "product", title: `${brand} ${name}`, subtitle: material,
      price: price ? `From $${price}` : undefined, image: data.featured_image || undefined,
    }),
    ogType: "product",
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
    type: "brand", title, description, canonical, ogImage: buildOgImageUrl({ type: "brand", title: `${brandName} Filaments`, subtitle: `${count} products`, image: data.logo_url || undefined }), ogType: "profile",
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
  return { type: "product", title, description, canonical, ogImage: buildOgImageUrl({ type: "product", title: full, subtitle: brandName || undefined, price: data.msrp_usd ? `From $${data.msrp_usd}` : undefined }), ogType: "product", jsonLd: [ps, breadcrumbSchema(crumbs)], breadcrumbs: crumbs, h1: full, bodyText: description };
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
    type: "guide", title, description: meta.description, canonical, ogImage: buildOgImageUrl({ type: "guide", title: meta.title }), ogType: "article",
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

function colorFinderPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Color Finder", url: "/color-finder" }];
  return {
    type: "tool", title: "3D Filament Color Finder — Search by Color | FilaScope",
    description: "Find 3D printer filaments by exact color. Search by hex code, color name, or upload an image to match filaments visually.",
    canonical: "/color-finder", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Filament Color Finder", bodyText: "Search for 3D printer filaments by color. Match hex codes, browse color families, or find the closest filament to any color.",
  };
}

function hueforgeDbPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "HueForge TD Database", url: "/hueforge-td-database" }];
  return {
    type: "tool", title: "HueForge TD Value Database — Filament Transmissivity | FilaScope",
    description: "Complete HueForge TD value database. Search transmission distance values for 500+ filaments. Filter by brand, material & color for lithophane projects.",
    canonical: "/hueforge-td-database", ogType: "website",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Dataset", name: "HueForge TD Value Database", description: "Transmission Distance (TD) values for 3D printer filaments used in HueForge lithophane printing.", url: `${BASE_URL}/hueforge-td-database`, creator: { "@type": "Organization", name: "FilaScope" } },
      breadcrumbSchema(crumbs),
    ],
    breadcrumbs: crumbs, h1: "HueForge TD Value Database",
    bodyText: "Browse transmission distance (TD) values for 500+ filaments. Essential data for HueForge lithophane and multicolor printing projects.",
  };
}

function hueforgeFinderPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "HueForge Filament Finder", url: "/hueforge-filaments" }];
  return {
    type: "tool", title: "HueForge Filament Finder — TD-Ranked Filaments | FilaScope",
    description: "Find the best filaments for HueForge projects. Browse by TD value, color, and brand. Build your perfect lithophane filament stack.",
    canonical: "/hueforge-filaments", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "HueForge Filament Finder", bodyText: "Find and compare filaments for HueForge lithophane projects, ranked by transmission distance (TD) value.",
  };
}

function aboutPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "About", url: "/about" }];
  return {
    type: "info", title: "About FilaScope — 3D Filament Database & Comparison",
    description: "FilaScope is the most comprehensive 3D printer filament database. Compare specs, prices, and compatibility across 50+ brands and 1000+ products.",
    canonical: "/about", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "About FilaScope", bodyText: "FilaScope is the most comprehensive 3D printer filament database, helping makers find the perfect filament for every project.",
  };
}

function methodologyPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Methodology", url: "/methodology" }];
  return {
    type: "info", title: "Our Methodology — How FilaScope Ranks Filaments",
    description: "How FilaScope scores and ranks 3D printer filaments. Our data-driven methodology covers specs, pricing, availability, and community feedback.",
    canonical: "/methodology", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "FilaScope Methodology", bodyText: "Learn how FilaScope collects data, scores filaments, and ranks products across specs, pricing, and availability.",
  };
}

function affiliateDisclosurePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Affiliate Disclosure", url: "/affiliate-disclosure" }];
  return {
    type: "legal", title: "Affiliate Disclosure | FilaScope",
    description: "FilaScope Affiliate Disclosure — Transparency about how we earn commissions from affiliate links while maintaining editorial independence.",
    canonical: "/affiliate-disclosure", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Affiliate Disclosure", bodyText: "Transparency about how FilaScope earns revenue through affiliate partnerships while maintaining editorial independence.",
  };
}

function privacyPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Privacy Policy", url: "/privacy" }];
  return {
    type: "legal", title: "Privacy Policy | FilaScope",
    description: "FilaScope Privacy Policy — Learn how we collect, use, and protect your personal information when using our 3D printing filament comparison service.",
    canonical: "/privacy", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Privacy Policy", bodyText: "Learn how FilaScope collects, uses, and protects your personal information.",
  };
}

function termsPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Terms of Service", url: "/terms" }];
  return {
    type: "legal", title: "Terms of Service | FilaScope",
    description: "FilaScope Terms of Service — The terms and conditions governing your use of the FilaScope 3D printer filament comparison platform.",
    canonical: "/terms", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Terms of Service", bodyText: "The terms and conditions governing your use of FilaScope.",
  };
}

function wizardPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Filament Wizard", url: "/wizard" }];
  return {
    type: "tool", title: "Filament Wizard — Find Your Perfect 3D Filament | FilaScope",
    description: "Answer a few questions about your project and get personalized 3D printer filament recommendations. Material, brand, and budget guidance in seconds.",
    canonical: "/wizard", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Filament Wizard", bodyText: "Get personalized filament recommendations based on your project requirements, printer, and budget.",
  };
}

function diagnosePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Print Diagnose", url: "/diagnose" }];
  return {
    type: "tool", title: "3D Print Problem Diagnosis Tool | FilaScope",
    description: "Diagnose common 3D printing problems. Identify issues like stringing, warping, layer shifts, and get step-by-step fixes for your printer.",
    canonical: "/diagnose", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Print Problem Diagnosis", bodyText: "Identify and fix common 3D printing problems with step-by-step diagnosis and solutions.",
  };
}

function accessoriesPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Accessories", url: "/accessories" }];
  return {
    type: "listing", title: "3D Printer Accessories & Upgrades | FilaScope",
    description: "Browse essential 3D printer accessories and upgrades. Nozzles, build plates, enclosures, filament dryers, and more with price comparisons.",
    canonical: "/accessories", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Printer Accessories", bodyText: "Browse and compare essential 3D printer accessories and upgrades.",
  };
}

function brandComparePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Brands", url: "/brands" }, { name: "Compare", url: "/brands/compare" }];
  return {
    type: "tool", title: "Compare Filament Brands — Side-by-Side Analysis | FilaScope",
    description: "Compare 3D printing filament brands side-by-side. Analyze product variety, pricing, material options, and ratings to find the best brand for your needs.",
    canonical: "/brands/compare", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "Compare Filament Brands", bodyText: "Compare 3D printing filament brands side-by-side across product variety, pricing, materials, and ratings.",
  };
}

function fallback(path: string): PageData {
  return {
    type: "notfound", title: "Page Not Found | FilaScope",
    description: "The page you're looking for doesn't exist or has been moved.",
    canonical: path, ogType: "website", jsonLd: [], breadcrumbs: [{ name: "Home", url: "/" }],
    h1: "Page Not Found", bodyText: "The page you're looking for doesn't exist or has been moved. Browse our filament database or use the search to find what you need.",
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

// ============================================================
// Robots.txt content
// ============================================================
const ROBOTS_TXT = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /settings
Disallow: /maintenance
Disallow: /embed/
Crawl-delay: 1

Sitemap: ${BASE_URL}/sitemap.xml
`;

// ============================================================
// Sitemap helpers
// ============================================================
function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toW3CDate(date: string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  try { return new Date(date).toISOString().split("T")[0]; } catch { return new Date().toISOString().split("T")[0]; }
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: number): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}

const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

const STATIC_PAGES = [
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
  { path: "/learn", priority: 0.6, changefreq: "weekly" },
  { path: "/matrix", priority: 0.6, changefreq: "weekly" },
  { path: "/reference/slicers", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/repos", priority: 0.5, changefreq: "monthly" },
  { path: "/about", priority: 0.3, changefreq: "monthly" },
  { path: "/methodology", priority: 0.4, changefreq: "monthly" },
  { path: "/affiliate-disclosure", priority: 0.2, changefreq: "yearly" },
  { path: "/privacy", priority: 0.2, changefreq: "yearly" },
  { path: "/terms", priority: 0.2, changefreq: "yearly" },
];

const GUIDE_SLUGS = [
  "best-pla-filaments", "best-petg-filaments", "best-abs-filaments",
  "pla-vs-petg", "beginners-guide", "hueforge-filaments",
  "best-filaments-for-hueforge-lithophanes", "pla-plus-vs-pla-pro",
  "best-filament-for-bambu-lab-p1s", "silk-pla-comparison",
  "asa-vs-abs-outdoor-printing",
];

async function sitemapFilaments(supabase: SupabaseClient): Promise<string> {
  const entries: string[] = [];
  let offset = 0;
  const BATCH = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("filaments")
      .select("product_handle, id, updated_at")
      .not("product_handle", "is", null)
      .order("id").range(offset, offset + BATCH - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    for (const f of data) {
      entries.push(urlEntry(`${BASE_URL}/filament/${f.product_handle || f.id}`, toW3CDate(f.updated_at), "weekly", 0.7));
    }
    hasMore = data.length >= BATCH;
    offset += BATCH;
  }
  return wrapUrlset(entries);
}

async function sitemapBrands(supabase: SupabaseClient): Promise<string> {
  const entries: string[] = [];
  let offset = 0;
  const BATCH = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("automated_brands")
      .select("brand_slug, updated_at").eq("is_visible", true)
      .order("brand_slug").range(offset, offset + BATCH - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    for (const b of data) {
      entries.push(urlEntry(`${BASE_URL}/brands/${b.brand_slug}`, toW3CDate(b.updated_at), "monthly", 0.8));
    }
    hasMore = data.length >= BATCH;
    offset += BATCH;
  }
  return wrapUrlset(entries);
}

async function sitemapPrinters(supabase: SupabaseClient): Promise<string> {
  const entries: string[] = [];
  let offset = 0;
  const BATCH = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("printers")
      .select("printer_id, id, updated_at")
      .order("id").range(offset, offset + BATCH - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    for (const p of data) {
      entries.push(urlEntry(`${BASE_URL}/printers/${p.printer_id || p.id}`, toW3CDate(p.updated_at), "weekly", 0.6));
    }
    hasMore = data.length >= BATCH;
    offset += BATCH;
  }
  return wrapUrlset(entries);
}

function sitemapPages(): string {
  const today = new Date().toISOString().split("T")[0];
  const entries = STATIC_PAGES.map((p) => urlEntry(`${BASE_URL}${p.path}`, today, p.changefreq, p.priority));
  return wrapUrlset(entries);
}

function sitemapGuides(): string {
  const today = new Date().toISOString().split("T")[0];
  const entries = GUIDE_SLUGS.map((s) => urlEntry(`${BASE_URL}/guides/${s}`, today, "weekly", 0.9));
  return wrapUrlset(entries);
}

function sitemapIndex(): string {
  const subs = ["sitemap-pages.xml", "sitemap-filaments.xml", "sitemap-brands.xml", "sitemap-printers.xml", "sitemap-guides.xml"];
  const items = subs.map((s) => `  <sitemap><loc>${BASE_URL}/${s}</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get("user-agent");
    let path = url.searchParams.get("path") || "/";
    path = path.replace(/\/+$/, "") || "/";

    // --- robots.txt (served to ALL user agents) ---
    if (path === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
      });
    }

    // --- Sitemaps (served to ALL user agents) ---
    if (path === "/sitemap.xml") {
      return new Response(sitemapIndex(), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
    }
    if (path === "/sitemap-pages.xml") {
      return new Response(sitemapPages(), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
    }
    if (path === "/sitemap-guides.xml") {
      return new Response(sitemapGuides(), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
    }

    // DB-backed sitemaps need Supabase client
    const needsDb = ["/sitemap-filaments.xml", "/sitemap-brands.xml", "/sitemap-printers.xml"].includes(path);

    if (needsDb || isCrawler(userAgent)) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (path === "/sitemap-filaments.xml") {
        return new Response(await sitemapFilaments(supabase), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
      }
      if (path === "/sitemap-brands.xml") {
        return new Response(await sitemapBrands(supabase), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
      }
      if (path === "/sitemap-printers.xml") {
        return new Response(await sitemapPrinters(supabase), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
      }

      // Crawler prerender
      const pageData = await getPageData(path, supabase);
      const is404 = pageData.type === "notfound";
      const html = is404 ? build404Html(pageData) : buildHtml(pageData);
      return new Response(html, {
        status: is404 ? 404 : 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": is404 ? "public, max-age=60" : "public, max-age=3600, s-maxage=3600",
          ...(is404 ? { "X-Robots-Tag": "noindex" } : { "X-Robots-Tag": "all" }),
        },
      });
    }

    // Non-crawler, non-sitemap → redirect to SPA
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${BASE_URL}${path}` },
    });
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response("Internal Server Error", { status: 500, headers: corsHeaders });
  }
});
