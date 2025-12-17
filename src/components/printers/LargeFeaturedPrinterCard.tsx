import { Link } from "react-router-dom";
import { Heart, ExternalLink, Check, Printer as PrinterIcon, RefreshCw, ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterFeatures, getPrinterBadges, type CardSizeResult } from "@/lib/printerCardUtils";
import { generateRecommendation } from "@/lib/printerRecommendations";
import PrinterBadge from "./PrinterBadge";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface LargeFeaturedPrinterCardProps {
  printer: Printer;
  cardInfo: CardSizeResult;
  isSelected: boolean;
  isMaxReached: boolean;
  onToggleCompare: () => void;
  isAdmin?: boolean;
  onEditImage?: (e: React.MouseEvent) => void;
  onRescrape?: (e: React.MouseEvent) => void;
  isRescraping?: boolean;
}

export default function LargeFeaturedPrinterCard({
  printer,
  cardInfo,
  isSelected,
  isMaxReached,
  onToggleCompare,
  isAdmin,
  onEditImage,
  onRescrape,
  isRescraping
}: LargeFeaturedPrinterCardProps) {
  const { formatPrice } = useCurrency();
  const productImage = getPrinterImage(printer);
  const features = getPrinterFeatures(printer);
  const recommendation = generateRecommendation(printer);
  const secondaryBadges = getPrinterBadges(printer, 2);

  const price = printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd;

  return (
    <article 
      className="col-span-1 sm:col-span-2 row-span-1 lg:row-span-2 group relative"
      role="article"
      aria-label={`Featured: ${printer.brand?.brand} ${printer.model_name}`}
    >
      <Link to={`/printers/${printer.id}`}>
        <div className="
          relative
          bg-primary/5
          border-2 border-primary/30
          rounded-2xl 
          p-6
          transition-all duration-300 ease-out
          hover:border-primary/60
          hover:-translate-y-1.5
          hover:shadow-[0_12px_40px_rgba(0,212,212,0.2)]
          cursor-pointer
          h-full
          min-h-[400px] lg:min-h-[520px]
          flex flex-col
        ">
          {/* Featured Badge + Secondary Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {/* Primary Featured Badge */}
            {cardInfo.badge && (
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${cardInfo.badge.colorClass}`}>
                <span className="mr-1.5">{cardInfo.badge.icon}</span>
                {cardInfo.badge.label}
              </div>
            )}
            {/* Secondary Semantic Badges */}
            {secondaryBadges.slice(0, 2).map((badge, idx) => (
              <PrinterBadge 
                key={`${badge.type}-${idx}`}
                type={badge.type}
                size="sm"
                compact
              />
            ))}
          </div>

          {/* Action Icons - Top Right */}
          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
            <button 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
              aria-label="Add to favorites"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-4 w-4 text-white/70 hover:text-red-400 transition-colors" />
            </button>
            
            <div 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Checkbox
                className="h-4 w-4 border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                checked={isSelected}
                onCheckedChange={onToggleCompare}
                disabled={isMaxReached && !isSelected}
                aria-label="Add to comparison"
              />
            </div>
            
            {printer.official_product_url && (
              <a
                href={printer.official_product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="View on manufacturer website"
              >
                <ExternalLink className="h-4 w-4 text-white/70 hover:text-primary transition-colors" />
              </a>
            )}
            
            {isAdmin && (
              <>
                <button 
                  className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                  onClick={onEditImage}
                  aria-label="Edit printer image"
                >
                  <ImageIcon className="h-4 w-4 text-white/70" />
                </button>
                {printer.official_product_url && (
                  <button 
                    className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
                    onClick={onRescrape}
                    disabled={isRescraping}
                    aria-label="Re-scrape printer data"
                  >
                    <RefreshCw className={`h-4 w-4 text-white/70 ${isRescraping ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Two-column layout on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 h-full mt-8">
            {/* Left Column: Image and core info */}
            <div className="flex-1 flex flex-col">
              {/* Printer Image */}
              <div className="relative aspect-square max-h-[280px] mb-4 flex items-center justify-center">
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={`${printer.brand?.brand} ${printer.model_name}`}
                    className="w-full h-full object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
                  <PrinterIcon className="h-20 w-20 text-white/20" />
                </div>
              </div>

              {/* Brand */}
              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                {printer.brand?.brand}
              </div>

              {/* Printer Name */}
              <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-1 line-clamp-2">
                {printer.model_name}
              </h3>
              {printer.variant_or_bundle_name && (
                <p className="text-sm text-muted-foreground mb-2">{printer.variant_or_bundle_name}</p>
              )}

              {/* Price */}
              <div className="mb-4">
                {price ? (
                  <span className="text-2xl lg:text-3xl font-bold text-amber-500">
                    {formatPrice(price)}
                  </span>
                ) : (
                  <span className="text-lg text-muted-foreground">Price TBD</span>
                )}
              </div>

              {/* Key Specs */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
                  <span className="flex items-center gap-1.5">
                    📏 {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm
                  </span>
                )}
                {printer.max_print_speed_mms && (
                  <span className="flex items-center gap-1.5">
                    ⚡ {printer.max_print_speed_mms}mm/s
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Recommendation */}
            <div className="flex-1 flex flex-col bg-primary/5 rounded-xl p-4 lg:p-5 border border-primary/10">
              {/* Why We Recommend */}
              <div className="mb-4">
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                  Why We Recommend
                </h4>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  {recommendation.tagline}
                </p>
              </div>

              {/* Key Features */}
              <div className="mb-4 flex-1">
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                  Key Features
                </h4>
                <ul className="space-y-1.5">
                  {features.slice(0, 6).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For Tags */}
              {recommendation.bestFor.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                    Best For
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.bestFor.map((use, idx) => (
                      <span key={idx} className="text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <Button 
                variant="outline" 
                className="w-full mt-auto border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                onClick={(e) => e.preventDefault()}
              >
                View Full Details →
              </Button>
            </div>
          </div>

          {/* Brand Logo - Bottom Right */}
          {getBrandLogo(printer.brand?.brand || null) && (
            <div className="absolute bottom-4 right-4">
              <img 
                src={getBrandLogo(printer.brand?.brand || null)!} 
                alt={`${printer.brand?.brand} logo`}
                className="h-auto max-w-[40px] object-contain opacity-40"
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
