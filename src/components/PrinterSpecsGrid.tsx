import { useState, useRef, useCallback } from "react";
import { Thermometer, Circle, Zap, Wind, Gauge, Printer } from "lucide-react";
import { usePrinterSpecsRange, PrinterSpecsRange } from "@/hooks/usePrinterSpecsRange";

interface SpecCardData {
  id: string;
  label: string;
  getValue: (specs: PrinterSpecsRange) => string;
  unit: string;
  icon: React.ElementType;
  subLabel: string;
}

const PRINTER_SPECS: SpecCardData[] = [
  {
    id: "nozzle-temp",
    label: "NOZZLE TEMP",
    getValue: (specs) => {
      if (specs.nozzleTempMin === null || specs.nozzleTempMax === null) return "--";
      return `${specs.nozzleTempMin}-${specs.nozzleTempMax}`;
    },
    unit: "°C",
    icon: Thermometer,
    subLabel: "Max Supported",
  },
  {
    id: "bed-temp",
    label: "BED TEMP",
    getValue: (specs) => {
      if (specs.bedTempMin === null || specs.bedTempMax === null) return "--";
      return `${specs.bedTempMin}-${specs.bedTempMax}`;
    },
    unit: "°C",
    icon: Thermometer,
    subLabel: "Max Heated",
  },
  {
    id: "nozzle-dia",
    label: "NOZZLE DIA",
    getValue: (specs) => {
      if (specs.nozzleDiaMin === null || specs.nozzleDiaMax === null) return "--";
      return `${specs.nozzleDiaMin}-${specs.nozzleDiaMax}`;
    },
    unit: "mm",
    icon: Circle,
    subLabel: "Stock Range",
  },
  {
    id: "print-speed",
    label: "PRINT SPEED",
    getValue: (specs) => {
      if (specs.printSpeedMin === null || specs.printSpeedMax === null) return "--";
      return `${specs.printSpeedMin}-${specs.printSpeedMax}`;
    },
    unit: "mm/s",
    icon: Zap,
    subLabel: "Max Capable",
  },
  {
    id: "acceleration",
    label: "ACCELERATION",
    getValue: (specs) => {
      if (specs.accelerationMin === null || specs.accelerationMax === null) return "--";
      // Format large numbers with k suffix
      const formatAccel = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
      return `${formatAccel(specs.accelerationMin)}-${formatAccel(specs.accelerationMax)}`;
    },
    unit: "mm/s²",
    icon: Gauge,
    subLabel: "XY Max",
  },
  {
    id: "flow-rate",
    label: "FLOW RATE",
    getValue: (specs) => {
      if (specs.flowRateMin === null || specs.flowRateMax === null) return "--";
      return `${specs.flowRateMin}-${specs.flowRateMax}`;
    },
    unit: "mm³/s",
    icon: Wind,
    subLabel: "Volumetric",
  },
];

interface SpecCardProps {
  spec: SpecCardData;
  specs: PrinterSpecsRange | undefined;
  delay: number;
  isLoading: boolean;
}

const SpecCard = ({ spec, specs, delay, isLoading }: SpecCardProps) => {
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
  const value = specs ? spec.getValue(specs) : "--";

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

      {/* Live indicator dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live</span>
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-live" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary/50 animate-ping-slow" />
        </div>
      </div>

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
        <div className="flex items-baseline gap-1 mb-1">
          {isLoading ? (
            <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
          ) : (
            <>
              <span className="font-mono text-2xl font-bold text-foreground tracking-tight">
                {value}
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {spec.unit}
              </span>
            </>
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
  const { data: specs, isLoading } = usePrinterSpecsRange();

  return (
    <section className="w-full py-12 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Printer className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
            3D Printer Specs
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRINTER_SPECS.map((spec, index) => (
            <SpecCard 
              key={spec.id} 
              spec={spec} 
              specs={specs}
              delay={index * 100} 
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PrinterSpecsGrid;
