import { useState } from "react";
import { useParams, useSearchParams, Navigate, Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useJsonLd, useJsonLdMultiple } from "@/components/seo/useJsonLd";
import { FAQSection, FAQSchema } from "@/components/seo";
import { MATERIAL_SLUG_CONFIG } from "@/pages/MaterialHub";
import { materialNameToSlug } from "@/lib/materialSlugUtils";
import { useFinderQuery, DEFAULT_PAGE_SIZE } from "@/hooks/useFinderQuery";
import { FilamentCard } from "@/components/FilamentCard";
import { FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
import { FilamentsEmptyState } from "@/components/filament/FilamentsEmptyState";
import { CrawlablePaginationBar } from "@/components/CrawlablePaginationBar";
import { RelatedSearchesSection } from "@/components/seo/RelatedSearchesSection";
import { RelatedQuestionsSection } from "@/components/seo/RelatedQuestionsSection";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { ExploreMoreSection } from "@/components/ExploreMoreSection";
import { useRegion } from "@/contexts/RegionContext";
import { useIntelligentSearch } from "@/hooks/useIntelligentSearch";
import IntelligentSearchBar from "@/components/search/IntelligentSearchBar";
import IntelligentSearchResults from "@/components/search/IntelligentSearchResults";
import { SearchBarGated } from "@/components/search/SearchBarGated";

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
    descTemplate: "Filter, sort, and compare {count}+ PLA 3D printer filaments from {brandCount}+ brands. Real-time pricing, HueForge TD values, and printer compatibility — find the best PLA for your setup.",
    h1: "PLA Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "PLA (Polylactic Acid) is the most popular 3D printing filament, known for its ease of use, low warping, and wide color selection. It prints at 190–220°C with minimal bed adhesion issues, making it ideal for beginners and detailed decorative prints. Compare {count}+ PLA filaments below from brands like Bambu Lab, Polymaker, and eSUN — with real-time pricing, HueForge TD values, and printer compatibility data.",
  },
  petg: {
    titleTemplate: "PETG Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG 3D printer filaments. Stronger than PLA with better heat resistance. Filter by brand, price, TD value, and printer compatibility.",
    h1: "PETG Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "PETG (Polyethylene Terephthalate Glycol) bridges the gap between PLA's ease of use and ABS's strength. It's impact-resistant, food-safe options exist, and it tolerates temperatures up to 80°C without deforming — ideal for functional enclosures, brackets, and mechanical parts. Compare {count}+ PETG filaments below with real-time pricing, regional availability, and compatibility data.",
  },
  abs: {
    titleTemplate: "ABS Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ABS 3D printer filaments. Heat-resistant and durable for functional parts. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ABS Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "ABS (Acrylonitrile Butadiene Styrene) is a durable, heat-resistant engineering plastic used in everything from LEGO bricks to automotive parts. It resists temperatures up to 100°C but requires an enclosed printer and heated bed to prevent warping. Compare {count}+ ABS filaments with specs, pricing, and printer compatibility data.",
  },
  tpu: {
    titleTemplate: "TPU Flexible Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ TPU and flexible 3D printer filaments. Find the right shore hardness for your project. Filter by brand, price, and printer compatibility.",
    h1: "TPU & Flexible Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "TPU (Thermoplastic Polyurethane) is a rubber-like filament ideal for phone cases, gaskets, shoe insoles, and wearables — anything that needs to bend and return to shape. Shore hardness (95A being common) controls stiffness; softer grades require a direct-drive extruder. Compare {count}+ TPU filaments with shore hardness specs, brand options, and pricing.",
  },
  asa: {
    titleTemplate: "ASA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ASA 3D printer filaments. UV-resistant and weatherproof for outdoor use. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ASA Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "ASA (Acrylonitrile Styrene Acrylate) is ABS's weatherproof sibling — with superior UV and moisture resistance, making it ideal for outdoor signs, garden tools, and automotive trim. It prints similarly to ABS (230–260°C) and requires an enclosure to prevent warping. Compare {count}+ ASA filaments with specs, pricing, and compatibility data.",
  },
  "silk-pla": {
    titleTemplate: "Silk PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Silk PLA 3D printer filaments with shimmery metallic finish. High TD values ideal for HueForge. Filter by brand, color, price, and TD value.",
    h1: "Silk PLA Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Silk PLA produces stunning metallic-sheen prints with a satin finish that catches the light from every angle. It shares PLA's easy printability (200–230°C) and is especially popular for HueForge multi-color lithophanes thanks to characteristically high TD values. Compare {count}+ Silk PLA filaments with color swatches, TD data, and pricing.",
  },
  nylon: {
    titleTemplate: "Nylon/PA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Nylon and PA 3D printer filaments. Strong, flexible engineering material. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "Nylon (PA) Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Nylon (PA — Polyamide) is a tough, flexible engineering material with excellent fatigue resistance and impact strength — ideal for gears, hinges, snap-fits, and functional prototypes. It's highly hygroscopic, so always dry your spool before printing and use a dry box during long prints. Compare {count}+ Nylon filaments from PA6, PA12, and carbon-fiber reinforced variants with specs and pricing.",
  },
  "pla-plus": {
    titleTemplate: "PLA+ Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PLA+ 3D printer filaments. Improved impact resistance over standard PLA. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PLA+ Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "PLA+ (also called PLA Pro) delivers improved toughness and reduced brittleness over standard PLA while keeping the same easy print settings (195–230°C). It's a popular upgrade for functional prints that need more abuse resistance without the complexity of PETG or ABS. Compare {count}+ PLA+ filaments across brands with real-time pricing and specs.",
  },
  "high-speed-pla": {
    titleTemplate: "High Speed PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ High Speed PLA filaments for fast 3D printing. Compatible with Bambu Lab, Creality K1, and more. Filter by brand and price on FilaScope.",
    h1: "High Speed PLA Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "High-Speed PLA is specially formulated for printing at 200–600 mm/s on modern CoreXY printers like the Bambu Lab X1C, A1, and Creality K1 — enabling dramatically shorter print times without layer delamination. It requires higher flow rates and nozzle temperatures (220–240°C) than standard PLA. Compare {count}+ high-speed PLA filaments with printer compatibility and pricing data.",
  },
  polycarbonate: {
    titleTemplate: "Polycarbonate Filaments — Compare {count}+ PC Options | FilaScope",
    descTemplate: "Compare {count}+ PC and Polycarbonate 3D printer filaments. Strongest print material with high heat tolerance. Filter by brand and printer compatibility.",
    h1: "Polycarbonate (PC) Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Polycarbonate is one of the strongest and most heat-tolerant 3D printing materials — used in bulletproof glass, eyeglass lenses, and aerospace components. It handles temperatures up to 130°C and resists impacts that shatter PLA or ABS. Printing requires an all-metal hotend, enclosure, and nozzle temperatures of 260–310°C. Compare {count}+ PC filaments with specs and pricing.",
  },
  "petg-cf": {
    titleTemplate: "PETG Carbon Fiber Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG-CF carbon fiber 3D printer filaments. Stiff, lightweight, and strong. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PETG Carbon Fiber Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "PETG-CF (Carbon Fiber reinforced PETG) combines PETG's chemical resistance and printability with dramatically increased stiffness from short-strand carbon fibers — ideal for lightweight structural parts, brackets, and drone frames. It requires a hardened steel nozzle (0.4mm+) to prevent wear. Compare {count}+ PETG-CF filaments with specs, pricing, and compatibility data.",
  },
  wood: {
    titleTemplate: "Wood PLA Filaments — Realistic Texture & Finish | FilaScope",
    descTemplate: "Compare {count}+ Wood PLA 3D printer filaments. Achieve realistic wood texture and grain. Sand, stain, and paint like real wood. Find the best wood filament brand.",
    h1: "Wood PLA Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Wood PLA filaments blend standard PLA with 10–30% real wood particles — sawdust, bamboo, or cork — to produce prints with an authentic wooden texture and grain that can be sanded, stained, and even painted like real wood. They print at standard PLA temperatures (190–220°C) but require a larger nozzle (0.5mm+) to prevent clogging from the fiber content. Higher nozzle temperatures produce a darker, more 'burnt wood' appearance while cooler temps give a lighter finish. Wood PLA is popular for cosplay props, architectural models, decorative sculptures, furniture models, and any print where a natural organic look is desired. Compare {count}+ wood filament options below, with brand specs and pricing.",
  },
  "carbon-fiber": {
    titleTemplate: "Carbon Fiber Filaments — Lightweight & Stiff | FilaScope",
    descTemplate: "Compare {count}+ carbon fiber 3D printer filaments. CF-reinforced PLA, PETG, Nylon, and ABS for lightweight, rigid structural parts. Requires hardened nozzle.",
    h1: "Carbon Fiber 3D Printing Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Carbon fiber filaments combine a standard base polymer (PLA, PETG, Nylon, or ABS) with short-strand carbon fiber reinforcement, dramatically increasing stiffness and reducing weight compared to unreinforced plastics. The result is a material with an excellent strength-to-weight ratio — ideal for drone frames, RC car parts, robotic arms, structural brackets, and functional engineering components. Carbon fiber filaments are highly abrasive and will rapidly wear standard brass nozzles; a hardened steel, ruby-tipped, or tungsten carbide nozzle is essential. Print temperatures vary by base material (230–270°C) and the carbon fibers reduce stringing significantly. Compare {count}+ carbon fiber filaments from top brands below.",
  },
  "glow-in-the-dark": {
    titleTemplate: "Glow in the Dark Filaments — Photoluminescent PLA | FilaScope",
    descTemplate: "Compare {count}+ glow in the dark 3D printer filaments. Photoluminescent PLA that charges under light and glows for 6–12 hours. Easy to print, same settings as PLA.",
    h1: "Glow in the Dark 3D Printer Filaments — Compare {count}+ Options from {brandCount}+ Brands",
    introTemplate: "Glow in the dark filaments use strontium aluminate phosphor particles embedded in a PLA base, creating prints that charge under natural or artificial light and emit a vivid glow for 6–12 hours in the dark. They print at standard PLA temperatures (190–220°C) making them beginner-friendly, and the thicker your walls and layers, the more phosphor material stores energy and the brighter and longer your glow. Popular for safety markers, cosplay costumes, night-stand accessories, gaming accessories, and Halloween decorations. Green glows are the brightest and most common; blue and purple variants have a shorter glow duration. Compare {count}+ glow filament options with brand, price, and color data.",
  },
};

const ALL_META: CategoryMeta = {
  titleTemplate: "3D Printer Filaments — Compare {count}+ Products | FilaScope",
  descTemplate: "Browse and compare {count}+ 3D printer filaments from {brandCount}+ brands. Filter by material, price, printer compatibility, and TD value for HueForge. Updated daily.",
  h1: "Compare 3D Printer Filaments — {count}+ Products from {brandCount}+ Brands",
  introTemplate: "Browse all {count}+ 3D printer filaments from {brandCount}+ brands. Filter by material, brand, price range, and printer compatibility to find your perfect filament.",
};

function applyCount(template: string, count: number, brandCount?: number): string {
  let result = template.replace(/\{count\}/g, count.toLocaleString());
  if (brandCount != null) {
    result = result.replace(/\{brandCount\}/g, String(brandCount));
  }
  return result;
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

  // Standalone ItemList schema (first 10 products) for rich results
  const standaloneItemList = groups.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: slug ? `${label} 3D Printer Filaments` : "3D Printer Filaments",
        description: `Browse and compare ${count.toLocaleString()}+ 3D printer filaments from 49+ brands with real-time pricing and specifications.`,
        numberOfItems: count,
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: groups.slice(0, 10).map((g, i) => {
          const f = g.representativeFilament;
          const handle = f?.product_handle || f?.id;
          return {
            "@type": "ListItem",
            position: i + 1,
            name: g.baseName || f?.product_title || "Filament",
            url: handle ? `${BASE_URL}/filament/${handle}` : `${BASE_URL}/filaments`,
            item: {
              "@type": "Product",
              name: g.baseName || f?.product_title || "Filament",
              url: handle ? `${BASE_URL}/filament/${handle}` : `${BASE_URL}/filaments`,
              ...(f?.featured_image && { image: f.featured_image }),
              ...(g.vendor && { brand: { "@type": "Brand", name: g.vendor } }),
              category,
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

  useJsonLdMultiple([collectionPageSchema, standaloneItemList].filter(Boolean) as Record<string, unknown>[]);
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
      answer: `Based on FilaScope's real-time price tracking across 15+ stores in 5 regions, ${label} filament typically ranges from ${minStr} to ${maxStr} per spool in the US market. Price varies by brand, color type, and spool weight.`,
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
      answer: `FilaScope currently tracks 48+ brands across 20+ material types. Popular ${label} filament brands include ${materialStats.topBrands.join(', ')}, and many more. You can compare specs and prices side by side.`,
    });
  }

  return faqs;
}

// ─────────────────────────────────────────────
// People Also Ask — per-material AEO content
// ─────────────────────────────────────────────
const MATERIAL_PAA: Record<string, { question: string; answer: string }[]> = {
  pla: [
    {
      question: 'What temperature should I print PLA at?',
      answer: 'Most PLA filaments print best at 200–215°C nozzle temperature with a 50–60°C bed. However, some high-speed PLA variants need 220°C+. Check FilaScope\'s database for the exact recommended temperature for your specific PLA filament.',
    },
    {
      question: 'Is PLA food safe?',
      answer: 'PLA itself is derived from plant-based materials and is generally considered food-safe before printing. However, FDM-printed PLA has layer lines that harbor bacteria, and most colored PLA contains non-food-safe additives. For food contact, use food-safe certified filaments and consider a food-safe coating.',
    },
    {
      question: 'How long does PLA last outdoors?',
      answer: 'PLA degrades in direct sunlight and temperatures above 55–60°C. For outdoor use, PLA may warp or become brittle within weeks to months depending on conditions. For outdoor projects, use ASA or PETG instead — see our guide on best filaments for outdoor use.',
    },
    {
      question: 'What is the strongest PLA filament?',
      answer: 'PLA+ (PLA Plus) and PLA-CF (carbon fiber reinforced PLA) are the strongest PLA variants. PLA+ offers improved impact resistance over standard PLA, while PLA-CF provides higher stiffness and heat resistance. Compare strength ratings across brands on FilaScope.',
    },
  ],
  petg: [
    {
      question: 'What temperature should I print PETG at?',
      answer: 'PETG prints best at 230–250°C nozzle temperature with a 70–85°C heated bed. Unlike PLA, PETG benefits from reduced part cooling (30–50% fan speed) for better layer adhesion. Check FilaScope for brand-specific temperature recommendations.',
    },
    {
      question: 'Is PETG stronger than PLA?',
      answer: 'Yes. PETG has higher tensile strength (~50 MPa vs ~37 MPa for PLA), better impact resistance, and a higher glass transition temperature (~80°C vs ~60°C). PETG is the recommended upgrade from PLA for functional parts that need to withstand mechanical stress.',
    },
    {
      question: 'Can PETG be used outdoors?',
      answer: 'PETG has moderate UV resistance and handles outdoor temperatures better than PLA, but it will degrade over time in direct sunlight. For long-term outdoor use, ASA is a better choice. PETG works well for short-term outdoor items or parts with indirect sun exposure.',
    },
    {
      question: 'Why does my PETG string so much?',
      answer: 'PETG is naturally more prone to stringing than PLA due to its higher viscosity. Reduce stringing by increasing retraction distance (4–6mm for Bowden, 1–3mm for direct drive), lowering nozzle temperature by 5–10°C, and enabling coasting in your slicer settings.',
    },
  ],
  abs: [
    {
      question: 'Do I need an enclosure to print ABS?',
      answer: 'Yes, an enclosure is strongly recommended for ABS. Without one, temperature differentials cause warping, layer splitting, and poor adhesion. Even a simple cardboard or plastic enclosure that maintains ambient temperature above 35°C dramatically improves ABS print quality.',
    },
    {
      question: 'What temperature should I print ABS at?',
      answer: 'ABS prints at 230–260°C nozzle temperature with a 90–110°C heated bed. Minimal part cooling (0–30% fan) is recommended. An enclosed build chamber at 35–50°C ambient temperature prevents warping and improves layer adhesion.',
    },
    {
      question: 'Is ABS safe to print indoors?',
      answer: 'ABS emits styrene fumes when heated, which can cause headaches and respiratory irritation. Always print ABS in a well-ventilated area or use an enclosure with a HEPA/activated carbon filter. For a safer alternative with similar properties, consider ASA.',
    },
    {
      question: 'What is the difference between ABS and ASA?',
      answer: 'ASA is essentially a UV-stabilized version of ABS. Both have similar mechanical properties and print settings, but ASA resists yellowing and degradation from sunlight far better. Choose ABS for indoor functional parts and ASA for anything that will be exposed to outdoor conditions.',
    },
  ],
};

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

  // Fetch total visible brand count (for "all filaments" page H1)
  const { data: allBrandCount } = useQuery({
    queryKey: ["filament-category-brand-count"],
    enabled: !slug,
    queryFn: async () => {
      const { count } = await supabase
        .from("automated_brands")
        .select("id", { count: "exact", head: true })
        .eq("is_visible", true);
      return count ?? 48;
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
        brandCount: Object.keys(brandCounts).length,
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
  // Brand count: from materialStats for material pages, from allBrandCount for "all" page
  const brandCount = slug ? (materialStats?.brandCount ?? undefined) : (allBrandCount ?? 48);
  const title = applyCount(metaConfig.titleTemplate, displayCount, brandCount);
  const description = applyCount(metaConfig.descTemplate, displayCount, brandCount);
  const intro = applyCount(metaConfig.introTemplate, displayCount, brandCount);
  const h1Text = applyCount(metaConfig.h1, displayCount, brandCount);

  // Breadcrumb items for visible nav
  const breadcrumbItems = slug
    ? [
        { name: "Filaments", url: "/filaments" },
        { name: label, url: basePath },
      ]
    : [{ name: "Filaments", url: "/filaments" }];

  useCategorySchemas(slug, h1Text, canonical, groups, displayCount);

  const paaQuestions = slug ? (MATERIAL_PAA[slug] ?? []) : [];
  const baseFaqs = slug && config
    ? generateMaterialCategoryFAQs(slug, config.label, intro, materialStats)
    : [];
  // Merge all Q&As into one array for the single FAQPage JSON-LD schema
  const materialFaqs = [...baseFaqs, ...paaQuestions];

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
              {h1Text}
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

        {/* Intelligent Search Bar — gated by feature switch */}
        <SearchBarGated>
          <div className="mb-6">
            <IntelligentSearchBar
              query={aiQuery}
              onQueryChange={setAiQuery}
              isLoading={aiLoading && isIntelligentMode}
              isIntelligentMode={isIntelligentMode}
            />
          </div>
        </SearchBarGated>

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
              <FilamentsEmptyState
                searchTerm=""
                hasActiveFilters={false}
                onClearFilters={() => {}}
              />
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

        {/* Material-specific SEO content sections */}
        {slug === "pla" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is PLA Filament and Why Is It the Most Popular?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                PLA (Polylactic Acid) is the most popular 3D printing filament material, known for its ease of use, low warping, and wide color selection. PLA prints at 190–220°C nozzle temperature with 25–60°C bed temperature and does not require an enclosure. It is biodegradable, ideal for beginners and decorative prints. FilaScope indexes 4,296+ PLA filament variants from 48+ brands with real-time pricing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>PLA filament</strong> is the most widely used FDM 3D printing material worldwide, and for good reason. Made from renewable resources like corn starch, PLA is biodegradable, low-odor, and incredibly easy to print. It extrudes at just 190–220°C, doesn't require a heated bed or enclosure, and produces sharp, detailed prints on virtually any FDM printer. Whether you're a beginner looking for the <strong>best PLA filament</strong> or an experienced maker comparing options, FilaScope's <strong>PLA filament comparison</strong> tools let you evaluate specs, colors, and <strong>PLA filament prices</strong> across 48+ brands. PLA is ideal for prototypes, cosplay props, decorative models, miniatures, and HueForge lithophanes thanks to its excellent layer adhesion and vibrant color range.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">PLA Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "190–220°C" },
                  { label: "Bed Temperature", value: "0–60°C" },
                  { label: "Print Speed", value: "40–100 mm/s" },
                  { label: "Cooling", value: "100% fan after first layer" },
                  { label: "Enclosure", value: "Not required" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">PLA Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not sure which PLA to buy? Our <a href="/guides/best-pla-filaments" className="text-primary hover:underline font-medium">best PLA filaments guide</a> ranks top picks by print quality, consistency, and value. If you're weighing PLA against other materials, check the <a href="/guides/pla-vs-petg" className="text-primary hover:underline font-medium">PLA vs PETG comparison</a> for a detailed breakdown of strength, heat resistance, and ease of printing. Use the <a href="/compare" className="text-primary hover:underline font-medium">side-by-side comparison tool</a> to evaluate specific products, or read our <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a> for a broader overview of every material type.
              </p>
            </article>
          </section>
        )}

        {slug === "petg" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is PETG Filament and When Should You Use It?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                PETG (Polyethylene Terephthalate Glycol) is a durable, chemical-resistant 3D printing filament that balances ease of printing with functional strength. PETG prints at 220–250°C nozzle temperature with 70–90°C bed temperature and does not require an enclosure. It resists UV and moisture better than PLA, making it ideal for functional parts. FilaScope indexes 1,200+ PETG variants with cross-regional pricing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>PETG filament</strong> bridges the gap between PLA's ease of use and ABS's durability, making it the go-to material for functional parts and everyday prints. It offers excellent layer adhesion, chemical resistance, and impact strength while remaining relatively easy to print. If you're searching for the <strong>best PETG filament</strong>, FilaScope's <strong>PETG filament comparison</strong> lets you evaluate tensile strength, flexibility, and <strong>PETG filament prices</strong> across dozens of brands. PETG prints at 220–250°C with a heated bed at 70–90°C, doesn't require an enclosure, and resists UV degradation better than PLA — making it suitable for parts that see moderate outdoor exposure or mechanical stress.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">PETG Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "220–250°C" },
                  { label: "Bed Temperature", value: "70–90°C" },
                  { label: "Print Speed", value: "40–80 mm/s" },
                  { label: "Cooling", value: "50–70% fan" },
                  { label: "Enclosure", value: "Not required" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">PETG Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our <a href="/guides/best-petg-filaments" className="text-primary hover:underline font-medium">best PETG filaments guide</a> ranks top picks by strength, clarity, and print reliability. Comparing PETG to other materials? See <a href="/guides/pla-vs-petg" className="text-primary hover:underline font-medium">PLA vs PETG</a> for an in-depth analysis of trade-offs. Use the <a href="/compare" className="text-primary hover:underline font-medium">comparison tool</a> to evaluate specific PETG products head-to-head, or explore the <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a> to understand which material fits your use case best.
              </p>
            </article>
          </section>
        )}

        {slug === "abs" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is ABS Filament and What Is It Best For?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ABS (Acrylonitrile Butadiene Styrene) is a heat-resistant, tough 3D printing filament used for engineering and functional parts. ABS prints at 230–260°C nozzle temperature with 90–110°C bed temperature and requires an enclosed build chamber to prevent warping. It can be smoothed with acetone vapor for a glossy finish. FilaScope indexes 800+ ABS filament variants with real-time pricing across regions.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>ABS filament</strong> has been an industrial staple since the early days of 3D printing, prized for its heat resistance, toughness, and ability to be post-processed with acetone vapor smoothing. It prints at 230–260°C and requires a heated bed (90–110°C) plus an enclosed build chamber to prevent warping and layer splitting. Finding the <strong>best ABS filament</strong> means balancing print reliability with mechanical performance — FilaScope's <strong>ABS filament comparison</strong> helps you evaluate tensile strength, glass transition temperature, and <strong>ABS filament prices</strong> across all major brands. ABS is ideal for functional enclosures, automotive parts, jigs, and any application where heat resistance above 100°C is needed.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">ABS Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "230–260°C" },
                  { label: "Bed Temperature", value: "90–110°C" },
                  { label: "Print Speed", value: "40–80 mm/s" },
                  { label: "Cooling", value: "0–30% fan (minimal)" },
                  { label: "Enclosure", value: "Required" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">ABS Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our <a href="/guides/best-abs-filaments" className="text-primary hover:underline font-medium">best ABS filaments guide</a> ranks top picks by warp resistance, layer adhesion, and value. Wondering whether ABS is the right choice? Read <a href="/guides/asa-vs-abs-outdoor-printing" className="text-primary hover:underline font-medium">ASA vs ABS for outdoor printing</a> or <a href="/guides/petg-vs-abs" className="text-primary hover:underline font-medium">PETG vs ABS</a> for detailed comparisons. Use the <a href="/compare" className="text-primary hover:underline font-medium">side-by-side comparison tool</a> for specific products, or start with the <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a>.
              </p>
            </article>
          </section>
        )}

        {slug === "tpu" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is TPU Filament and What Can You Print With It?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                TPU (Thermoplastic Polyurethane) is a flexible, rubber-like 3D printing filament prized for its elasticity and impact resistance. TPU prints at 210–230°C nozzle temperature with 30–60°C bed temperature at slower speeds of 20–40 mm/s. No enclosure is required. It is ideal for phone cases, gaskets, wearables, and vibration-dampening parts. FilaScope indexes 400+ TPU filament variants with real-time pricing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>TPU filament</strong> is the leading flexible 3D printing material, offering Shore hardness ranging from 85A to 95A depending on the brand and formulation. Its rubber-like properties make it perfect for functional parts that need to bend, stretch, or absorb shock. Printing TPU requires a direct-drive extruder for best results, as Bowden setups can struggle with the material's flexibility. If you're looking for the <strong>best TPU filament</strong>, FilaScope's <strong>TPU filament comparison</strong> helps you evaluate flexibility, print reliability, and <strong>TPU filament prices</strong> across multiple brands.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">TPU Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "210–230°C" },
                  { label: "Bed Temperature", value: "30–60°C" },
                  { label: "Print Speed", value: "20–40 mm/s" },
                  { label: "Cooling", value: "50–100% fan" },
                  { label: "Enclosure", value: "Not required" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">TPU Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our <a href="/guides/best-tpu-filaments" className="text-primary hover:underline font-medium">best TPU filaments guide</a> ranks top picks by flexibility, print ease, and value. Use the <a href="/compare" className="text-primary hover:underline font-medium">side-by-side comparison tool</a> to evaluate specific TPU products, or read the <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a> for a broader overview of every material type.
              </p>
            </article>
          </section>
        )}

        {slug === "asa" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is ASA Filament and Why Use It for Outdoor Prints?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                ASA (Acrylonitrile Styrene Acrylate) is a UV-resistant, weatherproof 3D printing filament designed for outdoor and long-term functional use. ASA prints at 235–260°C nozzle temperature with 90–110°C bed temperature at 40–80 mm/s. An enclosure is recommended to prevent warping. It offers ABS-like strength without yellowing in sunlight. FilaScope indexes 300+ ASA filament variants with cross-regional pricing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>ASA filament</strong> is the material of choice for outdoor 3D printed parts. Unlike ABS, ASA resists UV degradation and maintains color stability even after prolonged sun exposure. It shares ABS's mechanical properties — high impact resistance, heat tolerance, and the ability to be acetone-smoothed — but adds superior weatherability. If you're searching for the <strong>best ASA filament</strong>, FilaScope's <strong>ASA filament comparison</strong> helps you compare UV resistance, print reliability, and <strong>ASA filament prices</strong> across top brands.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">ASA Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "235–260°C" },
                  { label: "Bed Temperature", value: "90–110°C" },
                  { label: "Print Speed", value: "40–80 mm/s" },
                  { label: "Cooling", value: "0–30% fan (minimal)" },
                  { label: "Enclosure", value: "Recommended" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">ASA Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our <a href="/guides/best-asa-filaments" className="text-primary hover:underline font-medium">best ASA filaments guide</a> ranks top picks by UV resistance, warp control, and value. Wondering how ASA compares to ABS? Read <a href="/guides/asa-vs-abs-outdoor-printing" className="text-primary hover:underline font-medium">ASA vs ABS for outdoor printing</a>. Use the <a href="/compare" className="text-primary hover:underline font-medium">comparison tool</a> to evaluate specific products, or explore the <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a>.
              </p>
            </article>
          </section>
        )}

        {slug === "nylon" && (
          <section className="mt-12 space-y-8">
            <article>
              <h2 className="text-2xl font-bold text-foreground mb-4">What Is Nylon Filament and What Are Its Advantages?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nylon (Polyamide) is a strong, wear-resistant 3D printing filament valued for its toughness, flexibility, and self-lubricating surface. Nylon prints at 240–270°C nozzle temperature with 70–100°C bed temperature at 30–60 mm/s. An enclosure is required and the filament must be dried before printing due to its hygroscopic nature. It excels in gears, hinges, and load-bearing parts. FilaScope indexes 250+ Nylon variants with real-time pricing.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Nylon filament</strong> is the go-to engineering material for parts that demand abrasion resistance, fatigue strength, and a degree of flexibility that rigid materials can't provide. Its self-lubricating surface makes it ideal for gears, bearings, and sliding mechanisms. Nylon is hygroscopic — it absorbs moisture from the air — so proper drying and dry-box storage are essential for consistent results. If you need the <strong>best Nylon filament</strong>, FilaScope's <strong>Nylon filament comparison</strong> helps you evaluate strength, moisture sensitivity, and <strong>Nylon filament prices</strong> across leading brands.
              </p>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nylon Print Settings Quick Reference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nozzle Temperature", value: "240–270°C" },
                  { label: "Bed Temperature", value: "70–100°C" },
                  { label: "Print Speed", value: "30–60 mm/s" },
                  { label: "Cooling", value: "0–30% fan (minimal)" },
                  { label: "Enclosure", value: "Required" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nylon Filament Buying Guide</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our <a href="/guides/best-nylon-filaments" className="text-primary hover:underline font-medium">best Nylon filaments guide</a> ranks top picks by strength, moisture resistance, and value. Use the <a href="/compare" className="text-primary hover:underline font-medium">side-by-side comparison tool</a> to evaluate specific Nylon products, or read the <a href="/guides/how-to-choose-3d-printer-filament" className="text-primary hover:underline font-medium">complete filament buying guide</a> for a broader overview of every material type.
              </p>
            </article>
          </section>
        )}

        {/* Single consolidated FAQPage schema for all Q&As (FAQ + PAA) */}
        {slug && materialFaqs.length > 0 && <FAQSchema faqs={materialFaqs} />}

        {slug && baseFaqs.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="text-xl font-semibold mb-6">{`${config?.label ?? label} Filament — Frequently Asked Questions`}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {baseFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {slug && paaQuestions.length > 0 && (
          <RelatedQuestionsSection
            questions={paaQuestions}
            title="People Also Ask"
            className="mt-10"
            suppressSchema
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
              {
                question: 'What is the most popular 3D printer filament material?',
                answer: 'PLA (Polylactic Acid) is the most popular material by far, accounting for over 56% of all filaments in FilaScope\'s database. It is the easiest to print, requires the lowest temperatures (190-220°C), and produces excellent surface quality. PETG is the second most popular for users who need more strength and heat resistance.',
              },
              {
                question: 'How do I choose between different filament brands?',
                answer: 'Compare specs (temperature range, tolerance), pricing across your region, color availability, and community reviews. FilaScope\'s FilaScore rating weighs all these factors from 1-10. Brands like Bambu Lab, Polymaker, and Prusament consistently score high for documentation and consistency, while eSUN and Hatchbox offer excellent value.',
              },
              {
                question: 'What does HueForge TD value mean on a filament listing?',
                answer: 'TD (Transmissivity Distance) measures how translucent a filament is when printed — specifically, how many millimeters of light pass through before being blocked. It matters for HueForge lithophane printing and multicolor prints. Lower TD (0.5-2.0) means opaque, higher TD (4.0+) means translucent. FilaScope tracks TD values to help HueForge users find the right filaments.',
              },
              {
                question: 'Why do filament prices vary so much between regions?',
                answer: 'Filament prices differ due to shipping costs, import duties, local distribution, and currency exchange rates. A filament that costs $20/kg in the US might cost $30/kg equivalent in Canada or Europe after duties. FilaScope tracks real-time pricing from 15+ retailers across 6 regions so you can find the best price for your location.',
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

