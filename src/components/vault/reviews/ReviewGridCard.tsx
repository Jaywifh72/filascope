import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VaultReview } from "@/hooks/useVaultReviews";

interface ReviewGridCardProps {
  review: VaultReview;
}

function getProductLink(review: VaultReview): string {
  if (review.product_type === "filament") return `/filament/${review.product_id}`;
  if (review.product_type === "printer") return `/printer/${review.product_id}`;
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

export function ReviewGridCard({ review }: ReviewGridCardProps) {
  const productLink = getProductLink(review);
  const productName = getProductName(review);
  const productBrand = getProductBrand(review);
  const productImage = getProductImage(review);

  return (
    <Link to={productLink}>
      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all group overflow-hidden h-full">
        {/* Image */}
        <div className="relative aspect-square bg-muted/30">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : review.filament?.color_hex ? (
            <div
              className="w-full h-full"
              style={{ backgroundColor: review.filament.color_hex }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Star className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Rating Overlay */}
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < review.overall_rating
                    ? "fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        <CardContent className="p-3">
          <h4 className="font-medium text-sm truncate">{productName}</h4>
          <p className="text-xs text-muted-foreground truncate">{productBrand}</p>
          {review.headline && (
            <p className="text-xs text-foreground/70 mt-1 line-clamp-2">"{review.headline}"</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
