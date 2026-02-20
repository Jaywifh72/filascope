import { useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useJsonLd } from "@/components/seo/useJsonLd";
import { MATERIAL_SLUG_CONFIG } from "@/pages/MaterialHub";
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

const CATEGORY_META: Record<string, CategoryMeta> = {
  pla: {
    titleTemplate: "PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PLA 3D printer filaments by price, brand, TD value, and printer compatibility. Find the best PLA for your printer with real-time pricing.",
    h1: "PLA Filaments",
    introTemplate: "PLA (Polylactic Acid) is the most popular 3D printing material — easy to print, biodegradable, and available in hundreds of colors. Compare {count} PLA filaments below with real-time pricing, HueForge TD values, and printer compatibility data.",
  },
  petg: {
    titleTemplate: "PETG Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG 3D printer filaments. Stronger than PLA with better heat resistance. Filter by brand, price, TD value, and printer compatibility.",
    h1: "PETG Filaments",
    introTemplate: "PETG combines the printability of PLA with the strength of ABS. It's impact-resistant, food-safe options exist, and it handles higher temperatures. Compare {count} PETG filaments with real-time pricing and compatibility data.",
  },
  abs: {
    titleTemplate: "ABS Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ABS 3D printer filaments. Heat-resistant and durable for functional parts. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ABS Filaments",
    introTemplate: "ABS is a durable, heat-resistant engineering plastic ideal for functional parts. It requires an enclosed printer and heated bed. Compare {count} ABS filaments with specs, pricing, and compatibility data.",
  },
  tpu: {
    titleTemplate: "TPU Flexible Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ TPU and flexible 3D printer filaments. Find the right shore hardness for your project. Filter by brand, price, and printer compatibility.",
    h1: "TPU & Flexible Filaments",
    introTemplate: "TPU is a flexible filament with rubber-like properties, ideal for phone cases, gaskets, and wearables. Print slowly with a direct-drive extruder. Compare {count} TPU filaments with specs and pricing.",
  },
  asa: {
    titleTemplate: "ASA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ ASA 3D printer filaments. UV-resistant and weatherproof for outdoor use. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "ASA Filaments",
    introTemplate: "ASA offers superior UV and weather resistance compared to ABS, making it ideal for outdoor parts. It requires an enclosure. Compare {count} ASA filaments with specs, pricing, and compatibility data.",
  },
  "silk-pla": {
    titleTemplate: "Silk PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Silk PLA 3D printer filaments with shimmery metallic finish. High TD values ideal for HueForge. Filter by brand, color, price, and TD value.",
    h1: "Silk PLA Filaments",
    introTemplate: "Silk PLA produces stunning metallic-sheen prints with vibrant colors. It's particularly popular for HueForge lithophanes due to high TD values. Compare {count} Silk PLA filaments with color options and pricing.",
  },
  nylon: {
    titleTemplate: "Nylon/PA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ Nylon and PA 3D printer filaments. Strong, flexible engineering material. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "Nylon (PA) Filaments",
    introTemplate: "Nylon (PA) is a strong, flexible engineering material ideal for functional parts requiring fatigue resistance. It's highly hygroscopic — always dry before printing. Compare {count} Nylon filaments with specs and pricing.",
  },
  "pla-plus": {
    titleTemplate: "PLA+ Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PLA+ 3D printer filaments. Improved impact resistance over standard PLA. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PLA+ Filaments",
    introTemplate: "PLA+ offers improved impact resistance and reduced brittleness over standard PLA while maintaining easy printability. Compare {count} PLA+ filaments across brands with real-time pricing and specs.",
  },
  "high-speed-pla": {
    titleTemplate: "High Speed PLA Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ High Speed PLA filaments for fast 3D printing. Compatible with Bambu Lab, Creality K1, and more. Filter by brand and price on FilaScope.",
    h1: "High Speed PLA Filaments",
    introTemplate: "High-Speed PLA is formulated for printing at 200–600mm/s on modern printers like Bambu Lab and Creality K1. Compare {count} high-speed PLA filaments with compatible printers and pricing data.",
  },
  polycarbonate: {
    titleTemplate: "Polycarbonate Filaments — Compare {count}+ PC Options | FilaScope",
    descTemplate: "Compare {count}+ PC and Polycarbonate 3D printer filaments. Strongest print material with high heat tolerance. Filter by brand and printer compatibility.",
    h1: "Polycarbonate (PC) Filaments",
    introTemplate: "Polycarbonate is one of the strongest 3D printing materials, with exceptional impact resistance and heat tolerance up to 130°C. Requires an all-metal hotend and enclosure. Compare {count} PC filaments.",
  },
  "petg-cf": {
    titleTemplate: "PETG Carbon Fiber Filaments — Compare {count}+ Options | FilaScope",
    descTemplate: "Compare {count}+ PETG-CF carbon fiber 3D printer filaments. Stiff, lightweight, and strong. Filter by brand, price, and printer compatibility on FilaScope.",
    h1: "PETG Carbon Fiber Filaments",
    introTemplate: "PETG-CF (Carbon Fiber) combines PETG's printability with the rigidity of carbon fiber reinforcement. Ideal for lightweight structural parts. Compare {count} PETG-CF filaments with specs and pricing.",
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: slug
      ? [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Filaments", item: `${BASE_URL}/filaments` },
          { "@type": "ListItem", position: 3, name: label, item: `${BASE_URL}${canonical}` },
        ]
      : [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Filaments", item: `${BASE_URL}/filaments` },
        ],
  };

  const itemListSchema = groups.length > 0
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

  useJsonLd(breadcrumbSchema);
  useJsonLd(itemListSchema);
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

export default function FilamentCategoryPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // 0-indexed page
  const currentPage = Math.max(0, parseInt(searchParams.get("page") || "1", 10) - 1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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
        <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">{intro}</p>

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

