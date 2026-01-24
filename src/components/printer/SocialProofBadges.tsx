import { Star, Award } from "lucide-react";

interface SocialProofBadgesProps {
  isStaffPick?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
}

export function SocialProofBadges({
  isStaffPick = false,
  rating,
  reviewCount,
}: SocialProofBadgesProps) {
  const hasRating = rating !== null && rating !== undefined && rating > 0;
  const hasReviews = reviewCount !== null && reviewCount !== undefined && reviewCount > 0;

  if (!isStaffPick && !hasRating) return null;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {isStaffPick && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30">
          <Award className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Staff Pick</span>
        </div>
      )}

      {isStaffPick && hasRating && (
        <span className="text-muted-foreground/40">|</span>
      )}

      {hasRating && (
        <div className="inline-flex items-center gap-1.5">
          <Star size={16} className="fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
          <span className="text-sm font-semibold text-foreground">
            {rating.toFixed(1)}/5
          </span>
          {hasReviews && (
            <span className="text-sm text-muted-foreground">
              ({reviewCount} reviews)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
