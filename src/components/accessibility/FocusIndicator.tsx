import { cn } from "@/lib/utils";
import { forwardRef } from "react";

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
 */
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isActive: boolean) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;
    
    if (e.key !== "Tab") return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  };

  return { handleKeyDown };
};

/**
 * Focus Return Hook
 * 
 * Returns focus to the trigger element when a modal/dialog closes
 */
export const useFocusReturn = () => {
  const triggerRef = { current: null as HTMLElement | null };

  const saveTrigger = () => {
    triggerRef.current = document.activeElement as HTMLElement;
  };

  const returnFocus = () => {
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return { saveTrigger, returnFocus };
};
