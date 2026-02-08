import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tag, Clock, Percent, Sparkles, ArrowRight, Filter, AlertTriangle, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealFilters } from "@/components/deals/DealFilters";
import { MobileDealsFilterSheet } from "@/components/deals/MobileDealsFilterSheet";
import { DealNotificationSignup } from "@/components/deals/DealNotificationSignup";
import { GroupedDealCard } from "@/components/deals/GroupedDealCard";
import { BrandDistribution } from "@/components/deals/BrandDistribution";
import { BrandQuickFilters } from "@/components/deals/BrandQuickFilters";
import { useDealsWithFilters } from "@/hooks/useDealsWithFilters";
import { getRegionFlag } from "@/lib/dealStoreRegion";
import { ItemListSchema } from "@/components/seo";

const Deals = () => {
  const {
    deals,
    groupedDeals,
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

  // Compute max discount for dynamic meta description
  const maxDiscount = useMemo(() => {
    let max = 0;
    for (const group of groupedDeals) {
      const discount = group.bestDiscount ?? 0;
      if (discount > max && discount <= 60) max = discount;
    }
    return Math.round(max);
  }, [groupedDeals]);

  // Dynamic meta description
  const metaDescription = totalDeals > 0
    ? `Today's best 3D printer filament deals — ${totalDeals} active discounts up to ${maxDiscount}% off. Compare sale prices from top brands on FilaScope.`
    : "Today's best 3D printer filament deals. Compare sale prices and discounts from top brands on FilaScope.";

  // Build deal items for ItemListSchema
  const dealListItems = useMemo(() => {
    return groupedDeals.slice(0, 20).map((group, index) => ({
      name: group.groupKey,
      url: `https://filascope.com/filament/${group.variants[0]?.id || ''}`,
      description: `${Math.round(group.bestDiscount ?? 0)}% off`,
      position: index + 1,
    }));
  }, [groupedDeals]);

  return (
    <>
      <Helmet>
        <title>Today's Filament Deals — Best Prices on 3D Printing Materials | FilaScope</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:description" content={metaDescription} />
      </Helmet>
      {dealListItems.length > 0 && (
        <ItemListSchema
          name="Today's 3D Printer Filament Deals"
          description={metaDescription}
          items={dealListItems}
          itemListOrder="Descending"
        />
      )}
      <div className="min-h-screen flex flex-col">
      <section className="flex-1" role="region" aria-label="Deals listings">
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
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-green-400" />
                <span>
                  <span className="text-foreground font-medium">{groupedDeals.length}</span> {groupedDeals.length === 1 ? "deal" : "deals"}
                  {deals.length !== groupedDeals.length && (
                    <span className="text-muted-foreground"> ({deals.length} {deals.length === 1 ? "variant" : "variants"})</span>
                  )}
                </span>
              </div>
              <span className="hidden md:inline text-muted-foreground/50">•</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Prices may vary</span>
              </div>
              <span className="hidden md:inline text-muted-foreground/50">•</span>
              <DealNotificationSignup
                availableMaterials={availableMaterials}
                availableBrands={availableBrands}
              />
            </div>

            {/* Brand Distribution */}
            <BrandDistribution groupedDeals={groupedDeals} className="mb-6" />
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
                resultCount={groupedDeals.length}
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

            {/* Brand Quick Filter Chips */}
            <BrandQuickFilters
              groupedDeals={groupedDeals}
              selectedBrands={selectedBrands}
              onBrandChange={setSelectedBrands}
              className="mt-3"
            />
          </div>
        </section>

        {/* Results Count */}
        {hasActiveFilters && (
          <section className="px-6 md:px-10 pb-4">
            <div className="max-w-[1600px] mx-auto">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-medium">{groupedDeals.length}</span> {groupedDeals.length === 1 ? "deal" : "deals"}
                {deals.length !== groupedDeals.length && (
                  <span> ({deals.length} {deals.length === 1 ? "variant" : "variants"})</span>
                )}{" "}
                of <span className="text-foreground font-medium">{totalDeals}</span> total
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
                  <Card key={i} className="h-80 animate-pulse bg-muted/30" />
                ))}
              </div>
            ) : groupedDeals.length === 0 ? (
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
                {groupedDeals.map((group) => (
                  <GroupedDealCard key={group.groupKey} group={group} />
                ))}
              </div>
            )}

            {/* CTA */}
            {groupedDeals.length > 0 && (
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
      </section>
    </div>
    </>
  );
};

export default Deals;
