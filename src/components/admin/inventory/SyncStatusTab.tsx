import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrentSyncStatus } from './sync-status/CurrentSyncStatus';
import { BrandHealthGrid } from './sync-status/BrandHealthGrid';
import { RecentSyncRuns } from './sync-status/RecentSyncRuns';
import { FailedProductsList } from './sync-status/FailedProductsList';
import { RegionalHealthOverview } from './sync-status/RegionalHealthOverview';
import { BrandRegionMatrix } from './sync-status/BrandRegionMatrix';
import { RegionalFailedProducts } from './sync-status/RegionalFailedProducts';
import { MissingRegionalUrlsReport } from './sync-status/MissingRegionalUrlsReport';
import { SyncScheduleHints } from './sync-status/SyncScheduleHints';
import { RegionalUrlManager } from './sync-status/RegionalUrlManager';
import { OrchestrationControl } from './sync-status/OrchestrationControl';
import { PriceDiscrepancyQueue } from './sync-status/PriceDiscrepancyQueue';

export function SyncStatusTab() {
  const [brandFilter, setBrandFilter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'overview' | 'regional' | 'discrepancies'>('regional');

  const handleBrandClick = (brandSlug: string) => {
    setBrandFilter(brandSlug);
  };

  const handleClearBrandFilter = () => {
    setBrandFilter(undefined);
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Orchestration Control */}
      <OrchestrationControl />

      {/* Current Sync Status */}
      <CurrentSyncStatus />

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'overview' | 'regional' | 'discrepancies')}>
        <TabsList>
          <TabsTrigger value="regional">Regional View</TabsTrigger>
          <TabsTrigger value="overview">Brand Overview</TabsTrigger>
          <TabsTrigger value="discrepancies">Price Review</TabsTrigger>
        </TabsList>

        <TabsContent value="discrepancies" className="mt-4">
          <PriceDiscrepancyQueue />
        </TabsContent>

        <TabsContent value="regional" className="space-y-6 mt-4">
          {/* Regional URL Manager */}
          <RegionalUrlManager />

          {/* Regional Health Overview */}
          <RegionalHealthOverview />

          {/* Brand × Region Matrix */}
          <BrandRegionMatrix onBrandClick={handleBrandClick} />

          {/* Failed Products by Region */}
          <RegionalFailedProducts />

          {/* Missing Regional URLs Report */}
          <MissingRegionalUrlsReport />

          {/* Sync Schedule Hints */}
          <SyncScheduleHints />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Brand Health Overview (legacy) */}
          <BrandHealthGrid onBrandClick={handleBrandClick} />

          {/* Recent Sync Runs */}
          <RecentSyncRuns 
            brandFilter={brandFilter} 
            onClearBrandFilter={handleClearBrandFilter} 
          />

          {/* Failed Products (legacy) */}
          <FailedProductsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
