import { Package, Layers, Tag, Star, Globe, ExternalLink, MapPin, Calendar, BadgeCheck, Heart, ShieldCheck, TrendingUp, Database, Handshake } from 'lucide-react';
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAffiliateLink } from '@/hooks/useAffiliateLink';
import { toast } from '@/hooks/use-toast';

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
  reviewCount?: number;
  onNavigateToProducts?: () => void;
  onNavigateToMaterials?: () => void;
  onNavigateToProductsSorted?: () => void;
  className?: string;
}

interface SpecCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

function SpecCard({ icon, label, value, tooltip, ariaLabel, onClick }: SpecCardProps) {
  const card = (
    <div
      className={cn(
        "bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-3 min-w-0",
        "transition-all duration-200",
        "hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:scale-[1.02]",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={ariaLabel || (onClick ? `${label}: ${value}` : undefined)}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
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
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-400">
      <Icon className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function RatingStars({ rating, reviewCount }: { rating?: number | null; reviewCount?: number }) {
  if (rating && rating > 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i <= Math.round(rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-600"
              )}
            />
          ))}
        </div>
        <span className="text-lg font-bold text-white">{rating.toFixed(1)}</span>
        {reviewCount != null && reviewCount > 0 && (
          <span className="text-xs text-gray-400">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 fill-none text-gray-600" />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          toast({ title: "Reviews coming soon!", description: "We're building a community review system." });
        }}
        className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
      >
        Be the first to rate
      </button>
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
  reviewCount,
  onNavigateToProducts,
  onNavigateToMaterials,
  onNavigateToProductsSorted,
  className,
}: BrandHeroSectionProps) {
  const [heartBounce, setHeartBounce] = useState(false);

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


  const { buildLink, trackAndOpen, hasAffiliate } = useAffiliateLink(brandName);

  const handleSaveBrand = () => {
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 300);
    toast({ title: "Brand saved!", description: `${brandName} has been added to your saved brands.` });
  };

  const logoContent = (
    <div className={cn(
      "relative w-[120px] h-[120px] lg:w-[150px] lg:h-[150px] flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg p-4",
      "transition-all duration-300",
      website && "hover:ring-2 hover:ring-cyan-400/30 cursor-pointer"
    )}>
      <BrandLogo src={brandLogo} brandName={brandName} size="lg" />
      {isVerified && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                <BadgeCheck className="w-4 h-4 text-black" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-sm">Verified by FilaScope — specs and pricing confirmed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  return (
    <div className={cn("mb-8", className)}>
      {/* Main Hero Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left: Brand Logo */}
        <div className="flex-shrink-0 flex justify-center lg:justify-start">
          {website ? (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={hasAffiliate ? buildLink(website) : website}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    onClick={(e) => {
                      if (hasAffiliate) {
                        e.preventDefault();
                        trackAndOpen(website, {
                          sourcePage: window.location.pathname,
                          sourceComponent: 'BrandHeroSection-logo',
                        });
                      }
                    }}
                  >
                    {logoContent}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-sm">Visit {brandName} website</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            logoContent
          )}
        </div>

        {/* Right: Brand Info */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          {/* Row 1: Brand Name + Verified */}
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {brandName}{' '}
              <span className="block text-base sm:text-lg font-normal text-primary/80 mt-0.5">3D Printer Filaments</span>
            </h1>
            {isVerified && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <BadgeCheck className="w-4 h-4" />
                      Verified
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm">Verified by FilaScope — specs and pricing confirmed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Row 2: Location, Founded, Website */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-400">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {location}
              </span>
            )}
            {founded && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                Founded {founded}
              </span>
            )}
            {website && (
              <a 
                href={hasAffiliate ? buildLink(website) : website} 
                target="_blank" 
                rel={hasAffiliate ? "nofollow sponsored noopener noreferrer" : "nofollow noopener noreferrer"}
                className="flex items-center gap-1.5 text-primary hover:underline"
                onClick={(e) => {
                  if (hasAffiliate) {
                    e.preventDefault();
                    trackAndOpen(website, {
                      sourcePage: window.location.pathname,
                      sourceComponent: 'BrandHeroSection-inline',
                    });
                  }
                }}
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                Website
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <SpecCard
              icon={<Package className="w-5 h-5" />}
              label="Products"
              value={productsDisplay}
              ariaLabel={`View all ${productLineCount} products`}
              onClick={onNavigateToProducts}
            />
            <SpecCard
              icon={<Layers className="w-5 h-5" />}
              label="Materials"
              value={materialsDisplay}
              tooltip={materialsTooltip}
              ariaLabel={`View ${topMaterials.length} material types`}
              onClick={onNavigateToMaterials}
            />
            <SpecCard
              icon={<Tag className="w-5 h-5" />}
              label="Price Range"
              value={avgPriceRange || '—'}
              tooltip={avgPriceRange === '$' ? 'Budget-Friendly: Typically under $25/kg' : avgPriceRange === '$$' ? 'Mid-Range: Typically $25-40/kg' : avgPriceRange === '$$$' ? 'Premium: Typically $40+/kg' : undefined}
              ariaLabel="View products sorted by price"
              onClick={onNavigateToProductsSorted}
            />
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-3 min-w-0 transition-all duration-200 hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:scale-[1.02]">
              <div className="text-primary flex-shrink-0 mt-0.5">
                <Star className={cn("w-5 h-5", rating && rating > 0 ? "fill-amber-400 text-amber-400" : "text-slate-600")} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-400 mb-1">Community Rating</p>
                <RatingStars rating={rating} reviewCount={reviewCount} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 pt-2">
            {website && (
              <Button
                size="lg"
                className="w-full sm:w-auto group"
                onClick={() => {
                  if (hasAffiliate) {
                    trackAndOpen(website, {
                      sourcePage: window.location.pathname,
                      sourceComponent: 'BrandHeroSection',
                    });
                  } else {
                    window.open(website, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
                Visit Website
                <ExternalLink className="w-3.5 h-3.5 ml-2 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                {hasAffiliate && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs opacity-75">
                    <Handshake className="w-3 h-3" aria-hidden="true" />
                    Partner
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleSaveBrand}
            >
              <Heart
                className={cn(
                  "w-4 h-4 mr-2 transition-transform duration-300",
                  heartBounce && "scale-125"
                )}
                aria-hidden="true"
              />
              Save Brand
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
            <TrustIndicator icon={TrendingUp} label="Price Tracking" />
            <TrustIndicator icon={Database} label="Complete Catalog" />
          </div>
        </div>
      </div>
    </div>
  );
}
