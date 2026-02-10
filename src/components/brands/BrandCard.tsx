import { useNavigate } from "react-router-dom";
import { toBrandSlug } from "@/utils/brandSlug";
import { Package, BadgeCheck, Zap, ArrowRight, Leaf, Radio, Star } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";

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

  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
      onClick={handleClick}
    >
      {/* Top Section - Logo Area */}
      <div className="relative bg-muted/50 p-6 flex items-center justify-center h-28">
        <div className="flex items-center justify-center rounded-lg bg-white/10 dark:bg-white/[0.07] px-4 py-2 max-h-20">
          <BrandLogo
            src={resolvedLogoUrl}
            brandName={name}
            size="lg"
            className="max-h-16 max-w-full"
          />
        </div>
        
        {/* Verified Badge - Top Right */}
        {isVerified && (
          <div className="absolute top-3 right-3" title="Verified Brand">
            <BadgeCheck className="w-5 h-5 text-primary" />
          </div>
        )}

        {/* Price Indicator - Top Left */}
        {priceIndicator && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
              {priceIndicator}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Section - Info Area */}
      <div className="bg-card p-4 space-y-2.5">
        {/* Brand Name */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Key Stats Row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {productLineCount} {productLineCount === 1 ? 'product' : 'products'}
            {variantCount > productLineCount && (
              <span className="text-muted-foreground/60"> ({variantCount} {variantCount === 1 ? 'variant' : 'variants'})</span>
            )}
          </span>
          {averageRating && averageRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#FFB800] text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.6)]" />
              {averageRating.toFixed(1)}
            </span>
          )}
          {isVerified && (
            <span className="text-primary text-xs">Verified ✓</span>
          )}
        </div>

        {/* Material Badges */}
        {topMaterials.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topMaterials.slice(0, 4).map((material) => (
              <span
                key={material}
                className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
              >
                {material}
              </span>
            ))}
            {topMaterials.length > 4 && (
              <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground/60">
                +{topMaterials.length - 4}
              </span>
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

        {/* View Filaments Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-primary hover:text-primary hover:bg-primary/10 group/btn"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View Filaments
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

export default BrandCard;
