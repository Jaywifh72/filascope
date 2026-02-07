import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Package, Zap, ImageIcon, RefreshCw, Link2, Palette, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialBadge } from '@/components/MaterialBadge';
import { FilamentHeroGallery } from './FilamentHeroGallery';
import { LargeColorSwatchGrid } from './LargeColorSwatchGrid';
import { FilamentKeySpecsBar } from './FilamentKeySpecsBar';
import { FilamentQuickSpecsGrid } from './FilamentQuickSpecsGrid';
import { normalizeColorHex } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { getProductLineName } from '@/lib/productNameUtils';
import { getBrandLogo } from '@/lib/brandLogos';
import { toBrandSlug } from '@/utils/brandSlug';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface FilamentHeroSectionProps {
  displayFilament: Filament;
  pricingFilament: Filament;
  baseProductName: string;
  colorVariants: Array<{
    id: string;
    color_hex: string | null;
    color_family: string | null;
    product_title: string;
    net_weight_g: number | null;
    product_url: string | null;
    variant_available?: boolean | null;
  }>;
  onSelectColor: (variant: any) => void;
  getColorFromTitle: (title: string, baseName: string) => string | null;
  
  // Multi-pack info
  isMultiPack: boolean;
  packQuantity: number;
  
  // Admin controls
  isAdmin?: boolean;
  rescrapingImage?: boolean;
  scrapingData?: boolean;
  scrapingColors?: boolean;
  onEditImage?: () => void;
  onRescrapeImage?: () => void;
  onEditUrl?: () => void;
  onScrapeData?: () => void;
  onScrapeColors?: () => void;
}

export function FilamentHeroSection({
  displayFilament,
  pricingFilament,
  baseProductName,
  colorVariants,
  onSelectColor,
  getColorFromTitle,
  isMultiPack,
  packQuantity,
  isAdmin,
  rescrapingImage,
  scrapingData,
  scrapingColors,
  onEditImage,
  onRescrapeImage,
  onEditUrl,
  onScrapeData,
  onScrapeColors,
}: FilamentHeroSectionProps) {
  // Get the best product line name (e.g., "PLA High Speed" instead of just "PLA")
  const productLineName = getProductLineName(pricingFilament.material, pricingFilament.product_title);
  // Keep baseName for color extraction compatibility
  const baseName = baseProductName;

  return (
    <div className="space-y-6">
      {/* Hero Section - Dark Background like PrinterDetail */}
      <div className="relative bg-[#0A0A0A] rounded-2xl py-8 md:py-12 px-6 md:px-10 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative grid lg:grid-cols-[40%_60%] gap-8 lg:gap-12 items-start">
          {/* Left Column - Image Gallery (40%) */}
          <div className="relative">
            <div className="transition-transform duration-300 hover:scale-[1.02]">
              <div className="shadow-[0_20px_60px_rgba(0,212,212,0.15)] rounded-2xl overflow-hidden">
                <FilamentHeroGallery
                  images={[displayFilament.featured_image]}
                  productTitle={displayFilament.product_title}
                  colorHex={displayFilament.color_hex}
                />
              </div>
            </div>
            {isAdmin && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onEditImage}
                  title="Edit product image URL"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                {pricingFilament.product_url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onRescrapeImage}
                    disabled={rescrapingImage}
                    title={`Rescrape image from: ${pricingFilament.product_url}`}
                  >
                    <RefreshCw className={`w-4 h-4 ${rescrapingImage ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Info & Purchase (60%) */}
          <div className="flex flex-col gap-5">
            {/* Brand Logo/Name */}
            <div>
              <Link 
                to={`/brands/${toBrandSlug(pricingFilament.vendor || '')}`}
                className="inline-flex items-center gap-1.5 group hover:opacity-80 transition-opacity"
              >
                {getBrandLogo(pricingFilament.vendor) ? (
                  <img 
                    src={getBrandLogo(pricingFilament.vendor)!} 
                    alt={pricingFilament.vendor || 'Brand'}
                    className="h-8 w-auto max-w-[180px] object-contain"
                    onError={(e) => {
                      // Fallback to text if logo fails
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={getBrandLogo(pricingFilament.vendor) ? "hidden text-sm font-bold text-primary uppercase tracking-wider" : "text-sm font-bold text-primary uppercase tracking-wider"}>
                  {pricingFilament.vendor}
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </Link>
            </div>
            
            {/* Product Line Name - Primary Heading */}
            <div className="flex items-start gap-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                {productLineName}
              </h1>
              {isAdmin && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={onEditUrl} title="Edit product URL">
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onScrapeData}
                    disabled={scrapingData || !pricingFilament.product_url}
                    title={pricingFilament.product_url ? `Scrape all data` : "No product URL"}
                  >
                    <RefreshCw className={`w-4 h-4 ${scrapingData ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onScrapeColors}
                    disabled={scrapingColors || !pricingFilament.product_url}
                    title="Scrape color variants"
                  >
                    <Palette className={`w-4 h-4 ${scrapingColors ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              )}
            </div>

            {/* Material & Feature Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {pricingFilament.material && (
                <MaterialBadge 
                  material={pricingFilament.material} 
                  variant="default" 
                  size="sm"
                  className="text-xs"
                />
              )}
              {pricingFilament.high_speed_capable && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    <Zap className="w-3 h-3 mr-1" />
                    High-Speed Ready
                  </Badge>
                </>
              )}
            </div>

            {/* Quick Spec Badges */}
            <div className="flex gap-2 flex-wrap">
              {displayFilament.diameter_nominal_mm && (
                <Badge variant="outline" className="text-xs px-2.5 py-1 bg-white/[0.02] border-white/[0.08]">
                  {displayFilament.diameter_nominal_mm}mm
                </Badge>
              )}
              {displayFilament.color_family && (
                <Badge variant="outline" className="text-xs px-2.5 py-1 flex items-center gap-1.5 bg-white/[0.02] border-white/[0.08]">
                  {displayFilament.color_hex && (
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: normalizeColorHex(displayFilament.color_hex) }} />
                  )}
                  {displayFilament.color_family}
                </Badge>
              )}
              {displayFilament.net_weight_g && displayFilament.net_weight_g > 0 && (
                <Badge variant="outline" className="text-xs px-2.5 py-1 bg-white/[0.02] border-white/[0.08]">
                  <Package className="w-3 h-3 mr-1" />
                  {displayFilament.net_weight_g}g
                </Badge>
              )}
              {displayFilament.finish_type && (
                <Badge variant="secondary" className="text-xs px-2.5 py-1">{displayFilament.finish_type}</Badge>
              )}
              {displayFilament.is_nozzle_abrasive && (
                <Badge variant="destructive" className="text-xs px-2.5 py-1">⚠️ Abrasive</Badge>
              )}
              {isMultiPack && (
                <Badge variant="secondary" className="text-xs px-2.5 py-1 bg-primary/20 text-primary border-primary/30">
                  📦 {packQuantity}-Pack
                </Badge>
              )}
              {displayFilament.transmission_distance != null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-2.5 py-1 bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-help">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      TD {displayFilament.transmission_distance}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                    <p className="font-medium">Transmission Distance</p>
                    <p className="text-muted-foreground">
                      Transmissivity value for HueForge multi-color prints. Lower = more opaque, higher = more translucent.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Large Color Swatches */}
            {colorVariants.length > 1 && (
              <LargeColorSwatchGrid
                colorVariants={colorVariants}
                currentVariantId={displayFilament.id}
                onSelectColor={onSelectColor}
                getColorName={(title) => getColorFromTitle(title, baseName)}
                className="pt-2"
              />
            )}

            {/* Quick Specs Grid - Matches Printer detail page style */}
            <FilamentQuickSpecsGrid
              nozzleTempMin={displayFilament.nozzle_temp_min_c}
              nozzleTempMax={displayFilament.nozzle_temp_max_c}
              bedTempMin={displayFilament.bed_temp_min_c}
              bedTempMax={displayFilament.bed_temp_max_c}
              diameter={displayFilament.diameter_nominal_mm}
              netWeight={displayFilament.net_weight_g}
              className="pt-1"
            />
          </div>
        </div>
      </div>

      {/* Key Specs Bar - Full Width Below Hero */}
      <FilamentKeySpecsBar
        nozzleTempMin={displayFilament.nozzle_temp_min_c}
        nozzleTempMax={displayFilament.nozzle_temp_max_c}
        bedTempMin={displayFilament.bed_temp_min_c}
        bedTempMax={displayFilament.bed_temp_max_c}
        printSpeedMax={displayFilament.print_speed_max_mms}
        easeOfPrintingScore={displayFilament.ease_of_printing_score}
        isAbrasive={displayFilament.is_nozzle_abrasive}
        material={displayFilament.material}
      />
    </div>
  );
}
