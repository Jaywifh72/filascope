import { Badge } from "@/components/ui/badge";
import { TrendingDown, Clock, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DealQualityBadgeProps {
  discount: number;
  isUnusualDiscount: boolean;
  createdAt: string | null | undefined;
  lastScrapedAt: string | null | undefined;
  className?: string;
}

/**
 * Computes a 0-5 deal quality score based on discount, freshness, and unusualness.
 */
export function getDealQualityScore(
  discount: number,
  isUnusualDiscount: boolean,
  lastScrapedAt: string | null | undefined
): number {
  let score = 0;
  // Discount magnitude (0-2 points)
  if (discount >= 50) score += 2;
  else if (discount >= 30) score += 1;
  // Freshness (0-1.5 points)
  const daysSinceScraped = lastScrapedAt
    ? differenceInDays(new Date(), new Date(lastScrapedAt))
    : 999;
  if (daysSinceScraped <= 3) score += 1.5;
  else if (daysSinceScraped <= 7) score += 1;
  else if (daysSinceScraped <= 14) score += 0.5;
  // Unusual deal bonus (0-1.5 points)
  if (isUnusualDiscount) score += 1.5;
  return Math.min(5, Math.round(score * 10) / 10);
}

/**
 * Renders a row of 5 dots indicating deal quality score.
 */
export function DealQualityDots({
  discount,
  isUnusualDiscount,
  lastScrapedAt,
}: {
  discount: number;
  isUnusualDiscount: boolean;
  lastScrapedAt: string | null | undefined;
}) {
  const score = getDealQualityScore(discount, isUnusualDiscount, lastScrapedAt);
  const filledCount = Math.floor(score);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={`Deal quality score: ${score} out of 5`}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i <= filledCount
                    ? score >= 4
                      ? "bg-emerald-400"
                      : score >= 2.5
                        ? "bg-teal-400"
                        : "bg-muted-foreground/50"
                    : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Deal quality: {score}/5
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Returns a contextual label for a deal based on its quality and age.
 */
export function DealQualityBadge({
  discount,
  isUnusualDiscount,
  createdAt,
  lastScrapedAt,
  className,
}: DealQualityBadgeProps) {
  const dealAge = createdAt
    ? differenceInDays(new Date(), new Date(createdAt))
    : null;

  // Deal active >30 days at same discount — it's an everyday price
  if (dealAge !== null && dealAge > 30) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] border-muted bg-muted/30 text-muted-foreground",
          className
        )}
      >
        <Tag className="h-3 w-3" />
        Everyday Price
      </Badge>
    );
  }

  // Unusual discount — likely MSRP vs marketplace price
  if (isUnusualDiscount) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400",
          className
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        vs. MSRP
      </Badge>
    );
  }

  // Deal active 14-30 days — ongoing
  if (dealAge !== null && dealAge >= 14) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] border-muted bg-muted/30 text-muted-foreground",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        Ongoing
      </Badge>
    );
  }

  // New deal (<3 days)
  if (dealAge !== null && dealAge < 3) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] border-green-500/30 bg-green-500/10 text-green-400",
          className
        )}
      >
        <TrendingDown className="h-3 w-3" />
        New Deal
      </Badge>
    );
  }

  return null;
}
