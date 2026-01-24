import { useEffect, useRef } from "react";
import { useAnnouncer } from "@/components/accessibility/ScreenReaderAnnouncer";

/**
 * Hook to announce filter result changes to screen readers
 * 
 * WCAG 2.1 AA: Status Messages (4.1.3)
 * Announces changes in content that don't involve a change in context
 */
export function useFilterResultsAnnouncement(
  count: number,
  itemType: string = "results"
) {
  const { announce } = useAnnouncer();
  const previousCount = useRef(count);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousCount.current = count;
      return;
    }

    // Only announce if count changed
    if (count !== previousCount.current) {
      const message = count === 0
        ? `No ${itemType} found. Try adjusting your filters.`
        : count === 1
          ? `1 ${itemType.replace(/s$/, '')} found.`
          : `${count} ${itemType} found.`;
      
      announce(message, "polite");
      previousCount.current = count;
    }
  }, [count, itemType, announce]);
}

/**
 * Hook to announce compare tray changes
 */
export function useCompareTrayAnnouncement() {
  const { announce } = useAnnouncer();

  const announceAdd = (itemName: string, currentCount: number, maxCount: number = 4) => {
    const remaining = maxCount - currentCount;
    const message = remaining > 0
      ? `${itemName} added to comparison. ${currentCount} of ${maxCount} items selected.`
      : `${itemName} added. Maximum ${maxCount} items reached.`;
    announce(message, "polite");
  };

  const announceRemove = (itemName: string, remainingCount: number) => {
    const message = remainingCount === 0
      ? `${itemName} removed. Comparison tray is empty.`
      : `${itemName} removed. ${remainingCount} item${remainingCount !== 1 ? 's' : ''} remaining.`;
    announce(message, "polite");
  };

  const announceClear = () => {
    announce("All items cleared from comparison tray.", "polite");
  };

  const announceExpand = (isExpanded: boolean) => {
    announce(isExpanded ? "Comparison tray expanded." : "Comparison tray collapsed.", "polite");
  };

  return {
    announceAdd,
    announceRemove,
    announceClear,
    announceExpand,
  };
}

/**
 * Hook to announce search results
 */
export function useSearchAnnouncement() {
  const { announce } = useAnnouncer();
  const debounceRef = useRef<NodeJS.Timeout>();

  const announceResults = (count: number, query: string) => {
    // Debounce to avoid rapid-fire announcements while typing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!query.trim()) return;
      
      const message = count === 0
        ? `No results found for "${query}".`
        : count === 1
          ? `1 result found for "${query}".`
          : `${count} results found for "${query}".`;
      
      announce(message, "polite");
    }, 500);
  };

  const announceNoResults = (query: string, suggestion?: string) => {
    const message = suggestion
      ? `No results for "${query}". Did you mean "${suggestion}"?`
      : `No results found for "${query}".`;
    announce(message, "polite");
  };

  return {
    announceResults,
    announceNoResults,
  };
}

/**
 * Hook to announce loading states
 */
export function useLoadingAnnouncement() {
  const { announce } = useAnnouncer();
  const wasLoading = useRef(false);

  const announceLoading = (isLoading: boolean, context: string = "content") => {
    if (isLoading && !wasLoading.current) {
      announce(`Loading ${context}...`, "polite");
    } else if (!isLoading && wasLoading.current) {
      announce(`${context} loaded.`, "polite");
    }
    wasLoading.current = isLoading;
  };

  return { announceLoading };
}
