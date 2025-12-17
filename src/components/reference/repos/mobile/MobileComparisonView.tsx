import { useState, useRef } from 'react';
import QuickCompareCarousel from './QuickCompareCarousel';
import MobilePlatformList from './MobilePlatformList';
import MobileFilterBar from './MobileFilterBar';

interface Platform {
  id: string;
  name: string;
  owner: string;
  logo: string;
  overallScore: number;
  modelType: string;
  ratings: {
    quality: string;
    community: string;
    search: string;
    ux: string;
    monetization: string;
  };
  features: {
    free: boolean;
    mobile: boolean;
  };
  fileTypes: string[];
  bestFor: string;
  websiteUrl: string;
}

interface MobileComparisonViewProps {
  platforms: Platform[];
}

const MobileComparisonView = ({ platforms }: MobileComparisonViewProps) => {
  const [sortBy, setSortBy] = useState('rank');
  const listRef = useRef<HTMLDivElement>(null);

  // Sort platforms
  const sortedPlatforms = [...platforms].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.overallScore - a.overallScore;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quality':
        const qualityOrder: Record<string, number> = { 'excellent': 4, 'great': 3, 'good': 2, 'average': 1, 'limited': 0 };
        return (qualityOrder[b.ratings.quality.toLowerCase()] || 0) - (qualityOrder[a.ratings.quality.toLowerCase()] || 0);
      default: // rank - keep original order
        return 0;
    }
  });

  const handlePlatformSelect = (platformId: string) => {
    // Scroll to the platform card in the list
    const cardElement = document.getElementById(`mobile-platform-${platformId}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="block md:hidden">
      <MobileFilterBar
        totalCount={platforms.length}
        filteredCount={sortedPlatforms.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <QuickCompareCarousel
        platforms={sortedPlatforms}
        onPlatformSelect={handlePlatformSelect}
      />

      <div ref={listRef}>
        <MobilePlatformList platforms={sortedPlatforms} />
      </div>
    </div>
  );
};

export default MobileComparisonView;
