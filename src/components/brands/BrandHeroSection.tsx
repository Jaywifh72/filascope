import { Package, Layers, Tag, Star, Globe, ExternalLink, MapPin, Calendar, BadgeCheck, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BrandHeroSectionProps {
  brandName: string;
  brandLogo: string | null;
  isVerified?: boolean;
  location?: string;
  founded?: string;
  website?: string;
  productCount: number;
  topMaterials: string[];
  avgPriceRange?: string;
  rating?: number | null;
  className?: string;
}

interface SpecCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SpecCard({ icon, label, value }: SpecCardProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-start gap-3">
      <div className="text-primary flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-semibold text-white leading-tight">{value}</p>
      </div>
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
  productCount,
  topMaterials,
  avgPriceRange,
  rating,
  className,
}: BrandHeroSectionProps) {
  const materialsDisplay = topMaterials.length > 0 
    ? topMaterials.slice(0, 3).join(', ')
    : '—';

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Brand Logo */}
        <div className="flex-shrink-0">
          <div className="relative w-[150px] h-[150px] flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg p-4">
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
        <div className="flex-1 space-y-4">
          {/* Row 1: Brand Name + Verified */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{brandName}</h1>
            {isVerified && (
              <span className="flex items-center gap-1 text-sm text-primary">
                <BadgeCheck className="w-4 h-4" />
                Verified
              </span>
            )}
          </div>

          {/* Row 2: Location, Founded, Website */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <SpecCard
              icon={<Package className="w-5 h-5" />}
              label="Products"
              value={productCount.toString()}
            />
            <SpecCard
              icon={<Layers className="w-5 h-5" />}
              label="Materials"
              value={materialsDisplay}
            />
            <SpecCard
              icon={<Tag className="w-5 h-5" />}
              label="Avg Price"
              value={avgPriceRange || '—'}
            />
            <SpecCard
              icon={<Star className="w-5 h-5" />}
              label="Rating"
              value={rating ? rating.toFixed(1) : 'No ratings yet'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {website && (
              <Button asChild variant="primary" size="lg">
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </a>
              </Button>
            )}
            <Button variant="outline" size="lg">
              <Heart className="w-4 h-4 mr-2" />
              Save Brand
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
