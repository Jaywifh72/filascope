import { useMemo, useState } from "react";
import { useRegion } from "@/contexts/RegionContext";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tag, Clock, Percent, ArrowRight, Filter, AlertTriangle, X, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DealSortOption } from "@/hooks/useDealsWithFilters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DealFilters } from "@/components/deals/DealFilters";
import { MobileDealsFilterSheet } from "@/components/deals/MobileDealsFilterSheet";
import { DealNotificationSignup } from "@/components/deals/DealNotificationSignup";
import { GroupedDealCard } from "@/components/deals/GroupedDealCard";
import { BrandQuickFilters } from "@/components/deals/BrandQuickFilters";
import { DealCardSkeletonGrid } from "@/components/deals/DealCardSkeleton";
import { DealsEmptyState } from "@/components/deals/DealsEmptyState";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { useDealsWithFilters } from "@/hooks/useDealsWithFilters";
import { getRegionFlag } from "@/lib/dealStoreRegion";
import { ItemListSchema } from "@/components/seo";
import { formatDistanceToNow } from "date-fns";

type DealTypeFilter = "all" | "50plus" | "new-this-week" | "ongoing";

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
    lastUpdated,
    sortBy,
    setSortBy,
  } = useDealsWithFilters();

  const userRegionFlag = getRegionFlag(userRegion);
  const { currencyConfig } = useRegion();

  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => sessionStorage.getItem("filascope_deals_disclaimer_dismissed") === "true"
  );
  const [disclaimerHiding, setDisclaimerHiding] = useState(false);
  const [dealTypeFilter, setDealTypeFilter] = useState<DealTypeFilter>("all");

  const handleDismissDisclaimer = () => {
    setDisclaimerHiding(true);
    setTimeout(() => {
      setDisclaimerDismissed(true);
      sessionStorage.setItem("filascope_deals_disclaimer_dismissed", "true");
    }, 300);
  };

  // Handle deal type chip selection
  const handleDealTypeChange = (type: DealTypeFilter) => {
    const prevType = dealTypeFilter;
    setDealTypeFilter(type);
    if (type === "50plus") {
      setMinDiscount(50);
    } else if (prevType === "50plus") {
      setMinDiscount(0);
    }
  };

  // Filter grouped deals by deal type locally
  const filteredGroupedDeals = useMemo(() => {
    if (dealTypeFilter === "all" || dealTypeFilter === "50plus") return groupedDeals;
    if (dealTypeFilter === "new-this-week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return groupedDeals.filter((g) => {
        const scraped = g.representativeDeal.last_scraped_at;
        return scraped && new Date(scraped) >= weekAgo;
      });
    }
    if (dealTypeFilter === "ongoing") {
      return groupedDeals.filter((g) => (g.bestDiscount ?? 0) < 50);
    }
    return groupedDeals;
  }, [groupedDeals, dealTypeFilter]);

  // Active filter count for display
  const activeFilterCount =
    selectedMaterials.length +
    selectedBrands.length +
    (minDiscount > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (showLocalOnly ? 1 : 0) +
    (dealTypeFilter !== "all" ? 1 : 0);

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

  // Unique brand count for meta
  const uniqueBrandCount = availableBrands.length;

  // Region display name
  const regionDisplayNames: Record<string, string> = {
    US: 'the US', CA: 'Canada', UK: 'the UK', EU: 'Europe', AU: 'Australia', JP: 'Japan', CN: 'China',
  };
  const regionDisplay = regionDisplayNames[userRegion] || userRegion;

  // Dynamic meta description
  const metaDescription = totalDeals > 0
    ? `${totalDeals} active filament deals with discounts up to ${maxDiscount}% off. Compare prices from ${uniqueBrandCount} brands in ${regionDisplay}.`
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
        <meta property="og:title" content="Today's Filament Deals — Best Prices on 3D Printing Materials | FilaScope" />
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
        {/* Hero Section — compressed */}
        <section className="relative py-4 md:py-5 px-6 md:px-10">
          <div className="max-w-[1600px] mx-auto">
            {/* Badge */}
            <div className="flex items-center justify-center mb-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5">
                <Tag className="h-3.5 w-3.5 text-green-400" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-green-400">
                  Today's Deals
                </span>
              </div>
            </div>

            {/* Headline + Stats inline */}
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-1">
              Best Prices <span className="text-green-400">We Found</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span>
                <span className="text-foreground font-medium">{groupedDeals.length}</span> {groupedDeals.length === 1 ? "deal" : "deals"}
                {deals.length !== groupedDeals.length && (
                  <span className="text-muted-foreground"> ({deals.length} variants)</span>
                )}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span>Prices may vary</span>
            </div>

            {/* Deal Alerts CTA — compact */}
            <div className="flex justify-center mt-2 mb-1">
              <DealNotificationSignup
                availableMaterials={availableMaterials}
                availableBrands={availableBrands}
              />
            </div>
          </div>
        </section>

        {/* Filters Section — sticky below navbar */}
        <section id="deals-filters" className="sticky top-16 z-40 bg-background border-b border-border/50 shadow-sm px-4 sm:px-6 md:px-10 pb-4 pt-4">
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
                <span>Filter deals:{activeFilterCount > 0 && <span className="text-primary font-medium ml-1">({activeFilterCount} active)</span>}</span>
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

            {/* Deal Type Quick Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none mt-2">
              {([
                { id: "all", label: "All Deals" },
                { id: "50plus", label: "50%+ Off" },
                { id: "new-this-week", label: "New This Week" },
                { id: "ongoing", label: "Ongoing Sales" },
              ] as const).map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => handleDealTypeChange(chip.id)}
                  className={cn(
                    "inline-flex items-center px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all",
                    dealTypeFilter === chip.id
                      ? "bg-primary/10 border-primary text-primary font-medium"
                      : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Results Count + Sort Control Bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters || dealTypeFilter !== "all" ? (
                  <>Showing <span className="text-foreground font-medium">{filteredGroupedDeals.length}</span> of <span className="text-foreground font-medium">{totalDeals}</span> deals</>
                ) : (
                  <>Showing all <span className="text-foreground font-medium">{totalDeals}</span> deals</>
                )}
                {(hasActiveFilters || dealTypeFilter !== "all") && (
                  <button
                    onClick={() => { clearAllFilters(); setDealTypeFilter("all"); }}
                    className="ml-3 text-xs text-primary hover:underline transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
                {disclaimerDismissed && (
                  <span className="ml-3 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Info className="h-2.5 w-2.5" />
                    Prices are approximate
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort By</span>
                <Select value={sortBy} onValueChange={(val) => setSortBy(val as DealSortOption)}>
                  <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border bg-muted/50 border-border text-foreground hover:bg-muted transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="discount-desc">Biggest Discount</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="brand-az">Brand A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Price Disclaimer — dismissible */}
        {!disclaimerDismissed && (
          <section className={cn(
            "px-6 md:px-10 pb-6 transition-all duration-300",
            disclaimerHiding ? "opacity-0 max-h-0 pb-0 overflow-hidden" : "opacity-100 max-h-40"
          )}>
            <div className="max-w-[1600px] mx-auto">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg relative">
                <div className="flex items-start gap-3 pr-8">
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
                <button
                  onClick={handleDismissDisclaimer}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-400 transition-colors"
                  aria-label="Dismiss disclaimer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Deals Grid */}
        <section className="px-6 md:px-10 pb-16">
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <DealCardSkeletonGrid />
            ) : filteredGroupedDeals.length === 0 ? (
              <DealsEmptyState
                selectedMaterials={selectedMaterials}
                selectedBrands={selectedBrands}
                minDiscount={minDiscount}
                showLocalOnly={showLocalOnly}
                allGroupedDeals={groupedDeals}
                clearAllFilters={() => { clearAllFilters(); setDealTypeFilter("all"); }}
                onMaterialChange={setSelectedMaterials}
                hasActiveFilters={hasActiveFilters || dealTypeFilter !== "all"}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGroupedDeals.map((group, index) => (
                  <div
                    key={group.groupKey}
                    className="deal-card-enter"
                    style={index < 12 ? { animationDelay: `${index * 30}ms` } : undefined}
                  >
                    <GroupedDealCard group={group} />
                  </div>
                ))}
              </div>
            )}

            {/* End-of-results section */}
            {!isLoading && filteredGroupedDeals.length > 0 && (
              <>
                <div className="border-t border-border w-full my-8" />
                <div className="max-w-2xl mx-auto bg-card/50 border border-border/30 rounded-xl p-8 text-center">
                  <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground">That's all the deals for today!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    New deals are added regularly. Set up alerts to never miss a great price.
                  </p>
                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <DealNotificationSignup
                      availableMaterials={availableMaterials}
                      availableBrands={availableBrands}
                    />
                    <Button variant="outline" asChild>
                      <Link to="/finder" className="gap-2">
                        Browse All Filaments
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-4">
                    New deals are checked multiple times weekly
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </section>
      <ScrollToTopButton targetId="deals-filters" />
    </div>
    </>
  );
};

export default Deals;
