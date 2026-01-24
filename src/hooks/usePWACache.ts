import { useState, useEffect, useCallback } from "react";

export interface CachedProduct {
  id: string;
  title: string;
  vendor: string;
  material: string;
  imageUrl?: string;
  price?: number;
  viewedAt: number;
}

const CACHE_KEY = "pwa-recently-viewed";
const MAX_CACHED_PRODUCTS = 50;

/**
 * Recently Viewed Products Cache
 * 
 * Caches product data for offline viewing.
 * Stored in localStorage with automatic cleanup of old entries.
 */
export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<CachedProduct[]>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(recentlyViewed));
    } catch {
      // Storage might be full, try to clear oldest entries
      try {
        const trimmed = recentlyViewed.slice(0, MAX_CACHED_PRODUCTS / 2);
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
        setRecentlyViewed(trimmed);
      } catch {
        // Give up on caching
      }
    }
  }, [recentlyViewed]);

  // Add a product to the cache
  const addToCache = useCallback((product: Omit<CachedProduct, "viewedAt">) => {
    setRecentlyViewed((prev) => {
      // Remove existing entry if present
      const filtered = prev.filter((p) => p.id !== product.id);
      
      // Add to front with timestamp
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_CACHED_PRODUCTS);
      
      // Preload product image for offline access
      if (product.imageUrl) {
        preloadImage(product.imageUrl);
      }
      
      return updated;
    });
  }, []);

  // Preload an image for caching
  const preloadImage = useCallback((url: string) => {
    if (!url) return;
    
    // Use requestIdleCallback for non-blocking preload
    const load = () => {
      const img = new Image();
      img.src = url;
    };
    
    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 100);
    }
  }, []);

  // Remove a product from cache
  const removeFromCache = useCallback((id: string) => {
    setRecentlyViewed((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Clear all cached products
  const clearCache = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Get a cached product by ID
  const getCachedProduct = useCallback(
    (id: string): CachedProduct | undefined => {
      return recentlyViewed.find((p) => p.id === id);
    },
    [recentlyViewed]
  );

  // Check if a product is cached
  const isCached = useCallback(
    (id: string): boolean => {
      return recentlyViewed.some((p) => p.id === id);
    },
    [recentlyViewed]
  );

  return {
    recentlyViewed,
    addToCache,
    removeFromCache,
    clearCache,
    getCachedProduct,
    isCached,
    cacheSize: recentlyViewed.length,
  };
};

/**
 * Push Notification Manager
 * 
 * Handles notification permissions and subscription management.
 * Actual push notifications require a backend service.
 */
export interface NotificationPreferences {
  priceDrops: boolean;
  newFromBrands: boolean;
  deals: boolean;
}

const NOTIFICATION_PREFS_KEY = "pwa-notification-prefs";

export const useNotificationPreferences = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      return stored
        ? JSON.parse(stored)
        : { priceDrops: true, newFromBrands: true, deals: true };
    } catch {
      return { priceDrops: true, newFromBrands: true, deals: true };
    }
  });

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === "undefined") {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  // Check if notifications are supported
  const isSupported = typeof Notification !== "undefined";

  // Check if we have permission
  const hasPermission = permission === "granted";

  return {
    permission,
    hasPermission,
    isSupported,
    preferences,
    requestPermission,
    updatePreferences,
  };
};
