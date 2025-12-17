import { Link } from "react-router-dom";
import { Heart, ExternalLink, Printer as PrinterIcon, RefreshCw, ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterBadges } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface MediumStandardPrinterCardProps {
  printer: Printer;
  isSelected: boolean;
  isMaxReached: boolean;
  onToggleCompare: () => void;
  isAdmin?: boolean;
  onEditImage?: (e: React.MouseEvent) => void;
  onRescrape?: (e: React.MouseEvent) => void;
  isRescraping?: boolean;
}

export default function MediumStandardPrinterCard({
  printer,
  isSelected,
  isMaxReached,
  onToggleCompare,
  isAdmin,
  onEditImage,
  onRescrape,
  isRescraping
}: MediumStandardPrinterCardProps) {
  const { formatPrice } = useCurrency();
  const productImage = getPrinterImage(printer);
  const badges = getPrinterBadges(printer, 3);

  return (
    <article 
      className="group relative"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name}`}
    >
      <Link to={`/printers/${printer.id}`}>
        <div 
          className="
            relative
            bg-[hsl(0_0%_10%)] 
            border border-white/10 
            rounded-xl 
            p-5 
            transition-all duration-300 ease-out
            hover:border-primary 
            hover:-translate-y-1 
            hover:shadow-[0_8px_30px_rgba(0,212,212,0.15)]
            cursor-pointer
            h-full
            flex flex-col
          "
        >
          {/* Semantic Badges - Top Left */}
          {badges.length > 0 && (
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
              {badges.map((badge, idx) => (
                <PrinterBadge 
                  key={`${badge.type}-${idx}`}
                  type={badge.type}
                  size="sm"
                  compact
                />
              ))}
            </div>
          )}

          {/* Action Icons - Top Right */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
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

          {/* Printer Image */}
          <div className="relative aspect-square mb-4 mt-8">
            {productImage ? (
              <img 
                src={productImage} 
                alt={`${printer.brand?.brand} ${printer.model_name}`}
                className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
              <PrinterIcon className="h-16 w-16 text-white/20" />
            </div>
          </div>

          {/* Printer Name - Most Prominent */}
          <h3 className="text-2xl font-bold text-foreground mb-1 line-clamp-2">
            {printer.brand?.brand} {printer.model_name}
          </h3>
          {printer.variant_or_bundle_name && (
            <p className="text-sm text-muted-foreground mb-2">{printer.variant_or_bundle_name}</p>
          )}

          {/* Build Volume + Speed - Single Line */}
          <p className="text-sm text-muted-foreground mb-3">
            {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
              <span>{printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm</span>
            )}
            {printer.build_volume_x_mm && printer.max_print_speed_mms && <span> • </span>}
            {printer.max_print_speed_mms && <span>{printer.max_print_speed_mms}mm/s</span>}
          </p>

          {/* Price Section */}
          <div className="mb-4 mt-auto">
            {printer.current_price_usd_store ? (
              <>
                <span className="text-xl font-bold text-amber-500">
                  {formatPrice(printer.current_price_usd_store)}
                </span>
                {printer.msrp_usd && printer.current_price_usd_store < printer.msrp_usd && (
                  <div className="text-sm text-muted-foreground">
                    <span className="line-through">{formatPrice(printer.msrp_usd)}</span>
                    <span className="ml-2 text-emerald-500">
                      ({Math.round((1 - printer.current_price_usd_store / printer.msrp_usd) * 100)}% off)
                    </span>
                  </div>
                )}
              </>
            ) : printer.current_price_usd_amazon ? (
              <span className="text-xl font-bold text-amber-500">
                {formatPrice(printer.current_price_usd_amazon)}
              </span>
            ) : printer.msrp_usd ? (
              <span className="text-xl font-bold text-amber-500">
                {formatPrice(printer.msrp_usd)}
              </span>
            ) : (
              <span className="text-lg text-muted-foreground">Price TBD</span>
            )}
          </div>

          {/* Brand Logo - Bottom Right, Subtle */}
          {getBrandLogo(printer.brand?.brand || null) && (
            <div className="absolute bottom-5 right-5">
              <img 
                src={getBrandLogo(printer.brand?.brand || null)!} 
                alt={`${printer.brand?.brand} logo`}
                className="h-auto max-w-[40px] object-contain opacity-50"
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}