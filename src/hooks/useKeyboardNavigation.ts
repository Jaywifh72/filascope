import { useCallback, useRef } from "react";

interface UseKeyboardNavigationOptions {
  /** Whether navigation wraps from last to first item */
  wrap?: boolean;
  /** Orientation of navigation */
  orientation?: "horizontal" | "vertical" | "both";
  /** Callback when an item is selected via Enter/Space */
  onSelect?: (index: number) => void;
}

/**
 * Keyboard Navigation Hook
 * 
 * WCAG 2.1 AA Requirement: Keyboard (2.1.1)
 * Provides arrow key navigation for lists, grids, and menus.
 * 
 * @example
 * const { handleKeyDown, setFocusedIndex } = useKeyboardNavigation({
 *   itemCount: items.length,
 *   orientation: "vertical",
 *   onSelect: (index) => selectItem(items[index])
 * });
 * 
 * <ul onKeyDown={handleKeyDown}>
 *   {items.map((item, i) => (
 *     <li key={i} tabIndex={focusedIndex === i ? 0 : -1}>
 *       {item.label}
 *     </li>
 *   ))}
 * </ul>
 */
export const useKeyboardNavigation = ({
  wrap = true,
  orientation = "vertical",
  onSelect,
}: UseKeyboardNavigationOptions = {}) => {
  const focusedIndexRef = useRef(0);
  const itemsRef = useRef<HTMLElement[]>([]);

  const registerItem = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      itemsRef.current[index] = element;
    }
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = itemsRef.current.filter(Boolean);
    if (items.length === 0) return;

    let newIndex = index;
    if (wrap) {
      newIndex = ((index % items.length) + items.length) % items.length;
    } else {
      newIndex = Math.max(0, Math.min(index, items.length - 1));
    }

    focusedIndexRef.current = newIndex;
    items[newIndex]?.focus();
  }, [wrap]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = itemsRef.current.filter(Boolean);
    if (items.length === 0) return;

    const currentIndex = focusedIndexRef.current;
    let handled = false;

    switch (e.key) {
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;
      case "Home":
        focusItem(0);
        handled = true;
        break;
      case "End":
        focusItem(items.length - 1);
        handled = true;
        break;
      case "Enter":
      case " ":
        if (onSelect) {
          onSelect(currentIndex);
          handled = true;
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [orientation, focusItem, onSelect]);

  return {
    handleKeyDown,
    registerItem,
    focusItem,
    focusedIndex: focusedIndexRef.current,
  };
};

/**
 * Roving Tab Index Hook
 * 
 * Implements the roving tabindex pattern for composite widgets.
 * Only one item in the group has tabIndex=0, others have tabIndex=-1.
 */
export const useRovingTabIndex = (itemCount: number, initialIndex = 0) => {
  const currentIndex = useRef(initialIndex);

  const getTabIndex = useCallback((index: number) => {
    return index === currentIndex.current ? 0 : -1;
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    currentIndex.current = Math.max(0, Math.min(index, itemCount - 1));
  }, [itemCount]);

  return { getTabIndex, setCurrentIndex, currentIndex: currentIndex.current };
};
