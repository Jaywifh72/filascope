import { useState, useEffect, useCallback } from 'react';

interface ResponsiveColumnsOptions {
  /** Base height of each card in pixels */
  cardBaseHeight?: number;
  /** Gap between items in pixels */
  gap?: number;
  /** Breakpoints for column counts */
  breakpoints?: {
    sm?: number;  // < 640px
    md?: number;  // 640-1024px
    lg?: number;  // 1024-1280px
    xl?: number;  // >= 1280px
  };
}

interface ResponsiveColumnsResult {
  columns: number;
  rowHeight: number;
  containerWidth: number;
}

const DEFAULT_BREAKPOINTS = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

/**
 * Hook to calculate responsive column count and row height for virtual grids.
 * Automatically updates on window resize with debouncing.
 */
export function useResponsiveColumns({
  cardBaseHeight = 420,
  gap = 24,
  breakpoints = DEFAULT_BREAKPOINTS,
}: ResponsiveColumnsOptions = {}): ResponsiveColumnsResult {
  const getColumnsForWidth = useCallback((width: number): number => {
    if (width >= 1280) return breakpoints.xl ?? 4;
    if (width >= 1024) return breakpoints.lg ?? 3;
    if (width >= 640) return breakpoints.md ?? 2;
    return breakpoints.sm ?? 1;
  }, [breakpoints]);

  const [state, setState] = useState<ResponsiveColumnsResult>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const columns = getColumnsForWidth(width);
    return {
      columns,
      rowHeight: cardBaseHeight + gap,
      containerWidth: width,
    };
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const columns = getColumnsForWidth(width);
        
        setState({
          columns,
          rowHeight: cardBaseHeight + gap,
          containerWidth: width,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial calculation
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [cardBaseHeight, gap, getColumnsForWidth]);

  return state;
}

/**
 * Check if virtualization should be used based on item count.
 * Virtualization adds overhead, so only use for large lists.
 */
export function shouldUseVirtualization(itemCount: number, threshold = 50): boolean {
  return itemCount > threshold;
}
