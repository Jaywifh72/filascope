import { Thermometer, Circle, Weight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { resolveNozzleTemp, resolveBedTemp, type ResolvedSpec } from '@/lib/materialDefaults';

interface FilamentQuickSpecsGridProps {
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  diameter?: number | null;
  netWeight?: number | null;
  material?: string | null;
  className?: string;
}

interface SpecCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDefault?: boolean;
  defaultTooltip?: string;
}

function SpecCard({ icon, label, value, isDefault, defaultTooltip }: SpecCardProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-muted/40 border border-border/60 rounded-lg px-4 py-2.5 flex items-center gap-3 min-w-0">
            <div className="text-primary flex-shrink-0">
              {icon}
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <p className="text-xs text-muted-foreground shrink-0">
                {label}
                {isDefault && <Info className="inline w-2.5 h-2.5 ml-1 text-muted-foreground/70" />}:
              </p>
              <p className={cn(
                "text-sm font-semibold leading-tight",
                isDefault ? "text-muted-foreground" : "text-foreground"
              )}>{value}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isDefault ? defaultTooltip : `${label}: ${value}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Custom bed/plate icon since Lucide doesn't have one
function BedIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="14" width="18" height="4" rx="1" />
      <path d="M5 14V10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <line x1="3" y1="18" x2="3" y2="20" />
      <line x1="21" y1="18" x2="21" y2="20" />
    </svg>
  );
}

export function FilamentQuickSpecsGrid({
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  diameter,
  netWeight,
  material,
  className,
}: FilamentQuickSpecsGridProps) {
  // Resolve temps with material-based defaults
  const nozzle = resolveNozzleTemp(nozzleTempMin, nozzleTempMax, material);
  const bed = resolveBedTemp(bedTempMin, bedTempMax, material);

  const diameterValue = diameter ? `${diameter}mm` : null;
  const weightValue = netWeight
    ? netWeight >= 1000
      ? `${(netWeight / 1000).toFixed(netWeight % 1000 === 0 ? 0 : netWeight % 100 === 0 ? 1 : 2)}kg`
      : `${netWeight}g`
    : null;

  // Only render if we have at least one value (including defaults)
  const hasAnyData = nozzle || bed || diameterValue || weightValue;
  if (!hasAnyData) return null;

  const specs: (SpecCardProps & { icon: React.ReactNode; key: string })[] = [];

  if (nozzle) {
    specs.push({
      key: 'nozzle',
      icon: <Thermometer className="w-5 h-5" />,
      label: "Nozzle Temp",
      value: nozzle.value,
      isDefault: nozzle.isDefault,
      defaultTooltip: `Typical for ${nozzle.materialLabel} — verify with manufacturer TDS`,
    });
  }
  if (bed) {
    specs.push({
      key: 'bed',
      icon: <BedIcon className="w-5 h-5" />,
      label: "Bed Temp",
      value: bed.value,
      isDefault: bed.isDefault,
      defaultTooltip: `Typical for ${bed.materialLabel} — verify with manufacturer TDS`,
    });
  }
  if (diameterValue) {
    specs.push({
      key: 'dia',
      icon: <Circle className="w-5 h-5" />,
      label: "Diameter",
      value: diameterValue,
    });
  }
  if (weightValue) {
    specs.push({
      key: 'weight',
      icon: <Weight className="w-5 h-5" />,
      label: "Net Weight",
      value: weightValue,
    });
  }

  return (
    <div className={cn(
      "flex flex-col gap-2",
      className,
    )}>
      {specs.map((spec) => (
        <SpecCard
          key={spec.key}
          icon={spec.icon}
          label={spec.label}
          value={spec.value}
          isDefault={spec.isDefault}
          defaultTooltip={spec.defaultTooltip}
        />
      ))}
    </div>
  );
}
