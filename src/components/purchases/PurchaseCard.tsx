import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Star, ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UserPurchase } from "@/hooks/useUserPurchases";

interface PurchaseCardProps {
  purchase: UserPurchase;
  hasReview: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function PurchaseCard({ purchase, hasReview, onDelete, isDeleting }: PurchaseCardProps) {
  const productName = purchase.filament?.product_title || "Unknown Product";
  const brand = purchase.filament?.vendor || null;
  const material = purchase.filament?.material || null;
  const imageUrl = purchase.filament?.featured_image || null;
  const productLink =
    purchase.product_type === "printer"
      ? `/printer/${purchase.filament_id}`
      : `/filament/${purchase.filament_id}`;

  return (
    <Card className="group hover:border-border transition-all">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <Link to={productLink} className="shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                className="w-20 h-20 object-cover rounded-lg bg-muted/30"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted/30 flex items-center justify-center">
                <span className="text-2xl text-muted-foreground/50">📦</span>
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <Link to={productLink} className="block hover:underline">
              <h3 className="font-semibold text-sm truncate">{productName}</h3>
            </Link>
            {brand && (
              <p className="text-xs text-muted-foreground">{brand}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {material && (
                <Badge variant="secondary" className="text-[10px]">
                  {material}
                </Badge>
              )}
              {purchase.store_name && (
                <Badge variant="outline" className="text-[10px]">
                  {purchase.store_name}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {purchase.purchased_at && (
                <span>
                  {format(new Date(purchase.purchased_at), "MMM d, yyyy")}
                </span>
              )}
              {purchase.price_paid != null && (
                <span className="font-medium text-foreground">
                  ${purchase.price_paid.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {!hasReview && (
              <Link to={`${productLink}#reviews`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8">
                  <Star className="w-3 h-3" />
                  Review
                </Button>
              </Link>
            )}
            <Link to={productLink}>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8">
                <ExternalLink className="w-3 h-3" />
                View
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5 h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove purchase?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{productName}" from your purchase history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(purchase.id)}
                    disabled={isDeleting}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
