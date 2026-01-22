import { Thermometer, Circle, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilamentQuickSpecsGridProps {
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  diameter?: number | null;
  netWeight?: number | null;
  className?: string;
}

interface SpecCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SpecCard({ icon, label, value }: SpecCardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
      <div className="text-primary flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-semibold text-white leading-tight">{value}</p>
      </div>
    </div>
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
  className,
}: FilamentQuickSpecsGridProps) {
  // Format temperature range
  const formatTempRange = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${min}-${max}°C`;
    } else if (min) {
      return `${min}°C+`;
    } else if (max) {
      return `≤${max}°C`;
    }
    return '—';
  };

  const nozzleTemp = formatTempRange(nozzleTempMin, nozzleTempMax);
  const bedTemp = formatTempRange(bedTempMin, bedTempMax);
  const diameterValue = diameter ? `${diameter}mm` : '—';
  const weightValue = netWeight ? `${netWeight}g` : '—';

  // Only render if we have at least one value
  const hasAnyData = nozzleTempMin || nozzleTempMax || bedTempMin || bedTempMax || diameter || netWeight;
  if (!hasAnyData) return null;

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      <SpecCard
        icon={<Thermometer className="w-5 h-5" />}
        label="Nozzle Temp"
        value={nozzleTemp}
      />
      <SpecCard
        icon={<BedIcon className="w-5 h-5" />}
        label="Bed Temp"
        value={bedTemp}
      />
      <SpecCard
        icon={<Circle className="w-5 h-5" />}
        label="Diameter"
        value={diameterValue}
      />
      <SpecCard
        icon={<Weight className="w-5 h-5" />}
        label="Net Weight"
        value={weightValue}
      />
    </div>
  );
}
