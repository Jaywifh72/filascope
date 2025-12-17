import { useState } from 'react';
import MobilePlatformCard from './MobilePlatformCard';

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

interface MobilePlatformListProps {
  platforms: Platform[];
}

const MobilePlatformList = ({ platforms }: MobilePlatformListProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2 border-b border-white/[0.08]">
        <h2 className="text-lg font-bold text-foreground">All Platforms</h2>
        <span className="text-[13px] font-semibold text-muted-foreground px-3 py-1.5 bg-white/5 rounded-full">
          {platforms.length} platforms
        </span>
      </div>

      {/* Card List */}
      <div className="flex flex-col gap-4 pb-8">
        {platforms.map((platform, index) => (
          <MobilePlatformCard
            key={platform.id}
            platform={platform}
            rank={index + 1}
            isExpanded={expandedId === platform.id}
            onToggle={() => toggleExpanded(platform.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default MobilePlatformList;
