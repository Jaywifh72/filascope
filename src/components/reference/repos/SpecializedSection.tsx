import React from 'react';
import { DollarSign, Award, Search, Smartphone, Wrench, Zap, ExternalLink, Star } from 'lucide-react';
import { getSpecializedPlatforms, PlatformData } from '@/lib/platformData';
import RatingValue from './shared/RatingValue';
import TierHeader from './shared/TierHeader';

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
        <RatingValue rating={platform.ratings.quality} size="small" />
      </div>

      {/* Standout */}
      <div className="flex items-center gap-1.5 text-sm text-primary mb-2">
        <Zap size={12} />
        <span className="truncate">{platform.standoutFeature}</span>
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
  const specialized = getSpecializedPlatforms();

  return (
    <section className="mb-12">
      <TierHeader 
        icon="⚡"
        title="Specialized Options"
        subtitle="Platforms optimized for specific use cases"
        count="5 of 8 platforms"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {specialized.map(platform => (
          <SpecializedCard key={platform.id} platform={platform} />
        ))}
      </div>
    </section>
  );
};

export default SpecializedSection;
