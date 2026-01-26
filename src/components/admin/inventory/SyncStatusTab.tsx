import { useState } from 'react';
import { CurrentSyncStatus } from './sync-status/CurrentSyncStatus';
import { BrandHealthGrid } from './sync-status/BrandHealthGrid';
import { RecentSyncRuns } from './sync-status/RecentSyncRuns';
import { FailedProductsList } from './sync-status/FailedProductsList';

export function SyncStatusTab() {
  const [brandFilter, setBrandFilter] = useState<string | undefined>(undefined);

  const handleBrandClick = (brandSlug: string) => {
    setBrandFilter(brandSlug);
  };

  const handleClearBrandFilter = () => {
    setBrandFilter(undefined);
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Current Sync Status */}
      <CurrentSyncStatus />

      {/* Brand Health Overview */}
      <BrandHealthGrid onBrandClick={handleBrandClick} />

      {/* Recent Sync Runs */}
      <RecentSyncRuns 
        brandFilter={brandFilter} 
        onClearBrandFilter={handleClearBrandFilter} 
      />

      {/* Failed Products */}
      <FailedProductsList />
    </div>
  );
}
