import { FlaskConical, Users, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityRatingStats } from '@/hooks/useCommunityRatings';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CommunityVsLabScoreProps {
  labScore: number | null;
  communityStats: CommunityRatingStats | null;
  scoreLabel: string;
  onViewReviews?: () => void;
}

export function CommunityVsLabScore({ 
  labScore, 
  communityStats, 
  scoreLabel,
  onViewReviews 
}: CommunityVsLabScoreProps) {
  // Convert 5-star rating to 10-point scale
  const communityScore = communityStats ? communityStats.averageRating * 2 : null;
  
  const hasLabScore = labScore !== null;
  const hasCommunityScore = communityStats !== null && communityStats.totalReviews > 0;

  if (!hasLabScore && !hasCommunityScore) {
    return null;
  }

  const scoreDiff = hasLabScore && hasCommunityScore 
    ? Math.abs((labScore || 0) - (communityScore || 0))
    : 0;
  
  const scoresMatch = scoreDiff < 1;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
      {/* Header */}
      <div className="text-xs font-medium text-muted-foreground mb-3">
        Score Sources
      </div>

      <div className="space-y-4">
        {/* Lab Score */}
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-cyan-500/10">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Lab Score</span>
              {hasLabScore ? (
                <span className="text-lg font-bold text-cyan-400">
                  {labScore?.toFixed(1)}<span className="text-xs text-muted-foreground">/10</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">No data</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Standardized testing
            </p>
          </div>
        </div>

        {/* Community Score */}
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-amber-500/10">
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Community Score</span>
              {hasCommunityScore ? (
                <span className="text-lg font-bold text-amber-400">
                  {communityScore?.toFixed(1)}<span className="text-xs text-muted-foreground">/10</span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">No reviews yet</span>
              )}
            </div>
            {hasCommunityScore && communityStats && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {communityStats.totalReviews} reviews
              </p>
            )}
          </div>
        </div>

        {/* Distribution bars */}
        {hasCommunityScore && communityStats && (
          <div className="space-y-1.5 pt-2 border-t border-border/30">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-green-400">Positive</span>
                  <span className="text-muted-foreground">({communityStats.positiveCount})</span>
                </div>
                <Progress 
                  value={(communityStats.positiveCount / communityStats.totalReviews) * 100} 
                  className="h-1.5 bg-muted/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-amber-400">Mixed</span>
                  <span className="text-muted-foreground">({communityStats.mixedCount})</span>
                </div>
                <Progress 
                  value={(communityStats.mixedCount / communityStats.totalReviews) * 100} 
                  className="h-1.5 bg-muted/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-red-400">Negative</span>
                  <span className="text-muted-foreground">({communityStats.negativeCount})</span>
                </div>
                <Progress 
                  value={(communityStats.negativeCount / communityStats.totalReviews) * 100} 
                  className="h-1.5 bg-muted/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Match indicator */}
        {hasLabScore && hasCommunityScore && (
          <div className={cn(
            "flex items-center gap-2 text-xs p-2 rounded-md",
            scoresMatch ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
          )}>
            {scoresMatch ? (
              <>
                <Star className="w-3.5 h-3.5" />
                <span>Lab and community scores align closely</span>
              </>
            ) : (
              <>
                <Star className="w-3.5 h-3.5" />
                <span>Real-world experience differs from lab results</span>
              </>
            )}
          </div>
        )}

        {/* View reviews button */}
        {hasCommunityScore && onViewReviews && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={onViewReviews}
          >
            See community reviews
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
