// Centralized skeleton component exports
// All skeletons use consistent shimmer animation and match component dimensions exactly

export { 
  FilterPanelSkeleton, 
  FilterSectionSkeleton,
  HorizontalFilterBarSkeleton,
  MobileFilterChipsSkeleton 
} from "./FilterPanelSkeleton";

export { 
  ProductDetailSkeleton, 
  ProductImageSkeleton, 
  ProductInfoSkeleton, 
  PriceSkeleton as ProductPriceSkeleton,
  ProductTabsSkeleton 
} from "./ProductDetailSkeleton";

export { 
  CompareTrayItemSkeleton, 
  CompareTrayLoadingSkeleton,
  ComparisonDataSkeleton 
} from "./CompareTrayItemSkeleton";

export { 
  SearchSuggestionsSkeleton, 
  SearchSuggestionItemSkeleton,
  RecentSearchesSkeleton,
  SearchDropdownSkeleton 
} from "./SearchSuggestionsSkeleton";

// Page loading skeletons
export { PageLoadingSkeleton } from "./PageLoadingSkeleton";
export { PriceSkeleton, SalePriceSkeleton, ButtonPriceSkeleton } from "./PriceSkeleton";
export { BentoGridSkeleton } from "./BentoGridSkeleton";
export { VaultSkeleton } from "./VaultSkeleton";

// Re-export existing skeletons for convenience
export { FilamentCardSkeleton, FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
export { PrinterCardSkeleton, PrinterCardSkeletonGrid } from "@/components/printers/PrinterCardSkeleton";
