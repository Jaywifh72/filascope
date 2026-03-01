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
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-primary transition-colors duration-200"
        onClick={() => navigate("/auth")}
        aria-label="Sign in to access wishlist"
      >
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative opacity-60 hover:opacity-100 text-muted-foreground hover:text-primary transition-all duration-200",
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
