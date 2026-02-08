import { Link } from "react-router-dom";
import type { WishlistItem } from "@/hooks/usePublicProfile";

interface ProfileCollectionTabProps {
  items: WishlistItem[];
}

export function ProfileCollectionTab({ items }: ProfileCollectionTabProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Collection is empty</p>
        <p className="text-sm mt-1">No items in the public collection yet.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{items.length} item{items.length !== 1 ? "s" : ""}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <CollectionCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CollectionCard({ item }: { item: WishlistItem }) {
  const filament = item.filament;
  if (!filament) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/50 p-4 text-sm text-muted-foreground">
        Filament unavailable
      </div>
    );
  }

  return (
    <Link
      to={`/filament/${filament.id}`}
      className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-colors"
    >
      <div className="aspect-[3/2] bg-muted/30 relative overflow-hidden">
        {filament.featured_image ? (
          <img
            src={filament.featured_image}
            alt={filament.product_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : filament.color_hex ? (
          <div className="w-full h-full" style={{ backgroundColor: filament.color_hex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground truncate">{filament.vendor}</p>
        <p className="text-sm font-medium truncate mt-0.5">{filament.product_title}</p>
        {filament.material && (
          <p className="text-xs text-muted-foreground mt-1">{filament.material}</p>
        )}
      </div>
    </Link>
  );
}
