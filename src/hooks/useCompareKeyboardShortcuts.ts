import { useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompare } from "./useCompare";
import { toast } from "sonner";

interface UseCompareKeyboardShortcutsOptions {
  onShowHints?: () => void;
}

export function useCompareKeyboardShortcuts(options?: UseCompareKeyboardShortcutsOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null);
  
  const { 
    items, 
    removeItem, 
    isExpanded, 
    setIsExpanded,
    count,
  } = useCompare();

  const copyCompareUrl = useCallback(async () => {
    if (count < 2) {
      toast.info("Add at least 2 materials to share");
      return;
    }
    
    const ids = items.map(i => i.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Comparison link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [items, count]);

  const removeLastItem = useCallback(() => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      removeItem(lastItem.id);
    }
  }, [items, removeItem]);

  const startComparison = useCallback(() => {
    if (count < 2) {
      toast.info("Add at least 2 materials to compare");
      return;
    }
    
    const ids = items.map(i => i.id).join(',');
    navigate(`/compare?ids=${ids}`);
  }, [items, count, navigate]);

  const focusCard = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setFocusedCardIndex(index);
      // Auto-clear focus after animation
      setTimeout(() => setFocusedCardIndex(null), 1500);
    }
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore on compare page for conflicting shortcuts
      const isOnComparePage = location.pathname === '/compare';

      switch (e.key.toLowerCase()) {
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            // Cmd/Ctrl + C: Copy comparison URL (use Shift to avoid conflict with native copy)
            if (e.shiftKey) {
              e.preventDefault();
              copyCompareUrl();
            }
          } else if (!isOnComparePage && count > 0) {
            // C alone: Toggle tray expand/collapse
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
          break;

        case 'backspace':
        case 'delete':
          if (!isOnComparePage && count > 0) {
            e.preventDefault();
            removeLastItem();
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
          if (!isOnComparePage && count > 0) {
            const index = parseInt(e.key) - 1;
            if (index < items.length) {
              e.preventDefault();
              focusCard(index);
            }
          }
          break;

        case 'enter':
          if (!isOnComparePage && count >= 2) {
            e.preventDefault();
            startComparison();
          }
          break;

        case 'escape':
          if (!isOnComparePage && isExpanded) {
            e.preventDefault();
            setIsExpanded(false);
          }
          break;

        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            options?.onShowHints?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    location.pathname,
    count,
    items,
    isExpanded,
    setIsExpanded,
    copyCompareUrl,
    removeLastItem,
    startComparison,
    focusCard,
    options
  ]);

  return {
    focusedCardIndex,
    copyCompareUrl,
    removeLastItem,
    startComparison,
  };
}
