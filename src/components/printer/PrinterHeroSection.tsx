import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Gauge, Thermometer, Wifi, WifiOff, Share2, Check } from "lucide-react";
import { toBrandSlug } from "@/utils/brandSlug";
import { toast } from "sonner";
import { SocialProofBadges } from "./SocialProofBadges";
import { DataQualityIndicator } from "./DataQualityIndicator";

import { ProductGallery } from "@/components/ui/product-gallery";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-muted/40 border border-border rounded-lg px-3 py-3 flex flex-col items-center text-center gap-1 min-w-[70px] max-w-[140px]">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap">{label}</span>
            <span className="text-[11px] font-semibold text-foreground w-full leading-tight text-center break-words" title={value}>{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}: {value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
        {/* Left Column: Product Images — constrained on mobile */}
        <div className="w-full max-h-[300px] lg:max-h-none overflow-hidden">
          <ProductGallery
            images={galleryImages}
            productTitle={printer.model_name}
          />
        </div>

        {/* Right Column: Product Info */}
        <div className="space-y-6">
          {/* H1 — Brand + Model + "3D Printer" for SEO. Brand styled small above, model bold, "3D Printer" as subtle label */}
          <div className="flex items-center gap-3">
            <h1 className="leading-tight">
              {brand && (
                <Link to={`/brands/${toBrandSlug(brand)}`} className="block text-sm text-gray-400 font-medium mb-1 hover:text-primary transition-colors" title={`Browse all ${brand} 3D printer filaments`}>{brand}{' '}</Link>
              )}
              <span className="block text-3xl font-bold text-foreground">{printer.model_name}{' '}</span>
              <span className="sr-only">3D Printer</span>
            </h1>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async () => {
                      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: `${brand ? brand + ' ' : ''}${printer.model_name}`, url: cleanUrl });
                        } catch (e) {
                          // User cancelled share
                        }
                      } else {
                        await navigator.clipboard.writeText(cleanUrl);
                        toast.success("Link copied!", { duration: 2000 });
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/60 bg-transparent hover:bg-muted/60 transition-colors flex-shrink-0"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Share this printer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* AEO Answer Block — visually hidden, accessible to crawlers */}
          <p className="sr-only">
            {(() => {
              const name = `${brand ? brand + ' ' : ''}${printer.model_name}`;
              const type = (printer.printer_type || printer.printer_technology || 'FDM').toUpperCase();
              const parts: string[] = [];

              // Opening: name + enclosure + type
              const enclosedStr = printer.has_enclosure ? 'enclosed ' : '';
              parts.push(`The ${name} is a${printer.max_print_speed_mms && printer.max_print_speed_mms >= 300 ? ' high-speed,' : 'n'} ${enclosedStr}${type} 3D printer`);

              // Build volume
              if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
                parts.push(`with a build volume of ${printer.build_volume_x_mm} × ${printer.build_volume_y_mm} × ${printer.build_volume_z_mm} mm`);
              }

              // Speed
              if (printer.max_print_speed_mms) {
                parts.push(`maximum print speed of ${printer.max_print_speed_mms} mm/s`);
              }

              // Nozzle temp
              if (printer.max_nozzle_temp_c) {
                parts.push(`and nozzle temperature up to ${printer.max_nozzle_temp_c}°C`);
              }

              let sentence1 = parts[0];
              if (parts.length > 1) sentence1 += ' ' + parts.slice(1).join(', ');
              sentence1 += '.';

              // Features sentence
              const features: string[] = [];
              const connectivity: string[] = [];
              if (printer.has_wifi) connectivity.push('Wi-Fi');
              if (printer.has_ethernet) connectivity.push('Ethernet');
              if (printer.has_usb) connectivity.push('USB');
              if (connectivity.length > 0) features.push(`${connectivity.join(' and ')} connectivity`);
              if (printer.auto_bed_leveling) features.push('auto bed leveling');
              if (printer.multi_material_supported) {
                const spools = printer.multi_material_max_spools;
                features.push(spools ? `${spools}-color multi-material printing` : 'multi-material printing');
              }

              let sentence2 = '';
              if (features.length > 0) {
                sentence2 = ` It features ${features.join(', ')}.`;
              }

              // Price
              let sentence3 = '';
              const price = printer.current_price_usd_store ?? printer.msrp_usd;
              if (price) {
                sentence3 = ` Priced at $${Number(price).toLocaleString('en-US')}.`;
              }

              // Discontinued
              let sentence4 = '';
              if (printer.discontinued) {
                sentence4 = ` Note: This printer has been discontinued${brand ? ` by ${brand}` : ''}.`;
              }

              return sentence1 + sentence2 + sentence3 + sentence4;
            })()}
          </p>

          {/* Feature Pills */}
          {(() => {
            const pills: string[] = [];
            if (printer.printer_type) pills.push(printer.printer_type.toUpperCase());
            else pills.push('FDM');
            if (printer.multi_material_supported) pills.push('Multi-Material');
            if (printer.has_wifi) pills.push('Wi-Fi');
            if (printer.auto_bed_leveling) pills.push('Auto Bed Leveling');
            if (printer.has_enclosure) pills.push('Enclosed');
            if (printer.input_shaping_supported) pills.push('Input Shaping');
            if (printer.direct_drive) pills.push('Direct Drive');
            if (printer.has_camera || printer.ai_spaghetti_detection) pills.push('AI Monitoring');
            return pills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {pills.slice(0, 5).map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            ) : null;
          })()}

          {/* Social Proof Badges */}
          <SocialProofBadges
            isStaffPick={false}
            rating={printer.rating_community_overall}
            reviewCount={printer.review_count_aggregated}
          />

          {/* Quick Specs Grid — only show specs with real data */}
          {(() => {
            const specs = [
              buildVolume !== "N/A" && <QuickSpecCard key="vol" icon={Box} label="Build Volume" value={buildVolume} />,
              maxSpeed !== "N/A" && <QuickSpecCard key="speed" icon={Gauge} label="Speed" value={maxSpeed} />,
              maxNozzleTemp !== "N/A" && <QuickSpecCard key="temp" icon={Thermometer} label="Nozzle Temp" value={maxNozzleTemp} />,
              <QuickSpecCard key="wifi" icon={hasWifi ? Wifi : WifiOff} label="Connectivity" value={hasWifi ? "Wi-Fi" : "No Wi-Fi"} />,
            ].filter(Boolean);
            return specs.length > 0 ? (
              <div className={`grid grid-cols-2 ${specs.length >= 4 ? 'lg:grid-cols-4' : specs.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 mb-4`}>
                {specs}
              </div>
            ) : null;
          })()}

          {/* Admin: Data Quality Indicator */}
          {isAdmin && (
            <DataQualityIndicator printer={printer} className="mt-4" />
          )}
        </div>
      </div>
    </div>
  );
}
