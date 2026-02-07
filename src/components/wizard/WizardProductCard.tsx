import { Link } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getBrandLogo } from '@/lib/brandLogos';
import type { WizardProduct } from '@/hooks/useWizardRecommendations';

interface WizardProductCardProps {
  product: WizardProduct;
}

export function WizardProductCard({ product }: WizardProductCardProps) {
  const brandLogo = getBrandLogo(product.vendor);

  return (
    <div className="flex-shrink-0 w-[180px] sm:w-[200px] rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="h-32 bg-muted/20 flex items-center justify-center overflow-hidden">
        {product.featuredImage ? (
          <OptimizedImage
            src={product.featuredImage}
            alt={product.productTitle}
            className="w-full h-full"
            objectFit="contain"
            width={200}
          />
        ) : product.colorHex ? (
          <div
            className="w-16 h-16 rounded-full border border-border/50 shadow-inner"
            style={{ backgroundColor: product.colorHex }}
          />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-1.5 min-h-[20px]">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={product.vendor}
              className="h-4 max-w-[60px] object-contain opacity-70"
            />
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
              {product.vendor}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-xs font-medium leading-tight line-clamp-2 min-h-[2rem]">
          {product.productTitle}
        </p>

        {/* Price + Score */}
        <div className="flex items-baseline justify-between gap-1 mt-auto">
          <div className="min-w-0">
            {product.formattedPrice ? (
              <span className="text-sm font-semibold">{product.formattedPrice}</span>
            ) : (
              <span className="text-xs text-muted-foreground">No price</span>
            )}
            {product.formattedPricePerKg && (
              <div className="text-[10px] text-muted-foreground truncate">
                {product.formattedPricePerKg}/kg
              </div>
            )}
          </div>
          {product.score != null && (
            <div className="flex flex-col items-end flex-shrink-0">
              <span className={`text-sm font-bold tabular-nums ${product.scoreColor}`}>
                {product.score.toFixed(1)}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">Score</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-1">
          <Button variant="outline" size="sm" asChild className="flex-1 h-7 text-[10px] px-2">
            <Link to={product.detailUrl}>Details</Link>
          </Button>
          {product.buyUrl && (
            <Button size="sm" asChild className="flex-1 h-7 text-[10px] px-2 gap-1">
              <a href={product.buyUrl} target="_blank" rel="noopener noreferrer">
                Buy
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
