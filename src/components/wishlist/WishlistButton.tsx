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
        className="relative text-gray-400 hover:text-teal-400 transition-colors duration-200"
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
          className="relative opacity-60 hover:opacity-100 text-gray-400 hover:text-teal-400 transition-all duration-200"
          aria-label={`Saved Items${stats.totalItems > 0 ? `, ${stats.totalItems} items` : ''}`}
        >
          <Heart
            className={`h-5 w-5 ${stats.totalItems > 0 ? "fill-teal-500 text-teal-500" : ""}`}
          />
          {stats.totalItems > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-teal-500" />
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
