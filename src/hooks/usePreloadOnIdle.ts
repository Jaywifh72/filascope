import { useEffect, useRef } from "react";
import { preloadRoutes, preloadLikelyRoutes } from "@/lib/preloadRoutes";

/**
 * Preload routes during browser idle time
 * Uses requestIdleCallback for non-blocking preloading
 */
export function usePreloadOnIdle(
  currentPath: string,
  options: {
    delay?: number;
    enabled?: boolean;
  } = {}
) {
  const { delay = 1000, enabled = true } = options;
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasPreloadedRef.current) return;

    const schedulePreload = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            preloadLikelyRoutes(currentPath);
            hasPreloadedRef.current = true;
          },
          { timeout: 5000 }
        );
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          preloadLikelyRoutes(currentPath);
          hasPreloadedRef.current = true;
        }, delay);
      }
    };

    // Wait for initial page load to complete
    const timeoutId = setTimeout(schedulePreload, delay);

    return () => clearTimeout(timeoutId);
  }, [currentPath, delay, enabled]);
}

/**
 * Preload specific routes during idle time
 */
export function usePreloadRoutesOnIdle(
  routes: string[],
  options: {
    delay?: number;
    enabled?: boolean;
  } = {}
) {
  const { delay = 2000, enabled = true } = options;
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasPreloadedRef.current || routes.length === 0) return;

    const schedulePreload = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          () => {
            preloadRoutes(routes);
            hasPreloadedRef.current = true;
          },
          { timeout: 5000 }
        );
      } else {
        setTimeout(() => {
          preloadRoutes(routes);
          hasPreloadedRef.current = true;
        }, delay);
      }
    };

    const timeoutId = setTimeout(schedulePreload, delay);

    return () => clearTimeout(timeoutId);
  }, [routes, delay, enabled]);
}

/**
 * Hook to warm the image cache for recently viewed products
 */
export function useImageCacheWarmer(imageUrls: string[]) {
  useEffect(() => {
    if (imageUrls.length === 0) return;

    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };

    // Preload images during idle time
    const preloadAll = () => {
      imageUrls.slice(0, 10).forEach(preloadImage);
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(preloadAll, { timeout: 5000 });
    } else {
      setTimeout(preloadAll, 1000);
    }
  }, [imageUrls]);
}
