import React from 'react';
import { Thermometer, Flame, Zap, Gauge, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FilamentKeySpecsBarProps {
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  printSpeedMax?: number | null;
  easeOfPrintingScore?: number | null;
  isAbrasive?: boolean | null;
  material?: string | null;
  className?: string;
}

interface SpecItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
  warning?: boolean;
}

function getEaseLabel(score: number | null | undefined): { label: string; color: string } {
  if (!score) return { label: 'Unknown', color: 'text-muted-foreground' };
  if (score >= 8) return { label: 'Very Easy', color: 'text-emerald-400' };
  if (score >= 6) return { label: 'Easy', color: 'text-green-400' };
  if (score >= 4) return { label: 'Moderate', color: 'text-amber-400' };
  return { label: 'Advanced', color: 'text-orange-400' };
}

export function FilamentKeySpecsBar({
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  printSpeedMax,
  easeOfPrintingScore,
  isAbrasive,
  material,
  className,
}: FilamentKeySpecsBarProps) {
  const specs: SpecItem[] = [];

  // Nozzle Temperature
  if (nozzleTempMin || nozzleTempMax) {
    const tempDisplay = nozzleTempMin && nozzleTempMax
      ? `${nozzleTempMin}-${nozzleTempMax}°C`
      : `${nozzleTempMin || nozzleTempMax}°C`;
    specs.push({
      icon: <Thermometer className="w-4 h-4" />,
      label: 'Nozzle',
      value: tempDisplay,
      tooltip: 'Recommended nozzle temperature range',
    });
  }

  // Bed Temperature
  if (bedTempMin || bedTempMax) {
    const bedDisplay = bedTempMin && bedTempMax
      ? `${bedTempMin}-${bedTempMax}°C`
      : `${bedTempMin || bedTempMax}°C`;
    specs.push({
      icon: <Flame className="w-4 h-4" />,
      label: 'Bed',
      value: bedDisplay,
      tooltip: 'Recommended bed temperature range',
    });
  }

  // Print Speed
  if (printSpeedMax) {
    specs.push({
      icon: <Zap className="w-4 h-4" />,
      label: 'Max Speed',
      value: `${printSpeedMax} mm/s`,
      tooltip: 'Maximum recommended print speed',
      highlight: printSpeedMax >= 200,
    });
  }

  // Ease of Printing
  if (easeOfPrintingScore) {
    const ease = getEaseLabel(easeOfPrintingScore);
    specs.push({
      icon: <Gauge className="w-4 h-4" />,
      label: 'Difficulty',
      value: ease.label,
      tooltip: `Print difficulty: ${easeOfPrintingScore}/10`,
    });
  }

  // Material Type (if special)
  const materialLower = material?.toLowerCase() || '';
  if (materialLower.includes('cf') || materialLower.includes('carbon')) {
    specs.push({
      icon: <Shield className="w-4 h-4" />,
      label: 'Reinforced',
      value: 'Carbon Fiber',
      tooltip: 'Contains carbon fiber reinforcement',
    });
  } else if (materialLower.includes('gf') || materialLower.includes('glass')) {
    specs.push({
      icon: <Shield className="w-4 h-4" />,
      label: 'Reinforced',
      value: 'Glass Fiber',
      tooltip: 'Contains glass fiber reinforcement',
    });
  }

  // Abrasive Warning
  if (isAbrasive) {
    specs.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Nozzle',
      value: 'Hardened Required',
      tooltip: 'This filament is abrasive and requires a hardened steel nozzle',
      warning: true,
    });
  }

  if (specs.length === 0) return null;

  return (
    <div className={cn(
      "w-full bg-white/[0.02] border border-white/[0.08] rounded-xl",
      "px-4 py-3 md:px-6 md:py-4",
      className
    )}>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 lg:gap-10">
          {specs.map((spec, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-2 cursor-default",
                  spec.warning && "text-amber-400",
                  spec.highlight && "text-primary"
                )}>
                  <span className={cn(
                    "flex-shrink-0",
                    spec.warning ? "text-amber-400" : spec.highlight ? "text-primary" : "text-muted-foreground"
                  )}>
                    {spec.icon}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {spec.label}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold",
                      spec.warning ? "text-amber-400" : spec.highlight ? "text-primary" : "text-foreground"
                    )}>
                      {spec.value}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              {spec.tooltip && (
                <TooltipContent side="bottom" className="text-xs">
                  {spec.tooltip}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
