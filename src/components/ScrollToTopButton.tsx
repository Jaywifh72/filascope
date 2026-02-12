import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";

interface ScrollToTopButtonProps {
  /** CSS selector or element ID (without #) to scroll to */
  targetId?: string;
  /** Scroll threshold in px from that target's top */
  threshold?: number;
}

export function ScrollToTopButton({
  targetId = "filament-filters",
  threshold = 600,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const { count, isExpanded } = useCompare();
  const trayOpen = count > 0 && isExpanded;

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const check = () => {
      const rect = target.getBoundingClientRect();
      // Show when the target has scrolled well above viewport
      setVisible(rect.top < -threshold);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [targetId, threshold]);

  const scrollToTop = useCallback(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "start",
    });
  }, [targetId]);

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top of results"
      className={cn(
        "fixed right-6 z-40 w-10 h-10 rounded-full",
        "flex items-center justify-center",
        "bg-card/90 backdrop-blur-sm border border-border shadow-lg",
        "text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border-hover",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        visible
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none translate-y-2",
        trayOpen ? "bottom-48" : "bottom-6"
      )}
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
