import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getBrandLogo } from '@/lib/brandLogos';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { trackAffiliateClick as trackGA4AffiliateClick } from '@/lib/analytics';
import { trackAffiliateClick as trackSupabaseAffiliateClick } from '@/utils/affiliateLinks';
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
        <OptimizedImage
          src={product.featuredImage}
          alt={product.productTitle}
          className="w-full h-full"
          objectFit="contain"
          width={200}
          colorHex={product.colorHex}
          material={product.material}
        />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-1.5 min-h-[20px]">
          <BrandLogo
            src={brandLogo}
            brandName={product.vendor}
            size="sm"
            className="opacity-70"
          />
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
              <a
                href={product.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackGA4AffiliateClick({
                    brand: product.vendor,
                    productName: product.productTitle,
                    productId: product.id || '',
                    linkType: 'affiliate',
                  });
                  // Supabase logging — fire-and-forget
                  trackSupabaseAffiliateClick('', product.buyUrl!, {
                    brandName: product.vendor,
                    regionCode: 'US',
                    productName: product.productTitle,
                    productId: product.id,
                    productType: 'filament',
                    sourcePage: window.location.pathname,
                    sourceComponent: 'wizard_card',
                  }).catch(() => {});
                }}
              >
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
