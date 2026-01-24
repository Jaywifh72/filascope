import { useState } from "react";
import { Box, Gauge, Thermometer, Wifi, WifiOff } from "lucide-react";
import { SocialProofBadges } from "./SocialProofBadges";
import { DataQualityIndicator } from "./DataQualityIndicator";
import { generatePrinterDescription } from "@/lib/printerBenefitsGenerator";
import { ProductGallery } from "@/components/ui/product-gallery";
import { ImageLightbox } from "@/components/ui/image-lightbox";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  // Convert to gallery format
  const galleryImages = displayImages.map((url, idx) => ({
    url,
    alt: `${printer.model_name} view ${idx + 1}`,
  }));

  return (
    <div className="space-y-6">
      {/* Image and Info Grid - Stack on mobile, side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 lg:gap-10 items-start">
        {/* Left Column: Product Images */}
        <div className="w-full">
          <ProductGallery
            images={galleryImages}
            productTitle={printer.model_name}
          />
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
