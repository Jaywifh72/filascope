import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';

interface QuickCompareCardProps {
  platform: {
    id: string;
    name: string;
    owner: string;
    logo: string;
    overallScore: number;
    modelType: string;
    features: {
      free: boolean;
    };
  };
  rank: number;
  isActive: boolean;
  onClick: () => void;
}

const QuickCompareCard = ({ platform, rank, isActive, onClick }: QuickCompareCardProps) => {
  const standout = getStandoutForPlatform(platform.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[240px] p-4 rounded-2xl text-left transition-all duration-200",
        "scroll-snap-align-center cursor-pointer",
        "active:scale-[0.98]",
        isActive
          ? "bg-cyan-400/10 border border-cyan-400/30"
          : "bg-white/[0.03] border border-white/[0.08] hover:bg-cyan-400/10 hover:border-cyan-400/40"
      )}
      style={{ scrollSnapAlign: 'center' }}
    >
      {/* Rank */}
      <span className="text-[11px] font-bold text-muted-foreground mb-3 block">
        #{rank}
      </span>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={platform.logo}
          alt={platform.name}
          className="w-10 h-10 object-contain bg-white/5 rounded-[10px] p-1.5"
        />
        <h3 className="text-base font-bold text-foreground truncate">
          {platform.name}
        </h3>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-[28px] font-extrabold text-cyan-400">
          {platform.overallScore}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">/10</span>
      </div>

      {/* Standout */}
      {standout && (
        <div className="flex items-center gap-1.5 px-2.5 py-2 mb-3 bg-amber-500/10 border border-amber-500/25 rounded-lg">
          <Zap size={12} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-500 truncate">
            {standout.title}
          </span>
        </div>
      )}

      {/* Meta */}
      <div className="flex gap-2 mb-3">
        <span className={cn(
          "px-2 py-1 rounded text-[11px] font-semibold",
          platform.features.free
            ? "bg-green-500/10 text-green-500"
            : "bg-amber-500/10 text-amber-500"
        )}>
          {platform.features.free ? 'Free' : 'Paid'}
        </span>
        <span className="px-2 py-1 rounded text-[11px] font-semibold bg-white/5 text-muted-foreground">
          {platform.modelType}
        </span>
      </div>

      {/* Tap Hint */}
      <span className="block text-[11px] font-medium text-muted-foreground text-center pt-2 border-t border-white/[0.06]">
        Tap for details
      </span>
    </button>
  );
};

export default QuickCompareCard;
