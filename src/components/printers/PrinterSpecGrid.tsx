import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrinterSpecGridProps {
  buildVolume?: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  maxSpeed?: number | null;
  hotendTemp?: number | null;
  motionSystem?: string | null;
  bedTemp?: number | null;
  className?: string;
  variant?: "default" | "compact";
}

export default function PrinterSpecGrid({
  buildVolume,
  maxSpeed,
  hotendTemp,
  motionSystem,
  bedTemp,
  className,
  variant = "default",
}: PrinterSpecGridProps) {
  // Format build volume as compact notation (e.g., "256³" or "256×256×300")
  const formatBuildVolume = () => {
    if (!buildVolume?.x || !buildVolume?.y || !buildVolume?.z) return "—";
    const { x, y, z } = buildVolume;
    // If all dimensions are the same, show as cubed
    if (x === y && y === z) {
      return `${x}³`;
    }
    // If x and y are the same, show compactly
    if (x === y) {
      return `${x}²×${z}`;
    }
    // Show all dimensions
    return `${x}×${y}×${z}`;
  };

  // Determine motion type from notes
  const getMotionLabel = () => {
    if (!motionSystem) return "—";
    const lower = motionSystem.toLowerCase();
    if (lower.includes("corexy")) return "CoreXY";
    if (lower.includes("delta")) return "Delta";
    if (lower.includes("idex")) return "IDEX";
    if (lower.includes("cartesian") || lower.includes("bed slinger")) return "Cartesian";
    if (lower.includes("toolchanger")) return "Toolchanger";
    return motionSystem.slice(0, 10);
  };

  const specs = [
    {
      label: "BUILD VOL",
      value: formatBuildVolume(),
      unit: "mm",
    },
    {
      label: "MAX SPEED",
      value: maxSpeed ? `${maxSpeed}` : "—",
      unit: "mm/s",
    },
    {
      label: "HOTEND",
      value: hotendTemp ? `${hotendTemp}` : "—",
      unit: "°C",
    },
    {
      label: "MOTION",
      value: getMotionLabel(),
      unit: "",
    },
  ];

  if (variant === "compact") {
    return (
      <TooltipProvider delayDuration={300}>
        <div className={cn("grid grid-cols-2 gap-2", className)}>
          {specs.map((spec) => (
            <Tooltip key={spec.label}>
              <TooltipTrigger asChild>
                <div className="bg-white/[0.03] border border-white/5 rounded-md px-2 py-1.5 min-w-0 overflow-hidden">
                  <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
                    {spec.label}
                  </div>
                  <div className="font-mono text-[11px] font-bold text-foreground truncate">
                    {spec.value}
                    {spec.unit && (
                      <span className="text-[9px] text-muted-foreground ml-0.5">
                        {spec.unit}
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{spec.label}: {spec.value}{spec.unit ? ` ${spec.unit}` : ''}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px bg-white/5 rounded-lg overflow-hidden",
        className
      )}
    >
      {specs.map((spec, index) => (
        <div
          key={spec.label}
          className={cn(
            "bg-[hsl(0_0%_8%)] px-3 py-2.5",
            index === 0 && "rounded-tl-lg",
            index === 1 && "rounded-tr-lg",
            index === 2 && "rounded-bl-lg",
            index === 3 && "rounded-br-lg"
          )}
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1">
            {spec.label}
          </div>
          <div className="font-mono text-sm font-bold text-foreground flex items-baseline gap-0.5">
            <span className={spec.value === "—" ? "text-muted-foreground" : ""}>
              {spec.value}
            </span>
            {spec.unit && spec.value !== "—" && (
              <span className="text-[10px] text-muted-foreground font-normal">
                {spec.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
