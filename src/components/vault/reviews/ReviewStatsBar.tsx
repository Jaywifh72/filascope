import { Star, ThumbsUp, Award, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewStats } from "@/hooks/useVaultReviews";

interface ReviewStatsBarProps {
  stats: ReviewStats;
}

const RANK_STYLES = {
  new: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary border-primary/20",
  top: "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)] border-[hsl(45,93%,47%)]/20",
};

const RANK_ICONS = {
  new: MessageSquare,
  active: Star,
  top: Award,
};

export function ReviewStatsBar({ stats }: ReviewStatsBarProps) {
  const RankIcon = RANK_ICONS[stats.reviewerRank];

  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Total Reviews */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{stats.totalReviews}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>

          {/* Average Rating */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[hsl(45,93%,47%)]/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-[hsl(45,93%,47%)] fill-[hsl(45,93%,47%)]" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </div>

          {/* Helpful Votes */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent/50 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-foreground/70" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{stats.totalHelpfulVotes}</p>
              <p className="text-xs text-muted-foreground">Helpful Votes</p>
            </div>
          </div>

          {/* Reviewer Rank */}
          <div className="ml-auto">
            <Badge
              variant="outline"
              className={cn("gap-1.5 px-3 py-1", RANK_STYLES[stats.reviewerRank])}
            >
              <RankIcon className="w-3.5 h-3.5" />
              {stats.rankLabel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
