import { useNavigate } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { Package, BadgeCheck, Zap, ArrowRight, Leaf, Radio, Star } from "lucide-react";
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
}: BrandCardProps) => {
  const navigate = useNavigate();
  const resolvedLogoUrl = logoUrl || getBrandLogo(name);

  const handleClick = () => {
    navigate(`/brands/${toBrandSlug(name)}`);
  };

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

  return (

    <div
      className={`flex flex-col min-h-[280px] rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 [@media(hover:hover)]:hover:scale-[1.02] [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-cyan-500/10 [@media(hover:hover)]:hover:border-cyan-500/30 ${isEmpty ? 'opacity-50 border border-dashed border-gray-800' : 'border border-border'}`}
      onClick={handleClick}
    >
      {/* Top Section - Logo Area */}
      <div className="relative aspect-[2/1] bg-gray-800/60 flex items-center justify-center p-4">
        <BrandLogo
          src={resolvedLogoUrl}
          brandName={name}
          size="lg"
          className="max-h-12 max-w-full object-contain"
        />

        {/* Price Indicator - Top Left */}
        {priceIndicator && (
          <div className="absolute top-3 left-3">
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
      <div className="flex-1 flex flex-col bg-card p-4 space-y-2.5">
        {/* Brand Name */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Key Stats Row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {isEmpty ? (
            <span className="text-xs text-gray-500 italic font-mono">Coming soon</span>
          ) : (
            <span>
              {productLineCount} {productLineCount === 1 ? 'product' : 'products'}
              {variantCount > productLineCount && (
                <span className="text-muted-foreground/60"> ({variantCount} {variantCount === 1 ? 'variant' : 'variants'})</span>
              )}
            </span>
          )}
          {averageRating && averageRating > 0 ? (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
              {averageRating.toFixed(1)}
            </span>
          ) : !isEmpty ? (
            <span className="text-[10px] text-muted-foreground/40 font-mono italic">No rating yet</span>
          ) : null}
          {isVerified && (
            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/20">Verified ✓</span>
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

        {/* Feature Badges */}
        {featureBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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

        {/* View Filaments Button */}
        <div className="border-t border-border mt-auto pt-3">
          <button
            className="w-full rounded-lg border border-border py-2 text-sm font-medium text-cyan-400 transition-all duration-200 [@media(hover:hover)]:group-hover:text-cyan-300 [@media(hover:hover)]:group-hover:border-cyan-500/30 [@media(hover:hover)]:group-hover:bg-cyan-500/5 flex items-center justify-center gap-2 group/btn"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {isEmpty ? 'Notify Me' : 'View Filaments'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform [@media(hover:hover)]:group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandCard;
