import React from 'react';
import { Trophy, Printer, Archive, Check, ExternalLink, Star } from 'lucide-react';
import { getStaffPicks, PlatformData, metricTooltips } from '@/lib/platformData';
import { useFilters } from '@/contexts/PlatformFilterContext';
import { getStandoutForPlatform } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import FeatureTag from './shared/FeatureTag';
import StandoutBadge from './shared/StandoutBadge';

const getBadgeIcon = (iconName: string, size: number = 14) => {
  switch (iconName) {
    case 'trophy': return <Trophy size={size} />;
    case 'printer': return <Printer size={size} />;
    case 'archive': return <Archive size={size} />;
    default: return <Star size={size} />;
  }
};

interface FeaturedCardProps {
  platform: PlatformData;
  rank: number;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ platform, rank }) => {
  return (
    <div 
      id={platform.targetId}
      className="relative p-6 bg-gradient-to-br from-primary/5 via-background to-background border border-primary/30 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-200"
    >
      {/* Badge */}
      <div 
        className="absolute -top-3 left-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold"
        style={{ 
          backgroundColor: `${platform.tierBadgeColor}20`,
          color: platform.tierBadgeColor,
          border: `1px solid ${platform.tierBadgeColor}50`
        }}
      >
        {getBadgeIcon(platform.tierBadgeIcon, 16)}
        <span>{platform.tierBadge}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 mt-4 mb-6">
        <img 
          src={platform.logo} 
          alt={platform.name}
          className="w-16 h-16 object-contain rounded-xl bg-white/5 p-2"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-foreground">{platform.name}</h3>
          <p className="text-sm text-muted-foreground">by {platform.owner}</p>
          <p className="text-base font-medium text-primary mt-1">{platform.tagline}</p>
        </div>
        <span 
          className="px-3 py-1 text-xs font-semibold rounded-full"
          style={{ 
            backgroundColor: `${platform.modelTypeColor}20`,
            color: platform.modelTypeColor
          }}
        >
          {platform.modelTypeLabel}
        </span>
      </div>

      {/* Standout Feature */}
      {(() => {
        const standout = getStandoutForPlatform(platform.id);
        return standout ? (
          <StandoutBadge standout={standout} variant="standard" className="mb-6" />
        ) : null;
      })()}

      {/* Ratings - 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(['quality', 'community', 'search', 'ux'] as const).map(key => (
          <div key={key} className="text-center">
            <p className="text-xs text-muted-foreground mb-1 capitalize">{key}</p>
            <RatingValue 
              rating={platform.ratings[key]} 
              size="medium" 
              showTooltip 
              tooltipContent={metricTooltips[key]} 
            />
          </div>
        ))}
      </div>

      {/* Why We Picked It */}
      {platform.whyPicked && (
        <div className="mb-6 p-4 bg-muted/20 rounded-xl border border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">Why We Picked It</h4>
          <ul className="space-y-2">
            {platform.whyPicked.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Features */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FeatureTag label="Free" active={platform.features.free} />
        <FeatureTag label="Paid" active={platform.features.paid} />
        <FeatureTag label="Mobile" active={platform.features.mobile} />
        <span className="px-2 py-1 text-xs font-medium bg-muted/30 text-muted-foreground rounded-md">
          {platform.fileTypes.join(' / ')}
        </span>
      </div>

      {/* Best For */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Best For</p>
        <p className="text-sm text-foreground">{platform.bestFor}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href={platform.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Visit Website <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

const StaffPicksSection: React.FC = () => {
  const { filteredPlatforms, hasActiveFilters } = useFilters();
  const allStaffPicks = getStaffPicks();
  
  // Filter staff picks based on active filters
  const staffPicks = allStaffPicks.filter(pick => 
    filteredPlatforms.some(fp => fp.id === pick.id)
  );

  // Hide entire section if no matches
  if (staffPicks.length === 0 && hasActiveFilters) return null;

  return (
    <section className="mb-12" role="region" aria-labelledby="staff-picks-title">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 id="staff-picks-title" className="text-xl md:text-2xl font-bold text-foreground">
              Our Top Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              Staff-curated picks based on 100+ hours of research
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing {staffPicks.length} of {allStaffPicks.length} platforms
          </p>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {staffPicks.map((platform, index) => (
          <FeaturedCard key={platform.id} platform={platform} rank={index + 1} />
        ))}
      </div>
    </section>
  );
};

export default StaffPicksSection;
