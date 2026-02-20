import { useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useJsonLd } from "@/components/seo/useJsonLd";
import { MATERIAL_SLUG_CONFIG } from "@/pages/MaterialHub";
import { materialNameToSlug } from "@/lib/materialSlugUtils";
import { useFinderQuery, DEFAULT_PAGE_SIZE } from "@/hooks/useFinderQuery";
import { FilamentCard } from "@/components/FilamentCard";
import { FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
import { CrawlablePaginationBar } from "@/components/CrawlablePaginationBar";
import { RelatedSearchesSection } from "@/components/seo/RelatedSearchesSection";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";

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

export default function FilamentCategoryPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

  // Build filters: pre-set material from slug
  const finderFilters = {
    ...DEFAULT_FILTERS,
    selectedMaterials: config ? config.materials : [],
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

        {/* H1 + intro */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {metaConfig.h1}
        </h1>
        <p className="text-muted-foreground mb-3 max-w-2xl leading-relaxed">{intro}</p>

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
        {displayCount > 0 && (
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

        {/* Related Searches for SEO discoverability */}
        {slug && <RelatedSearchesSection materialSlug={slug} materialLabel={config?.label} />}
      </div>
    </>
  );
}

