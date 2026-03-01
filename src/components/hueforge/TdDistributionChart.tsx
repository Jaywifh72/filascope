import { useMemo } from 'react';

interface TDFilament {
  transmission_distance: number | null;
}

const ZONES = [
  { label: '0–1 Opaque', min: 0, max: 1, color: 'hsl(0 60% 40%)' },
  { label: '1–3 Mid-tone', min: 1, max: 3, color: 'hsl(35 80% 50%)' },
  { label: '3–5 Translucent', min: 3, max: 5, color: 'hsl(187 70% 45%)' },
  { label: '5+ Very Translucent', min: 5, max: Infinity, color: 'hsl(270 50% 60%)' },
];

interface Props {
  filaments: TDFilament[];
  onZoneClick: (min: number, max: number) => void;
}

export function TdDistributionChart({ filaments, onZoneClick }: Props) {
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

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">TD Distribution</p>
      <div className="flex flex-col md:flex-row gap-1.5">
        {counts.map((zone) => (
          <button
            key={zone.label}
            className="flex items-center gap-2 group cursor-pointer text-left md:flex-1"
            onClick={() => onZoneClick(zone.min, zone.max === Infinity ? 10 : zone.max)}
          >
            <div className="flex-1 h-5 rounded-sm overflow-hidden bg-muted/30 relative min-w-0">
              <div
                className="h-full rounded-sm transition-all group-hover:opacity-80"
                style={{
                  width: `${(zone.count / maxCount) * 100}%`,
                  backgroundColor: zone.color,
                  minWidth: zone.count > 0 ? '4px' : '0',
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0 w-24 md:w-auto">
              {zone.label}
            </span>
            <span className="text-xs font-mono font-medium shrink-0 w-6 text-right">{zone.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
