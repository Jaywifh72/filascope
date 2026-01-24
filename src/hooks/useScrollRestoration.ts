import { useLocation, useNavigationType } from 'react-router-dom';
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to save and restore scroll position for back/forward navigation.
 * Saves position to sessionStorage keyed by route.
 * Restores position on POP navigation (back/forward buttons).
 */
export function useScrollRestoration(key: string) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const storageKey = `scroll_${key}_${location.pathname}`;
  const lastScrollY = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced scroll save (100ms)
  const saveScrollPosition = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const currentY = window.scrollY;
      if (currentY !== lastScrollY.current) {
        lastScrollY.current = currentY;
        sessionStorage.setItem(storageKey, String(currentY));
      }
    }, 100);
  }, [storageKey]);

  // Restore on POP (back/forward) navigation
  useEffect(() => {
    if (navigationType === 'POP') {
      const savedY = sessionStorage.getItem(storageKey);
      if (savedY) {
        const scrollY = parseInt(savedY, 10);
        // Use requestAnimationFrame for smooth restoration after render
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        });
      }
    } else {
      // Clear saved position on new navigation (PUSH/REPLACE)
      // so we start at top for new navigations
    }
  }, [location.key, navigationType, storageKey]);

  // Listen for scroll events
  useEffect(() => {
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveScrollPosition]);

  // Save pagination state helper
  const savePaginationState = useCallback((displayCount: number) => {
    sessionStorage.setItem(`${storageKey}_pagination`, String(displayCount));
  }, [storageKey]);

  // Restore pagination state helper
  const restorePaginationState = useCallback((defaultCount: number): number => {
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`${storageKey}_pagination`);
      if (saved) {
        return parseInt(saved, 10);
      }
    }
    return defaultCount;
  }, [storageKey, navigationType]);

  return {
    savePaginationState,
    restorePaginationState,
    navigationType,
  };
}
