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
import { UrlHealthTab } from './sync-status/UrlHealthTab';
import { BuyButtonValidator } from './sync-status/BuyButtonValidator';

export function SyncStatusTab() {
  const [brandFilter, setBrandFilter] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'overview' | 'regional' | 'discrepancies' | 'url-health' | 'buy-buttons'>('regional');

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
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'overview' | 'regional' | 'discrepancies' | 'url-health' | 'buy-buttons')}>
        <TabsList>
          <TabsTrigger value="regional">Regional View</TabsTrigger>
          <TabsTrigger value="overview">Brand Overview</TabsTrigger>
          <TabsTrigger value="discrepancies">Price Review</TabsTrigger>
          <TabsTrigger value="url-health">URL Health</TabsTrigger>
          <TabsTrigger value="buy-buttons">Buy Button Validator</TabsTrigger>
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

        <TabsContent value="url-health" className="mt-4">
          <UrlHealthTab />
        </TabsContent>

        <TabsContent value="buy-buttons" className="mt-4">
          <BuyButtonValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
