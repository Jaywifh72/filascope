import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAnnouncer } from "@/components/accessibility/ScreenReaderAnnouncer";

interface UseGlobalKeyboardShortcutsOptions {
  onShowKeyboardHints?: () => void;
}

/**
 * Global Keyboard Shortcuts Hook
 * 
 * WCAG 2.1 AA Compliant keyboard navigation for power users.
 * 
 * Shortcuts:
 * - "/" : Focus search input
 * - "?" (Shift+/) : Show keyboard shortcuts help
 * - "Escape" : Close modals, dropdowns, blur focused elements
 * - "g f" : Go to Filaments
 * - "g p" : Go to Printers
 * - "g b" : Go to Brands
 * - "g d" : Go to Deals
 * - "g c" : Go to Compare
 */
export function useGlobalKeyboardShortcuts(options?: UseGlobalKeyboardShortcutsOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const { announce } = useAnnouncer();
  
  // Track 'g' key for vim-style navigation
  let gKeyPressed = false;
  let gKeyTimeout: NodeJS.Timeout | null = null;

  const focusSearchInput = useCallback(() => {
    // Try to find search input on the page
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="text"][placeholder*="Search"], input[type="search"], [data-search-input="true"]'
    );
    
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
      announce("Search field focused. Start typing to search.");
      return true;
    }
    
    // Fallback: scroll to top where search usually is
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return false;
  }, [announce]);

  const closeActiveOverlays = useCallback(() => {
    // Try to close any open dialogs, sheets, or dropdowns
    const activeElement = document.activeElement as HTMLElement;
    
    // Blur current element
    if (activeElement && activeElement !== document.body) {
      activeElement.blur();
    }

    // Trigger escape on any open Radix primitives
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    
    document.dispatchEvent(escapeEvent);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInputFocused = 
        tagName === 'input' || 
        tagName === 'textarea' || 
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox';

      // "/" to focus search (only when not in input)
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      // "?" (Shift+/) to show keyboard hints
      if (e.key === '?' && e.shiftKey && !isInputFocused) {
        e.preventDefault();
        options?.onShowKeyboardHints?.();
        return;
      }

      // Escape to close overlays (works even in inputs)
      if (e.key === 'Escape') {
        // If in input, just blur
        if (isInputFocused) {
          target.blur();
          return;
        }
        closeActiveOverlays();
        return;
      }

      // Vim-style "g" navigation (g f = go filaments, g p = go printers, etc.)
      if (!isInputFocused) {
        if (e.key === 'g' && !gKeyPressed) {
          gKeyPressed = true;
          if (gKeyTimeout) clearTimeout(gKeyTimeout);
          gKeyTimeout = setTimeout(() => {
            gKeyPressed = false;
          }, 500);
          return;
        }

        if (gKeyPressed) {
          e.preventDefault();
          gKeyPressed = false;
          if (gKeyTimeout) clearTimeout(gKeyTimeout);

          const navMap: Record<string, { path: string; label: string }> = {
            'f': { path: '/', label: 'Filaments' },
            'p': { path: '/printers', label: 'Printers' },
            'b': { path: '/brands', label: 'Brands' },
            'd': { path: '/deals', label: 'Deals' },
            'c': { path: '/compare', label: 'Compare' },
            'w': { path: '/wizard', label: 'Quick Match Wizard' },
            'v': { path: '/vault', label: 'Vault' },
          };

          const nav = navMap[e.key.toLowerCase()];
          if (nav && location.pathname !== nav.path) {
            navigate(nav.path);
            announce(`Navigating to ${nav.label}`);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gKeyTimeout) clearTimeout(gKeyTimeout);
    };
  }, [focusSearchInput, closeActiveOverlays, navigate, location.pathname, announce, options]);

  return {
    focusSearchInput,
    closeActiveOverlays,
  };
}
