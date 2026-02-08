import { useState, useEffect } from "react";
import { Heart, Plus, Check, Folder, Star, Printer, DollarSign, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWishlistCollections } from "@/hooks/useWishlistCollections";
import { useCollectionActions } from "@/hooks/useCollectionItems";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  printer: <Printer className="h-4 w-4" />,
  dollar: <DollarSign className="h-4 w-4" />,
  wrench: <Wrench className="h-4 w-4" />,
};

interface CollectionPickerProps {
  filamentId: string;
  currentPrice?: number | null;
  size?: "default" | "sm" | "lg";
}

export function CollectionPicker({ filamentId, currentPrice, size = "default" }: CollectionPickerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { collections, createCollection, refetch: refetchCollections } = useWishlistCollections();
  const { addToCollection, removeFromCollection } = useCollectionActions();
  const { isInWishlist, addToWishlist, removeFromWishlist, refetch: refetchWishlist } = useWishlist();
  const [memberCollections, setMemberCollections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isLiked = isInWishlist(filamentId);

  // Fetch which collections this filament belongs to
  useEffect(() => {
    if (!user || !isOpen) return;
    (async () => {
      const { data } = await supabase
        .from("user_favorites")
        .select("collection_id")
        .eq("user_id", user.id)
        .eq("filament_id", filamentId);
      
      const ids = new Set<string>();
      (data || []).forEach((d: any) => {
        if (d.collection_id) ids.add(d.collection_id);
      });
      setMemberCollections(ids);
    })();
  }, [user, filamentId, isOpen]);

  if (!user) {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate("/auth");
        }}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Sign in to save"
      >
        <Heart className="w-4 h-4" />
      </Button>
    );
  }

  const handleQuickToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    if (isLiked) {
      await removeFromWishlist(filamentId);
    } else {
      await addToWishlist(filamentId, { priceWhenAdded: currentPrice || undefined });
    }

    setIsLoading(false);
  };

  const handleCollectionToggle = async (collectionId: string) => {
    setIsLoading(true);
    if (memberCollections.has(collectionId)) {
      await removeFromCollection(filamentId, collectionId);
      setMemberCollections((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    } else {
      await addToCollection(filamentId, collectionId, currentPrice || undefined);
      setMemberCollections((prev) => new Set(prev).add(collectionId));
      // Also ensure it's in the main wishlist (null collection)
      if (!isLiked) {
        await addToWishlist(filamentId, { priceWhenAdded: currentPrice || undefined });
      }
    }
    refetchWishlist();
    setIsLoading(false);
  };

  const handleCreateAndAdd = async () => {
    const name = prompt("Collection name:");
    if (!name?.trim()) return;

    setIsLoading(true);
    const collection = await createCollection(name.trim());
    if (collection) {
      await addToCollection(filamentId, collection.id, currentPrice || undefined);
      if (!isLiked) {
        await addToWishlist(filamentId, { priceWhenAdded: currentPrice || undefined });
      }
      refetchCollections();
      refetchWishlist();
    }
    setIsLoading(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
          disabled={isLoading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "transition-colors",
            isLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={isLiked ? "Manage collections" : "Add to collection"}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick toggle all */}
        <DropdownMenuItem onClick={handleQuickToggle}>
          <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-red-500 text-red-500")} />
          {isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Collection list */}
        {collections.map((collection) => (
          <DropdownMenuItem
            key={collection.id}
            onClick={() => handleCollectionToggle(collection.id)}
          >
            <span className="mr-2">
              {ICON_MAP[collection.icon] || <Folder className="h-4 w-4" />}
            </span>
            <span className="flex-1 truncate">{collection.name}</span>
            {memberCollections.has(collection.id) && (
              <Check className="h-4 w-4 ml-2 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateAndAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
