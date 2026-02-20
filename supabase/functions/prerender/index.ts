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
  // Search engines
  "googlebot", "bingbot", "slurp", "duckduckbot", "yandex", "baiduspider",
  "applebot", "petalbot", "bytespider", "archive.org_bot", "msnbot",
  "sogou", "exabot", "seznambot",
  // Extended Google crawler variants
  "googlebot-image", "googlebot-news", "googlebot-video",
  "google-inspectiontool", "storebot-google", "apis-google",
  "adsbot-google", "mediapartners-google",
  // Social / messaging crawlers
  "twitterbot", "facebookexternalhit", "linkedinbot", "slackbot",
  "discordbot", "telegrambot", "whatsappbot", "ia_archiver",
  // SEO tools
  "semrushbot", "ahrefsbot",
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
    title: "Best PLA Filaments 2026 — Top Picks Ranked by Print Quality",
    description: "The best PLA filaments ranked by print quality, consistency & value. Compare Bambu Lab, Polymaker, eSUN & more with specs, TD values, and pricing data.",
  },
  "best-petg-filaments": {
    title: "Best PETG Filaments 2026 — Strongest Picks Compared",
    description: "Top PETG filaments ranked by strength, layer adhesion & print quality. Compare brands, check printer compatibility, and find the best PETG for your project.",
  },
  "best-abs-filaments": {
    title: "Best ABS Filaments 2026 — Heat Resistance & Strength Ranked",
    description: "Top ABS filaments compared by heat resistance, warping behavior & print quality. Specs, prices, and compatibility data across 48+ brands.",
  },
  "pla-vs-petg": {
    title: "PLA vs PETG — Complete Comparison for 3D Printing",
    description: "PLA vs PETG compared: strength, ease of printing, heat resistance, cost, and HueForge TD values. Choose the right filament with data from 1,080+ products.",
  },
  "beginners-guide": {
    title: "3D Printing Filament Guide for Beginners — What You Need to Know",
    description: "Everything beginners need to know about 3D printer filament: PLA, PETG, ABS explained. Materials, temperatures, storage tips, and how to choose your first filament.",
  },
  "hueforge-filaments": {
    title: "Best Filaments for HueForge 2026 — TD Values & Color Picks",
    description: "Find the best filaments for HueForge lithophanes. TD values, color recommendations & tested filaments for stunning multicolor prints. 500+ TD values indexed.",
  },
  "best-filaments-for-hueforge-lithophanes": {
    title: "Best Filaments for HueForge Lithophanes — TD Ranked Guide",
    description: "Top 10 filaments for HueForge lithophanes ranked by TD value. Detailed opacity testing, color recommendations, print settings, and pricing compared.",
  },
  "pla-plus-vs-pla-pro": {
    title: "PLA+ vs PLA Pro — What's Actually Different?",
    description: "PLA+ vs PLA Pro compared: are they the same? Actual material differences, strength tests, brand naming conventions, and top product picks for each.",
  },
  "best-filament-for-bambu-lab-p1s": {
    title: "Best Filament for Bambu Lab P1S — Compatible Picks 2026",
    description: "Top filament picks for Bambu Lab P1S. PLA, PETG, ABS, and TPU recommendations with AMS compatibility notes, print settings, and community ratings.",
  },
  "silk-pla-comparison": {
    title: "Best Silk PLA Filaments 2026 — Sheen & Color Compared",
    description: "Top silk PLA filaments ranked by sheen quality and color vibrancy. Compare print settings, prices, and find the shiniest silk PLA for your prints.",
  },
  "asa-vs-abs-outdoor-printing": {
    title: "ASA vs ABS for Outdoor 3D Prints — UV & Weather Resistance",
    description: "ASA vs ABS for outdoor use: UV resistance, heat tolerance, weathering compared. Find the best filament for outdoor functional parts with real test data.",
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
  modifiedTime?: string;
  /** Crawlable product links to emit in body */
  links?: { href: string; text: string }[];
  /** rel="prev" URL */
  paginationPrev?: string;
  /** rel="next" URL */
  paginationNext?: string;
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

  const paginationLinks = [
    data.paginationPrev ? `<link rel="prev" href="${escapeHtml(data.paginationPrev)}" />` : "",
    data.paginationNext ? `<link rel="next" href="${escapeHtml(data.paginationNext)}" />` : "",
  ].filter(Boolean).join("\n    ");

  const bodyLinks = data.links && data.links.length > 0
    ? `<ul aria-label="Filament listing">\n          ${
        data.links.map(l => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.text)}</a></li>`).join("\n          ")
      }\n        </ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(data.title)}</title>
    <meta name="description" content="${escapeHtml(data.description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    ${paginationLinks}
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
    ${data.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(data.modifiedTime)}" />` : ''}
    ${jsonLdScripts}
  </head>
  <body>
    <div id="root">
      <header><nav aria-label="Breadcrumb">${breadcrumbNav}</nav></header>
      <main>
        <h1>${escapeHtml(data.h1)}</h1>
        <p>${escapeHtml(data.bodyText)}</p>
        ${bodyLinks}
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
// ──────────────────────────────────────────────
// Prerender MATERIAL_SLUG_CONFIG (mirrors client)
// ──────────────────────────────────────────────
const PRERENDER_SLUG_CONFIG: Record<string, { label: string; materials: string[]; ilike?: string }> = {
  pla: { label: "PLA", materials: ["PLA", "PLA+", "PLA-HS", "HTPLA", "PLA Pro", "PLA-CF", "Matte PLA", "Marble PLA", "Wood PLA", "Rainbow PLA"] },
  petg: { label: "PETG", materials: ["PETG", "PCTG", "PETG-CF", "PETG+", "Co-Polyester"] },
  abs: { label: "ABS", materials: ["ABS", "ABS+", "ABS-CF", "ABS Pro"] },
  asa: { label: "ASA", materials: ["ASA", "ASA+", "ASA-CF"] },
  tpu: { label: "TPU", materials: ["TPU", "TPU-95A", "TPU-98A", "TPE", "Flexible"] },
  "pla-plus": { label: "PLA+", materials: ["PLA+", "PLA Pro", "PLA-HS"] },
  "silk-pla": { label: "Silk PLA", materials: ["Silk PLA", "Silk PLA+", "Silk"], ilike: "%silk%" },
  nylon: { label: "Nylon", materials: ["PA", "PA-CF", "PA-GF", "PA6", "PA12", "Nylon", "Nylon-CF"] },
  pc: { label: "PC", materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"] },
  polycarbonate: { label: "PC", materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"] },
  "high-speed-pla": { label: "High Speed PLA", materials: ["PLA-HS", "PLA High Speed", "High Speed PLA", "Premium PLA High Speed"] },
  "petg-cf": { label: "PETG-CF", materials: ["PETG-CF", "PETG-GF", "Carbon Fiber PETG"] },
};

const CATEGORY_META_PRERENDER: Record<string, { title: string; desc: string; h1: string; intro: string }> = {
  pla: { title: "PLA Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ PLA 3D printer filaments by price, brand, TD value, and printer compatibility. Find the best PLA for your printer with real-time pricing.", h1: "PLA Filaments", intro: "PLA (Polylactic Acid) is the most popular 3D printing material — easy to print, biodegradable, and available in hundreds of colors. Compare {count} PLA filaments with real-time pricing, HueForge TD values, and printer compatibility data." },
  petg: { title: "PETG Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ PETG 3D printer filaments. Stronger than PLA with better heat resistance. Filter by brand, price, TD value, and printer compatibility.", h1: "PETG Filaments", intro: "PETG combines the printability of PLA with the strength of ABS. It's impact-resistant, food-safe options exist, and it handles higher temperatures. Compare {count} PETG filaments with real-time pricing and compatibility data." },
  abs: { title: "ABS Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ ABS 3D printer filaments. Heat-resistant and durable for functional parts. Filter by brand, price, and printer compatibility on FilaScope.", h1: "ABS Filaments", intro: "ABS is a durable, heat-resistant engineering plastic ideal for functional parts. It requires an enclosed printer and heated bed. Compare {count} ABS filaments with specs, pricing, and compatibility data." },
  tpu: { title: "TPU Flexible Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ TPU and flexible 3D printer filaments. Find the right shore hardness for your project. Filter by brand, price, and printer compatibility.", h1: "TPU & Flexible Filaments", intro: "TPU is a flexible filament with rubber-like properties, ideal for phone cases, gaskets, and wearables. Print slowly with a direct-drive extruder. Compare {count} TPU filaments with specs and pricing." },
  asa: { title: "ASA Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ ASA 3D printer filaments. UV-resistant and weatherproof for outdoor use. Filter by brand, price, and printer compatibility on FilaScope.", h1: "ASA Filaments", intro: "ASA offers superior UV and weather resistance compared to ABS, making it ideal for outdoor parts. It requires an enclosure. Compare {count} ASA filaments with specs, pricing, and compatibility data." },
  "silk-pla": { title: "Silk PLA Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ Silk PLA filaments with shimmery metallic finish. High TD values ideal for HueForge. Filter by brand, color, price, and TD value.", h1: "Silk PLA Filaments", intro: "Silk PLA produces stunning metallic-sheen prints with vibrant colors. It's particularly popular for HueForge lithophanes due to high TD values. Compare {count} Silk PLA filaments with color options and pricing." },
  nylon: { title: "Nylon/PA Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ Nylon and PA 3D printer filaments. Strong, flexible engineering material. Filter by brand, price, and printer compatibility on FilaScope.", h1: "Nylon (PA) Filaments", intro: "Nylon (PA) is a strong, flexible engineering material ideal for functional parts requiring fatigue resistance. It's highly hygroscopic — always dry before printing. Compare {count} Nylon filaments with specs and pricing." },
  "pla-plus": { title: "PLA+ Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ PLA+ 3D printer filaments. Improved impact resistance over standard PLA. Filter by brand, price, and printer compatibility on FilaScope.", h1: "PLA+ Filaments", intro: "PLA+ offers improved impact resistance and reduced brittleness over standard PLA while maintaining easy printability. Compare {count} PLA+ filaments across brands with real-time pricing and specs." },
  "high-speed-pla": { title: "High Speed PLA Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ High Speed PLA filaments for fast 3D printing. Compatible with Bambu Lab, Creality K1, and more. Filter by brand and price.", h1: "High Speed PLA Filaments", intro: "High-Speed PLA is formulated for printing at 200–600mm/s on modern printers like Bambu Lab and Creality K1. Compare {count} high-speed PLA filaments with compatible printers and pricing data." },
  polycarbonate: { title: "Polycarbonate Filaments — Compare {count}+ PC Options | FilaScope", desc: "Compare {count}+ PC and Polycarbonate 3D printer filaments. Strongest print material with high heat tolerance. Filter by brand and printer compatibility.", h1: "Polycarbonate (PC) Filaments", intro: "Polycarbonate is one of the strongest 3D printing materials, with exceptional impact resistance and heat tolerance up to 130°C. Requires an all-metal hotend and enclosure. Compare {count} PC filaments." },
  "petg-cf": { title: "PETG Carbon Fiber Filaments — Compare {count}+ Options | FilaScope", desc: "Compare {count}+ PETG-CF carbon fiber 3D printer filaments. Stiff, lightweight, and strong. Filter by brand, price, and printer compatibility.", h1: "PETG Carbon Fiber Filaments", intro: "PETG-CF (Carbon Fiber) combines PETG's printability with the rigidity of carbon fiber reinforcement. Ideal for lightweight structural parts. Compare {count} PETG-CF filaments with specs and pricing." },
};

function applyCount(template: string, count: number): string {
  return template.replace(/\{count\}/g, count.toLocaleString());
}

async function filamentListingPage(supabase: SupabaseClient): Promise<PageData> {
  const { count } = await supabase.from("filaments").select("id", { count: "exact", head: true });
  const n = count ?? 0;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Filaments", url: "/filaments" }];
  // Top 50 filaments for ItemList
  const { data: topFilaments } = await supabase
    .from("filaments")
    .select("product_handle, id, product_title, display_name, vendor, material, variant_price, featured_image, filascope_score, variant_available")
    .not("filascope_score", "is", null)
    .order("filascope_score", { ascending: false })
    .limit(50);

  const items = (topFilaments ?? []) as any[];
  const bodyLinks = items.map((f: any) => ({
    href: `${BASE_URL}/filament/${f.product_handle || f.id}`,
    text: f.display_name || f.product_title || "Filament",
  }));

  const itemListSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "3D Printer Filament Database",
    numberOfItems: items.length,
    itemListElement: items.map((f: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: f.display_name || f.product_title || "Filament",
        url: `${BASE_URL}/filament/${f.product_handle || f.id}`,
        ...(f.vendor && { brand: { "@type": "Brand", name: f.vendor } }),
        category: `${f.material || "3D Printer"} Filament`,
        ...(f.variant_price && {
          offers: {
            "@type": "Offer",
            price: f.variant_price.toFixed(2),
            priceCurrency: "USD",
            availability: f.variant_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }),
      },
    })),
  };

  return {
    type: "listing",
    title: applyCount("3D Printer Filaments — Compare {count}+ Filaments | FilaScope", n),
    description: applyCount("Browse and compare {count}+ 3D printer filaments from 48+ brands. Filter by material, price, printer compatibility, and TD value for HueForge. Updated daily.", n),
    canonical: "/filaments",
    ogType: "website",
    jsonLd: [breadcrumbSchema(crumbs), itemListSchema],
    breadcrumbs: crumbs,
    h1: "3D Printer Filament Database",
    bodyText: applyCount("Browse all {count}+ 3D printer filaments from 48+ brands. Filter by material, brand, price range, and printer compatibility.", n),
    links: bodyLinks,
  };
}

async function filamentCategoryPage(slug: string, supabase: SupabaseClient, page: number = 0): Promise<PageData> {
  const config = PRERENDER_SLUG_CONFIG[slug];
  if (!config) return fallback(`/filaments/${slug}`);

  const meta = CATEGORY_META_PRERENDER[slug] ?? CATEGORY_META_PRERENDER["pla"];
  const PAGE_SIZE = 50;
  const offset = page * PAGE_SIZE;
  const canonical = `/filaments/${slug}`;

  // Count
  let countQ = supabase.from("filaments").select("id", { count: "exact", head: true });
  if (config.ilike) {
    countQ = (supabase as any).from("filaments").select("id", { count: "exact", head: true })
      .or(config.materials.map((m: string) => `material.eq.${m}`).join(",") + `,material.ilike.${config.ilike}`);
  } else {
    countQ = countQ.in("material", config.materials);
  }
  const { count } = await countQ;
  const n = count ?? 0;
  const totalPages = Math.ceil(n / PAGE_SIZE);

  // Top 50 for page
  let q = (supabase as any).from("filaments")
    .select("product_handle, id, product_title, display_name, vendor, material, variant_price, featured_image, filascope_score, variant_available")
    .in("material", config.materials)
    .not("filascope_score", "is", null)
    .order("filascope_score", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const { data: topFilaments } = await q;
  const items = (topFilaments ?? []) as any[];

  const bodyLinks = items.map((f: any) => ({
    href: `${BASE_URL}/filament/${f.product_handle || f.id}`,
    text: f.display_name || f.product_title || "Filament",
  }));

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Filaments", url: "/filaments" },
    { name: config.label, url: canonical },
  ];

  const breadcrumb = breadcrumbSchema(crumbs);

  const itemListSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${config.label} Filaments`,
    numberOfItems: items.length,
    itemListElement: items.map((f: any, i: number) => ({
      "@type": "ListItem",
      position: offset + i + 1,
      item: {
        "@type": "Product",
        name: f.display_name || f.product_title || "Filament",
        url: `${BASE_URL}/filament/${f.product_handle || f.id}`,
        ...(f.vendor && { brand: { "@type": "Brand", name: f.vendor } }),
        category: `${config.label} 3D Printer Filament`,
        ...(f.variant_price && {
          offers: {
            "@type": "Offer",
            price: f.variant_price.toFixed(2),
            priceCurrency: "USD",
            availability: f.variant_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }),
      },
    })),
  };

  // Pagination links
  const baseCanonical = `${BASE_URL}${canonical}`;
  const paginationPrev = page > 0
    ? (page === 1 ? baseCanonical : `${baseCanonical}?page=${page}`)
    : undefined;
  const paginationNext = page < totalPages - 1
    ? `${baseCanonical}?page=${page + 2}`
    : undefined;

  return {
    type: "listing",
    title: applyCount(meta.title, n),
    description: applyCount(meta.desc, n),
    canonical,
    ogType: "website",
    jsonLd: [breadcrumb, itemListSchema],
    breadcrumbs: crumbs,
    h1: meta.h1,
    bodyText: applyCount(meta.intro, n),
    links: bodyLinks,
    paginationPrev,
    paginationNext,
  };
}

async function getPageData(path: string, supabase: SupabaseClient, queryString?: string): Promise<PageData> {
  if (path === "/" || path === "") return homepage();

  // /filaments (all) and /filaments/:slug (category pages)
  if (path === "/filaments") return await filamentListingPage(supabase);
  const flm = path.match(/^\/filaments\/([^\/]+)$/);
  if (flm) {
    const pageParam = queryString ? new URLSearchParams(queryString).get("page") : null;
    const page = pageParam ? Math.max(0, parseInt(pageParam, 10) - 1) : 0;
    return await filamentCategoryPage(flm[1], supabase, page);
  }

  const fm = path.match(/^\/filament\/(.+)$/);
  if (fm) return await filamentPage(fm[1], supabase);

  // /brands/compare must come BEFORE /brands/:slug
  if (path === "/brands/compare") return brandComparePage();

  // /brands/:brand/:material must come before /brands/:brand
  const bmm = path.match(/^\/brands\/([^\/]+)\/([^\/]+)$/);
  if (bmm) return await brandMaterialPage(bmm[1], bmm[2], supabase);

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

  // /materials/:slug (after /materials/compare which is matched below)
  if (path === "/materials/compare") return comparePage();
  const mm = path.match(/^\/materials\/(.+)$/);
  if (mm) return await materialPage(mm[1], supabase);

  // /colors/:family (after /colors exact)
  if (path === "/color-finder" || path === "/colors") return colorFinderPage();
  const cm = path.match(/^\/colors\/(.+)$/);
  if (cm) return await colorFamilyPage(cm[1], supabase);

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
  if (path === "/best-filaments-for-hueforge") return bestFilamentsForHueforgePage();
  if (path === "/pla-vs-petg") return plaVsPetgPage();
  if (path === "/best-white-filaments") return bestWhiteFilamentsPage();
  if (path === "/filament-database") return filamentDatabasePage();

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
  const cols = "id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, diameter_nominal_mm, net_weight_g, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, transmission_distance, filascope_score, updated_at, last_scraped_at";
  let { data } = await supabase.from("filaments").select(cols).eq("product_handle", slug).limit(1).maybeSingle();
  if (!data && slug.match(/^[0-9a-f-]{36}$/i)) {
    const r = await supabase.from("filaments").select(cols).eq("id", slug).limit(1).maybeSingle();
    data = r.data;
  }
  if (!data) return fallback(`/filament/${slug}`);

  const name = data.display_name || data.product_title || "Filament";
  const brand = data.vendor || "";
  const material = data.material || "";
  const color = data.color_family || "";
  const colorHex = data.color_hex || null;
  const price = data.variant_price;
  const td = data.transmission_distance;
  const filaScore = data.filascope_score;
  const modifiedAt = data.last_scraped_at || data.updated_at || null;
  const canonicalSlug = data.product_handle || data.id;
  const canonical = `/filament/${canonicalSlug}`;
  const colorPart = color ? ` ${color}` : "";

  // Title: include color + TD when available, target ≤60 chars
  const suffix = " | FilaScope";
  let title: string;
  if (td) {
    const mid = `${brand} ${name}${colorPart} — ${material} Filament | TD ${td}`;
    title = mid.length + suffix.length <= 60 ? mid + suffix : `${brand} ${name} — TD ${td}${suffix}`;
  } else {
    const mid = `${brand} ${name}${colorPart} — ${material} Filament`;
    title = mid.length + suffix.length <= 60 ? mid + suffix : `${brand} ${name} — ${material} Filament${suffix}`;
  }
  if (title.length > 60) title = `${brand} ${name}${suffix}`;

  // Description: TD+HueForge when available, 140-160 chars
  const nozzleStr = data.nozzle_temp_min_c && data.nozzle_temp_max_c
    ? `Nozzle ${data.nozzle_temp_min_c}-${data.nozzle_temp_max_c}°C.` : "";
  const priceStr = price ? `From $${price}.` : "";
  let description: string;
  if (td) {
    description = `${brand} ${name}${colorPart} ${material} filament with TD value ${td} for HueForge. ${nozzleStr} ${priceStr} Compare specs, TD data & prices on FilaScope.`.replace(/\s+/g, ' ').trim();
  } else {
    description = `${brand} ${name}${colorPart} ${material} filament. ${nozzleStr} ${priceStr} Compare specs, printer compatibility & prices on FilaScope.`.replace(/\s+/g, ' ').trim();
  }
  if (description.length > 160) description = description.slice(0, 157) + "...";

  // Build additionalProperty array
  const additionalProperties: Record<string, unknown>[] = [];
  if (material) {
    additionalProperties.push({ "@type": "PropertyValue", "name": "Material Type", "value": material });
  }
  if (td != null) {
    additionalProperties.push({
      "@type": "PropertyValue",
      "name": "HueForge Transmission Distance (TD)",
      "value": td,
      "description": "Transmission Distance value for HueForge color mixing and lithophane printing",
    });
  }
  if (data.nozzle_temp_min_c && data.nozzle_temp_max_c) {
    additionalProperties.push({ "@type": "PropertyValue", "name": "Nozzle Temperature Range", "value": `${data.nozzle_temp_min_c}-${data.nozzle_temp_max_c}°C` });
  }
  if (colorHex) {
    additionalProperties.push({ "@type": "PropertyValue", "name": "Color Hex Code", "value": colorHex });
  }
  if (filaScore != null) {
    additionalProperties.push({ "@type": "PropertyValue", "name": "FilaScore", "value": filaScore, "description": "FilaScope quality rating out of 10" });
  }

  // Price valid until 30 days from now
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "Product",
    name: `${brand} ${name}`, description,
    ...(modifiedAt && { dateModified: modifiedAt }),
    ...(data.featured_image && { image: data.featured_image }),
    ...(brand && { brand: { "@type": "Brand", name: brand } }),
    sku: canonicalSlug,
    category: `3D Printer Filament${material ? ` - ${material}` : ""}`,
    ...(material && { material }),
    ...(color && { color }),
    url: `${BASE_URL}${canonical}`,
    ...(data.net_weight_g && { weight: { "@type": "QuantitativeValue", value: data.net_weight_g, unitCode: "GRM" } }),
    ...(data.diameter_nominal_mm && { width: { "@type": "QuantitativeValue", value: data.diameter_nominal_mm, unitCode: "MMT" } }),
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
  };
  if (price) {
    productSchema.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: price.toFixed(2),
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${BASE_URL}${canonical}`,
      ...(brand && { seller: { "@type": "Organization", name: brand } }),
    };
  }

  // Build FAQPage schema from available data
  const faqs: Record<string, unknown>[] = [];
  if (data.nozzle_temp_min_c && data.nozzle_temp_max_c) {
    const mid = Math.round((data.nozzle_temp_min_c + data.nozzle_temp_max_c) / 2);
    faqs.push({
      "@type": "Question",
      name: `What nozzle temperature for ${brand} ${name}${colorPart}?`,
      acceptedAnswer: { "@type": "Answer", text: `Recommended nozzle temperature for ${brand} ${name}${colorPart} is ${data.nozzle_temp_min_c}–${data.nozzle_temp_max_c}°C. Start at ${mid}°C and adjust based on your results.` },
    });
  }
  if (price) {
    faqs.push({
      "@type": "Question",
      name: `How much does ${brand} ${name}${colorPart} cost?`,
      acceptedAnswer: { "@type": "Answer", text: `${brand} ${name}${colorPart} is available from $${price.toFixed(2)} on FilaScope. Compare prices from multiple retailers to find the best deal.` },
    });
  }
  if (td) {
    const tdInterp = td < 2 ? "highly opaque, ideal for dark base layers" : td < 4 ? "semi-opaque, versatile for most HueForge projects" : "translucent, ideal for light-passing highlight layers";
    faqs.push({
      "@type": "Question",
      name: `What is the TD value for ${brand} ${name}${colorPart}?`,
      acceptedAnswer: { "@type": "Answer", text: `The TD (Transmission Distance) value for ${brand} ${name}${colorPart} is ${td}. This means it is ${tdInterp} in HueForge color mixing and lithophane printing.` },
    });
    faqs.push({
      "@type": "Question",
      name: `Is ${brand} ${name}${colorPart} good for HueForge?`,
      acceptedAnswer: { "@type": "Answer", text: `Yes, ${brand} ${name}${colorPart} has a verified TD value of ${td}, making it a suitable choice for HueForge lithophane printing. TD values between 1.0–4.0 are most commonly used for base and highlight layers.` },
    });
  }
  if (material) {
    const easyMaterials = ['PLA', 'PLA+', 'PETG'];
    const isEasy = easyMaterials.some(m => material.toUpperCase().startsWith(m));
    faqs.push({
      "@type": "Question",
      name: `Is ${brand} ${name} good for beginners?`,
      acceptedAnswer: { "@type": "Answer", text: isEasy ? `Yes, ${material} is one of the easiest materials to print with. ${brand} ${name} is well-suited for beginners with straightforward print settings.` : `${material} requires more experience to print reliably. Beginners may want to start with PLA before attempting ${brand} ${name}.` },
    });
  }

  const faqSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs,
  };

  const crumbs = [
    { name: "Home", url: "/" }, { name: "Filaments", url: "/" },
    ...(brand ? [{ name: brand, url: `/brands/${brand.toLowerCase().replace(/\s+/g, "-")}` }] : []),
    { name, url: canonical },
  ];

  // H1: full brand+color+material, truncated to 70 chars
  const h1Full = `${brand} ${name}${colorPart} — ${material} 3D Printer Filament`;
  const h1Short = `${brand} ${name}${colorPart} — ${material} Filament`;
  const h1Minimal = `${brand} ${name}${colorPart}`;
  const h1 = h1Full.length <= 70 ? h1Full : h1Short.length <= 70 ? h1Short : h1Minimal;

  return {
    type: "product", title, description, canonical,
    ogImage: buildOgImageUrl({
      type: "product", title: `${brand} ${name}`, subtitle: material,
      price: price ? `From $${price}` : undefined, image: data.featured_image || undefined,
    }),
    ogType: "product",
    jsonLd: faqs.length > 0 ? [productSchema, breadcrumbSchema(crumbs), faqSchema] : [productSchema, breadcrumbSchema(crumbs)],
    breadcrumbs: crumbs,
    h1,
    bodyText: `Complete specs, pricing, and compatibility info for ${brand} ${name}${colorPart} ${material} filament${td ? `. Transmission Distance (TD): ${td}` : ""}. Compare with similar filaments, check printer compatibility, and find the best deals.`,
    ...(modifiedAt && { modifiedTime: modifiedAt }),
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

  // Fetch top materials for richer description and schema
  const { data: topMats } = await supabase.from("filaments")
    .select("material")
    .ilike("vendor", brandName)
    .not("material", "is", null)
    .limit(1000);

  const materialCounts: Record<string, number> = {};
  (topMats || []).forEach((f: { material: string | null }) => {
    if (f.material) materialCounts[f.material] = (materialCounts[f.material] || 0) + 1;
  });
  const topMaterials = Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([m]) => m);
  const matList = topMaterials.join(", ");

  let title = `${brandName} 3D Filaments — ${count} Products | FilaScope`;
  if (title.length > 60) title = `${brandName} 3D Filaments | FilaScope`;
  if (title.length > 60) title = `${brandName} Filaments | FilaScope`;

  const description = topMaterials.length > 0
    ? `${brandName} 3D filaments: ${count} products across ${topMaterials.length} materials (${matList}). Compare specs, read reviews & find the best deals on FilaScope.`
    : `Browse all ${count} ${brandName} 3D printer filaments. Compare specs, TD values, prices & printer compatibility on FilaScope.`;

  const orgSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandName,
    url: data.website_url || `${BASE_URL}${canonical}`,
    ...(data.logo_url && { logo: { "@type": "ImageObject", url: data.logo_url } }),
    ...(data.description && { description: data.description }),
    ...(data.website_url && { sameAs: [data.website_url] }),
    makesOffer: { "@type": "AggregateOffer", offerCount: count, priceCurrency: "USD" },
  };
  if (topMaterials.length > 0) {
    orgSchema.knowsAbout = topMaterials.map(m => `${m} Filament`);
  }

  const crumbs = [{ name: "Home", url: "/" }, { name: "Brands", url: "/brands" }, { name: brandName, url: canonical }];
  return {
    type: "brand", title, description, canonical,
    ogImage: buildOgImageUrl({ type: "brand", title: `${brandName} 3D Filaments`, subtitle: `${count} products`, image: data.logo_url || undefined }),
    ogType: "profile",
    jsonLd: [orgSchema, breadcrumbSchema(crumbs)],
    breadcrumbs: crumbs,
    h1: `${brandName} 3D Filaments`,
    bodyText: data.description || `Browse all ${count} ${brandName} filament products with specs, prices, and compatibility info.`,
  };
}

async function brandsListing(supabase: SupabaseClient): Promise<PageData> {
  const { count } = await supabase.from("automated_brands").select("id", { count: "exact", head: true }).eq("is_visible", true);
  const n = count || 50;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Brands", url: "/brands" }];
  return {
    type: "listing", title: `3D Filament Brands — Compare ${n}+ Brands | FilaScope`,
    description: `Compare ${n}+ 3D printer filament brands with live pricing, material specifications, and verified reviews. Explore Bambu Lab, Polymaker, Prusament, eSUN, Hatchbox & more on FilaScope.`,
    canonical: "/brands", ogType: "website",
    jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
    h1: "3D Filament Brands — Compare & Discover", bodyText: `Browse ${n} filament brands and manufacturers with live pricing and product catalogs.`,
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

  let title = `${full} — Specs, Compatible Filaments & Price | FilaScope`;
  if (title.length > 60) title = `${full} — Specs & Price | FilaScope`;
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
  const crumbs = [{ name: "Home", url: "/" }, { name: "Color Finder", url: "/colors" }];
  return {
    type: "tool", title: "3D Filament Color Finder — Search by Color | FilaScope",
    description: "Find 3D printer filaments by exact color. Search by hex code, color name, or upload an image to match filaments visually.",
    canonical: "/colors", ogType: "website", jsonLd: [breadcrumbSchema(crumbs)], breadcrumbs: crumbs,
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
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "HueForge TD Value Database",
        description: "Transmission Distance (TD) values for 500+ 3D printer filaments, used for HueForge lithophane and multicolor printing projects.",
        url: `${BASE_URL}/hueforge-td-database`,
        creator: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
        license: "https://creativecommons.org/licenses/by-nc/4.0/",
        variableMeasured: "Transmission Distance",
        measurementTechnique: "Community testing with standardized methodology",
        keywords: ["HueForge", "TD value", "transmission distance", "3D printing", "lithophane", "filament"],
        includedInDataCatalog: { "@type": "DataCatalog", name: "FilaScope 3D Printing Database" },
      },
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

function faqSchema(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function bestFilamentsForHueforgePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Best Filaments for HueForge", url: "/best-filaments-for-hueforge" }];
  return {
    type: "article",
    title: "Best Filaments for HueForge 2026 — TD-Ranked | FilaScope",
    description: "Find the best filaments for HueForge lithophanes. TD-ranked picks across PLA, silk, and translucent materials. Compare TD values, prices & buy links.",
    canonical: "/best-filaments-for-hueforge",
    ogType: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "ItemList", name: "Best Filaments for HueForge 2026", description: "Top-ranked filaments for HueForge lithophane printing sorted by TD value.", url: `${BASE_URL}/best-filaments-for-hueforge` },
      breadcrumbSchema(crumbs),
      faqSchema([
        { q: "What is the best TD value for HueForge?", a: "TD values between 1.0–3.0mm work best for lithophanes. Lower TD is more opaque (anchor layers), higher TD is more translucent (highlight layers)." },
        { q: "Can I use any PLA for HueForge?", a: "Technically yes, but filaments need measured TD values for accurate HueForge profiles. Use community-verified filaments for best results." },
        { q: "How do I find TD values for my filament?", a: "FilaScope maintains the largest public TD value database with 500+ filaments. Search by brand, color, or material on the HueForge TD Database page." },
        { q: "What is silk PLA's TD value?", a: "Silk PLA typically has high TD values (5.0+), making it more translucent — excellent for highlight layers in HueForge stacks." },
        { q: "Do I need special HueForge settings per filament?", a: "Yes. Each filament needs its own TD profile in HueForge to calculate accurate opacity gradients for lithophane printing." },
      ]),
    ],
    breadcrumbs: crumbs,
    h1: "Best Filaments for HueForge in 2026 — TD-Ranked Picks",
    bodyText: "HueForge lithophanes rely on Transmission Distance (TD) values. We rank the top filaments from 48+ brands by verified TD data for perfect lithophane stacks.",
  };
}

function plaVsPetgPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "PLA vs PETG", url: "/pla-vs-petg" }];
  return {
    type: "article",
    title: "PLA vs PETG — 3D Filament Comparison Guide | FilaScope",
    description: "PLA vs PETG compared: strength, flexibility, print settings, price & HueForge TD values. Data-driven comparison from 1,080+ filaments on FilaScope.",
    canonical: "/pla-vs-petg",
    ogType: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", headline: "PLA vs PETG — Which 3D Printer Filament Is Right for You?", description: "Data-driven PLA vs PETG comparison covering print settings, strength, TD values and price.", publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL }, url: `${BASE_URL}/pla-vs-petg` },
      breadcrumbSchema(crumbs),
      faqSchema([
        { q: "Is PLA or PETG easier to print?", a: "PLA is significantly easier — lower temps (190–220°C), minimal warping, no enclosure needed. PETG needs 230–250°C and benefits from an enclosure." },
        { q: "Is PETG stronger than PLA?", a: "PETG is more impact-resistant and flexible. PLA is stiffer with higher tensile strength but more brittle. PETG handles repeated stress better." },
        { q: "Which is better for HueForge, PLA or PETG?", a: "PLA is strongly preferred. It has a wider TD range (0.5–6.0mm) and far more community-verified data, enabling more precise lithophane results." },
        { q: "Can I mix PLA and PETG in the same print?", a: "Generally not recommended — incompatible temperatures and poor interlayer adhesion make mixing PLA and PETG impractical for most printers." },
      ]),
    ],
    breadcrumbs: crumbs,
    h1: "PLA vs PETG — Which 3D Printer Filament Is Right for You?",
    bodyText: "PLA vs PETG: print settings, strength, flexibility, HueForge TD values, and price compared using data from FilaScope's 1,080+ filament database.",
  };
}

function bestWhiteFilamentsPage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Best White Filaments", url: "/best-white-filaments" }];
  return {
    type: "article",
    title: "Best White Filaments for 3D Printing & HueForge | FilaScope",
    description: "Compare white 3D printer filaments ranked by TD value, print quality & price. Find the perfect white PLA for HueForge lithophanes and general printing.",
    canonical: "/best-white-filaments",
    ogType: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "ItemList", name: "Best White 3D Printer Filaments — Ranked by TD Value", description: "White and natural filaments ranked by TD value for HueForge lithophane printing.", url: `${BASE_URL}/best-white-filaments` },
      breadcrumbSchema(crumbs),
      faqSchema([
        { q: "Why do white filaments matter for HueForge?", a: "White filaments are the critical base layer in HueForge lithophane stacks. Their TD value controls how much light passes through, affecting brightness and contrast." },
        { q: "What is the difference between white and natural filament?", a: "White contains TiO₂ pigment (lower TD, more opaque). Natural is unpigmented (higher TD, more translucent, slight yellow tint). Both serve different roles in HueForge stacks." },
        { q: "What TD value should my white filament have?", a: "For most lithophane projects, TD 1.5–4.0mm is ideal. Start with a tested white PLA in the 2.0–3.0mm range for balanced opacity and detail." },
      ]),
    ],
    breadcrumbs: crumbs,
    h1: "Best White Filaments for 3D Printing & HueForge",
    bodyText: "White filaments are the cornerstone of HueForge lithophanes. Ranked by TD value from 48+ brands to help you find the perfect base layer filament.",
  };
}

function filamentDatabasePage(): PageData {
  const crumbs = [{ name: "Home", url: "/" }, { name: "Filament Database", url: "/filament-database" }];
  return {
    type: "website",
    title: "3D Filament Database — Compare 1,080+ Products | FilaScope",
    description: "The most comprehensive 3D printer filament database. Compare PLA, PETG, ABS & more across 48+ brands. Filter by specs, price, TD value & compatibility.",
    canonical: "/filament-database",
    ogType: "website",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "WebApplication", name: "FilaScope 3D Filament Database", url: `${BASE_URL}/filament-database`, applicationCategory: "UtilitiesApplication", description: "The most comprehensive 3D printer filament database. Compare PLA, PETG, ABS & more across 48+ brands." },
      breadcrumbSchema(crumbs),
      faqSchema([
        { q: "How many filaments are in the FilaScope database?", a: "FilaScope indexes 1,080+ 3D printer filaments across 48+ brands, covering PLA, PETG, ABS, TPU, ASA, Nylon, PC, and specialty materials with specs, pricing, and TD values." },
        { q: "How do I filter filaments by material or brand?", a: "Use the main FilaScope catalog to filter by material, brand, diameter, color, price range, TD value, nozzle temperature, and FilaScope quality score." },
        { q: "How often is FilaScope's filament data updated?", a: "Pricing is updated frequently through automated scraping. Specs and TD values are verified manually. New products are typically added within days of brand announcements." },
      ]),
    ],
    breadcrumbs: crumbs,
    h1: "3D Printer Filament Database — 1,080+ Products Compared",
    bodyText: "The most comprehensive free 3D printer filament database. Compare PLA, PETG, ABS & more across 48+ brands by specs, price, TD value, and printer compatibility.",
  };
}

// ============================================================
// Programmatic page handlers
// ============================================================

const MATERIAL_SLUG_MAP: Record<string, { label: string; materials: string[]; ilike?: string }> = {
  pla:       { label: "PLA",      materials: ["PLA", "PLA+", "PLA-HS", "HTPLA", "PLA Pro", "PLA-CF", "Matte PLA", "Marble PLA", "Wood PLA", "Rainbow PLA"] },
  petg:      { label: "PETG",     materials: ["PETG", "PCTG", "PETG-CF", "PETG+", "Co-Polyester"] },
  abs:       { label: "ABS",      materials: ["ABS", "ABS+", "ABS-CF", "ABS Pro"] },
  asa:       { label: "ASA",      materials: ["ASA", "ASA+", "ASA-CF"] },
  tpu:       { label: "TPU",      materials: ["TPU", "TPU-95A", "TPU-98A", "TPE", "Flexible"] },
  "pla-plus":  { label: "PLA+",    materials: ["PLA+", "PLA Pro", "PLA-HS"] },
  "silk-pla":  { label: "Silk PLA", materials: ["Silk PLA", "Silk PLA+", "Silk"], ilike: "%silk%" },
  nylon:     { label: "Nylon",    materials: ["PA", "PA-CF", "PA-GF", "PA6", "PA12", "Nylon", "Nylon-CF"] },
  pc:        { label: "PC",       materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"] },
};

const COLOR_SLUG_MAP: Record<string, { label: string; families: string[]; hueforgeRelevant?: boolean }> = {
  white:   { label: "White",   families: ["White"],                               hueforgeRelevant: true },
  black:   { label: "Black",   families: ["Black"] },
  blue:    { label: "Blue",    families: ["Blue"] },
  red:     { label: "Red",     families: ["Red"] },
  green:   { label: "Green",   families: ["Green"] },
  gray:    { label: "Gray",    families: ["Gray", "Grey", "Light Grey", "Dark Grey", "Silver Gray"] },
  yellow:  { label: "Yellow",  families: ["Yellow"] },
  orange:  { label: "Orange",  families: ["Orange"] },
  purple:  { label: "Purple",  families: ["Purple", "Violet"] },
  brown:   { label: "Brown",   families: ["Brown", "Tan", "Beige"] },
  natural: { label: "Natural", families: ["Natural", "Beige", "Cream"],           hueforgeRelevant: true },
  pink:    { label: "Pink",    families: ["Pink", "Rose", "Magenta"] },
  clear:   { label: "Clear",   families: ["Clear", "Transparent", "Natural Clear"], hueforgeRelevant: true },
  gold:    { label: "Gold",    families: ["Gold", "Bronze"] },
  silver:  { label: "Silver",  families: ["Silver", "Chrome", "Metallic"] },
};

async function materialPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  const config = MATERIAL_SLUG_MAP[slug];
  if (!config) return fallback(`/materials/${slug}`);

  // Count + avg price + brand count
  const { data, count } = await (supabase as unknown as { from: (t: string) => any })
    .from("filaments")
    .select("vendor, variant_price", { count: "exact" })
    .in("material", config.materials)
    .limit(1000);

  const n = count ?? 0;
  if (n < 3) return fallback(`/materials/${slug}`);

  const rows = (data ?? []) as { vendor: string | null; variant_price: number | null }[];
  const prices = rows.map((r) => r.variant_price).filter(Boolean) as number[];
  const brandCount = new Set(rows.map((r) => r.vendor).filter(Boolean)).size;

  const { label } = config;
  const canonical = `/materials/${slug}`;

  let title = `${label} Filament — Compare ${n.toLocaleString()} Products | FilaScope`;
  if (title.length > 60) title = `${label} Filament — ${n.toLocaleString()} Products | FilaScope`;
  if (title.length > 60) title = `${label} Filament | FilaScope`;

  const description = `Browse ${n.toLocaleString()} ${label} 3D printer filaments from ${brandCount}+ brands. Compare specs, prices, and HueForge TD values on FilaScope.`;

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Materials", url: "/reference/materials" },
    { name: `${label} Filaments`, url: canonical },
  ];

  return {
    type: "material",
    title,
    description,
    canonical,
    ogType: "website",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "ItemList", name: `Best ${label} Filaments`, description, url: `${BASE_URL}${canonical}` },
      breadcrumbSchema(crumbs),
    ],
    breadcrumbs: crumbs,
    h1: `${label} Filament — Compare ${n.toLocaleString()} Products`,
    bodyText: `Browse ${n.toLocaleString()} ${label} 3D printer filaments from ${brandCount}+ brands. Compare specs, prices, TD values, and printer compatibility on FilaScope.`,
  };
}

async function colorFamilyPage(slug: string, supabase: SupabaseClient): Promise<PageData> {
  const config = COLOR_SLUG_MAP[slug];
  if (!config) return fallback(`/colors/${slug}`);

  const { count } = await supabase
    .from("filaments")
    .select("id", { count: "exact", head: true })
    .in("color_family", config.families);

  const n = count ?? 0;
  if (n < 3) return fallback(`/colors/${slug}`);

  const { label } = config;
  const canonical = `/colors/${slug}`;

  let description: string;
  if (config.hueforgeRelevant) {
    description = `Compare ${n.toLocaleString()} ${label.toLowerCase()} 3D printer filaments ranked by TD value, brand, and price. Essential for HueForge lithophanes — find your perfect ${label.toLowerCase()} filament on FilaScope.`;
  } else {
    description = `Browse ${n.toLocaleString()} ${label.toLowerCase()} 3D printer filaments from top brands. Compare prices, materials, and HueForge TD values. Find the best ${label.toLowerCase()} filament for your next print.`;
  }

  let title = `${label} 3D Printer Filaments — Compare ${n.toLocaleString()} Options | FilaScope`;
  if (title.length > 60) title = `${label} 3D Printer Filaments — ${n.toLocaleString()} Options | FilaScope`;

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Color Finder", url: "/colors" },
    { name: `${label} Filaments`, url: canonical },
  ];

  return {
    type: "color",
    title,
    description,
    canonical,
    ogType: "website",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "ItemList", name: `${label} 3D Printer Filaments`, description, url: `${BASE_URL}${canonical}` },
      breadcrumbSchema(crumbs),
    ],
    breadcrumbs: crumbs,
    h1: `${label} 3D Printer Filaments — ${n.toLocaleString()} Options`,
    bodyText: description,
  };
}

async function brandMaterialPage(brandSlug: string, materialSlug: string, supabase: SupabaseClient): Promise<PageData> {
  const config = MATERIAL_SLUG_MAP[materialSlug];
  if (!config) return fallback(`/brands/${brandSlug}/${materialSlug}`);

  const { data: brandData } = await supabase
    .from("automated_brands")
    .select("brand_name, display_name, brand_slug")
    .eq("brand_slug", brandSlug)
    .maybeSingle();

  if (!brandData) return fallback(`/brands/${brandSlug}/${materialSlug}`);

  const brandName = (brandData.display_name || brandData.brand_name) as string;

  const { count } = await (supabase as unknown as { from: (t: string) => any })
    .from("filaments")
    .select("id", { count: "exact", head: true })
    .in("material", config.materials)
    .ilike("vendor", brandData.brand_name);

  const n = count ?? 0;
  if (n < 3) return fallback(`/brands/${brandSlug}/${materialSlug}`);

  const { label } = config;
  const canonical = `/brands/${brandSlug}/${materialSlug}`;

  let title = `${brandName} ${label} Filaments — ${n} Products | FilaScope`;
  if (title.length > 60) title = `${brandName} ${label} Filaments | FilaScope`;

  const description = `Browse all ${n} ${brandName} ${label} filaments. Compare colors, specs, TD values, and prices. Find the right ${brandName} ${label} for your printer on FilaScope.`;

  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Brands", url: "/brands" },
    { name: brandName, url: `/brands/${brandSlug}` },
    { name: `${label} Filaments`, url: canonical },
  ];

  return {
    type: "brand-material",
    title,
    description,
    canonical,
    ogType: "website",
    jsonLd: [breadcrumbSchema(crumbs)],
    breadcrumbs: crumbs,
    h1: `${brandName} ${label} Filaments`,
    bodyText: `Browse ${n} ${brandName} ${label} filaments. Compare colors, specs, TD values, and prices on FilaScope.`,
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

Sitemap: ${FUNCTIONS_URL}/prerender?path=/sitemap.xml
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
  // Tier 1 — 1.0
  { path: "/", priority: 1.0, changefreq: "daily" },
  // Tier 2 — 0.9 (main listing pages)
  { path: "/filaments", priority: 0.9, changefreq: "daily" },
  { path: "/deals", priority: 0.9, changefreq: "daily" },
  { path: "/printers", priority: 0.9, changefreq: "weekly" },
  { path: "/brands", priority: 0.9, changefreq: "weekly" },
  // Tier 3 — 0.8 (material-filtered listings)
  { path: "/filaments/pla", priority: 0.8, changefreq: "daily" },
  { path: "/filaments/petg", priority: 0.8, changefreq: "daily" },
  { path: "/filaments/abs", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/tpu", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/asa", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/silk-pla", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/pla-plus", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/nylon", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/high-speed-pla", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/polycarbonate", priority: 0.8, changefreq: "weekly" },
  { path: "/filaments/petg-cf", priority: 0.7, changefreq: "weekly" },
  // Tier 3 — 0.8 (material hub pages)
  { path: "/materials/pla", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/petg", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/abs", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/tpu", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/asa", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/pla-plus", priority: 0.8, changefreq: "weekly" },
  { path: "/materials/silk-pla", priority: 0.7, changefreq: "weekly" },
  { path: "/materials/nylon", priority: 0.7, changefreq: "weekly" },
  { path: "/materials/pc", priority: 0.7, changefreq: "weekly" },
  // Tier 4 — 0.7 (tools & specialty pages)
  { path: "/brands/compare", priority: 0.7, changefreq: "monthly" },
  { path: "/compare", priority: 0.7, changefreq: "monthly" },
  { path: "/wizard", priority: 0.7, changefreq: "monthly" },
  { path: "/colors", priority: 0.7, changefreq: "monthly" },
  { path: "/hueforge-td-database", priority: 0.7, changefreq: "weekly" },
  { path: "/hueforge-filaments", priority: 0.7, changefreq: "weekly" },
  { path: "/accessories", priority: 0.7, changefreq: "weekly" },
  { path: "/diagnose", priority: 0.7, changefreq: "monthly" },
  { path: "/matrix", priority: 0.7, changefreq: "weekly" },
  // Tier 5 — 0.5 (learn / reference)
  { path: "/learn", priority: 0.5, changefreq: "weekly" },
  { path: "/reference/slicers", priority: 0.5, changefreq: "monthly" },
  { path: "/reference/repos", priority: 0.5, changefreq: "monthly" },
  // Tier 6 — 0.3 (static informational)
  { path: "/about", priority: 0.3, changefreq: "monthly" },
  { path: "/methodology", priority: 0.3, changefreq: "monthly" },
  { path: "/affiliate-disclosure", priority: 0.3, changefreq: "monthly" },
  { path: "/privacy", priority: 0.3, changefreq: "monthly" },
  { path: "/terms", priority: 0.3, changefreq: "monthly" },
];

// Guide slug → publish date (ISO date strings, updated when content changes)
// Key = URL path suffix, Value = publish date
// Canonical top-level pages use their full path; /guides/* pages use their slug
const GUIDE_DATES: Record<string, { date: string; isTopLevel?: boolean }> = {
  "best-pla-filaments":                    { date: "2026-01-10" },
  "best-petg-filaments":                   { date: "2026-01-10" },
  "best-abs-filaments":                    { date: "2026-01-10" },
  "best-filament-for-bambu-lab-p1s":       { date: "2026-01-14" },
  "silk-pla-comparison":                   { date: "2026-01-18" },
  "asa-vs-abs-outdoor-printing":           { date: "2026-01-16" },
  "pla-plus-vs-pla-pro":                   { date: "2026-01-12" },
  // Canonical top-level pages (not under /guides/)
  "pla-vs-petg":                           { date: "2026-01-15",  isTopLevel: true },
  "best-filaments-for-beginners":          { date: "2026-01-08",  isTopLevel: true },
  "best-filaments-for-hueforge":           { date: "2026-01-20",  isTopLevel: true },
};

// Fixed lastmod for static informational pages (update when content changes)
const STATIC_LASTMOD: Record<string, string> = {
  "/":                       new Date().toISOString().split("T")[0], // always fresh
  "/filaments":              new Date().toISOString().split("T")[0],
  "/deals":                  new Date().toISOString().split("T")[0],
  "/printers":               new Date().toISOString().split("T")[0],
  "/brands":                 new Date().toISOString().split("T")[0],
  "/about":                  "2026-01-01",
  "/methodology":            "2026-01-01",
  "/affiliate-disclosure":   "2025-11-01",
  "/privacy":                "2025-11-01",
  "/terms":                  "2025-11-01",
};

async function sitemapFilaments(supabase: SupabaseClient): Promise<string> {
  const entries: string[] = [];
  let offset = 0;
  const BATCH = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase.from("filaments")
      .select("product_handle, id, updated_at, last_scraped_at")
      .not("product_handle", "is", null)
      .order("id").range(offset, offset + BATCH - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    for (const f of data) {
      // Use the most recent of last_scraped_at (price change) or updated_at (data change)
      const bestDate = [f.last_scraped_at, f.updated_at]
        .filter(Boolean)
        .sort()
        .pop();
      entries.push(urlEntry(`${BASE_URL}/filament/${f.product_handle || f.id}`, toW3CDate(bestDate), "daily", 0.8));
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
    // Fetch the brand's own updated_at plus the most recent filament updated_at for that brand
    const { data, error } = await supabase.from("automated_brands")
      .select("brand_slug, brand_name, updated_at, last_scrape_at")
      .eq("is_visible", true)
      .order("brand_slug").range(offset, offset + BATCH - 1);
    if (error || !data || data.length === 0) { hasMore = false; break; }
    for (const b of data) {
      // Best lastmod = most recent of: brand updated_at or last_scrape_at (reflects product updates)
      const bestDate = [b.last_scrape_at, b.updated_at]
        .filter(Boolean)
        .sort()
        .pop();
      entries.push(urlEntry(`${BASE_URL}/brands/${b.brand_slug}`, toW3CDate(bestDate), "weekly", 0.8));
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
      entries.push(urlEntry(`${BASE_URL}/printers/${p.printer_id || p.id}`, toW3CDate(p.updated_at), "weekly", 0.8));
    }
    hasMore = data.length >= BATCH;
    offset += BATCH;
  }
  return wrapUrlset(entries);
}

async function sitemapColors(supabase: SupabaseClient): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const entries: string[] = [];
  const { data } = await supabase.from("color_families")
    .select("name").order("display_order", { ascending: true });
  if (data) {
    for (const c of data) {
      const slug = c.name.toLowerCase().replace(/\s+/g, "-");
      entries.push(urlEntry(`${BASE_URL}/colors/${slug}`, today, "weekly", 0.7));
    }
  }
  return wrapUrlset(entries);
}

function sitemapPages(): string {
  const today = new Date().toISOString().split("T")[0];
  const entries = STATIC_PAGES.map((p) => {
    const lastmod = STATIC_LASTMOD[p.path] ?? today;
    return urlEntry(`${BASE_URL}${p.path}`, lastmod, p.changefreq, p.priority);
  });
  return wrapUrlset(entries);
}

function sitemapGuides(): string {
  const today = new Date().toISOString().split("T")[0];
  const entries = Object.entries(GUIDE_DATES).map(([slug, { date, isTopLevel }]) => {
    const url = isTopLevel
      ? `${BASE_URL}/${slug}`          // canonical top-level: /best-filaments-for-beginners
      : `${BASE_URL}/guides/${slug}`;  // guide sub-path:       /guides/best-pla-filaments
    return urlEntry(url, date || today, "monthly", 0.7);
  });
  return wrapUrlset(entries);
}

function sitemapIndex(): string {
  // Sub-sitemap <loc> entries use filascope.com domain URLs so Google accepts
  // them as same-domain (required by the sitemap protocol).
  // The _redirects file proxies these /*.xml paths to this edge function.
  const subs = [
    "sitemap-pages.xml",
    "sitemap-filaments.xml",
    "sitemap-brands.xml",
    "sitemap-printers.xml",
    "sitemap-guides.xml",
    "sitemap-colors.xml",
  ];
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

    // /api/prerender-test — check BEFORE path derivation (uses ?path= for the test path)
    // Accessible at: /functions/v1/prerender?path=/api/prerender-test&testpath=/filament/...
    // or: curl .../prerender with ?path=/api/prerender-test
    const rawRequestPath = url.searchParams.get("path") || "/";
    const isTestEndpoint = rawRequestPath === "/api/prerender-test" || url.pathname.endsWith("/api/prerender-test");
    if (isTestEndpoint) {
      const supabaseTest = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const testPath = url.searchParams.get("testpath") || url.searchParams.get("p") || "/";
      const testQs = testPath.includes("?") ? testPath.split("?")[1] : "";
      const cleanTestPath = testPath.split("?")[0].replace(/\/+$/, "") || "/";
      console.log(`[PRERENDER-TEST] path="${cleanTestPath}"`);
      const testData = await getPageData(cleanTestPath, supabaseTest, testQs);
      const testIs404 = testData.type === "notfound";
      const testHtml = testIs404 ? build404Html(testData) : buildHtml(testData);
      return new Response(testHtml, {
        status: testIs404 ? 404 : 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "X-Prerender": "true",
          "X-Prerender-Test": "true",
          "X-Prerender-Path": cleanTestPath,
          "Cache-Control": "no-store",
        },
      });
    }

    const rawPath = url.searchParams.get("path")
      || url.pathname.replace(/^\/functions\/v1\/prerender/, "").replace(/^\/prerender/, "")
      || "/";
    const qsIndex = rawPath.indexOf("?");
    const queryString = qsIndex >= 0 ? rawPath.slice(qsIndex + 1) : url.search.slice(1);
    let path = qsIndex >= 0 ? rawPath.slice(0, qsIndex) : rawPath;
    path = path.replace(/\/+$/, "") || "/"; // strip trailing slashes

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
    // Legacy redirect: old sitemap-materials.xml now covered by sitemap-pages.xml
    if (path === "/sitemap-materials.xml") {
      return new Response(sitemapPages(), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
    }

    // 301 redirects for old guide paths → canonical URLs (for bots & crawlers)
    const GUIDE_REDIRECTS: Record<string, string> = {
      "/guides/beginners-guide":                    `${BASE_URL}/best-filaments-for-beginners`,
      "/guides/best-filament-for-beginners-2025":   `${BASE_URL}/best-filaments-for-beginners`,
      "/guides/hueforge-filaments":                 `${BASE_URL}/best-filaments-for-hueforge`,
      "/guides/best-filaments-for-hueforge-lithophanes": `${BASE_URL}/best-filaments-for-hueforge`,
    };
    if (GUIDE_REDIRECTS[path]) {
      return new Response(null, {
        status: 301,
        headers: { ...corsHeaders, Location: GUIDE_REDIRECTS[path], "Cache-Control": "public, max-age=86400" },
      });
    }

    // DB-backed sitemaps need Supabase client
    const needsDb = ["/sitemap-filaments.xml", "/sitemap-brands.xml", "/sitemap-printers.xml", "/sitemap-colors.xml"].includes(path);

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
      if (path === "/sitemap-colors.xml") {
        return new Response(await sitemapColors(supabase), { headers: { ...corsHeaders, ...SITEMAP_HEADERS } });
      }

      // Crawler prerender
      console.log(`[PRERENDER] crawler="${userAgent}" path="${path}"`);
      const pageData = await getPageData(path, supabase, queryString);
      const is404 = pageData.type === "notfound";
      console.log(`[PRERENDER] status=${is404 ? 404 : 200} path="${path}"`);
      const html = is404 ? build404Html(pageData) : buildHtml(pageData);
      return new Response(html, {
        status: is404 ? 404 : 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "X-Prerender": "true",
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
