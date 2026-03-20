export type RatingLevel = 'excellent' | 'great' | 'good' | 'average' | 'limited' | 'none';

export interface RatingConfig {
  level: RatingLevel;
  label: string;
  color: string;
  backgroundColor: string;
  description: string;
  numericValue: number;
}

export const ratingConfigs: Record<RatingLevel, RatingConfig> = {
  excellent: {
    level: 'excellent',
    label: 'Excellent',
    color: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    description: 'Best-in-class, industry leading',
    numericValue: 5
  },
  great: {
    level: 'great',
    label: 'Great',
    color: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    description: 'Above average, highly recommended',
    numericValue: 4
  },
  good: {
    level: 'good',
    label: 'Good',
    color: '#EAB308',
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    description: 'Adequate, meets expectations',
    numericValue: 3
  },
  average: {
    level: 'average',
    label: 'Average',
    color: '#6B7280',
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    description: 'Below average, has limitations',
    numericValue: 2
  },
  limited: {
    level: 'limited',
    label: 'Limited',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    description: 'Significant gaps, use with caution',
    numericValue: 1
  },
  none: {
    level: 'none',
    label: 'None',
    color: '#64748B',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    description: 'Feature not available',
    numericValue: 0
  }
};

export const metricTooltips: Record<string, string> = {
  quality: "Model quality standards, file integrity, and design excellence",
  community: "Active user base, engagement, forums, and support availability",
  search: "Search accuracy, filters, sorting options, and discovery features",
  ux: "User interface design, navigation ease, and overall experience",
  monetize: "Options for designers to sell models and earn revenue"
};

export const specialtyMetricTooltips: Record<string, string> = {
  easeOfUse: 'How quickly can a new user get started? Considers learning curve, documentation quality, and interface intuitiveness.',
  featureDepth: 'Breadth and depth of functionality. More features and advanced capabilities earn higher ratings.',
  valueForMoney: 'Quality relative to price. Free tools with great features score highest; expensive tools need exceptional value.',
  communitySupport: 'Active user base, available support, tutorials, and ongoing development/updates.',
  printFocus: 'How directly the tool serves 3D printing workflows. Pure printing tools score higher than general-purpose software.'
};

export const getRatingConfig = (rating: RatingLevel): RatingConfig => {
  return ratingConfigs[rating];
};

export const numericToRating = (value: number): RatingLevel => {
  if (value >= 5) return 'excellent';
  if (value >= 4) return 'great';
  if (value >= 3) return 'good';
  if (value >= 2) return 'average';
  return 'limited';
};

// Filter types
export type PriceFilter = 'free' | 'freemium' | 'premium';
export type BestForFilter = 'beginners' | 'sellers' | 'engineers' | 'hobbyists';
export type PrinterFilter = 'bambu' | 'creality' | 'universal';
export type FileTypeFilter = 'stl-obj' | '3mf' | 'cad-step';

export interface PlatformData {
  id: string;
  name: string;
  logo: string;
  owner: string;
  tagline: string;
  modelType: 'loss-leader' | 'hybrid' | 'ad-supported' | 'marketplace' | 'premium' | 'search-sub' | 'mobile-sub' | 'lead-gen';
  modelTypeLabel: string;
  modelTypeColor: string;
  
  tier: 1 | 2;
  tierBadge: string;
  tierBadgeColor: string;
  tierBadgeIcon: 'trophy' | 'printer' | 'archive' | 'dollar-sign' | 'award' | 'search' | 'smartphone' | 'wrench' | 'star';
  
  ratings: {
    quality: RatingLevel;
    community: RatingLevel;
    search: RatingLevel;
    ux: RatingLevel;
    monetize: RatingLevel;
  };
  
  features: {
    free: boolean;
    paid: boolean;
    mobile: boolean;
  };
  
  fileTypes: string[];
  standoutFeature: string;
  bestFor: string;
  whyPicked?: string[];
  websiteUrl: string;
  targetId: string;
  
  // Filter-specific data
  priceFilter: PriceFilter;
  bestForFilters: BestForFilter[];
  printerOptimization: PrinterFilter;
  fileTypeFilters: FileTypeFilter[];
}

export const platforms: PlatformData[] = [
  {
    id: 'printables',
    name: 'Printables',
    logo: '/images/platforms/printables.png',
    owner: 'Prusa Research',
    tagline: 'The Community Benchmark',
    modelType: 'hybrid',
    modelTypeLabel: 'Hybrid',
    modelTypeColor: '#EC4899',
    
    tier: 1,
    tierBadge: '#1 Staff Pick',
    tierBadgeColor: '#FFD700',
    tierBadgeIcon: 'trophy',
    
    ratings: {
      quality: 'excellent',
      community: 'excellent',
      search: 'excellent',
      ux: 'excellent',
      monetize: 'great'
    },
    
    features: { free: true, paid: true, mobile: false },
    fileTypes: ['STL', '3MF', 'G-code'],
    standoutFeature: 'Prusameters & Clubs',
    bestFor: 'Quality-focused makers who want vetted, community-curated designs',
    whyPicked: [
      'Highest quality curation standards',
      'Active community with contests and clubs',
      'Prusameter integration for printer-specific settings',
      'Strong creator reward program'
    ],
    websiteUrl: 'https://www.printables.com',
    targetId: 'platform-printables',
    
    // Filter data
    priceFilter: 'freemium',
    bestForFilters: ['hobbyists', 'beginners'],
    printerOptimization: 'universal',
    fileTypeFilters: ['stl-obj', '3mf']
  },
  {
    id: 'makerworld',
    name: 'MakerWorld',
    logo: '/images/platforms/makerworld.png',
    owner: 'Bambu Lab',
    tagline: 'The Ecosystem Disruptor',
    modelType: 'loss-leader',
    modelTypeLabel: 'Loss-Leader',
    modelTypeColor: '#EF4444',
    
    tier: 1,
    tierBadge: 'Best for Bambu',
    tierBadgeColor: '#00D9D9',
    tierBadgeIcon: 'printer',
    
    ratings: {
      quality: 'great',
      community: 'excellent',
      search: 'excellent',
      ux: 'excellent',
      monetize: 'excellent'
    },
    
    features: { free: true, paid: false, mobile: true },
    fileTypes: ['3MF', 'STL'],
    standoutFeature: 'One-Click Print Profiles',
    bestFor: 'Bambu Lab printer owners who want zero-friction workflow',
    whyPicked: [
      'One-click print profiles with pre-sliced settings',
      'Best creator reward/points system',
      'Seamless Bambu Studio integration',
      'Pushing industry toward 3MF standard'
    ],
    websiteUrl: 'https://makerworld.com',
    targetId: 'platform-makerworld',
    
    // Filter data
    priceFilter: 'free',
    bestForFilters: ['hobbyists', 'beginners'],
    printerOptimization: 'bambu',
    fileTypeFilters: ['stl-obj', '3mf']
  },
  {
    id: 'thingiverse',
    name: 'Thingiverse',
    logo: '/images/platforms/thingiverse.png',
    owner: 'UltiMaker',
    tagline: 'The Legacy Archive',
    modelType: 'ad-supported',
    modelTypeLabel: 'Ad-Supported',
    modelTypeColor: '#F59E0B',
    
    tier: 1,
    tierBadge: 'Largest Free Archive',
    tierBadgeColor: '#22C55E',
    tierBadgeIcon: 'archive',
    
    ratings: {
      quality: 'average',
      community: 'good',
      search: 'average',
      ux: 'average',
      monetize: 'none'
    },
    
    features: { free: true, paid: false, mobile: false },
    fileTypes: ['STL', 'OBJ'],
    standoutFeature: 'Largest Archive (6.7M+)',
    bestFor: 'Hobbyists looking for the widest selection of free models',
    whyPicked: [
      'Largest collection of free 3D models (6.7M+)',
      'Historical significance in 3D printing community',
      'Wide variety of categories and designs'
    ],
    websiteUrl: 'https://www.thingiverse.com',
    targetId: 'platform-thingiverse',
    
    // Filter data
    priceFilter: 'free',
    bestForFilters: ['hobbyists', 'beginners'],
    printerOptimization: 'universal',
    fileTypeFilters: ['stl-obj']
  },
  {
    id: 'cults3d',
    name: 'Cults3D',
    logo: '/images/platforms/cults3d.png',
    owner: 'Independent (France)',
    tagline: 'The Independent Marketplace',
    modelType: 'marketplace',
    modelTypeLabel: 'Marketplace',
    modelTypeColor: '#06B6D4',
    
    tier: 2,
    tierBadge: 'Best for Sellers',
    tierBadgeColor: '#F59E0B',
    tierBadgeIcon: 'dollar-sign',
    
    ratings: {
      quality: 'great',
      community: 'good',
      search: 'good',
      ux: 'great',
      monetize: 'excellent'
    },
    
    features: { free: true, paid: true, mobile: false },
    fileTypes: ['STL', 'OBJ', '3MF'],
    standoutFeature: '80/20 Commission Split',
    bestFor: 'Designers who want to sell models with the best commission rates',
    websiteUrl: 'https://cults3d.com',
    targetId: 'platform-cults3d',
    
    // Filter data
    priceFilter: 'freemium',
    bestForFilters: ['sellers', 'hobbyists'],
    printerOptimization: 'universal',
    fileTypeFilters: ['stl-obj', '3mf']
  },
  {
    id: 'myminifactory',
    name: 'MyMiniFactory',
    logo: '/images/platforms/myminifactory.png',
    owner: 'MMF (UK)',
    tagline: 'The Premium Curator',
    modelType: 'premium',
    modelTypeLabel: 'Premium',
    modelTypeColor: '#8B5CF6',
    
    tier: 2,
    tierBadge: 'Premium Curated',
    tierBadgeColor: '#8B5CF6',
    tierBadgeIcon: 'award',
    
    ratings: {
      quality: 'excellent',
      community: 'great',
      search: 'great',
      ux: 'great',
      monetize: 'great'
    },
    
    features: { free: false, paid: true, mobile: false },
    fileTypes: ['STL', 'OBJ'],
    standoutFeature: 'Guaranteed Printable',
    bestFor: 'Users willing to pay for guaranteed-printable, curated quality',
    websiteUrl: 'https://www.myminifactory.com',
    targetId: 'platform-myminifactory',
    
    // Filter data
    priceFilter: 'premium',
    bestForFilters: ['sellers', 'hobbyists'],
    printerOptimization: 'universal',
    fileTypeFilters: ['stl-obj']
  },
  {
    id: 'thangs',
    name: 'Thangs',
    logo: '/images/platforms/thangs.png',
    owner: 'Physna',
    tagline: 'The Geometric Search Engine',
    modelType: 'search-sub',
    modelTypeLabel: 'Search + Sub',
    modelTypeColor: '#10B981',
    
    tier: 2,
    tierBadge: 'AI Search',
    tierBadgeColor: '#10B981',
    tierBadgeIcon: 'search',
    
    ratings: {
      quality: 'good',
      community: 'good',
      search: 'excellent',
      ux: 'great',
      monetize: 'good'
    },
    
    features: { free: true, paid: true, mobile: false },
    fileTypes: ['30+ formats'],
    standoutFeature: 'Geometric AI Search',
    bestFor: "Users who know what shape they want but not what it's called",
    websiteUrl: 'https://thangs.com',
    targetId: 'platform-thangs',
    
    // Filter data
    priceFilter: 'freemium',
    bestForFilters: ['hobbyists', 'engineers'],
    printerOptimization: 'universal',
    fileTypeFilters: ['stl-obj', '3mf', 'cad-step']
  },
  {
    id: 'creality-cloud',
    name: 'Creality Cloud',
    logo: '/images/platforms/creality-cloud.png',
    owner: 'Creality',
    tagline: 'The Mobile Ecosystem',
    modelType: 'mobile-sub',
    modelTypeLabel: 'Mobile Sub',
    modelTypeColor: '#06B6D4',
    
    tier: 2,
    tierBadge: 'Mobile First',
    tierBadgeColor: '#06B6D4',
    tierBadgeIcon: 'smartphone',
    
    ratings: {
      quality: 'average',
      community: 'good',
      search: 'good',
      ux: 'great',
      monetize: 'good'
    },
    
    features: { free: true, paid: true, mobile: true },
    fileTypes: ['STL', 'G-code'],
    standoutFeature: 'Phone-to-Print',
    bestFor: 'Creality printer owners who want mobile-first workflow',
    websiteUrl: 'https://www.crealitycloud.com',
    targetId: 'platform-creality',
    
    // Filter data
    priceFilter: 'freemium',
    bestForFilters: ['hobbyists', 'beginners'],
    printerOptimization: 'creality',
    fileTypeFilters: ['stl-obj']
  },
  {
    id: 'grabcad',
    name: 'GrabCAD',
    logo: '/images/platforms/grabcad.png',
    owner: 'Stratasys',
    tagline: "The Engineer's Vault",
    modelType: 'lead-gen',
    modelTypeLabel: 'Lead Gen',
    modelTypeColor: '#64748B',
    
    tier: 2,
    tierBadge: 'For Engineers',
    tierBadgeColor: '#64748B',
    tierBadgeIcon: 'wrench',
    
    ratings: {
      quality: 'excellent',
      community: 'great',
      search: 'average',
      ux: 'great',
      monetize: 'none'
    },
    
    features: { free: true, paid: false, mobile: false },
    fileTypes: ['STEP', 'IGES', 'CAD'],
    standoutFeature: 'Engineering CAD Files',
    bestFor: 'Engineers needing professional CAD formats (STEP/IGES)',
    websiteUrl: 'https://grabcad.com',
    targetId: 'platform-grabcad',
    
    // Filter data
    priceFilter: 'free',
    bestForFilters: ['engineers'],
    printerOptimization: 'universal',
    fileTypeFilters: ['cad-step', 'stl-obj']
  }
];

export const getStaffPicks = () => platforms.filter(p => p.tier === 1);
export const getSpecializedPlatforms = () => platforms.filter(p => p.tier === 2);

export const getRatingColor = (rating: RatingLevel): string => {
  switch (rating) {
    case 'excellent': return '#22C55E';
    case 'great': return '#10B981';
    case 'good': return '#F59E0B';
    case 'average': return '#FB923C';
    case 'limited': return '#EF4444';
    case 'none': return '#64748B';
    default: return '#64748B';
  }
};
