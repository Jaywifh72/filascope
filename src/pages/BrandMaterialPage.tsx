import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { FilamentCard } from "@/components/FilamentCard";
import { MATERIAL_SLUG_CONFIG } from "./MaterialHub";

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function BrandMaterialPage() {
  const { brand: brandSlug, material: materialSlug } = useParams<{ brand: string; material: string }>();

  const config = materialSlug ? MATERIAL_SLUG_CONFIG[materialSlug] : null;

  // Brand info
  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ["brand-material-brand", brandSlug],
    enabled: !!brandSlug,
    queryFn: async () => {
      const { data } = await supabase
        .from("automated_brands")
        .select("id, brand_name, display_name, brand_slug, logo_url")
        .eq("brand_slug", brandSlug!)
        .maybeSingle();
      return data;
    },
  });

  // Filaments for this brand+material
  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ["brand-material-filaments", brandSlug, materialSlug],
    enabled: !!brandData && !!config,
    queryFn: async () => {
      if (!brandData || !config) return [] as any[];
      const { data } = await (supabase as any)
        .from("filaments")
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, td_value, filascope_score, diameter_nominal_mm, variant_available, nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c")
        .in("material", config.materials)
        .ilike("vendor", brandData.brand_name)
        .order("filascope_score", { ascending: false, nullsFirst: false })
        .limit(48);
      return (data ?? []) as any[];
    },
  });

  const isLoading = brandLoading || filamentsLoading;

  // Unknown material slug → redirect to brand page
  if (!config) {
    return <Navigate to={`/brands/${brandSlug}`} replace />;
  }

  // Brand not found → redirect to brands listing
  if (!brandLoading && !brandData) {
    return <Navigate to="/brands" replace />;
  }

  // Thin content → redirect to brand page
  if (!isLoading && filaments && filaments.length < 3) {
    return <Navigate to={`/brands/${brandSlug}`} replace />;
  }

  if (isLoading) return <PageLoadingSkeleton />;

  const brandName = brandData?.display_name || brandData?.brand_name || brandSlug || "";
  const matLabel = config.label;
  const count = filaments?.length ?? 0;

  const title = `${brandName} ${matLabel} Filaments — ${count} Products | FilaScope`;
  const description = `Browse all ${count} ${brandName} ${matLabel} filaments. Compare colors, specs, TD values, and prices. Find the right ${brandName} ${matLabel} for your printer on FilaScope.`;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Brands", url: "/brands" },
    { name: brandName, url: `/brands/${brandSlug}` },
    { name: `${matLabel} Filaments`, url: `/brands/${brandSlug}/${materialSlug}` },
  ];

  // Compute specs summary
  const withTemps = (filaments ?? []).filter((f: any) => f.nozzle_temp_min_c && f.nozzle_temp_max_c);
  const nozzleMin = withTemps.length ? Math.min(...withTemps.map((f: any) => f.nozzle_temp_min_c)) : null;
  const nozzleMax = withTemps.length ? Math.max(...withTemps.map((f: any) => f.nozzle_temp_max_c)) : null;
  const withBed = (filaments ?? []).filter((f: any) => f.bed_temp_min_c && f.bed_temp_max_c);
  const bedMin = withBed.length ? Math.min(...withBed.map((f: any) => f.bed_temp_min_c)) : null;
  const bedMax = withBed.length ? Math.max(...withBed.map((f: any) => f.bed_temp_max_c)) : null;
  const prices = (filaments ?? []).map((f: any) => f.variant_price).filter(Boolean) as number[];
  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;
  const colorCount = new Set((filaments ?? []).map((f: any) => f.color_family).filter(Boolean)).size;
  const diameters = [...new Set((filaments ?? []).map((f: any) => f.diameter_nominal_mm).filter(Boolean))];

  const faqs = [
    {
      question: `What ${matLabel} filaments does ${brandName} make?`,
      answer: `${brandName} offers ${count} ${matLabel} filament${count !== 1 ? "s" : ""} in ${colorCount} color${colorCount !== 1 ? "s" : ""}. Browse the full list above to compare specs, pricing, and HueForge TD values.`,
    },
    {
      question: `What temperature should I use for ${brandName} ${matLabel}?`,
      answer:
        nozzleMin && nozzleMax
          ? `${brandName} recommends ${nozzleMin}–${nozzleMax} °C nozzle temperature and ${bedMin ?? ""}–${bedMax ?? ""} °C bed temperature for their ${matLabel} filaments. Always check the specific product datasheet for exact settings.`
          : `Check the specific product datasheet for ${brandName} ${matLabel} temperature recommendations.`,
    },
    {
      question: `Is ${brandName} ${matLabel} compatible with my printer?`,
      answer: `${brandName} ${matLabel} filaments are compatible with most FDM 3D printers. They come in ${diameters.join(" and ")} mm diameter${diameters.length > 1 ? "s" : ""}. Check your printer's supported filament diameters and temperature range before purchasing.`,
    },
  ];

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        canonical={`https://filascope.com/brands/${brandSlug}/${materialSlug}`}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={breadcrumbItems.slice(1)} className="mb-4" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          {brandData?.logo_url && (
            <img
              src={brandData.logo_url}
              alt={`${brandName} logo`}
              className="h-10 w-auto object-contain"
              loading="eager"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {brandName} {matLabel} Filaments
          </h1>
        </div>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          {count} {matLabel} filament{count !== 1 ? "s" : ""} from {brandName}. Compare colors, specs, TD values, and prices.
        </p>

        {/* Specs summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 rounded-xl border border-border bg-card/50">
          <SpecItem label="Products" value={count.toString()} />
          <SpecItem label="Colors" value={colorCount.toString()} />
          <SpecItem
            label="Nozzle Temp"
            value={nozzleMin && nozzleMax ? `${nozzleMin}–${nozzleMax} °C` : "—"}
          />
          <SpecItem
            label="Price Range"
            value={priceMin && priceMax ? `$${priceMin.toFixed(2)}–$${priceMax.toFixed(2)}` : "—"}
          />
        </div>

        {/* Product grid */}
        {filaments && filaments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">All {brandName} {matLabel} Filaments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filaments.map((f: any) => (
                <FilamentCard key={f.id} filament={f as any} />
              ))}
            </div>
          </section>
        )}

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            to={`/brands/${brandSlug}`}
            className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
          >
            ← All {brandName} Filaments
          </Link>
          <Link
            to={`/materials/${materialSlug}`}
            className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
          >
            All {matLabel} Filaments →
          </Link>
        </div>

        {/* FAQ */}
        <FAQSection faqs={faqs} title={`${brandName} ${matLabel} Filament FAQ`} />
      </div>
    </>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
