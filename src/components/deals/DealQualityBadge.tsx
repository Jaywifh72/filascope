import { Badge } from "@/components/ui/badge";
import { TrendingDown, Clock, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface DealQualityBadgeProps {
  discount: number;
  isUnusualDiscount: boolean;
  createdAt: string | null | undefined;
  lastScrapedAt: string | null | undefined;
  className?: string;
}

/**
 * Returns a contextual label for a deal based on its quality and age.
 * - "Everyday Price" for deals stable >30 days
 * - "vs. MSRP" for unusual discounts
 * - "Ongoing" for deals active 14-30 days
 * - "New" for deals <3 days old  
 * - No label for normal deals
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

  // Deal active >30 days at same discount — it's an everyday price, not a real deal
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
