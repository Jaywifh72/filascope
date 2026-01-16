import { useState, useRef, useCallback } from "react";
import { Thermometer, Circle, Zap, Droplets, Wind, Gauge } from "lucide-react";

interface SpecCardData {
  id: string;
  label: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  subLabel?: string;
}

const MATERIAL_SPECS: SpecCardData[] = [
  {
    id: "nozzle-temp",
    label: "NOZZLE TEMP",
    value: "190-220",
    unit: "°C",
    icon: Thermometer,
    subLabel: "PLA Standard",
  },
  {
    id: "bed-temp",
    label: "BED TEMP",
    value: "50-60",
    unit: "°C",
    icon: Thermometer,
    subLabel: "Heated Bed",
  },
  {
    id: "diameter",
    label: "DIAMETER",
    value: "1.75",
    unit: "mm",
    icon: Circle,
    subLabel: "±0.02 Tolerance",
  },
  {
    id: "print-speed",
    label: "PRINT SPEED",
    value: "40-100",
    unit: "mm/s",
    icon: Zap,
    subLabel: "Optimal Range",
  },
  {
    id: "density",
    label: "DENSITY",
    value: "1.24",
    unit: "g/cm³",
    icon: Droplets,
    subLabel: "Material Weight",
  },
  {
    id: "flow-rate",
    label: "FLOW RATE",
    value: "95-105",
    unit: "%",
    icon: Wind,
    subLabel: "Calibrated",
  },
];

interface SpecCardProps {
  spec: SpecCardData;
  delay: number;
}

const SpecCard = ({ spec, delay }: SpecCardProps) => {
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
          <span className="font-mono text-2xl font-bold text-foreground tracking-tight">
            {spec.value}
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            {spec.unit}
          </span>
        </div>

        {/* Sub label */}
        {spec.subLabel && (
          <span className="text-[11px] text-muted-foreground/70">
            {spec.subLabel}
          </span>
        )}

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

export function MaterialSpecsGrid() {
  return (
    <section className="w-full py-12 px-6 md:px-10">
      <div className="max-w-[1400px] mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Gauge className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
            Material Specs Reference
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MATERIAL_SPECS.map((spec, index) => (
            <SpecCard key={spec.id} spec={spec} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default MaterialSpecsGrid;
