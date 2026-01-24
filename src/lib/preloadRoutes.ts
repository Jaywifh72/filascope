/**
 * Route preloading utilities for improved navigation performance.
 * Preloads route components during idle time or on link hover.
 */

type RoutePreloader = () => Promise<unknown>;

// Map of routes to their dynamic import functions
const routePreloaders: Record<string, RoutePreloader> = {
  '/': () => import('../pages/Finder'),
  '/finder': () => import('../pages/Finder'),
  '/printers': () => import('../pages/Printers'),
  '/deals': () => import('../pages/Deals'),
  '/brands': () => import('../pages/Brands'),
  '/wizard': () => import('../pages/Wizard'),
  '/compare': () => import('../pages/Compare'),
  '/filament': () => import('../pages/FilamentDetail'),
};

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();

/**
 * Preload a specific route's component.
 * Uses requestIdleCallback for non-blocking preloading.
 */
export function preloadRoute(path: string): void {
  // Normalize path (remove trailing slashes, handle dynamic segments)
  const normalizedPath = normalizePath(path);
  
  // Don't preload if already preloaded
  if (preloadedRoutes.has(normalizedPath)) {
    return;
  }

  const preloader = findPreloader(normalizedPath);
  if (!preloader) {
    return;
  }

  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        preloader()
          .then(() => {
            preloadedRoutes.add(normalizedPath);
          })
          .catch(() => {
            // Silently fail - preloading is an optimization, not required
          });
      },
      { timeout: 2000 }
    );
  } else {
    setTimeout(() => {
      preloader()
        .then(() => {
          preloadedRoutes.add(normalizedPath);
        })
        .catch(() => {
          // Silently fail
        });
    }, 0);
  }
}

/**
 * Preload multiple routes at once.
 * Useful for preloading likely next navigations.
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(preloadRoute);
}

/**
 * Preload routes that are likely to be navigated to from the current page.
 * Call this after the initial page load.
 */
export function preloadLikelyRoutes(currentPath: string): void {
  const likelyRoutes = getLikelyNextRoutes(currentPath);
  preloadRoutes(likelyRoutes);
}

/**
 * Get routes that are likely to be navigated to from the given path.
 */
function getLikelyNextRoutes(currentPath: string): string[] {
  const normalizedPath = normalizePath(currentPath);
  
  // Define likely navigation patterns
  const navigationPatterns: Record<string, string[]> = {
    '/': ['/printers', '/deals', '/wizard', '/brands'],
    '/finder': ['/printers', '/deals', '/wizard'],
    '/printers': ['/', '/compare'],
    '/deals': ['/', '/printers'],
    '/brands': ['/', '/printers'],
    '/wizard': ['/'],
  };

  return navigationPatterns[normalizedPath] || [];
}

/**
 * Normalize a path for consistent matching.
 */
function normalizePath(path: string): string {
  // Remove trailing slash
  let normalized = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  
  // Handle dynamic segments - match the base path
  // e.g., /filament/abc123 -> /filament
  const segments = normalized.split('/');
  if (segments.length > 2) {
    normalized = '/' + segments[1];
  }
  
  return normalized;
}

/**
 * Find the preloader for a given path.
 */
function findPreloader(path: string): RoutePreloader | undefined {
  return routePreloaders[path];
}

/**
 * Create a link hover handler that preloads the target route.
 */
export function createPreloadHandler(path: string) {
  let preloadTimeout: ReturnType<typeof setTimeout> | null = null;
  
  return {
    onMouseEnter: () => {
      // Delay preload slightly to avoid unnecessary preloads on quick mouse movements
      preloadTimeout = setTimeout(() => {
        preloadRoute(path);
      }, 100);
    },
    onMouseLeave: () => {
      if (preloadTimeout) {
        clearTimeout(preloadTimeout);
        preloadTimeout = null;
      }
    },
    onFocus: () => {
      preloadRoute(path);
    },
  };
}

/**
 * Check if a route has been preloaded.
 */
export function isRoutePreloaded(path: string): boolean {
  return preloadedRoutes.has(normalizePath(path));
}
