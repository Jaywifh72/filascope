import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Package, Zap, Sun, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MaterialBadge } from '@/components/MaterialBadge';
import { FilamentHeroGallery } from './FilamentHeroGallery';
import { LargeColorSwatchGrid } from './LargeColorSwatchGrid';
import { ShareButton } from './ShareButton';
import { FilamentKeySpecsBar } from './FilamentKeySpecsBar';
import { FilaScoreHeroDisplay } from './FilaScoreHeroDisplay';
import { FilamentQuickSpecsGrid } from './FilamentQuickSpecsGrid';
import { normalizeColorHex, cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { getProductLineName } from '@/lib/productNameUtils';
import { getBrandLogo } from '@/lib/brandLogos';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { toBrandSlug } from '@/utils/brandSlug';
import { calculateUnifiedScore, type FilamentForScoring } from '@/lib/unifiedFilamentScore';
import { isValidFinishType } from '@/lib/finishTypeValidation';
import { TdSubmissionButton } from '@/components/filament/td-community/TdSubmissionButton';
import { TdVerificationWidget } from '@/components/filament/td-community/TdVerificationWidget';
import type { CommunityReviewStats } from '@/hooks/useCommunityReviewStats';

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
  
  // Community rating
  communityRating?: CommunityReviewStats | null;
  onNavigateToCommunity?: () => void;
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
  communityRating,
  onNavigateToCommunity,
}: FilamentHeroSectionProps) {
  // Get the best product line name (e.g., "PLA High Speed" instead of just "PLA")
  const productLineName = getProductLineName(pricingFilament.material, pricingFilament.product_title);
  // Keep baseName for color extraction compatibility
  const baseName = baseProductName;

  // Calculate FilaScore
  const { score: filaScore, factors: scoreFactors, dataPointCount, label: scoreLabel } = useMemo(() =>
    calculateUnifiedScore(pricingFilament as FilamentForScoring),
    [pricingFilament]
  );

  return (
    <div className="space-y-6">
      {/* Hero Section - Dark Background like PrinterDetail */}
      <div className="relative bg-[#0A0A0A] rounded-2xl py-6 sm:py-8 md:py-12 px-3 sm:px-6 md:px-10 overflow-hidden">
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
                  brand={pricingFilament.vendor}
                  material={pricingFilament.material}
                  colorFamily={displayFilament.color_family}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Info & Purchase (60%) */}
          <div className="flex flex-col gap-5">
            {/* Brand Logo/Name */}
            <div>
              <Link 
                to={`/brands/${toBrandSlug(pricingFilament.vendor || '')}`}
                className="inline-flex items-center gap-1.5 group hover:opacity-80 transition-opacity"
                title={`${pricingFilament.vendor} Filaments — Full Catalog & Pricing`}
              >
                <BrandLogo
                  src={getBrandLogo(pricingFilament.vendor)}
                  brandName={pricingFilament.vendor || 'Brand'}
                  size="lg"
                  className="h-8 max-w-[180px]"
                />
                <span className="sr-only">{pricingFilament.vendor} Filaments</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </Link>
            </div>
            
            {/* Product Line Name badge (outside h1) + Share */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="block text-sm font-semibold text-primary tracking-wide uppercase">
                  {productLineName}
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight tracking-tight">
                  {(() => {
                    const colorDisplay = pricingFilament.color_family || null;
                    const h1Full = `${pricingFilament.vendor} ${productLineName}${colorDisplay ? ` ${colorDisplay}` : ''} — ${pricingFilament.material} 3D Printer Filament`;
                    const h1Short = `${pricingFilament.vendor} ${productLineName}${colorDisplay ? ` ${colorDisplay}` : ''} — ${pricingFilament.material} Filament`;
                    return h1Full.length <= 70 ? h1Full : h1Short.length <= 70 ? h1Short : `${pricingFilament.vendor} ${productLineName}${colorDisplay ? ` ${colorDisplay}` : ''}`;
                  })()}
                </h1>
              </div>
              <ShareButton title={productLineName} />
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
              {communityRating && communityRating.reviewCount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={onNavigateToCommunity}
                        className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        <span className="font-semibold text-primary">{communityRating.avgRating.toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs">
                          ({communityRating.reviewCount} review{communityRating.reviewCount !== 1 ? 's' : ''})
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                      <p className="font-medium mb-1">{communityRating.avgRating.toFixed(1)} average from {communityRating.reviewCount} reviews</p>
                      <div className="space-y-0.5 text-muted-foreground">
                        {communityRating.avgQuality != null && <p>Print Quality: {communityRating.avgQuality.toFixed(1)}</p>}
                        {communityRating.avgEase != null && <p>Ease: {communityRating.avgEase.toFixed(1)}</p>}
                        {communityRating.avgValue != null && <p>Value: {communityRating.avgValue.toFixed(1)}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
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
              {displayFilament.finish_type && isValidFinishType(displayFilament.finish_type) && (
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
              {/* TD (Transmission Distance) — always visible */}
              <Tooltip>
                <TooltipTrigger asChild>
                  {displayFilament.transmission_distance != null ? (
                    <a
                      href="/hueforge-td-database"
                      title="View all HueForge TD values on FilaScope"
                      className="inline-flex"
                    >
                      <Badge variant="outline" className="text-xs px-2.5 py-1 bg-purple-500/15 border-purple-500/30 text-purple-300 cursor-pointer gap-1 hover:bg-purple-500/25 hover:border-purple-500/40 transition-colors">
                        <Sun className="w-3.5 h-3.5" />
                        HueForge TD: {displayFilament.transmission_distance}mm
                      </Badge>
                    </a>
                  ) : (
                    <Badge variant="outline" className="text-xs px-2.5 py-1 bg-muted/50 border-border text-muted-foreground cursor-help gap-1">
                      <Sun className="w-3.5 h-3.5" />
                      TD —
                    </Badge>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[260px]">
                  {displayFilament.transmission_distance != null ? (
                    <>
                      <p className="font-medium">Transmission Distance (TD)</p>
                      <p className="text-muted-foreground">
                        Measures how far light travels through the filament. Used in HueForge for lithophanes and filament painting. Lower = more opaque, higher = more translucent.
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">TD value not yet measured for this filament.</p>
                  )}
                </TooltipContent>
              </Tooltip>
              {/* TD Submission/Verification */}
              <TdSubmissionButton
                filamentId={displayFilament.id}
                filamentName={displayFilament.product_title || displayFilament.display_name || 'Unknown'}
                currentTd={displayFilament.transmission_distance}
              />
              {displayFilament.transmission_distance != null && (
                <TdVerificationWidget filamentId={displayFilament.id} />
              )}
              {/* FilaScore Display */}
              {filaScore !== null && (
                <FilaScoreHeroDisplay
                  score={filaScore}
                  factors={scoreFactors}
                  communityRating={communityRating}
                  pricingFilament={pricingFilament}
                />
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
              material={displayFilament.material}
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
