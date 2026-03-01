import { useEffect, useState } from "react";
import { SharedWishlistEmptyState } from "@/components/empty-states";
import { useParams, Link } from "react-router-dom";
import { Heart, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlistShare } from "@/hooks/useWishlistShare";

interface SharedItem {
  id: string;
  filament_id: string;
  tags: string[];
  created_at: string;
  filament: {
    id: string;
    product_title: string;
    vendor: string | null;
    material: string | null;
    featured_image: string | null;
    variant_price: number | null;
    net_weight_g: number | null;
    color_hex: string | null;
  } | null;
}

const SharedWishlist = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { getSharedWishlist } = useWishlistShare();
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<string>("Shared Wishlist");
  const [items, setItems] = useState<SharedItem[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!shareCode) return;

      const result = await getSharedWishlist(shareCode);

      if (!result) {
        setNotFound(true);
      } else {
        setTitle(result.share.title || "Shared Wishlist");
        setItems(result.items);
      }

      setIsLoading(false);
    };

    loadWishlist();
  }, [shareCode]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <Heart className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold mb-4">Wishlist Not Found</h1>
        <p className="text-muted-foreground mb-8">
          This wishlist may have expired or been removed.
        </p>
        <Button asChild>
          <Link to="/materials">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Filaments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          <p className="text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} in this wishlist
          </p>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <SharedWishlistEmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const trueCost =
                item.filament?.variant_price && item.filament?.net_weight_g
                  ? (item.filament.variant_price / item.filament.net_weight_g) * 1000
                  : null;

              return (
                <Link
                  key={item.id}
                  to={`/filament/${item.filament_id}`}
                  className="group block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  {/* Image */}
                  <div className="h-40 bg-muted overflow-hidden">
                    {item.filament?.featured_image ? (
                      <img
                        src={item.filament.featured_image}
                        alt={item.filament.product_title}
                        width={400}
                        height={160}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: item.filament?.color_hex || "#333" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {item.filament?.product_title || "Unknown"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{item.filament?.vendor}</span>
                      {item.filament?.material && (
                        <>
                          <span>•</span>
                          <span>{item.filament.material}</span>
                        </>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-3">
                      {item.filament?.variant_price && (
                        <span className="font-mono font-semibold text-primary">
                          ${item.filament.variant_price.toFixed(2)}
                        </span>
                      )}
                      {trueCost && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ${trueCost.toFixed(2)}/kg
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to create your own wishlist?
          </p>
          <Button asChild variant="outline">
            <Link to="/materials">
              Browse Filaments
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharedWishlist;
