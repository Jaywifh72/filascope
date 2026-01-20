import { Link } from "react-router-dom";
import { Heart, ExternalLink, Printer as PrinterIcon, RefreshCw, ImageIcon, Crosshair } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterBadges } from "@/lib/printerCardUtils";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";
import PrinterSpecGrid from "./PrinterSpecGrid";

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
  const badges = getPrinterBadges(printer, 2);

  const price = printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd;

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
            bg-[hsl(220_15%_6%)] 
            border border-white/10 
            rounded-xl 
            p-5 
            transition-all duration-300 ease-out
            hover:border-primary/50
            hover:-translate-y-1 
            hover:shadow-[0_0_30px_rgba(0,207,232,0.12)]
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

          {/* Comparison Checkbox - Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <ComparisonCheckbox
              checked={isSelected}
              disabled={isMaxReached}
              onChange={onToggleCompare}
              printerName={`${printer.brand?.brand || ''} ${printer.model_name}`}
            />
          </div>

          {/* Action Icons - Below Checkbox */}
          <div className="absolute top-12 right-3 flex flex-col gap-1.5 z-10">
            <button 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
              aria-label="Add to favorites"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-3.5 w-3.5 text-white/50 hover:text-red-400 transition-colors" />
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
                <ExternalLink className="h-3.5 w-3.5 text-white/50 hover:text-primary transition-colors" />
              </a>
            )}
            
            {isAdmin && (
              <>
                <button 
                  className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
                  onClick={onEditImage}
                  aria-label="Edit printer image"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-white/50" />
                </button>
                {printer.official_product_url && (
                  <button 
                    className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
                    onClick={onRescrape}
                    disabled={isRescraping}
                    aria-label="Re-scrape printer data"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-white/50 ${isRescraping ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Brand Logo - Above Image */}
          {getBrandLogo(printer.brand?.brand || null) && (
            <div className="flex justify-center mt-2 mb-1">
              <img 
                src={getBrandLogo(printer.brand?.brand || null)!} 
                alt={`${printer.brand?.brand} logo`}
                className="h-12 w-auto object-contain opacity-60 group-hover:opacity-90 transition-opacity duration-300"
              />
            </div>
          )}

          {/* Printer Image */}
          <div className={`relative aspect-square mb-4 ${!getBrandLogo(printer.brand?.brand || null) ? 'mt-6' : ''}`}>
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
              <PrinterIcon className="h-16 w-16 text-white/15" />
            </div>
          </div>

          {/* Brand Name - Cyan, monospace */}
          <p className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.15em] leading-tight mb-1">
            {printer.brand?.brand}
          </p>

          {/* Printer Name */}
          <h3 className="text-xl font-bold text-foreground mb-1 leading-snug line-clamp-2">
            {printer.model_name}
          </h3>
          {printer.variant_or_bundle_name && (
            <p className="text-sm text-muted-foreground mb-2 font-mono text-[11px]">{printer.variant_or_bundle_name}</p>
          )}

          {/* Tech Spec Grid - 2x2 */}
          <PrinterSpecGrid
            buildVolume={{
              x: printer.build_volume_x_mm,
              y: printer.build_volume_y_mm,
              z: printer.build_volume_z_mm,
            }}
            maxSpeed={printer.max_print_speed_mms}
            hotendTemp={printer.max_nozzle_temp_c}
            motionSystem={printer.motion_system_notes || printer.machine_style}
            className="mb-4"
            variant="compact"
          />

          {/* Price Section - Terminal style */}
          <div className="mb-3 mt-auto">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Unit Cost:{" "}
            </span>
            {price ? (
              <span className="font-mono text-lg font-bold text-amber-400">
                {formatPrice(price)}
              </span>
            ) : (
              <span className="font-mono text-sm text-muted-foreground">TBD</span>
            )}
          </div>

          {/* Deploy Button - Wireframe style */}
          <button
            className="w-full h-10 rounded-lg border-2 border-primary/40 bg-transparent text-primary font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all duration-200 hover:bg-primary hover:text-background hover:border-primary hover:shadow-[0_0_20px_rgba(0,207,232,0.3)] flex items-center justify-center gap-2"
            onClick={(e) => e.preventDefault()}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Deploy Unit
          </button>

        </div>
      </Link>
    </article>
  );
}
