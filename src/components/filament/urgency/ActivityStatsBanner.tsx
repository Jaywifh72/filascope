import React from 'react';
import { Eye, ShoppingBag, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofData {
  viewingNow?: number;
  purchasedToday?: number;
  purchasedThisWeek?: number;
  isBestseller?: boolean;
  bestsellerRank?: number;
  bestsellerCategory?: string;
}

interface ActivityStatsBannerProps {
  socialProof: SocialProofData;
  compact?: boolean;
  className?: string;
}

export function ActivityStatsBanner({ 
  socialProof, 
  compact = false,
  className
}: ActivityStatsBannerProps) {
  const { 
    viewingNow = 0, 
    purchasedToday = 0, 
    purchasedThisWeek = 0, 
    isBestseller = false, 
    bestsellerRank,
    bestsellerCategory 
  } = socialProof;

  // Don't render if no meaningful data
  const hasData = viewingNow > 3 || purchasedToday > 0 || purchasedThisWeek > 20 || isBestseller;
  if (!hasData) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4 flex-wrap", className)}>
        {viewingNow > 3 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            {viewingNow} viewing
          </div>
        )}
        {purchasedToday > 5 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            {purchasedToday} sold today
          </div>
        )}
        {isBestseller && bestsellerRank && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <Trophy className="w-3.5 h-3.5" />
            #{bestsellerRank} Bestseller
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Bestseller badge */}
      {isBestseller && bestsellerRank && (
        <div className={cn(
          "inline-flex items-center gap-2.5 self-start",
          "px-4 py-2.5",
          "bg-gradient-to-r from-amber-500/15 to-amber-500/5",
          "border border-amber-500/30 rounded-lg"
        )}>
          <Trophy className="w-[18px] h-[18px] text-amber-500" />
          <div>
            <div className="text-sm font-bold text-amber-500">
              #{bestsellerRank} Bestseller
            </div>
            {bestsellerCategory && (
              <div className="text-[11px] font-medium text-muted-foreground">
                in {bestsellerCategory}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity stats */}
      <div className="flex items-center gap-5 flex-wrap">
        {viewingNow > 3 && (
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-white">{viewingNow}</span>
              <span className="text-xs font-medium text-muted-foreground">viewing now</span>
            </div>
          </div>
        )}

        {purchasedToday > 0 && (
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-white">{purchasedToday}</span>
              <span className="text-xs font-medium text-muted-foreground">sold today</span>
            </div>
          </div>
        )}

        {purchasedThisWeek > 20 && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-white">{purchasedThisWeek}+</span>
              <span className="text-xs font-medium text-muted-foreground">this week</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
