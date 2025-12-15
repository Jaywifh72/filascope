import { useState } from 'react';
import { Printer, Dumbbell, Coins, Info, ChartBar, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScoreCardData, SCORE_COLORS } from '@/lib/scoreCardService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScoreCardProps {
  data: ScoreCardData;
  onMethodologyClick: () => void;
  animationDelay?: number;
}

const ICONS = {
  printer: Printer,
  strength: Dumbbell,
  value: Coins,
};

// Generate star rating (filled vs empty)
function StarRating({ score, maxScore = 10 }: { score: number; maxScore?: number }) {
  const starCount = 5;
  const filledStars = Math.round((score / maxScore) * starCount);
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: starCount }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4 transition-all',
            i < filledStars 
              ? 'fill-amber-400 text-amber-400' 
              : 'fill-muted text-muted'
          )}
          style={{ animationDelay: `${i * 50 + 300}ms` }}
        />
      ))}
    </div>
  );
}

// Progress bar for comparison
function ComparisonBar({ 
  percentile, 
  colorClass 
}: { 
  percentile: number; 
  colorClass: string;
}) {
  return (
    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
      <div 
        className={cn('h-full rounded-full transition-all duration-700 ease-out', colorClass)}
        style={{ width: `${percentile}%` }}
      />
      {/* Position marker */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-md"
        style={{ left: `calc(${percentile}% - 6px)` }}
      />
    </div>
  );
}

export function ScoreCard({ data, onMethodologyClick, animationDelay = 0 }: ScoreCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICONS[data.icon];
  const colors = SCORE_COLORS[data.rating];
  
  return (
    <div
      className={cn(
        'relative rounded-xl p-6 border-2 transition-all duration-300 min-h-[320px] flex flex-col',
        colors.bg,
        colors.border,
        isHovered && 'transform -translate-y-1 shadow-lg'
      )}
      style={{ 
        animationDelay: `${animationDelay}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', colors.text)} />
          <span className="font-semibold text-foreground">{data.label}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onMethodologyClick}
                className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="View methodology"
              >
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click for score breakdown</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Score Display */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={cn('text-4xl font-bold tabular-nums', colors.text)}>
            {data.displayScore.toFixed(1)}
          </span>
          <span className="text-xl text-muted-foreground">/10</span>
        </div>
        
        {/* Star Rating (only for scores 6+) */}
        {data.displayScore >= 4 && (
          <div className="flex justify-center mb-3">
            <StarRating score={data.displayScore} />
          </div>
        )}
        
        {/* Rating Badge */}
        <span className={cn(
          'inline-block px-3 py-1 rounded-full text-sm font-medium border',
          colors.badge
        )}>
          {data.ratingLabel}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
        {data.description}
      </p>
      
      {/* Context Note (for special cases like low PLA strength) */}
      {data.contextNote && (
        <div className="bg-amber-500/10 border-l-3 border-amber-500 rounded-r-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">{data.contextNote.icon}</span>
            <div className="flex-1">
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {data.contextNote.text}
              </p>
              {data.contextNote.linkUrl && (
                <Link 
                  to={data.contextNote.linkUrl}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-2 font-medium"
                >
                  {data.contextNote.linkLabel}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Comparison Section */}
      {data.comparison && (
        <div className="bg-muted/30 rounded-lg p-3 mb-4">
          <div className="text-xs text-muted-foreground mb-2">
            vs Other {data.comparison.materialType} Materials
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-foreground">
              You: <span className="font-semibold">{data.displayScore.toFixed(1)}</span>
            </span>
            <span className="text-muted-foreground">
              Avg: <span className="font-medium">{data.comparison.average.toFixed(1)}</span>
            </span>
          </div>
          <ComparisonBar percentile={data.comparison.percentile} colorClass={colors.fill} />
          <div className="text-xs text-right mt-1.5 font-medium" style={{ color: `hsl(var(--${data.rating === 'excellent' ? 'chart-2' : data.rating === 'good' ? 'primary' : 'chart-4'}))` }}>
            {data.comparison.position}
          </div>
        </div>
      )}
      
      {/* Methodology Link */}
      <button 
        onClick={onMethodologyClick}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-auto"
      >
        <ChartBar className="w-3.5 h-3.5" />
        See methodology
      </button>
    </div>
  );
}
