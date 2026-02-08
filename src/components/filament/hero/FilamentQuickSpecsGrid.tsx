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
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2.5 sm:p-4 flex items-start gap-2 sm:gap-3 min-w-0">
            <div className="text-primary flex-shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 truncate">
                {label}
                {isDefault && <Info className="inline w-2.5 h-2.5 ml-1 text-muted-foreground/70" />}
              </p>
              <p className={cn(
                "text-sm sm:text-lg font-semibold leading-tight truncate",
                isDefault ? "text-gray-300" : "text-white"
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
      "grid gap-3",
      specs.length <= 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4",
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
