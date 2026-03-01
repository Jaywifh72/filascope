import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimilarScrollHintProps {
  count: number;
}

export function SimilarScrollHint({ count }: SimilarScrollHintProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (count === 0) return;

    let scrolledEnough = false;
    let timedEnough = false;

    const show = () => {
      if (scrolledEnough && timedEnough) {
        setVisible(true);
        // Auto-hide after 10s
        dismissTimerRef.current = setTimeout(() => setVisible(false), 10000);
      }
    };

    timerRef.current = setTimeout(() => {
      timedEnough = true;
      show();
    }, 5000);

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.3) {
        scrolledEnough = true;
        show();
      }
      // Hide once past the similar section
      const section = document.getElementById("similar-filaments-section");
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0) {
          setVisible(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timerRef.current);
      clearTimeout(dismissTimerRef.current);
    };
  }, [count]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    if (visible) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible]);

  if (!visible || count === 0) return null;

  const handleClick = () => {
    document.getElementById("similar-filaments-section")?.scrollIntoView({ behavior: "smooth" });
    setVisible(false);
  };

  return (
    <button
      onClick={handleClick}
      role="complementary"
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-30",
        "hidden md:flex items-center gap-1.5",
        "bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5",
        "text-xs text-muted-foreground hover:text-foreground hover:border-primary/50",
        "transition-all duration-200 shadow-lg",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "animate-in fade-in slide-in-from-right-2 duration-300 motion-reduce:animate-none"
      )}
    >
      <ChevronDown className="w-3.5 h-3.5" />
      <span>{count} similar</span>
    </button>
  );
}
