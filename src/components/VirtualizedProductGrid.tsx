import { memo, useMemo, useState, useEffect, useCallback } from "react";
import { VirtualGrid } from "@/components/ui/virtual-grid";
import { cn } from "@/lib/utils";

interface VirtualizedProductGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  minItemHeight?: number;
  gap?: number;
  className?: string;
  onEndReached?: () => void;
  /** Threshold for virtualization (default: 50 items) */
  virtualizationThreshold?: number;
  /** Force virtualization regardless of item count */
  forceVirtualize?: boolean;
}

/**
 * Calculate responsive column count based on viewport width
 */
function useResponsiveColumns() {
  const [columns, setColumns] = useState(() => {
    if (typeof window === "undefined") return 4;
    const width = window.innerWidth;
    if (width < 640) return 1;       // sm
    if (width < 1024) return 2;      // md/lg
    if (width < 1280) return 3;      // lg
    return 4;                         // xl+
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return columns;
}

/**
 * Virtualized grid component that automatically switches between
 * standard CSS grid (for small lists) and virtualized rendering (for large lists)
 */
export const VirtualizedProductGrid = memo(function VirtualizedProductGrid<T>({
  items,
  renderItem,
  getKey,
  minItemHeight = 420,
  gap = 24,
  className,
  onEndReached,
  virtualizationThreshold = 50,
  forceVirtualize = false,
}: VirtualizedProductGridProps<T>) {
  const columns = useResponsiveColumns();
  const shouldVirtualize = forceVirtualize || items.length > virtualizationThreshold;

  // Calculate dynamic row height based on item height and gap
  const rowHeight = minItemHeight + gap;

  // Memoize render function to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback(
    (item: T, index: number) => renderItem(item, index),
    [renderItem]
  );

  // Standard grid for small lists - no virtualization overhead
  if (!shouldVirtualize) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
          className
        )}
      >
        {items.map((item, idx) => (
          <div key={getKey(item)}>{memoizedRenderItem(item, idx)}</div>
        ))}
      </div>
    );
  }

  // Virtualized grid for large lists
  return (
    <VirtualGrid
      items={items}
      renderItem={memoizedRenderItem}
      getKey={getKey}
      columnCount={columns}
      rowHeight={rowHeight}
      gap={gap}
      onEndReached={onEndReached}
      className={cn("min-h-[600px]", className)}
      overscan={3}
      endReachedThreshold={400}
    />
  );
}) as <T>(props: VirtualizedProductGridProps<T>) => React.ReactElement;

/**
 * Hook to determine if virtualization should be used
 * Can be used externally to show/hide related UI elements
 */
export function useShouldVirtualize(itemCount: number, threshold = 50): boolean {
  return itemCount > threshold;
}
