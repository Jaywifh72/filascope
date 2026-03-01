import { Link } from "react-router-dom";
import { Heart, ExternalLink, Check, Printer as PrinterIcon, RefreshCw, ImageIcon, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useCurrency } from "@/hooks/useCurrency";
import { getPrinterImage, getPrinterFeatures, getPrinterBadges, type CardSizeResult } from "@/lib/printerCardUtils";
import { generateRecommendation } from "@/lib/printerRecommendations";
import PrinterBadge from "./PrinterBadge";
import ComparisonCheckbox from "./ComparisonCheckbox";
import PrinterSpecGrid from "./PrinterSpecGrid";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

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
      <Link to={`/printers/${printer.printer_id || printer.id}`}>
        <div className="
          relative
          bg-[hsl(220_15%_6%)]
          border-2 border-primary/30
          rounded-2xl 
          p-6
          transition-all duration-300 ease-out
          hover:border-primary/60
          hover:-translate-y-1.5
          hover:shadow-[0_0_40px_rgba(0,207,232,0.15)]
          cursor-pointer
          h-full
          min-h-[400px] lg:min-h-[520px]
          flex flex-col
        ">
          {/* Featured Badge + Secondary Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {cardInfo.badge && (
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-[0.1em] ${cardInfo.badge.colorClass}`}>
                <span className="mr-1.5">{cardInfo.badge.icon}</span>
                {cardInfo.badge.label}
              </div>
            )}
            {secondaryBadges.slice(0, 2).map((badge, idx) => (
              <PrinterBadge 
                key={`${badge.type}-${idx}`}
                type={badge.type}
                size="sm"
                compact
              />
            ))}
          </div>

          {/* Comparison Checkbox - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <ComparisonCheckbox
              checked={isSelected}
              disabled={isMaxReached}
              onChange={onToggleCompare}
              printerName={`${printer.brand?.brand || ''} ${printer.model_name}`}
            />
          </div>

          {/* Action Icons */}
          <div className="absolute top-14 right-4 flex flex-col gap-1.5 z-10">
            <button 
              className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
              aria-label="Add to favorites"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="h-4 w-4 text-white/50 hover:text-red-400 transition-colors" />
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
                <ExternalLink className="h-4 w-4 text-white/50 hover:text-primary transition-colors" />
              </a>
            )}
            
            {isAdmin && (
              <>
                <button 
                  className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
                  onClick={onEditImage}
                  aria-label="Edit printer image"
                >
                  <ImageIcon className="h-4 w-4 text-white/50" />
                </button>
                {printer.official_product_url && (
                  <button 
                    className="p-1.5 bg-black/60 backdrop-blur-sm rounded-md hover:bg-black/80 transition-colors border border-white/5"
                    onClick={onRescrape}
                    disabled={isRescraping}
                    aria-label="Re-scrape printer data"
                  >
                    <RefreshCw className={`h-4 w-4 text-white/50 ${isRescraping ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Two-column layout on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 h-full mt-10">
            {/* Left Column: Image and core info */}
            <div className="flex-1 flex flex-col">
              {/* Printer Image */}
              <div className="relative max-h-[280px] mb-4 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={productImage}
                  alt={`${printer.brand?.brand} ${printer.model_name}`}
                  type="printer"
                  aspectRatio="1/1"
                  className="object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Brand - Monospace */}
              <div className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">
                {printer.brand?.brand}
              </div>

              {/* Printer Name */}
              <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-1 line-clamp-2">
                {printer.model_name}
              </h3>
              {printer.variant_or_bundle_name && (
                <p className="text-sm text-muted-foreground mb-3 font-mono text-[11px]">{printer.variant_or_bundle_name}</p>
              )}

              {/* Tech Spec Grid */}
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
              />

              {/* Price - Terminal style */}
              <div className="mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  Unit Cost:{" "}
                </span>
                {printer.discontinued ? (
                  <span className="font-mono text-lg text-destructive/70">DISCONTINUED</span>
                ) : price ? (
                  <span className="font-mono text-2xl font-bold text-amber-400 inline-flex items-center gap-2">
                    {formatPrice(price)}
                    {printer.msrp_usd && price < printer.msrp_usd && (
                      <span className="text-sm font-medium text-emerald-400">
                        -{Math.round((1 - price / printer.msrp_usd) * 100)}%
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="font-mono text-lg text-muted-foreground">TBD</span>
                )}
              </div>
            </div>

            {/* Right Column: Recommendation */}
            <div className="flex-1 flex flex-col bg-white/[0.02] rounded-xl p-4 lg:p-5 border border-white/5">
              {/* Why We Recommend */}
              <div className="mb-4">
                <h4 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-2">
                  System Analysis
                </h4>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                  {recommendation.tagline}
                </p>
              </div>

              {/* Key Features */}
              <div className="mb-4 flex-1">
                <h4 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-2">
                  Key Capabilities
                </h4>
                <ul className="space-y-1.5">
                  {features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="font-mono text-[11px]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For Tags */}
              {recommendation.bestFor.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-2">
                    Optimal For
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.bestFor.map((use, idx) => (
                      <span key={idx} className="font-mono text-[10px] uppercase tracking-[0.05em] bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-muted-foreground">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button - Wireframe style */}
              <button
                className="w-full h-11 rounded-lg border-2 border-primary/40 bg-transparent text-primary font-mono text-[11px] uppercase tracking-[0.15em] font-bold transition-all duration-200 hover:bg-primary hover:text-background hover:border-primary hover:shadow-[0_0_20px_rgba(0,207,232,0.3)] flex items-center justify-center gap-2 mt-auto"
                onClick={(e) => e.preventDefault()}
              >
                <Crosshair className="h-4 w-4" />
                Acquire Unit
              </button>
            </div>
          </div>

          {/* Brand Logo - Bottom Right */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-30 transition-opacity duration-300">
            <BrandLogo
              src={getBrandLogo(printer.brand?.brand || null)}
              brandName={printer.brand?.brand || "Brand"}
              size="sm"
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
