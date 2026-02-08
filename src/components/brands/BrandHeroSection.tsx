import { Package, Layers, Tag, Star, Globe, ExternalLink, MapPin, Calendar, BadgeCheck, Heart, ShieldCheck, TrendingUp, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BrandHeroSectionProps {
  brandName: string;
  brandLogo: string | null;
  isVerified?: boolean;
  location?: string;
  founded?: string;
  website?: string;
  productLineCount: number;
  variantCount: number;
  topMaterials: string[];
  avgPriceRange?: string;
  rating?: number | null;
  className?: string;
}

interface SpecCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

function SpecCard({ icon, label, value, tooltip }: SpecCardProps) {
  const card = (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-3 min-w-0">
      <div className="text-primary flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-base font-semibold text-white leading-tight truncate">{value}</p>
      </div>
    </div>
  );

  if (tooltip && tooltip !== value) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return card;
}

function TrustIndicator({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Icon className="w-4 h-4 text-green-500" />
      <span>{label}</span>
    </div>
  );
}

export function BrandHeroSection({
  brandName,
  brandLogo,
  isVerified = false,
  location,
  founded,
  website,
  productLineCount,
  variantCount,
  topMaterials,
  avgPriceRange,
  rating,
  className,
}: BrandHeroSectionProps) {
  // Build materials display: show up to 3 + count
  const materialsDisplay = (() => {
    if (topMaterials.length === 0) return '—';
    const shown = topMaterials.slice(0, 3).join(', ');
    if (topMaterials.length > 3) {
      return `${shown} +${topMaterials.length - 3}`;
    }
    return shown;
  })();

  const materialsTooltip = topMaterials.length > 3
    ? topMaterials.join(', ')
    : undefined;

  // Build products display: "40 Products (227 variants)"
  const productsDisplay = variantCount > productLineCount
    ? `${productLineCount} (${variantCount} ${variantCount === 1 ? 'variant' : 'variants'})`
    : `${productLineCount}`;


  return (
    <div className={cn("mb-8", className)}>
      {/* Main Hero Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left: Brand Logo */}
        <div className="flex-shrink-0 flex justify-center lg:justify-start">
          <div className="relative w-[120px] h-[120px] lg:w-[150px] lg:h-[150px] flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={brandName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-4xl font-bold text-gray-500">
                {brandName.charAt(0)}
              </div>
            )}
            {isVerified && (
              <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                <BadgeCheck className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Brand Info */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          {/* Row 1: Brand Name + Verified */}
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{brandName}</h1>
            {isVerified && (
              <span className="flex items-center gap-1 text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                <BadgeCheck className="w-4 h-4" />
                Verified
              </span>
            )}
          </div>

          {/* Row 2: Location, Founded, Website */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-400">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
            )}
            {founded && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Founded {founded}
              </span>
            )}
            {website && (
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <SpecCard
              icon={<Package className="w-5 h-5" />}
              label="Products"
              value={productsDisplay}
            />
            <SpecCard
              icon={<Layers className="w-5 h-5" />}
              label="Materials"
              value={materialsDisplay}
              tooltip={materialsTooltip}
            />
            <SpecCard
              icon={<Tag className="w-5 h-5" />}
              label="Price Range"
              value={avgPriceRange || '—'}
            />
            <SpecCard
              icon={<Star className="w-5 h-5" />}
              label="Rating"
              value={rating ? rating.toFixed(1) : 'No ratings'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
            {website && (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </a>
              </Button>
            )}
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Heart className="w-4 h-4 mr-2" />
              Save Brand
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 pt-2">
            {isVerified && (
              <TrustIndicator icon={ShieldCheck} label="Verified Brand" />
            )}
            <TrustIndicator icon={TrendingUp} label="Price Tracking" />
            <TrustIndicator icon={Database} label="Complete Catalog" />
          </div>
        </div>
      </div>
    </div>
  );
}
