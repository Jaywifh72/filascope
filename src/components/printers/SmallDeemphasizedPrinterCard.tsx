import { Link } from "react-router-dom";
import { Heart, ExternalLink, Printer as PrinterIcon, Bell } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterBadges, type CardSizeResult } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface SmallDeemphasizedPrinterCardProps {
  printer: Printer;
  cardInfo: CardSizeResult;
  isSelected: boolean;
  isMaxReached: boolean;
  onToggleCompare: () => void;
}

export default function SmallDeemphasizedPrinterCard({
  printer,
  cardInfo,
  isSelected,
  isMaxReached,
  onToggleCompare,
}: SmallDeemphasizedPrinterCardProps) {
  const { formatPrice } = useCurrency();
  const productImage = getPrinterImage(printer);
  // Only show discontinued badge for small cards
  const badges = getPrinterBadges(printer, 1);

  return (
    <article 
      className="group relative opacity-75 hover:opacity-100 transition-opacity"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name} - ${cardInfo.badge?.label || 'Discontinued'}`}
    >
      <Link to={`/printers/${printer.id}`}>
        <div 
          className="
            relative
            bg-[hsl(0_0%_8%)] 
            border border-white/8 
            rounded-xl 
            p-4
            transition-all duration-300 ease-out
            hover:border-white/20 
            cursor-pointer
            h-full
            flex flex-col
            max-h-[360px]
          "
        >
          {/* Status Badge - Using PrinterBadge */}
          {badges.length > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <PrinterBadge 
                type={badges[0].type}
                size="sm"
                compact
              />
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
              <Heart className="h-3.5 w-3.5 text-white/50 hover:text-red-400 transition-colors" />
            </button>
            
            <div 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Checkbox
                className="h-3.5 w-3.5 border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                <ExternalLink className="h-3.5 w-3.5 text-white/50 hover:text-primary transition-colors" />
              </a>
            )}
          </div>

          {/* Printer Image - Smaller */}
          <div className="relative aspect-[4/3] mb-3 flex items-center justify-center">
            {productImage ? (
              <img 
                src={productImage} 
                alt={`${printer.brand?.brand} ${printer.model_name}`}
                className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] grayscale-[30%]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
              <PrinterIcon className="h-12 w-12 text-white/15" />
            </div>
          </div>

          {/* Printer Name */}
          <h3 className="text-lg font-bold text-foreground/80 mb-1 line-clamp-2">
            {printer.brand?.brand} {printer.model_name}
          </h3>

          {/* Build Volume + Speed - Single Line */}
          <p className="text-[13px] text-muted-foreground mb-2">
            {printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm && (
              <span>{printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm</span>
            )}
            {printer.build_volume_x_mm && printer.max_print_speed_mms && <span> • </span>}
            {printer.max_print_speed_mms && <span>{printer.max_print_speed_mms}mm/s</span>}
          </p>

          {/* Price - Muted */}
          <div className="mb-3">
            {printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd ? (
              <span className="text-lg font-semibold text-muted-foreground">
                {formatPrice(printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || 0)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground/60">Price TBD</span>
            )}
          </div>

          {/* Status Message & CTA */}
          <div className="mt-auto">
            <div className="text-[13px] text-destructive mb-2 text-center py-1.5 bg-destructive/10 rounded-md">
              {printer.discontinued ? 'This model has been discontinued' : 'Currently unavailable'}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-[13px] border-muted-foreground/30 text-muted-foreground hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Future: implement notify me
              }}
            >
              <Bell className="h-3 w-3 mr-1.5" />
              Notify Me
            </Button>
          </div>

          {/* Brand Logo - Bottom Right, Very Subtle */}
          {getBrandLogo(printer.brand?.brand || null) && (
            <div className="absolute bottom-4 right-4">
              <img 
                src={getBrandLogo(printer.brand?.brand || null)!} 
                alt={`${printer.brand?.brand} logo`}
                className="h-auto max-w-[30px] object-contain opacity-30"
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
