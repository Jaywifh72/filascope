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
  PriceSkeleton,
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

// Re-export existing skeletons for convenience
export { FilamentCardSkeleton, FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
export { PrinterCardSkeleton, PrinterCardSkeletonGrid } from "@/components/printers/PrinterCardSkeleton";
