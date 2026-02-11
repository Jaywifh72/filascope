import React from 'react';
import { cn } from '@/lib/utils';
import { Gauge } from 'lucide-react';

interface SpeedGaugeProps {
  speed: number | null | undefined;
  maxReference?: number;
  compact?: boolean;
}

// Speed categories with ranges and colors
const SPEED_CATEGORIES = [
  { label: 'Slow', maxSpeed: 100, color: 'text-gray-400' },
  { label: 'Medium', maxSpeed: 300, color: 'text-yellow-400' },
  { label: 'Fast', maxSpeed: 500, color: 'text-primary' },
  { label: 'Very Fast', maxSpeed: Infinity, color: 'text-green-400' },
];

function getSpeedCategory(speed: number) {
  for (const cat of SPEED_CATEGORIES) {
    if (speed <= cat.maxSpeed) {
      return cat;
    }
  }
  return SPEED_CATEGORIES[SPEED_CATEGORIES.length - 1];
}

export function SpeedGauge({ speed, maxReference = 800, compact = false }: SpeedGaugeProps) {
  if (!speed) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-800 rounded-lg min-h-[200px]">
        <Gauge size={32} className="text-gray-600 mb-2" />
        <span className="text-sm text-gray-500 font-mono">Speed data not available</span>
        <span className="text-xs text-gray-600 mt-1">This spec hasn't been added yet</span>
      </div>
    );
  }

  const percentage = Math.min((speed / maxReference) * 100, 100);
  const category = getSpeedCategory(speed);

  // Category boundary positions (as percentages)
  const categoryBoundaries = [
    { position: (100 / maxReference) * 100, label: 'Slow' },
    { position: (300 / maxReference) * 100, label: 'Medium' },
    { position: (500 / maxReference) * 100, label: 'Fast' },
  ];

  return (
    <div className={cn(
      "bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden",
      compact ? "p-4" : "p-5 sm:p-6"
    )}>
      {/* Header with prominent speed value */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-gray-400">Print Speed</span>
        </div>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-bold text-white">{speed}</div>
          <div className="text-xs text-gray-500">mm/s</div>
        </div>
      </div>

      {/* Speed gauge bar */}
      <div className="relative mb-3">
        {/* Background bar */}
        <div className="h-3 sm:h-4 bg-muted/50 rounded-full overflow-hidden">
          {/* Filled portion with gradient */}
          <div 
            className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Speed marker */}
        <div 
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${percentage}%` }}
        >
          {/* Marker line */}
          <div className="w-0.5 h-3 sm:h-4 bg-white rounded-full shadow-lg shadow-primary/50" />
          {/* Marker triangle */}
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white mt-0.5" />
        </div>

        {/* Category boundary markers */}
        {categoryBoundaries.map((boundary, idx) => (
          <div 
            key={idx}
            className="absolute top-0 h-3 sm:h-4 w-px bg-border/60"
            style={{ left: `${boundary.position}%` }}
          />
        ))}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>0 mm/s</span>
        <span>{maxReference} mm/s</span>
      </div>

      {/* Category labels */}
      <div className="relative h-6 sm:h-7">
        <div className="absolute inset-0 flex">
          {/* Slow: 0-100 (12.5% of 800) */}
          <div className="flex items-center justify-center" style={{ width: `${(100 / maxReference) * 100}%` }}>
            <span className={cn(
              "text-[10px] sm:text-xs font-medium px-1 py-0.5 rounded",
              category.label === 'Slow' ? "bg-primary/20 text-primary" : "text-gray-500"
            )}>
              Slow
            </span>
          </div>
          {/* Medium: 100-300 (25% of 800) */}
          <div className="flex items-center justify-center" style={{ width: `${((300 - 100) / maxReference) * 100}%` }}>
            <span className={cn(
              "text-[10px] sm:text-xs font-medium px-1 py-0.5 rounded",
              category.label === 'Medium' ? "bg-primary/20 text-primary" : "text-gray-500"
            )}>
              Medium
            </span>
          </div>
          {/* Fast: 300-500 (25% of 800) */}
          <div className="flex items-center justify-center" style={{ width: `${((500 - 300) / maxReference) * 100}%` }}>
            <span className={cn(
              "text-[10px] sm:text-xs font-medium px-1 py-0.5 rounded",
              category.label === 'Fast' ? "bg-primary/20 text-primary" : "text-gray-500"
            )}>
              Fast
            </span>
          </div>
          {/* Very Fast: 500+ (remaining) */}
          <div className="flex items-center justify-center flex-1">
            <span className={cn(
              "text-[10px] sm:text-xs font-medium px-1 py-0.5 rounded whitespace-nowrap",
              category.label === 'Very Fast' ? "bg-primary/20 text-primary" : "text-gray-500"
            )}>
              Very Fast
            </span>
          </div>
        </div>
      </div>

      {/* Category highlight badge */}
      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-center">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          "bg-primary/10 text-primary border border-primary/20"
        )}>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          This printer is rated <span className="font-bold">{category.label}</span>
        </div>
      </div>
    </div>
  );
}
