import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Package, Zap, ImageIcon, RefreshCw, Link2, Palette, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialBadge } from '@/components/MaterialBadge';
import { CurrencyCode } from '@/hooks/useCurrency';
import { FilamentHeroGallery } from './FilamentHeroGallery';
import { FilamentHeroPurchaseCard } from './FilamentHeroPurchaseCard';
import { LargeColorSwatchGrid } from './LargeColorSwatchGrid';
import { FilamentKeySpecsBar } from './FilamentKeySpecsBar';
import { FilamentQuickSpecsGrid } from './FilamentQuickSpecsGrid';
import { normalizeColorHex } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import type { Retailer } from './RetailersModal';
import { cleanFilamentDisplayName } from '@/lib/productNameUtils';
import { getBrandLogo } from '@/lib/brandLogos';

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
  }>;
  onSelectColor: (variant: any) => void;
  getColorFromTitle: (title: string, baseName: string) => string | null;
  
  // Pricing
  rawPricePerKg: number | null;
  rawPricePerSpool: number | null;
  hasActualRegionalPrice: boolean;
  affiliateUrl: string;
  productUrl: string;
  originalUsUrl?: string;
  retailerName?: string;
  retailerCount: number;
  onViewRetailers: () => void;
  isUsingFallbackRegion?: boolean;
  actualUrlCurrency?: CurrencyCode | null;
  isAvailableInUserRegion?: boolean;
  isRegionalBrand?: boolean;
  
  // Price validation
  priceValidation?: {
    isSuspicious: boolean;
    detectedPattern?: string | null;
    rawPricePerKg: number;
    estimatedTruePricePerKg?: number | null;
  };
  
  // Multi-pack info
  isMultiPack: boolean;
  packQuantity: number;
  totalPackPrice: string | null;
  
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
  rawPricePerKg,
  rawPricePerSpool,
  hasActualRegionalPrice,
  affiliateUrl,
  productUrl,
  originalUsUrl,
  retailerName,
  retailerCount,
  onViewRetailers,
  isUsingFallbackRegion,
  actualUrlCurrency,
  isAvailableInUserRegion,
  isRegionalBrand,
  priceValidation,
  isMultiPack,
  packQuantity,
  totalPackPrice,
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
                to={`/brands/${encodeURIComponent(pricingFilament.vendor || '')}`}
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
            
            {/* Product Title */}
            <div className="flex items-start gap-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                {cleanFilamentDisplayName(baseName)}
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

            {/* Purchase Card */}
            <FilamentHeroPurchaseCard
              filamentId={displayFilament.id}
              vendor={pricingFilament.vendor}
              pricePerKg={rawPricePerKg}
              pricePerSpool={rawPricePerSpool}
              weightGrams={pricingFilament.net_weight_g}
              affiliateUrl={affiliateUrl}
              productUrl={productUrl}
              originalUsUrl={originalUsUrl}
              retailerName={retailerName}
              retailerCount={retailerCount}
              onViewRetailers={onViewRetailers}
              hasActualRegionalPrice={hasActualRegionalPrice}
              isUsingFallbackRegion={isUsingFallbackRegion}
              actualUrlCurrency={actualUrlCurrency}
              isAvailableInUserRegion={isAvailableInUserRegion}
              isRegionalBrand={isRegionalBrand}
            />

            {/* Suspicious price warning */}
            {priceValidation?.isSuspicious && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-semibold">Price may be incorrect</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {priceValidation.detectedPattern === 'moq' 
                    ? 'This appears to be an MOQ (minimum order) listing where weight was miscalculated.'
                    : priceValidation.detectedPattern === 'bundle' || priceValidation.detectedPattern === 'pack'
                      ? 'This appears to be a bundle/pack listing.'
                      : `Price/kg ($${priceValidation.rawPricePerKg.toFixed(2)}) is below realistic market rates.`
                  }
                </p>
                {priceValidation.estimatedTruePricePerKg && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated true price: ~${priceValidation.estimatedTruePricePerKg.toFixed(2)}/kg
                  </p>
                )}
              </div>
            )}
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
