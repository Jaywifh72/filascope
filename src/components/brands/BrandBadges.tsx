import { BadgeCheck, Crown, DollarSign, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BrandBadgeType = 'verified-partner' | 'premium' | 'budget-friendly' | 'high-speed';

interface BrandBadge {
  type: BrandBadgeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  colorClass: string;
  bgClass: string;
}

const BADGE_CONFIG: Record<BrandBadgeType, Omit<BrandBadge, 'type'>> = {
  'verified-partner': {
    label: 'Verified Partner',
    icon: <BadgeCheck className="w-4 h-4" />,
    description: 'Official affiliate partner with direct relationship',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10 border-primary/30',
  },
  'premium': {
    label: 'Premium',
    icon: <Crown className="w-4 h-4" />,
    description: 'Known for high-quality filaments and materials',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
  },
  'budget-friendly': {
    label: 'Budget-Friendly',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Great value filaments at affordable prices',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10 border-green-500/30',
  },
  'high-speed': {
    label: 'High Speed Compatible',
    icon: <Zap className="w-4 h-4" />,
    description: 'Offers filaments optimized for high-speed printing',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10 border-cyan-500/30',
  },
};

// Brand classification data - can be moved to database later
const BRAND_CLASSIFICATIONS: Record<string, BrandBadgeType[]> = {
  // Verified Partners (direct affiliate relationships)
  'Polymaker': ['verified-partner', 'premium', 'high-speed'],
  'Bambu Lab': ['verified-partner', 'premium', 'high-speed'],
  'Prusament': ['verified-partner', 'premium'],
  'Overture': ['verified-partner', 'budget-friendly'],
  'eSun': ['verified-partner', 'budget-friendly', 'high-speed'],
  
  // Premium brands
  'Fillamentum': ['premium'],
  'ColorFabb': ['premium'],
  '3DXTech': ['premium'],
  'NinjaTek': ['premium'],
  'Proto-pasta': ['premium'],
  'FormFutura': ['premium'],
  'Ultimaker': ['premium'],
  'Extrudr': ['premium'],
  'Fiberlogy': ['premium'],
  
  // Budget-friendly brands
  'SUNLU': ['budget-friendly', 'high-speed'],
  'Creality': ['budget-friendly', 'high-speed'],
  'Elegoo': ['budget-friendly', 'high-speed'],
  'Hatchbox': ['budget-friendly'],
  'Amolen': ['budget-friendly'],
  'Duramic 3D': ['budget-friendly'],
  'Geeetech': ['budget-friendly'],
  'Eryone': ['budget-friendly'],
  'ANYCUBIC': ['budget-friendly'],
  'Kingroon': ['budget-friendly'],
  '3DHOJOR': ['budget-friendly'],
  
  // High-speed focused
  'Sovol': ['high-speed'],
  'QIDI': ['high-speed'],
};

export function getBrandBadges(brandName: string, hasHighSpeedProducts?: boolean): BrandBadgeType[] {
  const normalizedName = brandName.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
  
  // Find matching brand (case-insensitive)
  const matchingBrand = Object.keys(BRAND_CLASSIFICATIONS).find(
    key => key.toLowerCase().replace(/[-_\s]+/g, ' ').trim() === normalizedName
  );
  
  const badges = matchingBrand ? [...BRAND_CLASSIFICATIONS[matchingBrand]] : [];
  
  // Add high-speed badge dynamically if brand has high-speed products but not already classified
  if (hasHighSpeedProducts && !badges.includes('high-speed')) {
    badges.push('high-speed');
  }
  
  return badges;
}

interface BrandBadgeProps {
  type: BrandBadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function BrandBadge({ type, size = 'md', showLabel = true, className }: BrandBadgeProps) {
  const config = BADGE_CONFIG[type];
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs gap-1',
    md: 'px-2 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors',
        sizeClasses[size],
        config.bgClass,
        config.colorClass,
        className
      )}
      title={config.description}
    >
      <span className={iconSizes[size]}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface BrandBadgesDisplayProps {
  brandName: string;
  hasHighSpeedProducts?: boolean;
  maxBadges?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandBadgesDisplay({ 
  brandName, 
  hasHighSpeedProducts,
  maxBadges = 3,
  size = 'md',
  className 
}: BrandBadgesDisplayProps) {
  const badges = getBrandBadges(brandName, hasHighSpeedProducts);
  
  if (badges.length === 0) return null;
  
  const displayBadges = badges.slice(0, maxBadges);
  const remaining = badges.length - maxBadges;
  
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayBadges.map((badge) => (
        <BrandBadge key={badge} type={badge} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground self-center">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
