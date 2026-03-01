import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";

interface ScrollToTopButtonProps {
  targetId?: string;
  threshold?: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 16; // r=16

export function ScrollToTopButton({
  targetId = "filament-filters",
  threshold = 600,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const { count, isExpanded } = useCompare();
  const trayOpen = count > 0 && isExpanded;

  useEffect(() => {
    const target = document.getElementById(targetId);
    const grid = document.getElementById("filament-grid");

    const check = () => {
      if (target) {
        const rect = target.getBoundingClientRect();
        setVisible(rect.top < -threshold);
      }
      if (grid) {
        const gridRect = grid.getBoundingClientRect();
        const gridTop = gridRect.top + window.scrollY;
        const gridHeight = gridRect.height;
        const scrolled = window.scrollY - gridTop;
        const pct = gridHeight > 0 ? Math.max(0, Math.min(1, scrolled / (gridHeight - window.innerHeight))) : 0;
        setProgress(pct);
      }
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

  const dashOffset = CIRCUMFERENCE * (1 - progress);

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
      {/* Progress ring SVG */}
      <svg
        className="absolute inset-0 w-10 h-10 -rotate-90"
        viewBox="0 0 40 40"
      >
        {/* Background circle */}
        <circle
          cx="20" cy="20" r="16"
          fill="none"
          strokeWidth="2"
          className="stroke-gray-700/40"
        />
        {/* Progress circle */}
        <circle
          cx="20" cy="20" r="16"
          fill="none"
          strokeWidth="2"
          className="stroke-cyan-500/60"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 150ms ease-out" }}
        />
      </svg>
      <ArrowUp className="w-4 h-4 relative z-10" />
    </button>
  );
}
