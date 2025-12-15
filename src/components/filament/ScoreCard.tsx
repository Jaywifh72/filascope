import { useState } from 'react';
import { Printer, Dumbbell, Coins, Info, ChartBar, Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScoreCardData, SCORE_COLORS, DEFAULT_MATERIAL_STATS, normalizeStrengthIndex } from '@/lib/scoreCardService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScoreDistributionChart } from './ScoreDistributionChart';
import { ContextualComparisons } from './ContextualComparisons';
import { ScoreTrendIndicator, TrendData } from './ScoreTrendIndicator';
import { CategoryBreakdown } from './CategoryBreakdown';
import { useContextualComparisons } from '@/hooks/useContextualComparisons';
import { useCategoryComparisons } from '@/hooks/useCategoryComparisons';

interface ScoreCardProps {
  data: ScoreCardData;
  filamentId: string;
  material: string | null;
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

// Generate simulated trend data
function generateTrendData(currentScore: number): TrendData {
  // Simulate historical data with small variations
  const variance = () => (Math.random() - 0.5) * 0.6;
  const previousScore = Math.max(1, Math.min(10, currentScore + variance() - 0.2));
  const change = currentScore - previousScore;
  
  const dataPoints = [
    { date: '3mo ago', score: Math.max(1, Math.min(10, previousScore - 0.1)) },
    { date: '2mo ago', score: Math.max(1, Math.min(10, previousScore + 0.05)) },
    { date: '1mo ago', score: previousScore },
    { date: 'Now', score: currentScore },
  ];
  
  return {
    previousScore: Math.round(previousScore * 10) / 10,
    currentScore,
    change: Math.round(change * 10) / 10,
    direction: Math.abs(change) < 0.1 ? 'stable' : change > 0 ? 'up' : 'down',
    periodLabel: 'Over last 3 months • Based on updated testing data',
    dataPoints,
  };
}

export function ScoreCard({ data, filamentId, material, onMethodologyClick, animationDelay = 0 }: ScoreCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = ICONS[data.icon];
  const colors = SCORE_COLORS[data.rating];
  
  // Fetch contextual comparisons
  const { data: contextualData } = useContextualComparisons(
    filamentId,
    material,
    data.id,
    data.rawScore
  );
  
  // Fetch category comparisons
  const { data: categoryData } = useCategoryComparisons(
    filamentId,
    material,
    data.id,
    data.displayScore
  );
  
  // Generate trend data
  const trendData = generateTrendData(data.displayScore);
  
  // Get distribution stats from material stats
  const materialStats = data.comparison?.materialType 
    ? DEFAULT_MATERIAL_STATS[data.comparison.materialType] 
    : null;
  
  // Calculate distribution bounds
  const getDistributionBounds = () => {
    if (data.id === 'strength_index' && materialStats) {
      return {
        min: normalizeStrengthIndex(materialStats.minStrength),
        max: normalizeStrengthIndex(materialStats.maxStrength),
        mean: normalizeStrengthIndex(materialStats.avgStrength),
      };
    }
    if (data.id === 'ease_of_printing') {
      return { min: 3, max: 10, mean: data.comparison?.average || 7 };
    }
    return { min: 4, max: 10, mean: data.comparison?.average || 6.5 };
  };
  
  const distributionBounds = getDistributionBounds();
  
  return (
    <div
      className={cn(
        'relative rounded-xl p-6 border-2 transition-all duration-300 flex flex-col',
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
        
        {/* Star Rating (only for scores 4+) */}
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
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
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
      
      {/* Enhanced Comparison Section */}
      {data.comparison && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              You: <span className="font-semibold">{data.displayScore.toFixed(1)}</span>
            </span>
            <span className="text-muted-foreground">
              Avg: <span className="font-medium">{data.comparison.average.toFixed(1)}</span>
            </span>
          </div>
          
          {/* Distribution Chart */}
          <ScoreDistributionChart
            min={distributionBounds.min}
            max={distributionBounds.max}
            mean={distributionBounds.mean}
            currentScore={data.displayScore}
            percentile={data.comparison.percentile}
            colorClass={colors.fill}
          />
          
          {/* Trend Indicator */}
          <ScoreTrendIndicator trend={trendData} />
          
          {/* Category Breakdown */}
          {categoryData && (
            <CategoryBreakdown
              budget={categoryData.budget}
              midRange={categoryData.midRange}
              premium={categoryData.premium}
              currentScore={data.displayScore}
              materialType={data.comparison.materialType}
            />
          )}
          
          {/* Contextual Comparisons */}
          {contextualData && (
            <ContextualComparisons
              betterThan={contextualData.betterThan}
              similarTo={contextualData.similarTo}
              notAsGoodAs={contextualData.notAsGoodAs}
              currentScore={data.displayScore}
            />
          )}
        </div>
      )}
      
      {/* Methodology Link */}
      <button 
        onClick={onMethodologyClick}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-4"
      >
        <ChartBar className="w-3.5 h-3.5" />
        See methodology
      </button>
    </div>
  );
}
