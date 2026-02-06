import { useState, useRef, useCallback } from "react";
import { Thermometer, Circle, Zap, Wind, Gauge, Printer } from "lucide-react";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrinterSpecs {
  nozzleTemp: number | null;
  bedTemp: number | null;
  nozzleDia: number | null;
  printSpeed: number | null;
  acceleration: number | null;
  flowRate: number | null;
}

interface SpecCardData {
  id: string;
  label: string;
  getValue: (specs: PrinterSpecs) => string;
  unit: string;
  icon: React.ElementType;
  subLabel: string;
}

const PRINTER_SPECS: SpecCardData[] = [
  {
    id: "nozzle-temp",
    label: "NOZZLE TEMP",
    getValue: (specs) => specs.nozzleTemp !== null ? `${specs.nozzleTemp}` : "--",
    unit: "°C",
    icon: Thermometer,
    subLabel: "Max Supported",
  },
  {
    id: "bed-temp",
    label: "BED TEMP",
    getValue: (specs) => specs.bedTemp !== null ? `${specs.bedTemp}` : "--",
    unit: "°C",
    icon: Thermometer,
    subLabel: "Max Heated",
  },
  {
    id: "nozzle-dia",
    label: "NOZZLE DIA",
    getValue: (specs) => specs.nozzleDia !== null ? `${specs.nozzleDia}` : "--",
    unit: "mm",
    icon: Circle,
    subLabel: "Stock",
  },
  {
    id: "print-speed",
    label: "PRINT SPEED",
    getValue: (specs) => specs.printSpeed !== null ? `${specs.printSpeed}` : "--",
    unit: "mm/s",
    icon: Zap,
    subLabel: "Max Capable",
  },
  {
    id: "acceleration",
    label: "ACCELERATION",
    getValue: (specs) => {
      if (specs.acceleration === null) return "--";
      // Format large numbers with k suffix
      const v = specs.acceleration;
      return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
    },
    unit: "mm/s²",
    icon: Gauge,
    subLabel: "XY Max",
  },
  {
    id: "flow-rate",
    label: "FLOW RATE",
    getValue: (specs) => specs.flowRate !== null ? `${specs.flowRate}` : "--",
    unit: "mm³/s",
    icon: Wind,
    subLabel: "Volumetric",
  },
];

interface SpecCardProps {
  spec: SpecCardData;
  specs: PrinterSpecs;
  delay: number;
  isLoading: boolean;
  hasSelectedPrinter: boolean;
}

const SpecCard = ({ spec, specs, delay, isLoading, hasSelectedPrinter }: SpecCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setGlowPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const Icon = spec.icon;
  const value = spec.getValue(specs);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative overflow-hidden rounded-lg border border-border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:border-primary/50 animate-fade-in group"
      style={{ 
        animationDelay: `${delay}ms`,
        boxShadow: isHovering ? '0 0 30px hsla(180, 100%, 50%, 0.15)' : 'none'
      }}
    >
      {/* Cursor-following glow effect */}
      {isHovering && (
        <div
          className="pointer-events-none absolute w-32 h-32 rounded-full transition-opacity duration-300"
          style={{
            left: glowPosition.x - 64,
            top: glowPosition.y - 64,
            background: 'radial-gradient(circle, hsla(180, 100%, 50%, 0.15) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Live indicator dot - only show when printer is selected */}
      {hasSelectedPrinter && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live</span>
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-live" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/50 animate-ping-slow" />
          </div>
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {/* Icon and label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.15em]">
            {spec.label}
          </span>
        </div>

        {/* Main value - monospace font */}
        <div className="flex items-baseline gap-1 mb-1 min-w-0">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
          ) : (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-baseline gap-1 min-w-0 truncate">
                    <span className="font-mono text-2xl font-bold text-foreground tracking-tight truncate">
                      {value}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground shrink-0">
                      {spec.unit}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{spec.label}: {value} {spec.unit}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Sub label */}
        <span className="text-[11px] text-muted-foreground/70">
          {spec.subLabel}
        </span>

        {/* Decorative scan line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-primary/10 to-transparent rotate-45 translate-x-6 translate-y-6" />
      </div>
    </div>
  );
};

export function PrinterSpecsGrid() {
  const { selectedPrinter, printerLoading } = usePrinterSelection();

  // Map the selected printer's specs to our display format
  const specs: PrinterSpecs = {
    nozzleTemp: selectedPrinter?.max_nozzle_temp_c ?? null,
    bedTemp: selectedPrinter?.bed_max_temp_c ?? null,
    nozzleDia: selectedPrinter?.stock_nozzle_diameter_mm ?? null,
    printSpeed: selectedPrinter?.max_print_speed_mms ?? null,
    acceleration: selectedPrinter?.max_acceleration_xy_mmss ?? null,
    flowRate: selectedPrinter?.max_flow_rate_mm3s ?? null,
  };

  const hasSelectedPrinter = !!selectedPrinter;
  const printerName = selectedPrinter 
    ? `${selectedPrinter.brand?.brand || ''} ${selectedPrinter.model_name}`.trim()
    : null;

  return (
    <section className="w-full py-12 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Printer className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
            {printerName ? `${printerName} Specs` : "3D Printer Specs"}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* No printer selected message */}
        {!hasSelectedPrinter && !printerLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            Select a printer above to see its specifications
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRINTER_SPECS.map((spec, index) => (
            <SpecCard 
              key={spec.id} 
              spec={spec} 
              specs={specs}
              delay={index * 100} 
              isLoading={printerLoading}
              hasSelectedPrinter={hasSelectedPrinter}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PrinterSpecsGrid;
