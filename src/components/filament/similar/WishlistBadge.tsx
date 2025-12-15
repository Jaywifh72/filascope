import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface WishlistBadgeProps {
  savedDate?: string | null;
  variant?: "default" | "compact";
}

export function WishlistBadge({ savedDate, variant = "default" }: WishlistBadgeProps) {
  const formattedDate = savedDate ? format(new Date(savedDate), "MMM d, yyyy") : null;

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-sm">
              On your wishlist
              {formattedDate && <span className="text-muted-foreground"> · Saved {formattedDate}</span>}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs cursor-help"
          >
            <Star className="mr-1 h-3 w-3 fill-current" />
            On your wishlist
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">
            You saved this material
            {formattedDate && <span className="text-muted-foreground"> on {formattedDate}</span>}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
