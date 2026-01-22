import { useState } from "react";
import { Box, Gauge, Thermometer, Wifi, WifiOff } from "lucide-react";
import { SocialProofBadges } from "./SocialProofBadges";
import { DataQualityIndicator } from "./DataQualityIndicator";
import { generatePrinterDescription } from "@/lib/printerBenefitsGenerator";

interface PrinterHeroSectionProps {
  printer: any;
  brand: string | null;
  displayImages: string[];
  isAdmin?: boolean;
  onOpenLightbox: (index: number) => void;
}

interface QuickSpecCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function QuickSpecCard({ icon: Icon, label, value }: QuickSpecCardProps) {
  return (
    <div className="bg-muted/40 border border-border rounded-lg p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        {/* Labels: text-xs text-gray-400 */}
        <span className="text-xs text-gray-400">{label}</span>
        {/* Values: text-base font-semibold text-white */}
        <span className="text-base font-semibold text-white break-words">{value}</span>
      </div>
    </div>
  );
}

export function PrinterHeroSection({
  printer,
  brand,
  displayImages,
  isAdmin,
  onOpenLightbox,
}: PrinterHeroSectionProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Build volume string
  const buildVolume = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
    ? `${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm`
    : "N/A";

  // Max speed
  const maxSpeed = printer.max_print_speed_mms
    ? `${printer.max_print_speed_mms} mm/s`
    : "N/A";

  // Max nozzle temp
  const maxNozzleTemp = printer.max_nozzle_temp_c
    ? `${printer.max_nozzle_temp_c}°C`
    : "N/A";

  // Connectivity
  const hasWifi = printer.has_wifi;

  // Only show thumbnails if there are 2+ images
  const showThumbnails = displayImages.length >= 2;

  return (
    <div className="space-y-6">
      {/* Image and Info Grid - Stack on mobile, side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 lg:gap-10 items-start">
        {/* Left Column: Product Images */}
        <div className="w-full space-y-4">
          {/* Main Image */}
          {displayImages.length > 0 ? (
            <div 
              className="relative aspect-square bg-muted/20 rounded-xl border border-border/50 cursor-pointer group overflow-hidden"
              onClick={() => onOpenLightbox(selectedImageIndex)}
              role="button"
              aria-label={`View ${printer.model_name} product image in fullscreen`}
            >
              <div className="absolute inset-4 flex items-center justify-center">
                <img 
                  src={displayImages[selectedImageIndex] || displayImages[0]} 
                  alt={`${printer.model_name} product image`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-muted/30 rounded-xl border border-border/50 flex items-center justify-center">
              <Box className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}

          {/* Thumbnail Gallery - Only show if 2+ images available */}
          {showThumbnails && (
            <div className="grid grid-cols-5 gap-2">
              {displayImages.slice(0, 5).map((img, idx) => (
                <button
                  key={idx}
                  className={`relative aspect-square bg-muted/20 rounded-lg border p-1 flex items-center justify-center transition-all duration-200 ${
                    idx === selectedImageIndex
                      ? 'border-primary bg-primary/10 cursor-pointer'
                      : 'border-border/50 hover:border-primary/50 cursor-pointer'
                  }`}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt={`${printer.model_name} view ${idx + 1}`}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info */}
        <div className="space-y-6">
          {/* Brand - Not uppercase, consistent with listing cards */}
          <div className="text-sm text-gray-400 font-medium">
            {brand}
          </div>

          {/* Model Name */}
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            {printer.model_name}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {generatePrinterDescription({
              ...printer,
              brand: brand || undefined
            })}
          </p>

          {/* Social Proof Badges */}
          <SocialProofBadges
            isStaffPick={false}
            rating={printer.rating_community_overall}
            reviewCount={printer.review_count_aggregated}
          />

          {/* Quick Specs Grid - 2x2 on mobile, 4 columns on larger screens */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <QuickSpecCard
              icon={Box} 
              label="Build Volume" 
              value={buildVolume} 
            />
            <QuickSpecCard 
              icon={Gauge} 
              label="Max Speed" 
              value={maxSpeed} 
            />
            <QuickSpecCard 
              icon={Thermometer} 
              label="Max Nozzle Temp" 
              value={maxNozzleTemp} 
            />
            <QuickSpecCard 
              icon={hasWifi ? Wifi : WifiOff} 
              label="Connectivity" 
              value={hasWifi ? "Wi-Fi Enabled" : "No Wi-Fi"} 
            />
          </div>

          {/* Admin: Data Quality Indicator */}
          {isAdmin && (
            <DataQualityIndicator printer={printer} className="mt-4" />
          )}
        </div>
      </div>
    </div>
  );
}
