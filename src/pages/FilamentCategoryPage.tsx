import { useState } from "react";
import { useParams, useSearchParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useJsonLd } from "@/components/seo/useJsonLd";
import { FAQSection } from "@/components/seo";
import { MATERIAL_SLUG_CONFIG } from "@/pages/MaterialHub";
import { materialNameToSlug } from "@/lib/materialSlugUtils";
import { useFinderQuery, DEFAULT_PAGE_SIZE } from "@/hooks/useFinderQuery";
import { FilamentCard } from "@/components/FilamentCard";
import { FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
import { CrawlablePaginationBar } from "@/components/CrawlablePaginationBar";
import { RelatedSearchesSection } from "@/components/seo/RelatedSearchesSection";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { ExploreMoreSection } from "@/components/ExploreMoreSection";
import { useRegion } from "@/contexts/RegionContext";
import { useIntelligentSearch } from "@/hooks/useIntelligentSearch";
import IntelligentSearchBar from "@/components/search/IntelligentSearchBar";
import IntelligentSearchResults from "@/components/search/IntelligentSearchResults";

// ─────────────────────────────────────────────
// Per-material SEO meta + intro text
// ─────────────────────────────────────────────
interface CategoryMeta {
  titleTemplate: string;   // {count} will be replaced
  descTemplate: string;
  h1: string;
  introTemplate: string;
}

// Related material sentence shown above the grid (inline prose cross-links)
const RELATED_PROSE: Record<string, { intro: string; links: { label: string; slug: string }[] }> = {
  pla: {
    intro: "Need more strength or heat resistance?",
    links: [{ label: "PETG", slug: "petg" }, { label: "ABS", slug: "abs" }, { label: "PLA+", slug: "pla-plus" }],
  },
  petg: {
    intro: "Want easier printing or outdoor durability?",
    links: [{ label: "PLA", slug: "pla" }, { label: "ASA", slug: "asa" }, { label: "ABS", slug: "abs" }],
  },
  abs: {
    intro: "Want UV resistance or easier printing?",
    links: [{ label: "ASA", slug: "asa" }, { label: "PETG", slug: "petg" }, { label: "PC", slug: "polycarbonate" }],
  },
  asa: {
    intro: "Looking for indoor or flexible options?",
    links: [{ label: "ABS", slug: "abs" }, { label: "PETG", slug: "petg" }, { label: "TPU", slug: "tpu" }],
  },
  tpu: {
    intro: "Want rigid or high-strength alternatives?",
    links: [{ label: "PLA", slug: "pla" }, { label: "PETG", slug: "petg" }, { label: "Nylon", slug: "nylon" }],
  },
  "pla-plus": {
    intro: "Need even more strength or easier printing?",
    links: [{ label: "PETG", slug: "petg" }, { label: "Standard PLA", slug: "pla" }],
  },
  "silk-pla": {
    intro: "Want more practical materials?",
    links: [{ label: "Standard PLA", slug: "pla" }, { label: "PLA+", slug: "pla-plus" }],
  },
  nylon: {
    intro: "Need high-temp or rigid engineering materials?",
    links: [{ label: "PC", slug: "polycarbonate" }, { label: "PETG", slug: "petg" }, { label: "ABS", slug: "abs" }],
  },
  polycarbonate: {
    intro: "Need something easier to print?",
    links: [{ label: "ABS", slug: "abs" }, { label: "ASA", slug: "asa" }, { label: "Nylon", slug: "nylon" }],
  },
  "high-speed-pla": {
    intro: "Want standard or stronger options?",
    links: [{ label: "PLA", slug: "pla" }, { label: "PLA+", slug: "pla-plus" }, { label: "PETG", slug: "petg" }],
  },
  "petg-cf": {
    intro: "Looking for lighter or more flexible options?",
    links: [{ label: "PETG", slug: "petg" }, { label: "PLA", slug: "pla" }, { label: "Nylon", slug: "nylon" }],
  },
  wood: {
    intro: "Want standard PLA or specialty finishes?",
    links: [{ label: "PLA", slug: "pla" }, { label: "Silk PLA", slug: "silk-pla" }, { label: "PLA+", slug: "pla-plus" }],
  },
  "carbon-fiber": {
    intro: "Need a softer or easier base material?",
    links: [{ label: "PETG", slug: "petg" }, { label: "Nylon", slug: "nylon" }, { label: "PLA+", slug: "pla-plus" }],
  },
  "glow-in-the-dark": {
    intro: "Interested in other specialty finishes?",
    links: [{ label: "Silk PLA", slug: "silk-pla" }, { label: "PLA", slug: "pla" }],
  },
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  pla: {
    titleTemplate: "PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PLA 3D printer filaments by price, brand, TD value, and printer compatibility. Find the best PLA for your printer with real-time pricing.",
    h1: "PLA Filaments",
    introTemplate: "PLA (Polylactic Acid) is the most popular 3D printing filament, known for its ease of use, low warping, and wide color selection. It prints at 190–220°C with minimal bed adhesion issues, making it ideal for beginners and detailed decorative prints. Compare {count}+ PLA filaments below from brands like Bambu Lab, Polymaker, and eSUN — with real-time pricing, HueForge TD values, and printer compatibility data.",
  },
  petg: {
    titleTemplate: "PETG Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG 3D printer filaments. Stronger than PLA with better heat resistance. Filter by brand, price, TD value, and printer compatibility.",
    h1: "PETG Filaments",
    introTemplate: "PETG (Polyethylene Terephthalate Glycol) bridges the gap between PLA's ease of use and ABS's strength. It's impact-resistant, food-safe options exist, and it tolerates temperatures up to 80°C without deforming — ideal for functional enclosures, brackets, and mechanical parts. Compare {count}+ PETG filaments below with real-time pricing, regional availability, and compatibility data.",
  },
  abs: {
    titleTemplate: "ABS Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ABS 3D printer filaments. Heat-resistant and durable for functional parts. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ABS Filaments",
    introTemplate: "ABS (Acrylonitrile Butadiene Styrene) is a durable, heat-resistant engineering plastic used in everything from LEGO bricks to automotive parts. It resists temperatures up to 100°C but requires an enclosed printer and heated bed to prevent warping. Compare {count}+ ABS filaments with specs, pricing, and printer compatibility data.",
  },
  tpu: {
    titleTemplate: "TPU Flexible Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ TPU and flexible 3D printer filaments. Find the right shore hardness for your project. Filter by brand, price, and printer compatibility.",
    h1: "TPU & Flexible Filaments",
    introTemplate: "TPU (Thermoplastic Polyurethane) is a rubber-like filament ideal for phone cases, gaskets, shoe insoles, and wearables — anything that needs to bend and return to shape. Shore hardness (95A being common) controls stiffness; softer grades require a direct-drive extruder. Compare {count}+ TPU filaments with shore hardness specs, brand options, and pricing.",
  },
  asa: {
    titleTemplate: "ASA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ASA 3D printer filaments. UV-resistant and weatherproof for outdoor use. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ASA Filaments",
    introTemplate: "ASA (Acrylonitrile Styrene Acrylate) is ABS's weatherproof sibling — with superior UV and moisture resistance, making it ideal for outdoor signs, garden tools, and automotive trim. It prints similarly to ABS (230–260°C) and requires an enclosure to prevent warping. Compare {count}+ ASA filaments with specs, pricing, and compatibility data.",
  },
  "silk-pla": {
    titleTemplate: "Silk PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Silk PLA 3D printer filaments with shimmery metallic finish. High TD values ideal for HueForge. Filter by brand, color, price, and TD value.",
    h1: "Silk PLA Filaments",
    introTemplate: "Silk PLA produces stunning metallic-sheen prints with a satin finish that catches the light from every angle. It shares PLA's easy printability (200–230°C) and is especially popular for HueForge multi-color lithophanes thanks to characteristically high TD values. Compare {count}+ Silk PLA filaments with color swatches, TD data, and pricing.",
  },
  nylon: {
    titleTemplate: "Nylon/PA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Nylon and PA 3D printer filaments. Strong, flexible engineering material. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "Nylon (PA) Filaments",
    introTemplate: "Nylon (PA — Polyamide) is a tough, flexible engineering material with excellent fatigue resistance and impact strength — ideal for gears, hinges, snap-fits, and functional prototypes. It's highly hygroscopic, so always dry your spool before printing and use a dry box during long prints. Compare {count}+ Nylon filaments from PA6, PA12, and carbon-fiber reinforced variants with specs and pricing.",
  },
  "pla-plus": {
    titleTemplate: "PLA+ Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PLA+ 3D printer filaments. Improved impact resistance over standard PLA. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PLA+ Filaments",
    introTemplate: "PLA+ (also called PLA Pro) delivers improved toughness and reduced brittleness over standard PLA while keeping the same easy print settings (195–230°C). It's a popular upgrade for functional prints that need more abuse resistance without the complexity of PETG or ABS. Compare {count}+ PLA+ filaments across brands with real-time pricing and specs.",
  },
  "high-speed-pla": {
    titleTemplate: "High Speed PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ High Speed PLA filaments for fast 3D printing. Compatible with Bambu Lab, Creality K1, and more. Filter by brand and price on FilaScope.",
    h1: "High Speed PLA Filaments",
    introTemplate: "High-Speed PLA is specially formulated for printing at 200–600 mm/s on modern CoreXY printers like the Bambu Lab X1C, A1, and Creality K1 — enabling dramatically shorter print times without layer delamination. It requires higher flow rates and nozzle temperatures (220–240°C) than standard PLA. Compare {count}+ high-speed PLA filaments with printer compatibility and pricing data.",
  },
  polycarbonate: {
    titleTemplate: "Polycarbonate Filaments — Compare {count}+ PC Options | FilaScope",
    descTemplate: "Compare {count}+ PC and Polycarbonate 3D printer filaments. Strongest print material with high heat tolerance. Filter by brand and printer compatibility.",
    h1: "Polycarbonate (PC) Filaments",
    introTemplate: "Polycarbonate is one of the strongest and most heat-tolerant 3D printing materials — used in bulletproof glass, eyeglass lenses, and aerospace components. It handles temperatures up to 130°C and resists impacts that shatter PLA or ABS. Printing requires an all-metal hotend, enclosure, and nozzle temperatures of 260–310°C. Compare {count}+ PC filaments with specs and pricing.",
  },
  "petg-cf": {
    titleTemplate: "PETG Carbon Fiber Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG-CF carbon fiber 3D printer filaments. Stiff, lightweight, and strong. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PETG Carbon Fiber Filaments",
    introTemplate: "PETG-CF (Carbon Fiber reinforced PETG) combines PETG's chemical resistance and printability with dramatically increased stiffness from short-strand carbon fibers — ideal for lightweight structural parts, brackets, and drone frames. It requires a hardened steel nozzle (0.4mm+) to prevent wear. Compare {count}+ PETG-CF filaments with specs, pricing, and compatibility data.",
  },
  wood: {
    titleTemplate: "Wood PLA Filaments — Realistic Texture & Finish | FilaScope",
    descTemplate: "Compare {count}+ Wood PLA 3D printer filaments. Achieve realistic wood texture and grain. Sand, stain, and paint like real wood. Find the best wood filament brand.",
    h1: "Wood PLA Filaments",
    introTemplate: "Wood PLA filaments blend standard PLA with 10–30% real wood particles — sawdust, bamboo, or cork — to produce prints with an authentic wooden texture and grain that can be sanded, stained, and even painted like real wood. They print at standard PLA temperatures (190–220°C) but require a larger nozzle (0.5mm+) to prevent clogging from the fiber content. Higher nozzle temperatures produce a darker, more 'burnt wood' appearance while cooler temps give a lighter finish. Wood PLA is popular for cosplay props, architectural models, decorative sculptures, furniture models, and any print where a natural organic look is desired. Compare {count}+ wood filament options below, with brand specs and pricing.",
  },
  "carbon-fiber": {
    titleTemplate: "Carbon Fiber Filaments — Lightweight & Stiff | FilaScope",
    descTemplate: "Compare {count}+ carbon fiber 3D printer filaments. CF-reinforced PLA, PETG, Nylon, and ABS for lightweight, rigid structural parts. Requires hardened nozzle.",
    h1: "Carbon Fiber 3D Printing Filaments",
    introTemplate: "Carbon fiber filaments combine a standard base polymer (PLA, PETG, Nylon, or ABS) with short-strand carbon fiber reinforcement, dramatically increasing stiffness and reducing weight compared to unreinforced plastics. The result is a material with an excellent strength-to-weight ratio — ideal for drone frames, RC car parts, robotic arms, structural brackets, and functional engineering components. Carbon fiber filaments are highly abrasive and will rapidly wear standard brass nozzles; a hardened steel, ruby-tipped, or tungsten carbide nozzle is essential. Print temperatures vary by base material (230–270°C) and the carbon fibers reduce stringing significantly. Compare {count}+ carbon fiber filaments from top brands below.",
  },
  "glow-in-the-dark": {
    titleTemplate: "Glow in the Dark Filaments — Photoluminescent PLA | FilaScope",
    descTemplate: "Compare {count}+ glow in the dark 3D printer filaments. Photoluminescent PLA that charges under light and glows for 6–12 hours. Easy to print, same settings as PLA.",
    h1: "Glow in the Dark 3D Printer Filaments",
    introTemplate: "Glow in the dark filaments use strontium aluminate phosphor particles embedded in a PLA base, creating prints that charge under natural or artificial light and emit a vivid glow for 6–12 hours in the dark. They print at standard PLA temperatures (190–220°C) making them beginner-friendly, and the thicker your walls and layers, the more phosphor material stores energy and the brighter and longer your glow. Popular for safety markers, cosplay costumes, night-stand accessories, gaming accessories, and Halloween decorations. Green glows are the brightest and most common; blue and purple variants have a shorter glow duration. Compare {count}+ glow filament options with brand, price, and color data.",
  },
};

const ALL_META: CategoryMeta = {
  titleTemplate: "3D Printer Filaments — Compare {count}+ Filaments | FilaScope",
  descTemplate: "Browse and compare {count}+ 3D printer filaments from 48+ brands. Filter by material, price, printer compatibility, and TD value for HueForge. Updated daily.",
  h1: "3D Printer Filament Database",
  introTemplate: "Browse all {count}+ 3D printer filaments from 48+ brands. Filter by material, brand, price range, and printer compatibility to find your perfect filament.",
};

function applyCount(template: string, count: number): string {
  return template.replace(/\{count\}/g, count.toLocaleString());
}

const BASE_URL = "https://filascope.com";

// ─────────────────────────────────────────────
// JSON-LD hook for ItemList + Breadcrumb
// ─────────────────────────────────────────────
function useCategorySchemas(
  slug: string | undefined,
  h1: string,
  canonical: string,
  groups: any[],
  count: number
) {
  const label = slug ? (MATERIAL_SLUG_CONFIG[slug]?.label ?? slug) : "All";
  const category = label + " 3D Printer Filament";

  const itemList = groups.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: slug ? `Best ${label} Filaments` : "3D Printer Filament Database",
        numberOfItems: Math.min(groups.length, 50),
        itemListElement: groups.slice(0, 50).map((g, i) => {
          const f = g.representativeFilament;
          const handle = f?.product_handle || f?.id;
          return {
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: g.baseName || f?.product_title || "Filament",
              url: handle ? `${BASE_URL}/filament/${handle}` : `${BASE_URL}/filaments`,
              ...(g.vendor && { brand: { "@type": "Brand", name: g.vendor } }),
              category,
              ...(f?.featured_image && { image: f.featured_image }),
              ...(g.priceRange?.min && {
                offers: {
                  "@type": "Offer",
                  price: g.priceRange.min.toFixed(2),
                  priceCurrency: "USD",
                  availability: g.anyInStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }),
            },
          };
        }),
      }
    : null;

  const collectionPageSchema = itemList
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: h1,
        url: `${BASE_URL}${canonical}`,
        mainEntity: itemList,
      }
    : null;

  useJsonLd(collectionPageSchema);
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
const DEFAULT_FILTERS = {
  searchTerm: "",
  selectedBrands: [],
  priceRange: [0, 100] as [number, number],
  sortBy: "filascope_score",
  matte: false,
  silk: false,
  metallic: false,
  sparkle: false,
  translucent: false,
  glow: false,
  carbonFiber: false,
  glassFiber: false,
  woodFilled: false,
  highSpeed: false,
  largeSpools: false,
  amsOnly: false,
  brassOnly: false,
  selectedColorFamilies: [],
  hasTdData: false,
};

// Build a reverse-lookup: material name (case-insensitive) → slug
// e.g. "PLA" → "pla", "Silk PLA" → "silk-pla", "PLA+" → "pla-plus"
const MATERIAL_NAME_TO_SLUG: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [slug, cfg] of Object.entries(MATERIAL_SLUG_CONFIG)) {
    // Index by label (e.g. "PLA", "PETG")
    map[cfg.label.toLowerCase()] = slug;
    // Index by each material variant
    for (const mat of cfg.materials) {
      map[mat.toLowerCase()] = slug;
    }
    // Also index by the slug itself and its materialNameToSlug form
    map[slug.toLowerCase()] = slug;
    map[materialNameToSlug(cfg.label).toLowerCase()] = slug;
  }
  return map;
})();

// ─────────────────────────────────────────────
// Per-material FAQ static knowledge
// ─────────────────────────────────────────────
interface MaterialKnowledge {
  nozzle: string;
  bed: string;
  beginner: boolean;
  enclosure: boolean;
  beginnerReason: string;
  enclosureReason: string;
}

const MATERIAL_KNOWLEDGE: Record<string, MaterialKnowledge> = {
  pla: {
    nozzle: "190–220°C", bed: "0–60°C (unheated bed works)",
    beginner: true, enclosure: false,
    beginnerReason: "PLA is the most beginner-friendly filament — it prints at low temperatures, requires no enclosure, and has very low warping.",
    enclosureReason: "No, PLA does not require an enclosure. It prints fine on open-frame printers and even benefits from good airflow for cooling.",
  },
  petg: {
    nozzle: "220–250°C", bed: "70–90°C",
    beginner: true, enclosure: false,
    beginnerReason: "PETG is relatively beginner-friendly, though it's slightly more finicky than PLA. It benefits from a heated bed and good part cooling.",
    enclosureReason: "PETG generally does not need an enclosure, though a draft shield can help in cold environments.",
  },
  abs: {
    nozzle: "230–260°C", bed: "90–110°C",
    beginner: false, enclosure: true,
    beginnerReason: "ABS is not recommended for beginners. It is prone to warping and cracking, requires precise temperature control, and needs an enclosure for reliable results.",
    enclosureReason: "Yes, ABS absolutely requires an enclosure. Without one, rapid cooling causes layer delamination and warping, especially on larger prints.",
  },
  tpu: {
    nozzle: "220–240°C", bed: "30–60°C",
    beginner: false, enclosure: false,
    beginnerReason: "TPU is moderately difficult. It requires a direct-drive extruder and slow print speeds. Bowden setups struggle with flexible materials.",
    enclosureReason: "No enclosure is needed for TPU, but print slowly (20–35 mm/s) to avoid stringing and jams.",
  },
  asa: {
    nozzle: "230–260°C", bed: "90–110°C",
    beginner: false, enclosure: true,
    beginnerReason: "ASA is not recommended for beginners. Like ABS, it is prone to warping and requires careful environmental control.",
    enclosureReason: "Yes, ASA requires an enclosure to prevent warping and layer cracking, especially for large prints.",
  },
  "silk-pla": {
    nozzle: "200–230°C", bed: "25–60°C",
    beginner: true, enclosure: false,
    beginnerReason: "Silk PLA prints almost identically to standard PLA, making it beginner-friendly. You may need slightly higher temperatures for best shine.",
    enclosureReason: "No enclosure needed for Silk PLA. It behaves like standard PLA and prints on open-frame machines.",
  },
  nylon: {
    nozzle: "240–270°C", bed: "70–90°C (PEI or Garolite recommended)",
    beginner: false, enclosure: true,
    beginnerReason: "Nylon is challenging for beginners. It is highly hygroscopic (absorbs moisture), prone to warping, and needs an all-metal hotend.",
    enclosureReason: "Yes, an enclosure is strongly recommended for Nylon to maintain ambient temperature and prevent warping.",
  },
  "pla-plus": {
    nozzle: "195–230°C", bed: "25–60°C",
    beginner: true, enclosure: false,
    beginnerReason: "PLA+ prints just like standard PLA with the same easy settings, making it a great beginner upgrade for more durable prints.",
    enclosureReason: "No enclosure needed. PLA+ is as easy to print as standard PLA.",
  },
  "high-speed-pla": {
    nozzle: "220–240°C", bed: "35–65°C",
    beginner: false, enclosure: false,
    beginnerReason: "High-Speed PLA is best on modern CoreXY printers like Bambu Lab X1C or Creality K1. It requires higher flow rates and proper cooling — intermediate skill recommended.",
    enclosureReason: "An enclosure is not required, but consistent part cooling is critical at high speeds.",
  },
  polycarbonate: {
    nozzle: "260–310°C", bed: "100–130°C",
    beginner: false, enclosure: true,
    beginnerReason: "Polycarbonate is one of the most difficult materials to print. It requires an all-metal hotend, high-temperature bed, and enclosure — recommended for advanced users only.",
    enclosureReason: "Yes, PC absolutely requires an enclosed printer to maintain a high ambient temperature and prevent severe warping.",
  },
  "petg-cf": {
    nozzle: "240–260°C", bed: "70–90°C",
    beginner: false, enclosure: false,
    beginnerReason: "PETG-CF requires a hardened steel nozzle and careful settings. Not recommended for beginners.",
    enclosureReason: "An enclosure is not strictly required for PETG-CF, but it helps with print consistency.",
  },
  wood: {
    nozzle: "190–220°C", bed: "25–60°C",
    beginner: false, enclosure: false,
    beginnerReason: "Wood PLA prints at standard PLA temperatures but requires a larger nozzle (0.5mm+) to prevent clogging from wood particles. Intermediate skill recommended.",
    enclosureReason: "No enclosure is needed for Wood PLA. It prints on open-frame machines just like standard PLA.",
  },
  "carbon-fiber": {
    nozzle: "230–270°C (varies by base material)", bed: "60–100°C",
    beginner: false, enclosure: false,
    beginnerReason: "Carbon fiber filaments are not recommended for beginners. They require a hardened steel nozzle and specific settings depending on the base material (PLA-CF vs PETG-CF vs Nylon-CF).",
    enclosureReason: "Enclosure requirements vary by base material — ABS-CF and Nylon-CF benefit from an enclosure; PLA-CF and PETG-CF do not require one.",
  },
  "glow-in-the-dark": {
    nozzle: "190–220°C", bed: "25–60°C",
    beginner: true, enclosure: false,
    beginnerReason: "Glow in the dark PLA uses the same print settings as standard PLA, making it beginner-friendly. Just print slightly cooler for lighter glow or warmer for a darker, 'charred' appearance.",
    enclosureReason: "No enclosure is needed. Glow in the dark filaments behave like standard PLA and print on open-frame machines.",
  },
};

function generateMaterialCategoryFAQs(
  slug: string,
  label: string,
  intro: string,
  materialStats: { minPrice: number | null; maxPrice: number | null; topBrands: string[] } | null | undefined,
): { question: string; answer: string }[] {
  const knowledge = MATERIAL_KNOWLEDGE[slug];
  const faqs: { question: string; answer: string }[] = [];

  // 1. What is {Material}?
  faqs.push({
    question: `What is ${label} filament?`,
    answer: intro.replace(/<[^>]+>/g, '').split('.').slice(0, 3).join('.') + '.',
  });

  // 2. Temperature FAQ
  if (knowledge) {
    faqs.push({
      question: `What temperature does ${label} filament need?`,
      answer: `${label} filament typically prints at a nozzle temperature of ${knowledge.nozzle} and a bed temperature of ${knowledge.bed}. Exact settings vary by brand and color — always check the manufacturer's datasheet.`,
    });
  }

  // 3. Beginner FAQ
  if (knowledge) {
    faqs.push({
      question: `Is ${label} filament good for beginners?`,
      answer: knowledge.beginnerReason,
    });
  }

  // 4. Price FAQ (from DB data)
  if (materialStats?.minPrice && materialStats?.maxPrice) {
    const minStr = `$${materialStats.minPrice.toFixed(2)}`;
    const maxStr = `$${materialStats.maxPrice.toFixed(2)}`;
    faqs.push({
      question: `How much does ${label} filament cost?`,
      answer: `${label} filament typically ranges from ${minStr} to ${maxStr} per spool in the US market. Price varies by brand, color type, and spool weight. FilaScope tracks live pricing from 48+ brands to help you find the best deal.`,
    });
  }

  // 5. Enclosure FAQ
  if (knowledge) {
    faqs.push({
      question: `Does ${label} filament require an enclosure?`,
      answer: knowledge.enclosureReason,
    });
  }

  // 6. Brands FAQ (from DB data)
  if (materialStats?.topBrands && materialStats.topBrands.length > 0) {
    faqs.push({
      question: `What brands make ${label} filament?`,
      answer: `Popular ${label} filament brands include ${materialStats.topBrands.join(', ')}, and many more. FilaScope indexes ${label} filaments from 48+ manufacturers so you can compare specs and prices side by side.`,
    });
  }

  return faqs;
}

export default function FilamentCategoryPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { region: currentRegion } = useRegion();

  // Intelligent search
  const {
    query: aiQuery,
    setQuery: setAiQuery,
    results: aiResults,
    intent: aiIntent,
    isLoading: aiLoading,
    isIntelligentMode,
    error: aiError,
    clearSearch: aiClearSearch,
  } = useIntelligentSearch(currentRegion);

  const isAiActive = aiQuery.trim().length >= 3;

  // Read search query param for filtering
  const searchParam = searchParams.get("search") || "";

  // ?material=PLA → redirect to /filaments/pla (Option A)
  // Must be after all hooks to satisfy Rules of Hooks
  const materialParam = searchParams.get("material");
  const redirectSlug = (!slug && materialParam)
    ? MATERIAL_NAME_TO_SLUG[materialParam.toLowerCase()]
    : null;
  if (redirectSlug) {
    return <Navigate to={`/filaments/${redirectSlug}`} replace />;
  }

  // 0-indexed page
  const currentPage = Math.max(0, parseInt(searchParams.get("page") || "1", 10) - 1);

  const config = slug ? MATERIAL_SLUG_CONFIG[slug] : null;

  // Unknown slug → redirect to homepage
  if (slug && !config) {
    return <Navigate to="/" replace />;
  }

  const basePath = slug ? `/filaments/${slug}` : "/filaments";
  const canonical = basePath;
  const metaConfig = (slug && CATEGORY_META[slug]) ? CATEGORY_META[slug] : ALL_META;
  const label = config?.label ?? "All Filaments";

  // Build filters: pre-set material from slug and/or search term
  const finderFilters = {
    ...DEFAULT_FILTERS,
    selectedMaterials: config ? config.materials : [],
    searchTerm: searchParam,
  };

  // Fetch product count for the material
  const { data: materialCount } = useQuery({
    queryKey: ["filament-category-count", slug],
    queryFn: async () => {
      let q = (supabase as any)
        .from("filaments")
        .select("id", { count: "exact", head: true });
      if (config) {
        q = q.in("material", config.materials);
      }
      const { count } = await q;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch price range + top brands for FAQ generation
  const { data: materialStats } = useQuery({
    queryKey: ["filament-category-stats", slug],
    enabled: !!slug && !!config,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("filaments")
        .select("vendor, variant_price")
        .in("material", config!.materials)
        .not("variant_price", "is", null)
        .limit(500);
      if (!data) return null;
      const prices = (data as any[]).map((d: any) => d.variant_price).filter(Boolean) as number[];
      const brandCounts: Record<string, number> = {};
      for (const row of data as any[]) {
        if (row.vendor) brandCounts[row.vendor] = (brandCounts[row.vendor] || 0) + 1;
      }
      const topBrands = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([v]) => v);
      return {
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
        topBrands,
      };
    },
    staleTime: 1000 * 60 * 10,
  });

  const count = materialCount ?? 0;

  // Paginated products
  const { groups, totalCount, isLoading, isFetching } = useFinderQuery(
    finderFilters,
    currentPage,
    {},
    pageSize
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page === 0) {
      next.delete("page");
    } else {
      next.set("page", String(page + 1));
    }
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pagination rel links
  const prevUrl =
    currentPage > 0
      ? `${BASE_URL}${basePath}${currentPage === 1 ? "" : `?page=${currentPage}`}`
      : null;
  const nextUrl =
    currentPage < totalPages - 1
      ? `${BASE_URL}${basePath}?page=${currentPage + 2}`
      : null;

  // SEO strings
  const displayCount = count || totalCount;
  const title = applyCount(metaConfig.titleTemplate, displayCount);
  const description = applyCount(metaConfig.descTemplate, displayCount);
  const intro = applyCount(metaConfig.introTemplate, displayCount);

  // Breadcrumb items for visible nav
  const breadcrumbItems = slug
    ? [
        { name: "Filaments", url: "/filaments" },
        { name: label, url: basePath },
      ]
    : [{ name: "Filaments", url: "/filaments" }];

  useCategorySchemas(slug, metaConfig.h1, canonical, groups, displayCount);

  // Generate FAQs for material category pages (plain function call, not hook)
  const materialFaqs = slug && config
    ? generateMaterialCategoryFAQs(slug, config.label, intro, materialStats)
    : [];

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        canonical={`${BASE_URL}${canonical}`}
      />
      {/* Inject rel=prev/next pagination links directly */}
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="filament-grid">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />

        {/* Search results heading */}
        {searchParam ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Results for: "{searchParam}"
            </h1>
            <Link
              to="/filaments"
              className="text-sm text-primary hover:underline mb-4 inline-block"
            >
              ← Back to all filaments
            </Link>
          </>
        ) : (
          <>
            {/* H1 + intro */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {metaConfig.h1}
            </h1>
             <p className="text-muted-foreground mb-2 max-w-2xl leading-relaxed">{intro}</p>
             {slug && (
               <p className="text-sm mb-3">
                 <Link
                   to={`/materials/${slug === "polycarbonate" ? "pc" : slug}`}
                   className="text-primary hover:underline"
                 >
                   Learn about {label} material properties, print settings & specs →
                 </Link>
               </p>
             )}
          </>
        )}

        {/* Inline related-material cross-links — prose-style, above the grid */}
        {slug && RELATED_PROSE[slug] && (
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            {RELATED_PROSE[slug].intro}{" "}
            {RELATED_PROSE[slug].links.map((link, i) => (
              <span key={link.slug}>
                <a
                  href={`/filaments/${link.slug}`}
                  className="text-primary hover:underline underline-offset-4 decoration-primary/50 font-medium transition-colors"
                >
                  {link.label} Filaments
                </a>
                {i < RELATED_PROSE[slug].links.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        )}

        {/* Stats strip */}
        {displayCount > 0 && !isAiActive && (
          <div className="flex flex-wrap gap-3 mb-6 text-sm text-muted-foreground">
            <span className="bg-muted/60 rounded px-3 py-1">
              {displayCount.toLocaleString()} filaments
            </span>
            {slug && (
              <span className="bg-muted/60 rounded px-3 py-1">
                Material: {label}
              </span>
            )}
          </div>
        )}

        {/* Intelligent Search Bar */}
        <div className="mb-6">
          <IntelligentSearchBar
            query={aiQuery}
            onQueryChange={setAiQuery}
            isLoading={aiLoading && isIntelligentMode}
            isIntelligentMode={isIntelligentMode}
          />
        </div>

        {/* Conditional: AI results vs normal grid */}
        {isAiActive ? (
          <IntelligentSearchResults
            results={aiResults}
            isLoading={aiLoading}
            isIntelligentMode={isIntelligentMode}
            query={aiQuery}
            intent={aiIntent}
            region={currentRegion}
            onClear={aiClearSearch}
          />
        ) : (
          <>
            {/* Product grid */}
            {isLoading ? (
              <FilamentCardSkeletonGrid count={24} />
            ) : groups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No filaments found for this category.
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  aria-label={`${label} filaments`}
                >
                  {groups.map((group) => (
                    <FilamentCard
                      key={group.representativeFilament?.id ?? group.baseName}
                      filament={group.representativeFilament as any}
                    />
                  ))}
                </div>

                <ExploreMoreSection
                  topBrand={
                    materialStats?.topBrands?.[0]
                      ? { name: materialStats.topBrands[0], count: undefined }
                      : undefined
                  }
                  materialLabel={config?.label}
                  materialSlug={slug}
                />

                <CrawlablePaginationBar
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  displayedCount={groups.length}
                  basePath={basePath}
                  onPageChange={handlePageChange}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    handlePageChange(0);
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Cross-links to related material pages */}
        {config && config.relatedSlugs.length > 0 && (
          <nav aria-label="Related material categories" className="mt-10">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Compare Related Materials</h2>
            <div className="flex flex-wrap gap-2">
              {config.relatedSlugs.map((s, i) => (
                <a
                  key={s}
                  href={`/filaments/${s}`}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm font-medium text-foreground"
                >
                  {config.relatedMaterials[i]} Filaments →
                </a>
              ))}
              <a
                href="/filaments"
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm font-medium text-foreground"
              >
                All Filaments →
              </a>
            </div>
          </nav>
        )}

        {/* SEO content section — root /filaments page only */}
        {!slug && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">The Complete 3D Printer Filament Comparison Database</h2>
              <p className="text-muted-foreground leading-relaxed">
                FilaScope is the most comprehensive <strong>3D printer filament comparison</strong> tool available, tracking 8,277+ filaments from 48+ brands with real-time pricing across 15+ retailers worldwide. Whether you need to <strong>compare filaments</strong> by tensile strength, print temperature, HueForge TD value, or price per kilogram, our <strong>filament database</strong> puts every datapoint at your fingertips. Each product page includes detailed <strong>filament specifications</strong> — nozzle and bed temperatures, mechanical properties, spool weight, color options, and community ratings. Prices update automatically so you always see the latest deals. Use the filters above to narrow by material, brand, price, color, or printer compatibility, or try the{' '}
                <a href="/wizard" className="text-primary hover:underline font-medium">guided filament finder</a> for personalized recommendations.
              </p>
            </article>

            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">How to Use the Filament Database</h3>
              <p className="text-muted-foreground leading-relaxed">
                Start by selecting a material type — PLA, PETG, ABS, TPU, or any of 20+ supported materials. Refine your search with brand, price range, color family, spool weight, and reinforcement filters. If you own a specific printer, enable printer compatibility mode to see only filaments your machine can handle. Sort results by price, rating, or TD value to find exactly what you need. Ready to decide between two options? Use the{' '}
                <a href="/compare" className="text-primary hover:underline font-medium">side-by-side comparison tool</a> to evaluate up to four filaments at once. For a broader overview, read our{' '}
                <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a>.
              </p>
            </article>

            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">What Makes FilaScope Different</h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlike simple product listings, FilaScope aggregates cross-regional pricing from 15+ stores in five regions (US, UK, EU, CA, AU) so you can spot the best deal wherever you are. We maintain the largest public{' '}
                <a href="/hueforge-td-database" className="text-primary hover:underline font-medium">HueForge transmissivity database</a> with verified TD values for 500+ filaments, essential for lithophane and multicolor projects. Every filament is matched against 119+ printers for instant compatibility checks. Explore all indexed manufacturers on the{' '}
                <a href="/brands" className="text-primary hover:underline font-medium">brands directory</a>, or jump straight to the latest savings on our{' '}
                <a href="/deals" className="text-primary hover:underline font-medium">deals page</a>.
              </p>
            </article>
          </section>
        )}

        {slug && materialFaqs.length > 0 && (
          <FAQSection
            faqs={materialFaqs}
            title={`${config?.label ?? label} Filament — Frequently Asked Questions`}
            className="mt-10"
          />
        )}

        {/* People Also Ask — shown on root /filaments page only */}
        {!slug && (
          <FAQSection
            faqs={[
              {
                question: 'What is the best 3D printer filament for beginners?',
                answer: 'PLA is the best filament for beginners. It prints at low temperatures (190–220°C), requires no heated bed or enclosure, and produces consistent results on virtually every FDM printer. Browse PLA filaments or read the best filaments for beginners guide for detailed recommendations.',
              },
              {
                question: 'How do I compare 3D printer filaments?',
                answer: 'FilaScope lets you compare filaments side-by-side on specs, pricing, and compatibility. Use the comparison tool to evaluate up to 4 filaments at once — including temperature ranges, mechanical properties, regional pricing, and HueForge TD values.',
              },
              {
                question: 'What filament should I use for HueForge?',
                answer: 'For HueForge lithophanes and multicolor prints, you need filaments with known TD (Transmissivity Distance) values. White PLA with TD 4–6 is the most popular starting point. Search the HueForge TD Database for verified TD values across 500+ filaments from 40+ brands.',
              },
              {
                question: 'Is PETG stronger than PLA?',
                answer: 'Yes. PETG has higher tensile strength (~50 MPa vs ~37 MPa for PLA), better impact resistance, and a higher glass transition temperature (~80°C vs ~60°C). PETG is the recommended upgrade from PLA for functional parts. See the full PLA vs PETG comparison for detailed data.',
              },
            ]}
            title="People Also Ask"
            className="mt-10"
          />
        )}

        {/* Related Searches for SEO discoverability */}
        {slug && <RelatedSearchesSection materialSlug={slug} materialLabel={config?.label} />}
      </div>
    </>
  );
}

