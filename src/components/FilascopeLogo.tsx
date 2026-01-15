import { cn } from "@/lib/utils";

interface FilascopeLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FilascopeLogo({ className, size = "md" }: FilascopeLogoProps) {
  const sizeClasses = {
    sm: "h-12",
    md: "h-16 md:h-20",
    lg: "h-20 md:h-24",
  };

  const iconSizes = {
    sm: { width: 32, height: 32, boxSize: 8 },
    md: { width: 44, height: 44, boxSize: 11 },
    lg: { width: 56, height: 56, boxSize: 14 },
  };

  const textSizes = {
    sm: { brand: "text-lg", tagline: "text-[0.65rem]" },
    md: { brand: "text-xl md:text-2xl", tagline: "text-[0.75rem] md:text-sm" },
    lg: { brand: "text-2xl md:text-3xl", tagline: "text-sm md:text-base" },
  };

  const { width, height, boxSize } = iconSizes[size];
  const gap = Math.floor(boxSize * 0.3);

  return (
    <div className={cn("flex items-center gap-3", sizeClasses[size], className)}>
      {/* Logo Icon - 3x3 grid of boxes with middle cyan box pulsing */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0"
        style={{ imageRendering: "crisp-edges" }}
      >
        {/* Grid of boxes */}
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const x = col * (boxSize + gap);
            const y = row * (boxSize + gap);
            const isCenter = row === 1 && col === 1;

            return (
              <rect
                key={`${row}-${col}`}
                x={x}
                y={y}
                width={boxSize}
                height={boxSize}
                rx={2}
                className={cn(
                  isCenter
                    ? "fill-[#00CFE8] animate-logo-pulse"
                    : "fill-white/80"
                )}
              />
            );
          })
        )}
      </svg>

      {/* Brand text and tagline */}
      <div className="flex flex-col justify-end">
        <span
          className={cn(
            "font-bold tracking-tight text-white leading-none",
            textSizes[size].brand
          )}
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          FilaScope
        </span>
        <span
          className={cn(
            "text-white/60 tracking-widest uppercase leading-none mt-0.5",
            textSizes[size].tagline
          )}
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Measure Material
        </span>
      </div>
    </div>
  );
}
