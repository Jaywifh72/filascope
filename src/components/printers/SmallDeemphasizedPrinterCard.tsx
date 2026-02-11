import { Link } from "react-router-dom";
import { Heart, ExternalLink, Printer as PrinterIcon, Bell, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterBadges, type CardSizeResult } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";
import PrinterSpecGrid from "./PrinterSpecGrid";

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
  const badges = getPrinterBadges(printer, 1);

  return (
    <article 
      className="group relative opacity-60 hover:opacity-90 transition-opacity"
      role="article"
      aria-label={`${printer.brand?.brand} ${printer.model_name} - ${cardInfo.badge?.label || 'Discontinued'}`}
    >
      <Link to={`/printers/${printer.printer_id || printer.id}`}>
        <div 
          className="
            relative
            bg-[hsl(220_15%_5%)] 
            border border-white/5 
            rounded-xl 
            p-4
            transition-all duration-300 ease-out
            hover:border-white/15 
            cursor-pointer
            h-full
            flex flex-col
            max-h-[400px]
          "
        >
          {/* Status Badge */}
          {badges.length > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <PrinterBadge 
                type={badges[0].type}
                size="sm"
                compact
              />
            </div>
          )}

          {/* Comparison Checkbox */}
          <div className="absolute top-3 right-3 z-10">
            <ComparisonCheckbox
              checked={isSelected}
              disabled={isMaxReached}
              onChange={onToggleCompare}
              printerName={`${printer.brand?.brand || ''} ${printer.model_name}`}
            />
          </div>

          {/* Action Icons */}
          <div className="absolute top-12 right-3 flex flex-col gap-1.5 z-10">
            <button 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
              aria-label="Add to favorites"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-3 w-3 text-white/40 hover:text-red-400 transition-colors" />
            </button>
            
            {printer.official_product_url && (
              <a
                href={printer.official_product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
                onClick={(e) => e.stopPropagation()}
                aria-label="View on manufacturer website"
              >
                <ExternalLink className="h-3 w-3 text-white/40 hover:text-primary transition-colors" />
              </a>
            )}
          </div>

          {/* Printer Image - Smaller, grayscale */}
          <div className="relative aspect-[4/3] mb-3 flex items-center justify-center mt-6 bg-[#0d1117] rounded-lg overflow-hidden">
            {productImage ? (
              <img 
                src={productImage} 
                alt={`${printer.brand?.brand} ${printer.model_name}`}
                className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] grayscale-[50%] group-hover:grayscale-[20%] transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${productImage ? 'hidden' : ''}`}>
              <PrinterIcon className="h-12 w-12 text-white/10" />
            </div>
          </div>

          {/* Printer Name */}
          <h3 className="text-base font-bold text-foreground/70 mb-1 line-clamp-2">
            {printer.brand?.brand} {printer.model_name}
          </h3>

          {/* Compact Spec Grid */}
          <PrinterSpecGrid
            buildVolume={{
              x: printer.build_volume_x_mm,
              y: printer.build_volume_y_mm,
              z: printer.build_volume_z_mm,
            }}
            maxSpeed={printer.max_print_speed_mms}
            hotendTemp={printer.max_nozzle_temp_c}
            motionSystem={printer.motion_system_notes || printer.machine_style}
            className="mb-3"
            variant="compact"
          />

          {/* Price - Only show for non-discontinued printers */}
          {!printer.discontinued && (
            <div className="mb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">
                Last Price:{" "}
              </span>
              {printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd ? (
                <span className="font-mono text-sm font-semibold text-muted-foreground/80">
                  {formatPrice(printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd || 0)}
                </span>
              ) : (
                <span className="font-mono text-xs text-muted-foreground/50">N/A</span>
              )}
            </div>
          )}

          {/* Status Message & CTA */}
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-destructive/70 py-1.5 bg-destructive/5 border border-destructive/10 rounded-md">
              <Ban className="h-3 w-3" />
              {printer.discontinued ? 'End of Life' : 'Unavailable'}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full font-mono text-[10px] uppercase tracking-[0.1em] border border-white/5 text-muted-foreground/60 hover:bg-white/5 hover:text-muted-foreground h-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Bell className="h-3 w-3 mr-1.5" />
              Notify Me
            </Button>
          </div>

          {/* Brand Logo */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-20 transition-opacity">
            <BrandLogo src={getBrandLogo(printer.brand?.brand || null)} brandName={printer.brand?.brand || ''} size="sm" />
          </div>
        </div>
      </Link>
    </article>
  );
}
