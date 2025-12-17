import { ChevronDown, Zap, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import { RatingLevel } from '@/lib/platformData';
import RatingValue from '../shared/RatingValue';

interface MobilePlatformCardProps {
  platform: {
    id: string;
    name: string;
    owner: string;
    logo: string;
    overallScore: number;
    modelType: string;
    ratings: {
      quality: string;
      community: string;
      search: string;
      ux: string;
      monetization: string;
    };
    features: {
      free: boolean;
      mobile: boolean;
    };
    fileTypes: string[];
    bestFor: string;
    websiteUrl: string;
  };
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const MobilePlatformCard = ({ platform, rank, isExpanded, onToggle }: MobilePlatformCardProps) => {
  const standout = getStandoutForPlatform(platform.id);

  const getTierBadge = () => {
    if (rank === 1) return { icon: '🏆', label: 'Staff Pick' };
    if (rank <= 3) return { icon: '⭐', label: 'Top Pick' };
    return null;
  };

  const tierBadge = getTierBadge();

  const getModelTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'loss-leader': return 'text-purple-400';
      case 'hybrid': return 'text-cyan-400';
      case 'marketplace': return 'text-green-400';
      case 'ad-supported': return 'text-amber-400';
      case 'freemium': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <article className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden transition-colors hover:border-white/[0.12]">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Left: Rank & Tier */}
        <div className="flex flex-col items-center gap-1 min-w-[50px]">
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
          {tierBadge && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
              <span className="text-xs">{tierBadge.icon}</span>
              <span className="hidden">{tierBadge.label}</span>
            </span>
          )}
        </div>

        {/* Center: Logo & Name */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <img
            src={platform.logo}
            alt={platform.name}
            className="w-11 h-11 object-contain bg-white/5 rounded-[10px] p-1.5 flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{platform.name}</h3>
            <span className="text-xs font-medium text-muted-foreground">{platform.owner}</span>
          </div>
        </div>

        {/* Right: Score & Chevron */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-extrabold text-cyan-400">{platform.overallScore}</span>
            <span className="text-xs font-semibold text-muted-foreground">/10</span>
          </div>
          <ChevronDown
            size={18}
            className={cn(
              "text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Standout - Always Visible */}
      {standout && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-[10px]">
          <Zap size={14} className="text-amber-500 flex-shrink-0" />
          <span className="text-[13px] font-semibold text-amber-500 truncate">
            {standout.title}
          </span>
        </div>
      )}

      {/* Quick Stats - Always Visible */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-4">
        <div className="flex flex-col items-center gap-1.5 py-2.5 bg-white/[0.02] rounded-lg">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Quality</span>
          <RatingValue rating={platform.ratings.quality as RatingLevel} size="small" />
        </div>
        <div className="flex flex-col items-center gap-1.5 py-2.5 bg-white/[0.02] rounded-lg">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Type</span>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", getModelTypeColor(platform.modelType))}>
            {platform.modelType.split('-')[0]}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 py-2.5 bg-white/[0.02] rounded-lg">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Price</span>
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded",
            platform.features.free ? "bg-green-500/15 text-green-500" : "bg-amber-500/15 text-amber-500"
          )}>
            {platform.features.free ? 'Free' : 'Paid'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 py-2.5 bg-white/[0.02] rounded-lg">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mobile</span>
          <span className={cn("text-sm font-bold", platform.features.mobile ? "text-green-500" : "text-muted-foreground")}>
            {platform.features.mobile ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Expanded Section */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-400",
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 space-y-4">
          {/* All Ratings */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-white/[0.02] rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-muted-foreground">Quality</span>
              <RatingValue rating={platform.ratings.quality as RatingLevel} size="small" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-muted-foreground">Community</span>
              <RatingValue rating={platform.ratings.community as RatingLevel} size="small" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-muted-foreground">Search</span>
              <RatingValue rating={platform.ratings.search as RatingLevel} size="small" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-semibold text-muted-foreground">UX</span>
              <RatingValue rating={platform.ratings.ux as RatingLevel} size="small" />
            </div>
            <div className="flex justify-between items-center col-span-2">
              <span className="text-[13px] font-semibold text-muted-foreground">Monetization</span>
              <RatingValue rating={platform.ratings.monetization as RatingLevel} size="small" />
            </div>
          </div>

          {/* Best For */}
          <div className="p-3.5 bg-cyan-400/5 border border-cyan-400/15 rounded-[10px]">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide mb-2">Best For</div>
            <p className="text-sm font-medium text-foreground/90 leading-relaxed">{platform.bestFor}</p>
          </div>

          {/* Standout Description */}
          {standout && (
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-[10px]">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-500">Why It Stands Out</span>
              </div>
              <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
                {standout.fullDescription}
              </p>
            </div>
          )}

          {/* File Types */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">File Types:</span>
            <div className="flex gap-1.5 flex-wrap">
              {platform.fileTypes.map(type => (
                <span key={type} className="px-2 py-1 bg-white/5 rounded text-[11px] font-semibold text-muted-foreground">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Always Visible */}
      <div className="flex gap-2.5 p-4 border-t border-white/[0.06]">
        <button
          onClick={onToggle}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-transparent border border-white/15 rounded-[10px] text-sm font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground active:scale-[0.98] transition-all"
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
          <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
        </button>
        <a
          href={platform.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-cyan-400 rounded-[10px] text-sm font-bold text-background hover:bg-cyan-300 active:scale-[0.98] transition-all"
        >
          Visit Site
          <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
};

export default MobilePlatformCard;
