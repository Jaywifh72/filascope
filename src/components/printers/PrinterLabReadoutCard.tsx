import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Thermometer,
  Box,
  Zap,
  Printer as PrinterIcon,
  Ban,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCurrency } from "@/hooks/useCurrency";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import { getPrinterImage } from "@/lib/printerCardUtils";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface PrinterLabReadoutCardProps {
  printer: Printer;
  index?: number;
}

export function PrinterLabReadoutCard({ 
  printer, 
  index = 0 
}: PrinterLabReadoutCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { formatPrice } = useCurrency();
  const { addPrinter, removePrinter, isSelected, isMaxReached } = usePrinterCompare();
  
  const printerIsSelected = isSelected(printer.id);
  const isCompareDisabled = isMaxReached && !printerIsSelected;
  
  const productImage = getPrinterImage(printer);
  const brandLogo = printer.brand?.brand ? getBrandLogo(printer.brand.brand) : null;
  
  // Price calculation
  const price = printer.current_price_usd_store || printer.current_price_usd_amazon || printer.msrp_usd;
  
  // Tech badge (FDM/Resin)
  const isFDM = () => {
    const tech = (printer.printer_technology || "").toLowerCase();
    return tech.includes("fdm") || tech.includes("fff") || (!tech.includes("resin") && !tech.includes("sla") && !tech.includes("msla") && !tech.includes("dlp"));
  };
  
  const techLabel = isFDM() ? "FDM" : "RESIN";
  
  // Specs calculations
  const nozzleTemp = printer.max_nozzle_temp_c 
    ? `${printer.max_nozzle_temp_c}°C`
    : "—";
  
  const buildVolume = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
    ? `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}`
    : "—";
  
  // Star rating based on features (simple heuristic)
  const getFeatureScore = () => {
    let score = 0;
    if (printer.auto_bed_leveling) score += 1;
    if (printer.has_enclosure) score += 1;
    if (printer.filament_runout_detection) score += 1;
    if (printer.has_wifi) score += 1;
    if ((printer.max_print_speed_mms || 0) >= 300) score += 1;
    return Math.min(score, 5);
  };
  const starCount = getFeatureScore();

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const scrapedData = printer.scraped_data as Record<string, unknown> | null;
    const images = scrapedData?.images as Record<string, unknown> | null;
    const productImages = images?.product_images as string[] | null;
    const printerImage = productImages?.[0] || null;
    
    if (printerIsSelected) {
      removePrinter(printer.id);
    } else if (!isMaxReached) {
      addPrinter({
        id: printer.id,
        name: `${printer.brand?.brand || ""} ${printer.model_name}`.trim(),
        imageUrl: printerImage,
        brand: printer.brand?.brand || null,
      });
    }
  };

  return (
    <Link 
      to={`/printers/${printer.id}`}
      className="block"
    >
      <div
        role="article"
        aria-label={`${printer.brand?.brand || 'Unknown'} ${printer.model_name} printer card`}
        className={cn(
          "group relative rounded-2xl transition-all duration-300 overflow-hidden",
          "border border-white/10",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
          isHovered && "border-[#00CFE8]/60 shadow-[0_0_30px_rgba(0,207,232,0.25)]",
          printerIsSelected && "border-2 border-primary bg-primary/5"
        )}
        style={{
          animation: `card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
          background: "rgba(10, 12, 16, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ═══════════════════════════════════════════════════════════════
            HEADER: Dark header with Stars, Tech Badge, Price
            ═══════════════════════════════════════════════════════════════ */}
        <div className="relative bg-[#14171C] px-4 py-3">
          {/* Scanning Line Animation on Hover */}
          <div 
            className={cn(
              "absolute inset-0 pointer-events-none overflow-hidden",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div 
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00CFE8] to-transparent"
              style={{
                animation: isHovered ? 'headerScan 2s ease-in-out infinite' : 'none',
                boxShadow: '0 0 15px 3px rgba(0, 207, 232, 0.5)',
              }}
            />
          </div>
          
          {/* Header Content Row */}
          <div className="relative flex items-center justify-between gap-2">
            {/* Left: Star Rating */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < starCount 
                      ? "fill-amber-400 text-amber-400" 
                      : "fill-transparent text-white/20"
                  )}
                />
              ))}
            </div>
            
            {/* Center: Technology Badge */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                isFDM() 
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : "bg-violet-500/20 border border-violet-500/40 text-violet-300"
              )}>
                {techLabel}
              </span>
            </div>
            
            {/* Right: Price */}
            <div className="text-right flex-shrink-0">
              {price ? (
                <span className="text-lg font-black text-foreground font-mono tracking-tight">
                  {formatPrice(price)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground font-mono">TBD</span>
              )}
            </div>
          </div>
          
          {/* Bottom Cyan Glow Line */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-px transition-all duration-300",
              isHovered 
                ? "bg-[#00CFE8]/80" 
                : "bg-white/10"
            )}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MANUFACTURER MARK: Circular Brand Logo (Top Right of Body)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute top-[60px] right-4 z-10">
          <div 
            className={cn(
              "w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all duration-300",
              isHovered 
                ? "border-[#00CFE8]/60 bg-white/10" 
                : "border-white/20 bg-black/40"
            )}
          >
            {brandLogo ? (
              <img 
                src={brandLogo} 
                alt={printer.brand?.brand || "Brand"}
                className={cn(
                  "w-8 h-8 object-contain transition-all duration-300",
                  isHovered ? "opacity-100 grayscale-0" : "opacity-50 grayscale"
                )}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[8px] font-bold text-muted-foreground uppercase">
                {(printer.brand?.brand || "?").slice(0, 2)}
              </span>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CHECKBOX: Compare Selection
            ═══════════════════════════════════════════════════════════════ */}
        <div className="absolute top-[68px] left-4 z-10">
          <button
            onClick={handleCompareToggle}
            disabled={isCompareDisabled}
            aria-label={`Add ${printer.model_name} to comparison`}
            aria-checked={printerIsSelected}
            role="checkbox"
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer",
              printerIsSelected
                ? "bg-primary border-primary"
                : "bg-black/60 border-white/30 hover:border-primary hover:bg-primary/10",
              isCompareDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {printerIsSelected && (
              <Check className="w-3 h-3 text-background" strokeWidth={3} />
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BODY: Printer Image + Name + 2-Column Specs Grid
            ═══════════════════════════════════════════════════════════════ */}
        <div className="px-4 pt-4 pb-3">
          {/* Printer Image */}
          <div className="relative aspect-[4/3] mb-4 flex items-center justify-center">
            {/* Status Badge - Overlays the image area */}
            {printer.discontinued && (
              <div className="absolute top-2 right-2 z-20">
                <span className="inline-flex items-center gap-1 bg-red-500/90 text-white text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                  <Ban className="w-2.5 h-2.5" />
                  DISCONTINUED
                </span>
              </div>
            )}
            {!printer.discontinued && printer.coming_soon && (
              <div className="absolute top-2 right-2 z-20">
                <span className="inline-flex items-center gap-1 bg-[#00CFE8]/90 text-white text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded shadow-lg">
                  <Clock className="w-2.5 h-2.5" />
                  COMING SOON
                </span>
              </div>
            )}
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
            <div className={`w-full h-full flex items-center justify-center absolute inset-0 ${productImage ? 'hidden' : ''}`}>
              <PrinterIcon className="h-16 w-16 text-white/20" />
            </div>
          </div>

          {/* Printer Name */}
          <h3 className="text-base font-bold text-foreground truncate leading-tight mb-1 pr-14">
            {printer.model_name}
          </h3>
          
          {/* Brand */}
          {printer.brand?.brand && (
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-3">
              {printer.brand.brand}
            </p>
          )}
          
          {/* 2-Column Specs Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Nozzle Temp */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Thermometer className="w-3 h-3 text-[#00CFE8]" />
                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  Nozzle Temp
                </span>
              </div>
              <span className="font-mono text-base font-bold text-foreground block">
                {nozzleTemp}
              </span>
            </div>
            
            {/* Build Volume */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Box className="w-3 h-3 text-[#00CFE8]" />
                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
                  Build Vol
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-foreground block">
                {buildVolume}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER: Speed Badge + View Details CTA
            ═══════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.05]">
          {/* Speed Badge */}
          {printer.max_print_speed_mms && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-sm font-bold text-foreground">
                {printer.max_print_speed_mms}mm/s
              </span>
            </div>
          )}
          
          {!printer.max_print_speed_mms && <div />}

          {/* View Details Link */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00CFE8] hover:text-[#00CFE8]/80 transition-colors group/link">
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </span>
        </div>
        
        {/* Animation keyframes */}
        <style>{`
          @keyframes headerScan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes card-enter {
            0% { opacity: 0; transform: translateY(16px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </Link>
  );
}

export default PrinterLabReadoutCard;
