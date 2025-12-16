import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompatibleCountBadgeProps {
  count: number;
  className?: string;
}

export function CompatibleCountBadge({ count, className }: CompatibleCountBadgeProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousCount = useRef(count);

  useEffect(() => {
    if (count !== previousCount.current) {
      setIsAnimating(true);
      
      // Animate count
      const startCount = previousCount.current;
      const endCount = count;
      const duration = 400;
      const startTime = Date.now();

      const animateCount = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentCount = Math.round(startCount + (endCount - startCount) * easeOut);
        
        setDisplayCount(currentCount);
        
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          previousCount.current = count;
          setTimeout(() => setIsAnimating(false), 200);
        }
      };

      requestAnimationFrame(animateCount);
    }
  }, [count]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px]",
        "bg-emerald-500/[0.12] border-[1.5px] border-emerald-500/30",
        "transition-all duration-200",
        isAnimating && "animate-count-pulse",
        className
      )}
    >
      <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400" />
      <span className="text-[15px] font-bold text-emerald-400 tabular-nums">
        {displayCount.toLocaleString()}
      </span>
      <span className="text-[13px] font-medium text-foreground hidden sm:inline">
        compatible
      </span>
    </div>
  );
}
