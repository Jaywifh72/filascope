import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Thin scroll progress bar for long-content pages (product detail, guides).
 * Fixed at viewport top, above the navbar. 2px tall, primary color.
 */
export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  // Only show on filament detail and learn/guide pages
  const isDetailPage =
    /^\/filament\//.test(location.pathname) ||
    /^\/(learn|guides|reference)\//.test(location.pathname);

  useEffect(() => {
    if (!isDetailPage) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min((scrollTop / docHeight) * 100, 100));
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDetailPage, location.pathname]);

  if (!isDetailPage || progress <= 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none",
        "motion-reduce:transition-none"
      )}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
