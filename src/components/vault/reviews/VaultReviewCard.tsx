import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Star,
  ThumbsUp,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { VaultReview } from "@/hooks/useVaultReviews";

interface VaultReviewCardProps {
  review: VaultReview;
  onEdit: (review: VaultReview) => void;
  onDelete: (reviewId: string) => void;
  isDeleting: boolean;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return { label: "Published", className: "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/20" };
    case "pending":
      return { label: "Pending Moderation", className: "bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,47%)] border-[hsl(45,93%,47%)]/20" };
    case "rejected":
      return { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" };
    default:
      return { label: status, className: "bg-muted text-muted-foreground" };
  }
}

function getProductLink(review: VaultReview): string {
  if (review.product_type === "filament") {
    return `/filament/${review.product_id}`;
  }
  if (review.product_type === "printer") {
    return `/printer/${review.product_id}`;
  }
  return "#";
}

function getProductName(review: VaultReview): string {
  if (review.filament) return review.filament.product_title;
  if (review.printer_info) return review.printer_info.display_name || review.printer_info.model_name;
  return "Unknown Product";
}

function getProductBrand(review: VaultReview): string {
  if (review.filament) return review.filament.vendor;
  if (review.printer_info) return review.printer_info.brand_name || "";
  return "";
}

function getProductImage(review: VaultReview): string | null {
  if (review.filament) return review.filament.featured_image;
  if (review.printer_info) return review.printer_info.image_url;
  return null;
}

export function VaultReviewCard({ review, onEdit, onDelete, isDeleting }: VaultReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const statusBadge = getStatusBadge(review.status);
  const productLink = getProductLink(review);
  const productName = getProductName(review);
  const productBrand = getProductBrand(review);
  const productImage = getProductImage(review);
  const bodyTruncated = review.body.length > 120;
  const displayBody = expanded ? review.body : review.body.slice(0, 120);
  const wasEdited = review.updated_at !== review.created_at;

  return (
    <>
      <Card className="bg-card/50 border-border hover:border-border/80 transition-colors">
        <CardContent className="p-4 space-y-3">
          {/* Product Info + Stars */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {productImage && (
                <Link to={productLink} className="shrink-0">
                  <img
                    src={productImage}
                    alt={`${productBrand} ${productName}`}
                    className="w-11 h-11 rounded-lg object-cover border border-border"
                  />
                </Link>
              )}
              {!productImage && review.filament?.color_hex && (
                <Link to={productLink} className="shrink-0">
                  <div
                    className="w-11 h-11 rounded-lg border border-border"
                    style={{ backgroundColor: review.filament.color_hex }}
                  />
                </Link>
              )}
              <div className="min-w-0">
                <Link to={productLink} className="hover:text-primary transition-colors">
                  <h4 className="font-medium text-sm truncate">{productName}</h4>
                </Link>
                <p className="text-xs text-muted-foreground">{productBrand}</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < review.overall_rating
                      ? "fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Headline */}
          <h5 className="font-semibold text-sm">{review.headline}</h5>

          {/* Body */}
          <div className="text-sm text-foreground/80">
            <p className="whitespace-pre-line">
              {displayBody}
              {bodyTruncated && !expanded && "…"}
            </p>
            {bodyTruncated && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary text-xs font-medium mt-1 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>

          {/* Photos */}
          {review.photos.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {review.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.photo_url}
                  alt="Review photo"
                  className="w-12 h-12 rounded-md object-cover border border-border shrink-0"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={cn("text-[10px]", statusBadge.className)}>
              {statusBadge.label}
            </Badge>

            {review.helpful_count > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {review.helpful_count} helpful
              </span>
            )}

            {review.photos.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {review.photos.length} photo{review.photos.length !== 1 ? "s" : ""}
              </span>
            )}

            <span>
              Posted {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>

            {wasEdited && (
              <span className="italic">
                Edited {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={() => onEdit(review)}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-7 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-7 ml-auto"
              asChild
            >
              <Link to={productLink}>
                View on Product Page
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review of{" "}
              <strong>{productName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(review.id);
                setShowDeleteDialog(false);
              }}
              disabled={isDeleting}
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
