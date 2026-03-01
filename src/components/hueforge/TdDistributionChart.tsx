import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TDFilament {
  transmission_distance: number | null;
}

const ZONES = [
  { label: 'Opaque', range: '0–1', min: 0, max: 1, color: 'hsl(0 60% 40%)' },
  { label: 'Mid-tone', range: '1–3', min: 1, max: 3, color: 'hsl(35 80% 50%)' },
  { label: 'Translucent', range: '3–5', min: 3, max: 5, color: 'hsl(187 70% 45%)' },
  { label: 'Very Translucent', range: '5+', min: 5, max: Infinity, color: 'hsl(270 50% 60%)' },
];

interface Props {
  filaments: TDFilament[];
  totalCount?: number;
  activeTdRange?: [number, number];
  onZoneClick: (min: number, max: number) => void;
}

function isZoneActive(zone: typeof ZONES[0], range: [number, number]) {
  const zMax = zone.max === Infinity ? 10 : zone.max;
  return range[0] === zone.min && range[1] === zMax;
}

export function TdDistributionChart({ filaments, totalCount, activeTdRange, onZoneClick }: Props) {
  const [mounted, setMounted] = useState(false);
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const counts = useMemo(() => {
    return ZONES.map((z) => ({
      ...z,
      count: filaments.filter((f) => {
        const td = f.transmission_distance;
        if (td == null) return false;
        return td >= z.min && (z.max === Infinity ? true : td < z.max);
      }).length,
    }));
  }, [filaments]);

  const total = counts.reduce((s, c) => s + c.count, 0);
  const isFiltered = totalCount != null && totalCount !== total;

  const handleClick = (zone: typeof counts[0]) => {
    const zMax = zone.max === Infinity ? 10 : zone.max;
    // Toggle off if already active
    if (activeTdRange && isZoneActive(zone, activeTdRange)) {
      onZoneClick(0, 10);
    } else {
      onZoneClick(zone.min, zMax);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium text-muted-foreground">TD Distribution</p>
          {isFiltered && (
            <p className="text-[11px] text-muted-foreground/70">
              Distribution of {total} filtered results
            </p>
          )}
        </div>

        {/* Bar */}
        <div className="flex h-8 rounded-lg overflow-hidden bg-muted/20">
          {counts.map((zone, i) => {
            const pct = total > 0 ? (zone.count / total) * 100 : 0;
            const isActive = activeTdRange ? isZoneActive(zone, activeTdRange) : false;
            const isFirst = i === 0;
            const isLast = i === counts.length - 1;

            return (
              <Tooltip key={zone.label}>
                <TooltipTrigger asChild>
                  <button
                    ref={(el) => { segmentRefs.current[i] = el; }}
                    className={`
                      relative flex items-center justify-center transition-all duration-300 ease-out
                      cursor-pointer hover:brightness-110
                      ${isFirst ? 'rounded-l-lg' : ''} 
                      ${isLast ? 'rounded-r-lg' : ''}
                      ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-sm z-10' : ''}
                    `}
                    style={{
                      width: mounted ? `${Math.max(pct, zone.count > 0 ? 3 : 0)}%` : '0%',
                      backgroundColor: zone.color,
                      transitionDelay: `${i * 100}ms`,
                    }}
                    onClick={() => handleClick(zone)}
                    aria-label={`${zone.count} ${zone.label.toLowerCase()} filaments (TD ${zone.range})`}
                  >
                    {/* Inline count if segment wide enough */}
                    {pct > 12 && (
                      <span className="text-xs font-bold text-white/90 drop-shadow-sm">
                        {zone.count}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {zone.count} {zone.label.toLowerCase()} filaments (TD {zone.range}) — Click to filter
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {counts.map((zone) => (
            <button
              key={zone.label}
              className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
              onClick={() => handleClick(zone)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: zone.color }}
              />
              <span>{zone.range} {zone.label}</span>
              <span className="font-mono font-medium">{zone.count}</span>
            </button>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
