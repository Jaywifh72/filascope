import React from 'react';
import { DollarSign, Award, Search, Smartphone, Wrench, Zap, ExternalLink, Star } from 'lucide-react';
import { getSpecializedPlatforms, PlatformData, metricTooltips } from '@/lib/platformData';
import { useFilters } from '@/contexts/PlatformFilterContext';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import StandoutBadge from './shared/StandoutBadge';

const getBadgeIcon = (iconName: string, size: number = 14) => {
  switch (iconName) {
    case 'dollar-sign': return <DollarSign size={size} />;
    case 'award': return <Award size={size} />;
    case 'search': return <Search size={size} />;
    case 'smartphone': return <Smartphone size={size} />;
    case 'wrench': return <Wrench size={size} />;
    default: return <Star size={size} />;
  }
};

interface SpecializedCardProps {
  platform: PlatformData;
}

const SpecializedCard: React.FC<SpecializedCardProps> = ({ platform }) => {
  return (
    <div 
      id={platform.targetId}
      className="relative p-5 bg-card/50 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-200"
    >
      {/* Badge */}
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
        style={{ 
          backgroundColor: `${platform.tierBadgeColor}15`,
          color: platform.tierBadgeColor,
          border: `1px solid ${platform.tierBadgeColor}40`
        }}
      >
        {getBadgeIcon(platform.tierBadgeIcon, 14)}
        <span>{platform.tierBadge}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={platform.logo} 
          alt={platform.name}
          className="w-12 h-12 object-contain rounded-lg bg-white/5 p-1.5"
        />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">{platform.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{platform.owner}</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-sm font-medium text-primary mb-3">{platform.tagline}</p>

      {/* Standout Feature */}
      {(() => {
        const standout = getStandoutForPlatform(platform.id);
        return standout ? (
          <StandoutBadge standout={standout} variant="compact" className="mb-4" />
        ) : null;
      })()}

      {/* Model Type */}
      <span 
        className="inline-block px-2 py-0.5 text-xs font-semibold rounded mb-4"
        style={{ 
          backgroundColor: `${platform.modelTypeColor}15`,
          color: platform.modelTypeColor
        }}
      >
        {platform.modelTypeLabel}
      </span>

      {/* Ratings Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Quality:</span>
          <RatingValue rating={platform.ratings.quality} size="small" showTooltip tooltipContent={metricTooltips.quality} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Community:</span>
          <RatingValue rating={platform.ratings.community} size="small" showTooltip tooltipContent={metricTooltips.community} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Search:</span>
          <RatingValue rating={platform.ratings.search} size="small" showTooltip tooltipContent={metricTooltips.search} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">UX:</span>
          <RatingValue rating={platform.ratings.ux} size="small" showTooltip tooltipContent={metricTooltips.ux} />
        </div>
      </div>

      {/* Best For */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{platform.bestFor}</p>

      {/* Features */}
      <div className="flex items-center gap-2 mb-4">
        {platform.features.free && (
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">Free</span>
        )}
        {platform.features.paid && (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">Paid</span>
        )}
        {platform.features.mobile && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">📱 Mobile</span>
        )}
      </div>

      {/* Action */}
      <a
        href={platform.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Visit Site <ExternalLink size={14} />
      </a>
    </div>
  );
};

const SpecializedSection: React.FC = () => {
  const { filteredPlatforms, hasActiveFilters } = useFilters();
  const allSpecialized = getSpecializedPlatforms();
  
  // Filter specialized platforms based on active filters
  const specialized = allSpecialized.filter(sp => 
    filteredPlatforms.some(fp => fp.id === sp.id)
  );

  // Hide entire section if no matches
  if (specialized.length === 0 && hasActiveFilters) return null;

  return (
    <section className="mb-12" role="region" aria-labelledby="specialized-title">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 id="specialized-title" className="text-xl md:text-2xl font-bold text-foreground">
              Specialized Platforms
            </h2>
            <p className="text-sm text-muted-foreground">
              For specific use cases and workflows
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {specialized.length} of {allSpecialized.length} platforms
          </p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {specialized.map(platform => (
          <SpecializedCard key={platform.id} platform={platform} />
        ))}
      </div>
    </section>
  );
};

export default SpecializedSection;
