import { cn } from '@/lib/utils';

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

export function TdValueCell({ value }: Props) {
  const pct = Math.min((value / 10) * 100, 100);

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={cn(
          'font-mono font-bold text-sm min-w-[60px] text-center rounded-md px-2 py-0.5',
          getTdBadgeClasses(value)
        )}
      >
        {value}
      </span>
      <div className="w-[60px] h-1 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getTdBarColor(value))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
