import { Link } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { BadgeCheck, Zap, ArrowRight, Leaf, Radio, Star, Sun } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface BrandCardProps {
  name: string;
  productLineCount: number;
  variantCount: number;
  isVerified: boolean;
  hasHighSpeed: boolean;
  hasEcoSpools: boolean;
  hasRfid: boolean;
  topMaterials: string[];
  logoUrl?: string | null;
  averageRating?: number | null;
  priceIndicator?: "$" | "$$" | "$$$" | null;
  colorPrimary?: string | null;
  colors?: string[];
  avgTransmissionDistance?: number | null;
  index?: number;
}

const BrandCard = ({
  name,
  productLineCount,
  variantCount,
  isVerified,
  hasHighSpeed,
  hasEcoSpools,
  hasRfid,
  topMaterials,
  logoUrl,
  averageRating,
  priceIndicator,
  colorPrimary,
  colors = [],
  avgTransmissionDistance,
  index = 0,
}: BrandCardProps) => {
  const resolvedLogoUrl = logoUrl || getBrandLogo(name);
  const slug = toBrandSlug(name);

  // Collect feature badges (max 2)
  const featureBadges: { icon: React.ReactNode; label: string; color: string }[] = [];
  if (hasHighSpeed) {
    featureBadges.push({ 
      icon: <Zap className="w-3 h-3" />, 
      label: "High Speed", 
      color: "border-primary/30 text-primary" 
    });
  }
  if (hasEcoSpools) {
    featureBadges.push({ 
      icon: <Leaf className="w-3 h-3" />, 
      label: "Eco Spools", 
      color: "border-green-500/30 text-green-400" 
    });
  }
  if (hasRfid && featureBadges.length < 2) {
    featureBadges.push({ 
      icon: <Radio className="w-3 h-3" />, 
      label: "RFID", 
      color: "border-purple-500/30 text-purple-400" 
    });
  }

  const isEmpty = productLineCount === 0 && variantCount === 0;

  const priceTierLabel = priceIndicator === '$' ? 'Budget-friendly' : priceIndicator === '$$' ? 'Mid-range' : priceIndicator === '$$$' ? 'Premium' : null;

  const hasHoverPreview = topMaterials.length > 0 || priceIndicator;

  const cardInner = (
    <div
      className={`flex flex-col min-h-[260px] rounded-xl overflow-hidden group transition-all duration-200 [@media(hover:hover)]:hover:scale-[1.02] [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-cyan-500/10 [@media(hover:hover)]:hover:border-cyan-500/30 animate-fade-in motion-reduce:animate-none ${isEmpty ? 'opacity-50 border border-dashed border-gray-800' : 'border border-border'}`}
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms`, animationFillMode: 'both' }}
    >
      {/* Color Accent Bar */}
      <div 
        className="h-1 w-full"
        style={{ 
          background: colorPrimary 
            ? colorPrimary 
            : 'linear-gradient(to right, hsl(var(--primary) / 0.3), transparent)' 
        }}
      />

      {/* Top Section - Logo Area (compact) */}
      <div className="relative h-[88px] bg-gray-800/60 flex items-center justify-center p-3">
        <BrandLogo
          src={resolvedLogoUrl}
          brandName={name}
          size="lg"
          className="max-h-10 max-w-full object-contain"
        />

        {/* Price Indicator - Top Left */}
        {priceIndicator && (
          <div className="absolute top-2.5 left-2.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-xs font-bold font-mono bg-background/80 px-1.5 py-0.5 rounded cursor-help ${priceIndicator === '$' ? 'text-green-500/60' : priceIndicator === '$$' ? 'text-amber-500/60' : 'text-orange-500/60'}`}
                  >
                    {priceIndicator}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 border border-white/10 text-sm max-w-[200px]">
                  {priceIndicator === '$' && 'Budget-Friendly: Typically under $25/kg'}
                  {priceIndicator === '$$' && 'Mid-Range: Typically $25-40/kg'}
                  {priceIndicator === '$$$' && 'Premium: Typically $40+/kg'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Bottom Section - Info Area */}
      <div className="flex-1 flex flex-col bg-card p-4 space-y-2">
        {/* Brand Name */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Key Stats Row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {isEmpty ? (
            <span className="text-xs text-gray-500 italic font-mono">Coming soon</span>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {productLineCount} {productLineCount === 1 ? 'product' : 'products'}
              </span>
              {variantCount > productLineCount && (
                <span className="text-[10px] text-muted-foreground">· {variantCount} colors</span>
              )}
              {priceTierLabel && (
                <span className="text-[10px] text-muted-foreground">· {priceTierLabel}</span>
              )}
            </>
          )}
          {averageRating && averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
              {averageRating.toFixed(1)}
            </span>
          )}
          {avgTransmissionDistance && avgTransmissionDistance > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-purple-400">
              <Sun className="h-3 w-3" />
              Avg TD {avgTransmissionDistance.toFixed(1)}
            </span>
          )}
          {isVerified && (
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-medium px-2 py-0.5 rounded-full border border-cyan-500/20">Verified ✓</span>
          )}
        </div>

        {/* Material Badges */}
        {topMaterials.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {topMaterials.slice(0, 3).map((material) => (
              <span
                key={material}
                className="bg-gray-800 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded border border-gray-700/50"
              >
                {material}
              </span>
            ))}
            {topMaterials.length > 3 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-slate-500 hover:text-cyan-400 inline-flex items-center ml-1 cursor-help">
                      +{topMaterials.length - 3} more
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-slate-800 border border-white/10 text-sm max-w-[200px]">
                    {topMaterials.slice(3).join(', ')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Color Palette Preview */}
        {colors.length > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {colors.slice(0, 8).map((hex, i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full border border-gray-700/50"
                style={{ backgroundColor: hex }}
              />
            ))}
            {colors.length > 8 && (
              <span className="text-[9px] text-muted-foreground ml-0.5">+{colors.length - 8}</span>
            )}
          </div>
        )}

        {/* Feature Badges */}
        {featureBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {featureBadges.slice(0, 2).map((badge) => (
              <span
                key={badge.label}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border bg-transparent ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* View Filaments CTA — styled as button but inside <Link> */}
        <div className="border-t border-border mt-auto pt-3">
          <span className="w-full rounded-lg border border-border py-2 text-sm font-medium text-cyan-400 transition-all duration-200 [@media(hover:hover)]:group-hover:text-cyan-300 [@media(hover:hover)]:group-hover:border-cyan-500/30 [@media(hover:hover)]:group-hover:bg-cyan-500/5 flex items-center justify-center gap-2">
            {isEmpty ? 'Notify Me' : variantCount > 0 ? `View ${variantCount} Filament${variantCount === 1 ? '' : 's'}` : `View ${productLineCount} Filament${productLineCount === 1 ? '' : 's'}`}
            <ArrowRight className="h-3.5 w-3.5 transition-transform [@media(hover:hover)]:group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </div>
  );

  const card = (
    <Link to={`/brands/${slug}`} className="block cursor-pointer">
      {cardInner}
    </Link>
  );

  if (!hasHoverPreview || isEmpty) return card;

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          {card}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          sideOffset={8} 
          className="hidden [@media(hover:hover)]:block bg-gray-900/95 border border-border p-4 rounded-xl max-w-[220px] shadow-xl"
        >
          <p className="text-xs font-semibold text-foreground mb-2">{name} Highlights</p>
          {topMaterials.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-muted-foreground mb-1">Specializes in:</p>
              <div className="flex flex-wrap gap-1">
                {topMaterials.slice(0, 4).map(mat => (
                  <span key={mat} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}
          {priceIndicator && (
            <p className="text-[10px] text-muted-foreground mb-2">
              Price range: {priceIndicator === '$' ? 'Budget-friendly (under $25/kg)' : priceIndicator === '$$' ? 'Mid-range ($25-40/kg)' : 'Premium ($40+/kg)'}
            </p>
          )}
          <p className="text-[10px] text-primary">Click to explore →</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BrandCard;
