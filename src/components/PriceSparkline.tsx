import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PriceSparklineProps {
  prices: { date: string; price: number }[];
  currentPrice: number;
  min: number;
  max: number;
  className?: string;
}

export function PriceSparkline({ prices, currentPrice, min, max, className }: PriceSparklineProps) {
  const { pathD, currentX, currentY, gradientId } = useMemo(() => {
    if (prices.length === 0) return { pathD: "", currentX: 0, currentY: 0, gradientId: "" };

    const width = 120;
    const height = 40;
    const padding = 4;
    
    const range = max - min || 1;
    const gradId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;
    
    // Normalize prices to SVG coordinates
    const points = prices.map((p, i) => {
      const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.price - min) / range) * (height - padding * 2);
      return { x, y };
    });

    // Create smooth curve path
    const path = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${acc} L ${point.x} ${point.y}`;
    }, "");

    // Current price position (rightmost)
    const currY = height - padding - ((currentPrice - min) / range) * (height - padding * 2);

    return {
      pathD: path,
      currentX: width - padding,
      currentY: currY,
      gradientId: gradId,
    };
  }, [prices, currentPrice, min, max]);

  if (prices.length < 2) {
    return (
      <div className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}>
        No price history
      </div>
    );
  }

  return (
    <svg 
      viewBox="0 0 120 40" 
      className={cn("w-[120px] h-[40px]", className)}
      aria-label="Price history sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={`${pathD} L 116 36 L 4 36 Z`}
        fill={`url(#${gradientId})`}
        className="sparkline-area"
      />
      
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-line"
      />
      
      {/* Current price dot */}
      <circle
        cx={currentX}
        cy={currentY}
        r="4"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth="2"
        className="sparkline-dot"
      />
    </svg>
  );
}
