import { cn } from '@/lib/utils';

interface TrustBarProps {
  filamentCount: number;
  brandCount: number;
  regionCount: number;
}

function TrustDot({ color }: { color: 'green' | 'cyan' | 'purple' }) {
  const colorClasses = {
    green: 'bg-emerald-500 shadow-emerald-500/40',
    cyan: 'bg-primary shadow-primary/40',
    purple: 'bg-purple-500 shadow-purple-500/40',
  };
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full shadow-sm', colorClasses[color], color === 'green' && 'animate-pulse')}
      aria-hidden="true"
    />
  );
}

export function TrustBar({ filamentCount, brandCount, regionCount }: TrustBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 border-y border-border/50 bg-card/50 px-6 py-3 md:flex md:items-center md:justify-center md:gap-8 md:px-8">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrustDot color="green" />
        <span>Prices verified <span className="font-semibold text-foreground">daily</span></span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrustDot color="cyan" />
        <span className="font-semibold text-foreground">{filamentCount.toLocaleString()}</span> filaments compared
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrustDot color="purple" />
        <span className="font-semibold text-foreground">{brandCount}</span> brands · <span className="font-semibold text-foreground">{regionCount}</span> regions
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrustDot color="green" />
        <span className="font-semibold text-foreground">100%</span> independent · no ads
      </div>
    </div>
  );
}
