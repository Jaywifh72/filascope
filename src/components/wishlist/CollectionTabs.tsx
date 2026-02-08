import { Plus, Folder, Star, Printer, DollarSign, Wrench, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistCollection } from "@/hooks/useWishlistCollections";
import { cn } from "@/lib/utils";

interface CollectionTabsProps {
  collections: WishlistCollection[];
  selectedCollectionId: string | null;
  totalCount: number;
  onSelectCollection: (id: string | null) => void;
  onCreateCollection: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  printer: <Printer className="h-4 w-4" />,
  dollar: <DollarSign className="h-4 w-4" />,
  wrench: <Wrench className="h-4 w-4" />,
};

export function CollectionTabs({
  collections,
  selectedCollectionId,
  totalCount,
  onSelectCollection,
  onCreateCollection,
}: CollectionTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Items */}
      <Button
        variant={selectedCollectionId === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCollection(null)}
        className={cn(
          "flex-shrink-0",
          selectedCollectionId === null && "bg-primary text-primary-foreground"
        )}
      >
        <Folder className="h-4 w-4 mr-2" />
        All
        <span className="ml-2 text-xs opacity-70">({totalCount})</span>
      </Button>

      {/* Collections */}
      {collections.map((collection) => (
        <Button
          key={collection.id}
          variant={selectedCollectionId === collection.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCollection(collection.id)}
          className={cn(
            "flex-shrink-0",
            selectedCollectionId === collection.id && "bg-primary text-primary-foreground"
          )}
          style={{
            borderColor:
              selectedCollectionId !== collection.id ? collection.color : undefined,
          }}
        >
          {ICON_MAP[collection.icon] || <Folder className="h-4 w-4" />}
          <span className="ml-2">{collection.name}</span>
          <span className="ml-1.5 text-xs opacity-70">({collection.item_count || 0})</span>
          {collection.is_public ? (
            <Globe className="h-3 w-3 ml-1.5 opacity-50" />
          ) : (
            <Lock className="h-3 w-3 ml-1.5 opacity-50" />
          )}
        </Button>
      ))}

      {/* Create New */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateCollection}
        className="flex-shrink-0 border border-dashed border-border"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Collection
      </Button>
    </div>
  );
}
