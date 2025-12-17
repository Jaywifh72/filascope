import React from 'react';
import { DollarSign, Award, Search, Smartphone, Wrench, Zap, ExternalLink, Star } from 'lucide-react';
import { getSpecializedPlatforms, PlatformData, metricTooltips } from '@/lib/platformData';
import { useFilters } from '@/contexts/PlatformFilterContext';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import TierHeader from './shared/TierHeader';
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
      className="relative p-4 bg-card/30 border border-border/40 rounded-xl hover:border-primary/30 hover:bg-card/50 transition-all"
    >
      {/* Badge */}
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3"
        style={{ 
          backgroundColor: `${platform.tierBadgeColor}15`,
          color: platform.tierBadgeColor,
          border: `1px solid ${platform.tierBadgeColor}30`
        }}
      >
        {getBadgeIcon(platform.tierBadgeIcon, 12)}
        <span>{platform.tierBadge}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img 
          src={platform.logo} 
          alt={platform.name}
          className="w-10 h-10 object-contain rounded-lg bg-white/5 p-1"
        />
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground truncate">{platform.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{platform.owner}</p>
        </div>
      </div>

      {/* Standout Feature - Moved up for prominence */}
      {(() => {
        const standout = getStandoutForPlatform(platform.id);
        return standout ? (
          <StandoutBadge standout={standout} variant="compact" className="mb-3" />
        ) : null;
      })()}

      {/* Model Type */}
      <span 
        className="inline-block px-2 py-0.5 text-xs font-semibold rounded mb-3"
        style={{ 
          backgroundColor: `${platform.modelTypeColor}15`,
          color: platform.modelTypeColor
        }}
      >
        {platform.modelTypeLabel}
      </span>

      {/* Key Rating */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-muted-foreground">Quality:</span>
        <RatingValue rating={platform.ratings.quality} size="small" showTooltip tooltipContent={metricTooltips.quality} />
      </div>

      {/* Best For */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{platform.bestFor}</p>

      {/* Features */}
      <div className="flex items-center gap-2 mb-3">
        {platform.features.free && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted/30 text-muted-foreground rounded">Free</span>
        )}
        {platform.features.paid && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted/30 text-muted-foreground rounded">Paid</span>
        )}
        {platform.features.mobile && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-muted/30 text-muted-foreground rounded">📱</span>
        )}
      </div>

      {/* Action */}
      <a
        href={platform.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Visit Site <ExternalLink size={12} />
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
      <TierHeader 
        id="specialized-title"
        icon="⚡"
        title="Specialized Options"
        subtitle="Platforms optimized for specific use cases"
        count={`${specialized.length} of ${allSpecialized.length} platforms`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {specialized.map(platform => (
          <SpecializedCard key={platform.id} platform={platform} />
        ))}
      </div>
    </section>
  );
};

export default SpecializedSection;
