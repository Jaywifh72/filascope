import React from 'react';
import { Trophy, Printer, Archive, Check, Zap, ExternalLink, Star } from 'lucide-react';
import { getStaffPicks, PlatformData } from '@/lib/platformData';
import RatingValue from './shared/RatingValue';
import FeatureTag from './shared/FeatureTag';
import TierHeader from './shared/TierHeader';

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
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ platform }) => {
  return (
    <div 
      id={platform.targetId}
      className="relative p-6 bg-gradient-to-br from-amber-500/5 via-background to-background border-2 border-amber-500/30 rounded-2xl"
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

      {/* Ratings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(['quality', 'community', 'search', 'ux'] as const).map(key => (
          <div key={key} className="text-center">
            <p className="text-xs text-muted-foreground mb-1 capitalize">{key}</p>
            <RatingValue rating={platform.ratings[key]} size="medium" />
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
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-1">Best For</p>
        <p className="text-sm text-foreground">{platform.bestFor}</p>
      </div>

      {/* Standout */}
      <div className="flex items-center gap-2 text-sm text-primary mb-6">
        <Zap size={16} />
        <span className="font-medium">Standout:</span>
        <span>{platform.standoutFeature}</span>
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

interface SecondaryCardProps {
  platform: PlatformData;
}

const SecondaryCard: React.FC<SecondaryCardProps> = ({ platform }) => {
  return (
    <div 
      id={platform.targetId}
      className="relative p-5 bg-card/50 border border-border/50 rounded-xl hover:border-primary/30 transition-colors"
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
        <div>
          <h3 className="text-lg font-bold text-foreground">{platform.name}</h3>
          <p className="text-sm font-medium text-primary">{platform.tagline}</p>
        </div>
      </div>

      {/* Quick Ratings */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Quality:</span>
          <RatingValue rating={platform.ratings.quality} size="small" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Community:</span>
          <RatingValue rating={platform.ratings.community} size="small" />
        </div>
      </div>

      {/* Standout */}
      <div className="flex items-center gap-2 text-sm text-primary mb-3">
        <Zap size={14} />
        <span>{platform.standoutFeature}</span>
      </div>

      {/* Best For */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{platform.bestFor}</p>

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

const StaffPicksSection: React.FC = () => {
  const staffPicks = getStaffPicks();
  const featured = staffPicks[0];
  const secondary = staffPicks.slice(1);

  return (
    <section className="mb-12" role="region" aria-labelledby="staff-picks-title">
      <TierHeader 
        id="staff-picks-title"
        icon="🏆"
        title="Staff Picks"
        subtitle="Our top recommendations based on 100+ hours of research"
        count="3 of 8 platforms"
      />

      <div className="space-y-6">
        <FeaturedCard platform={featured} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondary.map(platform => (
            <SecondaryCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StaffPicksSection;
