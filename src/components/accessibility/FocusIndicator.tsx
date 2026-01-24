import { cn } from "@/lib/utils";
import { forwardRef, useRef, useEffect, useCallback, useState } from "react";

/**
 * Focus Ring Wrapper Component
 * 
 * WCAG 2.1 AA Requirement: Focus Visible (2.4.7)
 * Provides consistent, high-visibility focus indicators
 * 
 * Use this to wrap interactive elements that need enhanced focus visibility.
 */
export const FocusRing = forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & {
    /** Focus ring color variant */
    variant?: "primary" | "destructive" | "warning";
    /** Size of the focus ring offset */
    offset?: "sm" | "md" | "lg";
  }
>(({ 
  children, 
  className, 
  variant = "primary",
  offset = "md",
  ...props 
}, ref) => {
  const ringColors = {
    primary: "focus-within:ring-primary",
    destructive: "focus-within:ring-destructive",
    warning: "focus-within:ring-warning",
  };

  const offsetSizes = {
    sm: "focus-within:ring-offset-1",
    md: "focus-within:ring-offset-2",
    lg: "focus-within:ring-offset-4",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "focus-within:outline-none focus-within:ring-2",
        ringColors[variant],
        offsetSizes[offset],
        "focus-within:ring-offset-background",
        "rounded-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

FocusRing.displayName = "FocusRing";

/**
 * Focus Trap Hook
 * 
 * Traps focus within a container for modals, dialogs, etc.
 * WCAG 2.1 AA Requirement: Focus Order (2.4.3)
 * 
 * @param containerRef - Reference to the container element
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options
 */
export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>, 
  isActive: boolean,
  options?: {
    /** Automatically focus the first focusable element when activated */
    autoFocus?: boolean;
    /** Restore focus to previously focused element when deactivated */
    restoreFocus?: boolean;
    /** Initial focus selector (if different from first focusable) */
    initialFocusSelector?: string;
  }
) => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const { autoFocus = true, restoreFocus = true, initialFocusSelector } = options || {};

  // Handle focus trapping with Tab key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;
    
    if (e.key !== "Tab") return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [isActive, containerRef]);

  // Auto-setup focus trap when activated
  useEffect(() => {
    if (!isActive) {
      // Restore focus when deactivating
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
        previouslyFocusedElement.current = null;
      }
      return;
    }

    // Save current focus before trapping
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Setup event listener
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown as EventListener);
      
      // Auto-focus first focusable element
      if (autoFocus) {
        const selector = initialFocusSelector || 
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const firstFocusable = container.querySelector<HTMLElement>(selector);
        
        // Delay focus to ensure element is mounted
        requestAnimationFrame(() => {
          firstFocusable?.focus();
        });
      }
    }

    return () => {
      container?.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isActive, autoFocus, restoreFocus, initialFocusSelector, containerRef, handleKeyDown]);

  return { handleKeyDown };
};

/**
 * Focus Return Hook
 * 
 * Returns focus to the trigger element when a modal/dialog closes
 */
export const useFocusReturn = () => {
  const triggerRef = useRef<HTMLElement | null>(null);

  const saveTrigger = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  const returnFocus = useCallback(() => {
    if (triggerRef.current && document.body.contains(triggerRef.current)) {
      // Use requestAnimationFrame to ensure the element is focusable
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  return { saveTrigger, returnFocus, triggerRef };
};

/**
 * Roving Tabindex Hook
 * 
 * Implements roving tabindex pattern for lists, grids, and other composite widgets
 * WCAG 2.1 AA Requirement: Keyboard (2.1.1)
 */
export const useRovingTabindex = (
  items: HTMLElement[],
  options?: {
    /** Orientation of the list for arrow key handling */
    orientation?: 'horizontal' | 'vertical' | 'grid';
    /** Whether to wrap around at the ends */
    wrap?: boolean;
    /** Number of columns for grid orientation */
    columns?: number;
  }
) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { orientation = 'vertical', wrap = true, columns = 1 } = options || {};

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { key } = e;
    let newIndex = activeIndex;

    const isHorizontal = orientation === 'horizontal' || orientation === 'grid';
    const isVertical = orientation === 'vertical' || orientation === 'grid';

    if (isHorizontal && key === 'ArrowLeft') {
      newIndex = activeIndex - 1;
    } else if (isHorizontal && key === 'ArrowRight') {
      newIndex = activeIndex + 1;
    } else if (isVertical && key === 'ArrowUp') {
      newIndex = orientation === 'grid' ? activeIndex - columns : activeIndex - 1;
    } else if (isVertical && key === 'ArrowDown') {
      newIndex = orientation === 'grid' ? activeIndex + columns : activeIndex + 1;
    } else if (key === 'Home') {
      newIndex = 0;
    } else if (key === 'End') {
      newIndex = items.length - 1;
    } else {
      return; // Don't prevent default for unhandled keys
    }

    e.preventDefault();

    // Handle wrapping or clamping
    if (wrap) {
      newIndex = (newIndex + items.length) % items.length;
    } else {
      newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
    }

    setActiveIndex(newIndex);
    items[newIndex]?.focus();
  }, [activeIndex, items, orientation, wrap, columns]);

  return { activeIndex, setActiveIndex, handleKeyDown };
};
