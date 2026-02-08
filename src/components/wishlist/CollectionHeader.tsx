import { useState } from "react";
import {
  Folder,
  Star,
  Printer,
  DollarSign,
  Wrench,
  Globe,
  Lock,
  Link2,
  Pencil,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WishlistCollection } from "@/hooks/useWishlistCollections";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  printer: <Printer className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
};

interface CollectionHeaderProps {
  collection: WishlistCollection | null;
  itemCount: number;
  totalValue: number;
  username?: string | null;
  onEdit: () => void;
  onTogglePublic: (isPublic: boolean) => void;
}

export function CollectionHeader({
  collection,
  itemCount,
  totalValue,
  username,
  onEdit,
  onTogglePublic,
}: CollectionHeaderProps) {
  const [copied, setCopied] = useState(false);

  if (!collection) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Items</h3>
          <p className="text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
            {totalValue > 0 && ` · Total value: $${totalValue.toFixed(2)}`}
          </p>
        </div>
      </div>
    );
  }

  const shareUrl =
    username && collection.slug
      ? `${window.location.origin}/collections/${username}/${collection.slug}`
      : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: collection.color + "20", color: collection.color }}
        >
          {ICON_MAP[collection.icon] || <Folder className="h-5 w-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{collection.name}</h3>
            <Badge
              variant="outline"
              className="text-xs cursor-pointer"
              onClick={() => onTogglePublic(!collection.is_public)}
            >
              {collection.is_public ? (
                <>
                  <Globe className="h-3 w-3 mr-1" /> Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" /> Private
                </>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
            {totalValue > 0 && ` · Total value: $${totalValue.toFixed(2)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {collection.is_public && shareUrl && (
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-1 text-green-500" />
            ) : (
              <Link2 className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copied" : "Share"}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
