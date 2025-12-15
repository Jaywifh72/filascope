import { useState } from "react";
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

export function WishlistButton() {
  const { user } = useAuth();
  const { items, stats, isLoading } = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setOpen(false);
    navigate("/vault");
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        onClick={() => navigate("/auth")}
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
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Heart
            className={`h-5 w-5 ${stats.totalItems > 0 ? "fill-red-500 text-red-500" : ""}`}
          />
          {stats.totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {stats.totalItems > 99 ? "99+" : stats.totalItems}
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
