import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Filter,
  ArrowUpDown,
  Grid3X3,
  List,
  Loader2,
} from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useWishlistCollections } from "@/hooks/useWishlistCollections";
import { useAuth } from "@/hooks/useAuth";
import { useVaultProfile } from "@/hooks/useVaultProfile";
import { WishlistItemCard } from "@/components/wishlist/WishlistItem";
import { CollectionTabs } from "@/components/wishlist/CollectionTabs";
import { CollectionDialog } from "@/components/wishlist/CollectionDialog";
import { CollectionHeader } from "@/components/wishlist/CollectionHeader";
import { ShareWishlistDialog } from "@/components/wishlist/ShareWishlistDialog";
import { VaultEmptyState } from "./VaultEmptyState";

export function VaultWishlistTab() {
  const { user } = useAuth();
  const { profile } = useVaultProfile();
  const { items, stats, updateItem, removeFromWishlist, refetch: refetchWishlist } = useWishlist();
  const {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch: refetchCollections,
  } = useWishlistCollections();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "price" | "name" | "brand" | "rating">("date");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const username = (profile as any)?.username_slug || null;

  const selectedCollection = selectedCollectionId
    ? collections.find((c) => c.id === selectedCollectionId) || null
    : null;

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (selectedCollectionId) {
      result = result.filter((item) => item.collection_id === selectedCollectionId);
    }
    if (filterTag) {
      result = result.filter((item) => item.tags?.includes(filterTag));
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return (a.filament?.variant_price || 0) - (b.filament?.variant_price || 0);
        case "name":
          return (a.filament?.product_title || "").localeCompare(b.filament?.product_title || "");
        case "brand":
          return (a.filament?.vendor || "").localeCompare(b.filament?.vendor || "");
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [items, selectedCollectionId, filterTag, sortBy]);

  const totalValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      return sum + (item.filament?.variant_price || 0);
    }, 0);
  }, [filteredItems]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [items]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleRemoveSelected = async () => {
    for (const itemId of selectedItems) {
      const item = items.find((i) => i.id === itemId);
      if (item) await removeFromWishlist(item.filament_id);
    }
    setSelectedItems(new Set());
  };

  const handleMoveSelected = async (collectionId: string | null) => {
    for (const itemId of selectedItems) {
      await updateItem(itemId, { collection_id: collectionId });
    }
    setSelectedItems(new Set());
    refetchWishlist();
  };

  const handleCreateCollection = async (data: any) => {
    await createCollection(data.name, {
      description: data.description,
      icon: data.icon,
      color: data.color,
      is_public: data.is_public,
    });
    setShowCollectionDialog(false);
    refetchCollections();
  };

  const handleUpdateCollection = async (data: any) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, {
        ...data,
        is_public: data.is_public,
      });
      setEditingCollection(null);
      refetchCollections();
    }
  };

  const handleDeleteCollection = async () => {
    if (editingCollection) {
      await deleteCollection(editingCollection.id);
      setEditingCollection(null);
      setSelectedCollectionId(null);
      refetchCollections();
    }
  };

  const handleTogglePublic = async (isPublic: boolean) => {
    if (selectedCollection) {
      await updateCollection(selectedCollection.id, { is_public: isPublic });
      refetchCollections();
    }
  };

  const handleItemTagAdd = async (itemId: string, tag: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const newTags = [...(item.tags || []), tag];
      await updateItem(itemId, { tags: newTags });
      refetchWishlist();
    }
  };

  const handleItemTagRemove = async (itemId: string, tag: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const newTags = (item.tags || []).filter((t) => t !== tag);
      await updateItem(itemId, { tags: newTags });
      refetchWishlist();
    }
  };

  return (
    <div className="space-y-6">
      <CollectionTabs
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        totalCount={items.length}
        onSelectCollection={setSelectedCollectionId}
        onCreateCollection={() => setShowCollectionDialog(true)}
      />

      {/* Collection Header */}
      <CollectionHeader
        collection={selectedCollection}
        itemCount={filteredItems.length}
        totalValue={totalValue}
        username={username}
        onEdit={() =>
          selectedCollection
            ? setEditingCollection(selectedCollection)
            : undefined
        }
        onTogglePublic={handleTogglePublic}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedItems.size > 0
              ? `${selectedItems.size} selected`
              : `${filteredItems.length} items`}
          </span>
          {selectedItems.size > 0 && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/compare?ids=${Array.from(selectedItems).join(",")}`}>
                  Compare
                </Link>
              </Button>

              {/* Move to collection dropdown */}
              <Select onValueChange={(v) => handleMoveSelected(v === "none" ? null : v)}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Collection</SelectItem>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveSelected}
                className="text-destructive"
              >
                Remove
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {allTags.length > 0 && (
            <Select
              value={filterTag || "all"}
              onValueChange={(v) => setFilterTag(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    #{tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <VaultEmptyState
          icon={Heart}
          title={selectedCollectionId ? "This collection is empty" : "Your wishlist is empty"}
          description={
            selectedCollectionId
              ? "Add filaments to this collection from product pages."
              : "Save filaments you're interested in to compare and track prices."
          }
          actionLabel="Browse Filaments"
          actionHref="/"
        />
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              collections={collections}
              isSelected={selectedItems.has(item.id)}
              onSelect={(selected) => {
                const newSet = new Set(selectedItems);
                if (selected) newSet.add(item.id);
                else newSet.delete(item.id);
                setSelectedItems(newSet);
              }}
              onRemove={() => removeFromWishlist(item.filament_id)}
              onMoveToCollection={(collectionId) => {
                updateItem(item.id, { collection_id: collectionId });
                refetchWishlist();
              }}
              onAddTag={(tag) => handleItemTagAdd(item.id, tag)}
              onRemoveTag={(tag) => handleItemTagRemove(item.id, tag)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all overflow-hidden">
              <CardContent className="p-0">
                <Link to={`/filament/${item.filament?.id}`} className="block">
                  {/* Image */}
                  <div className="aspect-[3/2] bg-muted/30 overflow-hidden">
                    {item.filament?.featured_image ? (
                      <img
                        src={item.filament.featured_image}
                        alt={item.filament.product_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : item.filament?.color_hex ? (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.filament.color_hex }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {item.filament?.vendor}
                    </p>
                    <h3 className="text-sm font-semibold truncate mt-0.5">
                      {item.filament?.product_title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      {item.filament?.material && (
                        <Badge variant="secondary" className="text-xs">
                          {item.filament.material}
                        </Badge>
                      )}
                      {item.filament?.variant_price && (
                        <span className="text-sm font-mono font-semibold text-primary">
                          ${item.filament.variant_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CollectionDialog
        open={showCollectionDialog || !!editingCollection}
        onOpenChange={(open) => {
          if (!open) {
            setShowCollectionDialog(false);
            setEditingCollection(null);
          }
        }}
        collection={editingCollection}
        onSave={editingCollection ? handleUpdateCollection : handleCreateCollection}
        onDelete={editingCollection ? handleDeleteCollection : undefined}
      />

      <ShareWishlistDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        collections={collections}
      />
    </div>
  );
}
