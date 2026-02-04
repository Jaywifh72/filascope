import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Tag, Clock, Percent, Sparkles, ArrowRight, Filter, AlertTriangle, Globe } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealFilters } from "@/components/deals/DealFilters";
import { MobileDealsFilterSheet } from "@/components/deals/MobileDealsFilterSheet";
import { DealNotificationSignup } from "@/components/deals/DealNotificationSignup";
import { DealCard } from "@/components/deals/DealCard";
import { useDealsWithFilters } from "@/hooks/useDealsWithFilters";
import { getRegionFlag } from "@/lib/dealStoreRegion";

const Deals = () => {
  const {
    deals,
    totalDeals,
    isLoading,
    selectedMaterials,
    setSelectedMaterials,
    selectedBrands,
    setSelectedBrands,
    minDiscount,
    setMinDiscount,
    priceRange,
    setPriceRange,
    showLocalOnly,
    setShowLocalOnly,
    availableMaterials,
    availableBrands,
    maxPrice,
    localDealCount,
    userRegion,
    clearAllFilters,
  } = useDealsWithFilters();

  const userRegionFlag = getRegionFlag(userRegion);

  const hasActiveFilters =
    selectedMaterials.length > 0 ||
    selectedBrands.length > 0 ||
    minDiscount > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    showLocalOnly;

  // Filter and categorize deals by freshness
  const { freshDeals, staleCount } = useMemo(() => {
    const MAX_DEAL_AGE_DAYS = 7;
    
    const fresh = deals.filter((deal) => {
      const capturedAt = deal.last_scraped_at || deal.created_at;
      if (!capturedAt) return true; // Include if no date (can't determine age)
      const daysSinceCapture = differenceInDays(new Date(), new Date(capturedAt));
      return daysSinceCapture < MAX_DEAL_AGE_DAYS;
    });
    
    return {
      freshDeals: fresh,
      staleCount: deals.length - fresh.length,
    };
  }, [deals]);

  // Helper to determine if a deal needs a warning
  const getDealWarningLevel = (deal: typeof deals[0]): 'none' | 'caution' | 'stale' => {
    const capturedAt = deal.last_scraped_at || deal.created_at;
    if (!capturedAt) return 'caution';
    const daysSinceCapture = differenceInDays(new Date(), new Date(capturedAt));
    if (daysSinceCapture >= 5) return 'stale';
    if (daysSinceCapture >= 3) return 'caution';
    return 'none';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto">
            {/* Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5">
                <Tag className="h-4 w-4 text-green-400" />
                <span className="font-mono text-xs uppercase tracking-wider text-green-400">
                  Today's Deals
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Best Prices <span className="text-green-400">We Found</span>
            </h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-6">
              Discounted filaments from top brands. Prices captured periodically from retailers.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-green-400" />
                <span>
                  <span className="text-foreground font-medium">{freshDeals.length}</span> active deals
                  {staleCount > 0 && (
                    <span className="text-muted-foreground"> ({staleCount} older deals hidden)</span>
                  )}
                </span>
              </div>
              <span className="hidden md:inline text-gray-600">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Prices may vary</span>
              </div>
              <span className="hidden md:inline text-gray-600">•</span>
              <DealNotificationSignup
                availableMaterials={availableMaterials}
                availableBrands={availableBrands}
              />
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="px-4 sm:px-6 md:px-10 pb-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Mobile Filter Sheet */}
            <div className="md:hidden mb-4">
              <MobileDealsFilterSheet
                materials={availableMaterials}
                brands={availableBrands}
                selectedMaterials={selectedMaterials}
                selectedBrands={selectedBrands}
                minDiscount={minDiscount}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onMaterialChange={setSelectedMaterials}
                onBrandChange={setSelectedBrands}
                onDiscountChange={setMinDiscount}
                onPriceRangeChange={setPriceRange}
                onClearAll={clearAllFilters}
                resultCount={deals.length}
                showLocalOnly={showLocalOnly}
                onShowLocalOnlyChange={setShowLocalOnly}
                localDealCount={localDealCount}
                userRegionFlag={userRegionFlag}
              />
            </div>
            
            {/* Desktop Filters */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filter deals:</span>
              </div>
              <DealFilters
                materials={availableMaterials}
                brands={availableBrands}
                selectedMaterials={selectedMaterials}
                selectedBrands={selectedBrands}
                minDiscount={minDiscount}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onMaterialChange={setSelectedMaterials}
                onBrandChange={setSelectedBrands}
                onDiscountChange={setMinDiscount}
                onPriceRangeChange={setPriceRange}
                onClearAll={clearAllFilters}
                showLocalOnly={showLocalOnly}
                onShowLocalOnlyChange={setShowLocalOnly}
                localDealCount={localDealCount}
                userRegionFlag={userRegionFlag}
              />
            </div>
          </div>
        </section>

        {/* Results Count */}
        {hasActiveFilters && (
          <section className="px-6 md:px-10 pb-4">
            <div className="max-w-[1600px] mx-auto">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-medium">{deals.length}</span> of{" "}
                <span className="text-foreground font-medium">{totalDeals}</span> deals
              </p>
            </div>
          </section>
        )}

        {/* Price Disclaimer */}
        <section className="px-6 md:px-10 pb-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-400">
                    Price Disclaimer
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deal prices are captured periodically and may not reflect current store prices. 
                    Sales and promotions change frequently. Always verify the price at the retailer 
                    before purchasing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="px-6 md:px-10 pb-16">
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="h-80 animate-pulse bg-gray-800/50" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-16">
                {showLocalOnly ? (
                  <>
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Local Deals Found</h2>
                    <p className="text-muted-foreground mb-6">
                      We don't have any deals shipping from your region right now.
                      Try browsing international deals.
                    </p>
                    <Button variant="outline" onClick={() => setShowLocalOnly(false)}>
                      Show International Deals
                    </Button>
                  </>
                ) : hasActiveFilters ? (
                  <>
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Matching Deals</h2>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters to see more results.
                    </p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No Active Deals</h2>
                    <p className="text-muted-foreground mb-6">
                      Check back soon! New deals are added daily.
                    </p>
                    <Button asChild>
                      <Link to="/finder">Browse All Filaments</Link>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    discount={deal.discount}
                    savings={deal.savings}
                    expiresIn={deal.expiresIn}
                    stockStatus={deal.stockStatus}
                    viewsToday={deal.viewsToday}
                    storeName={deal.storeName}
                    storeRegion={deal.storeRegion}
                    regionFlag={deal.regionFlag}
                    isLocal={deal.isLocal}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            {deals.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/finder" className="gap-2">
                    Browse All Filaments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Deals;
