import { useNavigate } from "react-router-dom";
import { Package, BadgeCheck, Zap, ArrowRight } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { Button } from "@/components/ui/button";

interface BrandCardProps {
  name: string;
  count: number;
  isVerified: boolean;
  hasHighSpeed: boolean;
  topMaterials: string[];
  logoUrl?: string | null;
}

const BrandCard = ({
  name,
  count,
  isVerified,
  hasHighSpeed,
  topMaterials,
  logoUrl,
}: BrandCardProps) => {
  const navigate = useNavigate();
  const resolvedLogoUrl = logoUrl || getBrandLogo(name);

  const handleClick = () => {
    navigate(`/brands/${encodeURIComponent(name)}`);
  };

  return (
    <div
      className="border border-gray-700 rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
      onClick={handleClick}
    >
      {/* Top Section - Logo Area */}
      <div className="relative bg-gray-800 p-6 flex items-center justify-center h-28">
        {resolvedLogoUrl ? (
          <img
            src={resolvedLogoUrl}
            alt={name}
            className="max-h-20 max-w-full object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-8 h-8 text-primary" />
          </div>
        )}
        
        {/* Verified Badge - Top Right */}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <BadgeCheck className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      {/* Bottom Section - Info Area */}
      <div className="bg-gray-900 p-4 space-y-3">
        {/* Brand Name */}
        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Filament Count */}
        <p className="text-sm text-gray-400">{count} filaments</p>

        {/* Material Badges */}
        {topMaterials.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topMaterials.slice(0, 3).map((material) => (
              <span
                key={material}
                className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300 border border-gray-700"
              >
                {material}
              </span>
            ))}
            {topMaterials.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-500">
                +{topMaterials.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Feature Badge - High Speed */}
        {hasHighSpeed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-primary/30 text-primary bg-transparent">
            <Zap className="w-3 h-3" />
            High Speed
          </span>
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
