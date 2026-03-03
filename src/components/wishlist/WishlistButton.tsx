import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { WishlistDropdown } from "./WishlistDropdown";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function WishlistButton() {
  const { user } = useAuth();
  const { items, stats, isLoading } = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const prevCount = useRef(stats.totalItems);
  const [countBounce, setCountBounce] = useState(false);
  const [firstItemPulse, setFirstItemPulse] = useState(false);

  // Detect count changes for bounce animation
  useEffect(() => {
    if (stats.totalItems > prevCount.current) {
      setCountBounce(true);
      const timer = setTimeout(() => setCountBounce(false), 400);

      // First item pulse (0 -> 1)
      if (prevCount.current === 0 && stats.totalItems === 1) {
        setFirstItemPulse(true);
        const pulseTimer = setTimeout(() => setFirstItemPulse(false), 600);
        prevCount.current = stats.totalItems;
        return () => { clearTimeout(timer); clearTimeout(pulseTimer); };
      }

      prevCount.current = stats.totalItems;
      return () => clearTimeout(timer);
    }
    prevCount.current = stats.totalItems;
  }, [stats.totalItems]);

  const handleClick = () => {
    setOpen(false);
    navigate("/vault");
  };

  if (!user) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => navigate("/auth")}
            aria-label="Sign in to access wishlist"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
          Saved Items
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                firstItemPulse && "wishlist-nav-pulse"
              )}
              aria-label={`Saved Items${stats.totalItems > 0 ? `, ${stats.totalItems} items` : ''}`}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  stats.totalItems > 0 && "fill-rose-500 text-rose-500"
                )}
              />
              {stats.totalItems > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 transition-transform",
                  countBounce && "wishlist-count-bounce"
                )}>
                  {stats.totalItems}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
            {stats.totalItems > 0 ? `Saved Items (${stats.totalItems})` : "Saved Items"}
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        <WishlistDropdown
          items={items.slice(0, 3)}
          stats={stats}
          isLoading={isLoading}
          onViewAll={handleClick}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
