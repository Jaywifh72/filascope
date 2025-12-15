import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HardwareFilters, type FilterState } from "./HardwareFilters";
import { HardwareRecommendationCard } from "./HardwareRecommendationCard";

interface HardwareItem {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  product_url: string | null;
  price?: number | null;
  currency?: string | null;
  specs?: Record<string, unknown> | null;
  compatibility: {
    rating: 'green' | 'orange' | 'red';
    reason: string;
    details?: string[];
  };
}

interface HardwareSearchListProps {
  title: string;
  icon: React.ReactNode;
  items: HardwareItem[];
  printerStatus: string;
  recommendedItems?: string[];
  detailPath: string;
  emptyMessage?: string;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
  accessoryType?: 'hotend' | 'build_plate' | 'ams_mmu';
}

export function HardwareSearchList({
  title,
  icon,
  items,
  printerStatus,
  recommendedItems = [],
  detailPath,
  emptyMessage = "No compatible items found",
  getAffiliateUrl,
  accessoryType = 'hotend',
}: HardwareSearchListProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    search: "",
    materials: [],
    priceRange: null,
    features: [],
    sort: "recommended",
  });
  
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    // Search filter
    if (filterState.search) {
      const query = filterState.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.brand?.toLowerCase().includes(query)) ||
        (item.specs && JSON.stringify(item.specs).toLowerCase().includes(query))
      );
    }
    
    // Material filter
    if (filterState.materials.length > 0) {
      result = result.filter(item => {
        const material = ((item.specs as Record<string, unknown>)?.material as string || "").toLowerCase();
        return filterState.materials.some(m => material.includes(m.toLowerCase()));
      });
    }
    
    // Price filter
    if (filterState.priceRange) {
      result = result.filter(item => {
        const price = item.price || 0;
        return price >= filterState.priceRange!.min && price <= filterState.priceRange!.max;
      });
    }
    
    // Feature filters
    if (filterState.features.length > 0) {
      result = result.filter(item => {
        const specs = item.specs as Record<string, unknown> || {};
        return filterState.features.every(feature => {
          if (feature === 'high_flow') return specs.high_flow === true;
          if (feature === 'abrasion_resistant') return specs.abrasion_resistant === true;
          if (feature === 'quick_swap') return specs.quick_swap === true;
          if (feature === 'textured') return (specs.surface_type as string || "").toLowerCase().includes('textured');
          if (feature === 'magnetic') return specs.magnetic === true;
          if (feature === 'drying') return specs.drying_capability === true;
          return true;
        });
      });
    }
    
    // Sort
    if (filterState.sort === 'recommended') {
      result.sort((a, b) => {
        const ratingOrder = { green: 0, orange: 1, red: 2 };
        const ratingDiff = ratingOrder[a.compatibility.rating] - ratingOrder[b.compatibility.rating];
        if (ratingDiff !== 0) return ratingDiff;
        const aRec = recommendedItems.includes(a.id) ? 0 : 1;
        const bRec = recommendedItems.includes(b.id) ? 0 : 1;
        return aRec - bRec;
      });
    } else if (filterState.sort === 'price_asc') {
      result.sort((a, b) => (a.price || 999) - (b.price || 999));
    } else if (filterState.sort === 'price_desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (filterState.sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return result;
  }, [items, filterState, recommendedItems]);
  
  const displayedItems = showAll ? filteredItems : filteredItems.slice(0, 5);
  const hasMore = filteredItems.length > 5;

  if (items.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-background/50 border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium text-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      
      {/* Filters */}
      {items.length > 3 && (
        <HardwareFilters
          accessoryType={accessoryType}
          filterState={filterState}
          onFilterChange={setFilterState}
          totalCount={items.length}
          filteredCount={filteredItems.length}
        />
      )}
      
      {/* Items List */}
      <div className="space-y-2">
        {displayedItems.map((item) => (
          <HardwareRecommendationCard
            key={item.id}
            item={item}
            isRecommended={recommendedItems.includes(item.id)}
            isExpanded={expandedId === item.id}
            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
            detailPath={detailPath}
            getAffiliateUrl={getAffiliateUrl}
            icon={icon}
          />
        ))}
      </div>
      
      {/* Show More/Less */}
      {hasMore && !filterState.search && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-muted-foreground"
        >
          {showAll ? (
            <>Hide <ChevronDown className="w-4 h-4 ml-1 rotate-180" /></>
          ) : (
            <>Show all {filteredItems.length} <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}
