import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandSlug, isEncodedBrandName } from "@/utils/brandSlug";

import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandDetailSkeleton } from "@/components/brands/BrandDetailSkeleton";
import { DetailBreadcrumb } from "@/components/navigation/DetailBreadcrumb";
import { getBrandLogo } from "@/lib/brandLogos";
import { getBrandInfo } from "@/lib/brandInfo";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRegion } from "@/contexts/RegionContext";
import { BrandHeroSection } from "@/components/brands/BrandHeroSection";
import { BrandQuickNav } from "@/components/brands/BrandQuickNav";
import { BrandTabNav, type BrandTab } from "@/components/brands/tabs/BrandTabNav";
import { BrandOverviewTab } from "@/components/brands/tabs/BrandOverviewTab";
import { BrandAboutTab } from "@/components/brands/tabs/BrandAboutTab";
import { BrandProductsTab } from "@/components/brands/tabs/BrandProductsTab";
import { BrandSEO } from "@/components/seo/BrandSEO";
import { BrandOrganizationSchema } from "@/components/seo";
import { BrandBadgesDisplay, getBrandBadges } from "@/components/brands/BrandBadges";
import { BrandFAQSection } from "@/components/brands/BrandFAQSection";
import { RelatedBrandsSection } from "@/components/brands/RelatedBrandsSection";
import { useBrandFilaments } from "@/hooks/useBrandFilaments";
import { toast } from "sonner";

// Admin-only component for triggering Fiberlogy image sync
function AdminFiberlogySync({ brandId }: { brandId?: string | null }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-fiberlogy-images");
      if (error) throw error;
      setResult(data);
      toast.success(`Synced ${data?.updated || 0} images`);
    } catch (err: unknown) {
      toast.error(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          className="gap-1.5 text-xs border-amber-500/30 hover:border-amber-500/50"
        >
          <ImageIcon className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing Images..." : "Sync Fiberlogy Images from np3dp.com"}
        </Button>
        {result && (
          <span className="text-xs text-muted-foreground">
            Matched: {String(result.matched ?? 0)} | Updated: {String(result.updated ?? 0)} | Skipped: {String(result.skipped ?? 0)}
          </span>
        )}
      </div>
    </div>
  );
}

const BrandDetail = () => {
  const { brand } = useParams<{ brand: string }>();
  const navigate = useNavigate();
  const decodedBrand = brand ? decodeURIComponent(brand) : "";
  const brandSlug = toBrandSlug(decodedBrand);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BrandTab>("overview");
  const [descExpanded, setDescExpanded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();
  const { formatPrice } = useRegion();

  // Redirect old URL format
  useEffect(() => {
    if (brand && isEncodedBrandName(brand)) {
      navigate(`/brands/${brandSlug}`, { replace: true });
    }
  }, [brand, brandSlug, navigate]);

  // Fetch public brand data
  const { data: automatedBrand } = useQuery({
    queryKey: ["public-brand", brandSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_public_brands")
        .select("*")
        .or(`brand_name.ilike.${decodedBrand},brand_slug.eq.${brandSlug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!brandSlug,
  });

  const displayName = automatedBrand?.display_name || automatedBrand?.brand_name || decodedBrand.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const brandInfo = getBrandInfo(displayName);
  const brandLogo = automatedBrand?.logo_url || getBrandLogo(displayName) || getBrandLogo(decodedBrand);

  // Admin-only query
  const { data: adminBrandData } = useQuery({
    queryKey: ["admin-brand-data", brandSlug, isAdmin],
    queryFn: async () => {
      if (!isAdmin) return null;
      const { data, error } = await supabase
        .from("automated_brands")
        .select("*")
        .or(`brand_name.ilike.${decodedBrand},brand_slug.eq.${brandSlug}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!brandSlug && isAdmin,
  });

  // Use the new server-side grouping hook
  const {
    groupedProducts,
    filaments,
    availableMaterials,
    isLoading,
    isError,
    refetch,
  } = useBrandFilaments(
    decodedBrand.replace(/-/g, ' '),
    selectedMaterial
  );

  const hasHighSpeedProducts = filaments.some(f => f.high_speed_capable);
  const brandBadges = getBrandBadges(displayName, hasHighSpeedProducts);
  const isPremium = brandBadges.includes('premium');
  const isBudgetFriendly = brandBadges.includes('budget-friendly');

  // Derive price range from live filament data for FAQ
  const brandPriceRange = useMemo(() => {
    if (filaments.length === 0) return null;
    const prices = filaments.map(f => f.variant_price).filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [filaments]);

  // Derive top retailer names from product_url domains
  const topRetailers = useMemo(() => {
    if (filaments.length === 0) return [];
    const domainCounts: Record<string, number> = {};
    for (const f of filaments) {
      if (!f.product_url) continue;
      try {
        const domain = new URL(f.product_url).hostname.replace(/^www\./, '');
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch {}
    }
    return Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain]) => {
        if (domain.includes('amazon')) return 'Amazon';
        const slugNoDash = brandSlug.replace(/-/g, '');
        if (domain.replace(/\./g, '').includes(slugNoDash)) return 'Official Store';
        return domain
          .replace(/\.(com|net|org|store|shop|co).*$/, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      });
  }, [filaments, brandSlug]);

  // Derive which regions have live price data
  const regionsCovered = useMemo(() => {
    if (filaments.length === 0) return ['US'];
    const regions: string[] = [];
    if (filaments.some(f => f.variant_price && f.variant_price > 0)) regions.push('US');
    if (filaments.some(f => (f as any).price_cad && (f as any).price_cad > 0)) regions.push('CA');
    if (filaments.some(f => (f as any).price_eur && (f as any).price_eur > 0)) regions.push('EU');
    if (filaments.some(f => (f as any).price_gbp && (f as any).price_gbp > 0)) regions.push('UK');
    if (filaments.some(f => (f as any).price_aud && (f as any).price_aud > 0)) regions.push('AU');
    if (filaments.some(f => (f as any).price_jpy && (f as any).price_jpy > 0)) regions.push('JP');
    return regions.length > 0 ? regions : ['US'];
  }, [filaments]);

  // Derive TD count, top material category, and color count for FAQ
  const tdCount = useMemo(() => {
    return filaments.filter(f => (f as any).transmission_distance != null).length;
  }, [filaments]);

  const { topMaterialCategory, topMaterialCategoryCount } = useMemo(() => {
    if (filaments.length === 0) return { topMaterialCategory: null, topMaterialCategoryCount: 0 };
    const counts: Record<string, number> = {};
    for (const f of filaments) {
      if (f.material) counts[f.material] = (counts[f.material] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0
      ? { topMaterialCategory: sorted[0][0], topMaterialCategoryCount: sorted[0][1] }
      : { topMaterialCategory: null, topMaterialCategoryCount: 0 };
  }, [filaments]);

  const colorCount = useMemo(() => {
    const colors = new Set(filaments.map(f => f.color_family).filter(Boolean));
    return colors.size;
  }, [filaments]);

  if (isLoading) {
    return <BrandDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center py-24">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold text-foreground mb-2">Unable to load brand information</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We're having trouble loading data for this brand. Please try again.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => refetch()}>Retry</Button>
            <Button variant="outline" onClick={() => navigate('/brands')}>Browse All Brands</Button>
          </div>
        </div>
      </div>
    );
  }

  const hasNoProducts = filaments.length === 0;

  return (
    <div className="min-h-screen p-8">
      <BrandQuickNav
        brandName={displayName}
        brandLogo={brandLogo}
        isVerified={automatedBrand?.is_visible ?? false}
        website={brandInfo?.website}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        heroRef={heroRef}
        onVisitWebsite={brandInfo?.website ? () => {
          window.open(brandInfo.website, '_blank', 'noopener,noreferrer');
        } : undefined}
      />

      <BrandSEO
        brandName={displayName}
        description={brandInfo?.summary?.slice(0, 160)}
        canonicalUrl={`/brands/${brandSlug}`}
        image={brandLogo}
        productCount={filaments.length}
        materials={availableMaterials}
      />
      <BrandOrganizationSchema
        name={displayName}
        slug={brandSlug}
        url={brandInfo?.website}
        logo={brandLogo}
        description={brandInfo?.summary?.slice(0, 160)}
        productCount={filaments.length}
        priceRange={(() => {
          if (filaments.length === 0) return null;
          const prices = filaments.map(f => f.variant_price).filter((p): p is number => p !== null && p > 0);
          if (prices.length === 0) return null;
          return { low: Math.min(...prices), high: Math.max(...prices) };
        })()}
        location={brandInfo?.location ? (() => {
          const parts = brandInfo.location.split(',').map(s => s.trim());
          if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
          return { country: parts[0] };
        })() : null}
        founded={brandInfo?.founded || null}
        topProducts={groupedProducts
          .filter(g => g.variants[0]?.product_handle)
          .slice(0, 10)
          .map(g => ({
            name: g.baseName,
            slug: g.variants[0].product_handle!,
          }))}
      />

      <div className="max-w-7xl mx-auto">
        <DetailBreadcrumb
          segments={[
            { label: "Brands", href: "/brands" },
            { label: displayName, href: `/brands/${brandSlug}` },
          ]}
          mobileBackLabel="Brands"
        />

        <div ref={heroRef}>
          <BrandHeroSection
            brandName={displayName}
            brandLogo={brandLogo}
            isVerified={automatedBrand?.is_visible ?? false}
            location={brandInfo?.location}
            founded={brandInfo?.founded}
            website={brandInfo?.website}
            productLineCount={groupedProducts.length}
            variantCount={filaments.length}
            topMaterials={availableMaterials}
            avgPriceRange={(() => {
              if (filaments.length === 0) return undefined;
              const usdPrices = filaments
                .map(f => f.variant_price)
                .filter((p): p is number => p !== null && p > 0);
              if (usdPrices.length >= filaments.length * 0.1) {
                const min = Math.min(...usdPrices);
                const max = Math.max(...usdPrices);
                return `${formatPrice(min).split('.')[0]}–${formatPrice(max).split('.')[0]}`;
              }
              const regionalPriceKeys = ['price_cad', 'price_eur', 'price_gbp', 'price_aud', 'price_jpy'] as const;
              for (const col of regionalPriceKeys) {
                const regionalPrices = filaments
                  .map(f => (f as Record<string, unknown>)[col] as number | null)
                  .filter((p): p is number => p !== null && p > 0);
                if (regionalPrices.length >= filaments.length * 0.1) {
                  const min = Math.min(...regionalPrices);
                  const max = Math.max(...regionalPrices);
                  const currencyLabel = col === 'price_cad' ? 'CA$' : col === 'price_eur' ? '€' : col === 'price_gbp' ? '£' : col === 'price_aud' ? 'A$' : '¥';
                  return `${currencyLabel}${Math.round(min)}–${currencyLabel}${Math.round(max)}`;
                }
              }
              if (usdPrices.length > 0) {
                const min = Math.min(...usdPrices);
                const max = Math.max(...usdPrices);
                return `${formatPrice(min).split('.')[0]}–${formatPrice(max).split('.')[0]}`;
              }
              return undefined;
            })()}
            rating={null}
            onNavigateToProducts={() => {
              setActiveTab("products");
              window.history.replaceState(null, "", "#products");
            }}
            onNavigateToMaterials={() => {
              const el = document.getElementById("materials-offered");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            onNavigateToProductsSorted={() => {
              setActiveTab("products");
              window.history.replaceState(null, "", "#products");
            }}
          />
        </div>

        {/* Brand Answer Block for AEO */}
        {filaments.length > 0 && (
          <div className="mx-auto max-w-4xl mb-6">
            <time dateTime={new Date().toISOString().split('T')[0]} className="sr-only">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <p className={`text-sm text-muted-foreground leading-relaxed ${descExpanded ? '' : 'line-clamp-2 md:line-clamp-none'}`}>
              {displayName} is a 3D printer filament manufacturer
              {brandInfo?.founded ? ` founded in ${brandInfo.founded}` : ''}
              {brandInfo?.location ? ` and headquartered in ${brandInfo.location}` : ''}.
              {' '}FilaScope indexes <strong className="text-white font-semibold">{groupedProducts.length}</strong> {displayName} filament product{groupedProducts.length !== 1 ? 's' : ''}
              {' '}(<strong className="text-white font-semibold">{filaments.length.toLocaleString()}</strong> color variant{filaments.length !== 1 ? 's' : ''})
              {' '}across <strong className="text-white font-semibold">{availableMaterials.length}</strong> material type{availableMaterials.length !== 1 ? 's' : ''}
              {availableMaterials.length > 0
                ? ` including ${availableMaterials.slice(0, 6).join(', ')}${availableMaterials.length > 6 ? `, and more` : ''}`
                : ''}.
              {brandPriceRange
                ? <> Prices range from <strong className="text-white font-semibold">{formatPrice(brandPriceRange.min)}</strong> to <strong className="text-white font-semibold">{formatPrice(brandPriceRange.max)}</strong> with real-time pricing tracked from multiple retailers.</>
                : ' Real-time pricing is tracked from multiple retailers.'}
            </p>
            <button
              onClick={() => setDescExpanded(v => !v)}
              className="text-cyan-400 text-xs mt-1 md:hidden hover:underline"
            >
              {descExpanded ? 'Read less' : 'Read more'}
            </button>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
              {brandInfo?.location && <span>🏭 Made in {brandInfo.location}</span>}
              {availableMaterials.length > 0 && <span>📦 {availableMaterials.length} Material Types</span>}
              {brandPriceRange && <span>💰 From {formatPrice(brandPriceRange.min)}/spool</span>}
            </div>
          </div>
        )}

        {/* Brand Badges */}
        {brandBadges.length > 0 && (
          <div className="mb-6">
            <BrandBadgesDisplay 
              brandName={displayName} 
              hasHighSpeedProducts={hasHighSpeedProducts}
              size="md"
            />
          </div>
        )}

        {/* Admin Tools */}
        {isAdmin && brandSlug === 'fiberlogy' && (
          <AdminFiberlogySync brandId={automatedBrand?.id} />
        )}

        {/* Tab Navigation */}
        <BrandTabNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          productCount={groupedProducts.length}
        />

        {/* Tab Content */}
        <div className="mt-6">
          {hasNoProducts ? (
            <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
              <Package className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-foreground mb-2">No products indexed yet for {displayName}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                We're working on adding products. Check back soon!
              </p>
              <Button variant="outline" onClick={() => navigate('/filaments')}>
                Browse All Filaments
              </Button>
            </div>
          ) : (<>
            <div
              id="tabpanel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview"
              className={activeTab === "overview" ? "animate-fade-in" : "hidden"}
            >
              <BrandOverviewTab
                brandName={displayName}
                brandLogo={brandLogo}
                groupedProducts={groupedProducts}
                availableMaterials={availableMaterials}
                hasHighSpeedProducts={filaments.some(f => f.high_speed_capable)}
                hasEcoSpools={filaments.some(f => f.spool_material === 'cardboard' || f.spool_material === 'mixed')}
                hasRFID={filaments.some(f => f.transmission_distance && f.transmission_distance > 0)}
                hasHueForgeData={filaments.some(f => f.transmission_distance != null)}
                isVerified={automatedBrand?.is_visible ?? false}
                onViewAllProducts={() => setActiveTab("products")}
                onFilterByMaterial={(material) => {
                  setSelectedMaterial(material);
                  setActiveTab("products");
                }}
              />
            </div>

            <div
              id="tabpanel-products"
              role="tabpanel"
              aria-labelledby="tab-products"
              className={activeTab === "products" ? "animate-fade-in" : "hidden"}
            >
              <BrandProductsTab
                brandName={displayName}
                brandLogo={brandLogo}
                groupedProducts={groupedProducts}
                filaments={filaments}
                initialMaterialFilter={selectedMaterial}
                onMaterialFilterChange={setSelectedMaterial}
              />
            </div>

            <div
              id="tabpanel-about"
              role="tabpanel"
              aria-labelledby="tab-about"
              className={activeTab === "about" ? "animate-fade-in" : "hidden"}
            >
              <BrandAboutTab
                brandName={displayName}
                brandInfo={brandInfo}
                productCount={groupedProducts.length}
                materialsCount={availableMaterials.length}
                onNavigateToProducts={() => {
                  setActiveTab("products");
                  window.history.replaceState(null, "", "#products");
                }}
                onNavigateToMaterials={() => {
                  setActiveTab("overview");
                  window.history.replaceState(null, "", "#overview");
                  setTimeout(() => {
                    const el = document.getElementById("materials-offered");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              />
              {filaments.length > 0 && <BrandFAQSection
                brandName={displayName}
                productCount={filaments.length}
                materials={availableMaterials}
                priceRange={brandPriceRange}
                topRetailers={topRetailers}
                regionsCovered={regionsCovered}
                isVerified={automatedBrand?.is_visible ?? false}
                isPremium={isPremium}
                isBudgetFriendly={isBudgetFriendly}
                tdCount={tdCount}
                topMaterialCategory={topMaterialCategory}
                topMaterialCategoryCount={topMaterialCategoryCount}
                colorCount={colorCount}
              />}
            </div>
          </>)}
        </div>

        <RelatedBrandsSection brandName={displayName} />
      </div>
    </div>
  );
};

export default BrandDetail;
