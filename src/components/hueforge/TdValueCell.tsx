import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  value: number;
}

function getTdBadgeClasses(td: number): string {
  if (td <= 1) return 'bg-gray-800 text-gray-300';
  if (td <= 3) return 'bg-amber-900/50 text-amber-400';
  if (td <= 5) return 'bg-cyan-900/50 text-cyan-400';
  return 'bg-purple-900/50 text-purple-400';
}

function getTdBarColor(td: number): string {
  if (td <= 1) return 'bg-gray-400';
  if (td <= 3) return 'bg-amber-500';
  if (td <= 5) return 'bg-cyan-500';
  return 'bg-purple-500';
}

function getTdTooltip(td: number): string {
  if (td <= 1) return 'Opaque — ideal for base/shadow layers';
  if (td <= 3) return 'Mid-tone — great for color transitions';
  if (td <= 5) return 'Translucent — good for highlights';
  return 'Very translucent — maximum light transmission';
}

function getTdGlowShadow(td: number): string {
  if (td <= 1) return '0 0 8px rgba(156,163,175,0.3)';
  if (td <= 3) return '0 0 8px rgba(245,158,11,0.3)';
  if (td <= 5) return '0 0 8px rgba(0,200,200,0.3)';
  return '0 0 8px rgba(168,85,247,0.3)';
}

export function TdValueCell({ value }: Props) {
  const pct = Math.min((value / 10) * 100, 100);

  return (
    <div className="flex flex-col items-end gap-1">
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              className={cn(
                'font-mono font-bold text-sm min-w-[60px] text-center rounded-md px-2 py-0.5 cursor-default',
                'transition-all duration-150 hover:scale-110 focus:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                getTdBadgeClasses(value)
              )}
              style={{
                // @ts-ignore -- custom shadow on hover handled via group
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = getTdGlowShadow(value);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = getTdGlowShadow(value);
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs max-w-[200px]">
            <p className="font-semibold">TD {value}</p>
            <p className="text-muted-foreground">{getTdTooltip(value)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div className="w-[60px] h-1 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getTdBarColor(value))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
