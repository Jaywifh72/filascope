import { useRef, useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollCarouselProps {
  children: React.ReactNode;
  className?: string;
  /** Gap between items in pixels (default: 16) */
  gap?: number;
  /** Show navigation arrows on desktop (default: true) */
  showArrows?: boolean;
}

/**
 * Lightweight CSS scroll-snap carousel.
 * Replaces embla-carousel to avoid the 91KB dependency.
 * Supports touch swipe, keyboard navigation, and arrow buttons.
 */
export function ScrollCarousel({
  children,
  className,
  gap = 16,
  showArrows = true,
}: ScrollCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 2);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, children]);

  const scroll = useCallback((direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className={cn("relative group", className)}>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-2"
        style={{ gap: `${gap}px` }}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scroll("prev");
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            scroll("next");
          }
        }}
      >
        {children}
      </div>

      {/* Right gradient fade */}
      {canScrollNext && (
        <div className="absolute right-0 top-0 bottom-2 w-[60px] bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
      )}
      {/* Left gradient fade */}
      {canScrollPrev && (
        <div className="absolute left-0 top-0 bottom-2 w-[60px] bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
      )}

      {/* Navigation Arrows */}
      {showArrows && canScrollPrev && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800/90 backdrop-blur flex items-center justify-center border border-slate-700/50 hover:border-slate-600 transition-colors z-10"
          onClick={() => scroll("prev")}
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-4 w-4 text-slate-300" />
        </button>
      )}
      {showArrows && canScrollNext && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800/90 backdrop-blur flex items-center justify-center border border-slate-700/50 hover:border-slate-600 transition-colors z-10"
          onClick={() => scroll("next")}
          aria-label="Next slide"
        >
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </button>
      )}
    </div>
  );
}

interface ScrollCarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollCarouselItem({ children, className }: ScrollCarouselItemProps) {
  return (
    <div
      className={cn("flex-shrink-0 snap-start", className)}
      role="group"
      aria-roledescription="slide"
    >
      {children}
    </div>
  );
}
