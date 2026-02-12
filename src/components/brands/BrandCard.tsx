import { useNavigate } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { Package, BadgeCheck, Zap, ArrowRight, Leaf, Radio, Star } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";


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
      className={`flex flex-col min-h-[280px] rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/8 hover:-translate-y-0.5 ${isEmpty ? 'opacity-50 border border-dashed border-gray-800' : 'border border-border hover:border-cyan-500/20'}`}
      onClick={handleClick}
    >
      {/* Top Section - Logo Area */}
      <div className="relative bg-muted/50 p-6 flex items-center justify-center h-28">
        <div className={`flex items-center justify-center rounded-lg px-4 py-2 max-h-20 ${resolvedLogoUrl ? 'bg-white/10 dark:bg-white/20' : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/30'}`}>
          <BrandLogo
            src={resolvedLogoUrl}
            brandName={name}
            size="lg"
            className="max-h-16 max-w-full"
          />
        </div>
        

        {/* Price Indicator - Top Left */}
        {priceIndicator && (
          <div className="absolute top-3 left-3">
            <span
              className={`text-xs font-bold font-mono bg-background/80 px-1.5 py-0.5 rounded ${priceIndicator === '$' ? 'text-green-500/60' : priceIndicator === '$$' ? 'text-amber-500/60' : 'text-orange-500/60'}`}
              title={priceIndicator === '$' ? 'Budget-friendly brand' : priceIndicator === '$$' ? 'Mid-range pricing' : 'Premium pricing'}
            >
              {priceIndicator}
            </span>
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
          <div>
            <div className="flex flex-wrap gap-1.5 max-h-[28px] overflow-hidden">
              {topMaterials.slice(0, 4).map((material) => (
                <span
                  key={material}
                  className="bg-gray-800 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded border border-gray-700/50"
                >
                  {material}
                </span>
              ))}
            </div>
            {topMaterials.length > 4 && (
              <span className="text-[10px] text-gray-500 font-mono mt-1 inline-block">
                +{topMaterials.length - 4} more
              </span>
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
        <button
          className="w-full h-10 rounded-lg border border-cyan-500/30 text-cyan-400 text-sm font-medium transition-all duration-200 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center gap-2 mt-auto group/btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {isEmpty ? 'Notify Me' : 'View Filaments'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

export default BrandCard;
