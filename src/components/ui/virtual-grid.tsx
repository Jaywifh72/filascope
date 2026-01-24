import { useRef, useState, useCallback, useEffect, memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  columnCount: number;
  rowHeight: number;
  gap?: number;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * Virtualized grid component for efficient rendering of large lists
 */
export const VirtualGrid = memo(function VirtualGrid<T>({
  items,
  renderItem,
  getKey,
  columnCount,
  rowHeight,
  gap = 24,
  className,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Handle scroll with debounce for performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    // Check if we're near the end for infinite scroll
    if (onEndReached) {
      const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remaining < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Calculate visible rows
  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalRows = Math.ceil(items.length / columnCount);
    const totalHeight = totalRows * (rowHeight + gap) - gap;

    if (containerHeight === 0) {
      return { visibleItems: items.slice(0, columnCount * 3), totalHeight, offsetY: 0 };
    }

    const startRow = Math.max(0, Math.floor(scrollTop / (rowHeight + gap)) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / (rowHeight + gap)) + overscan
    );

    const startIndex = startRow * columnCount;
    const endIndex = Math.min(items.length, endRow * columnCount);

    return {
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight,
      offsetY: startRow * (rowHeight + gap),
      startIndex,
    };
  }, [items, columnCount, rowHeight, gap, containerHeight, scrollTop, overscan]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("overflow-auto", className)}
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
              gap: `${gap}px`,
            }}
          >
            {visibleItems.map((item, idx) => (
              <div key={getKey(item)} style={{ minHeight: rowHeight }}>
                {renderItem(item, idx)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualGridProps<T>) => React.ReactElement;

/**
 * Simple windowed list for non-grid layouts
 */
interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
  itemHeight: number;
  className?: string;
  overscan?: number;
}

export const VirtualList = memo(function VirtualList<T>({
  items,
  renderItem,
  getKey,
  itemHeight,
  className,
  overscan = 5,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => setContainerHeight(container.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;

    if (containerHeight === 0) {
      return { visibleItems: items.slice(0, 10), totalHeight, offsetY: 0 };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("overflow-auto", className)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, idx) => (
            <div key={getKey(item)} style={{ height: itemHeight }}>
              {renderItem(item, idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => React.ReactElement;
