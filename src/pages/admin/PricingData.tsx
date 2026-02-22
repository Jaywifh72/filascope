import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { DollarSign } from 'lucide-react';
import { ProductType, PRODUCT_TYPE_CONFIGS } from './pricing/types';
import type { StoreRow } from './pricing/types';
import { PricingStatsBar } from './pricing/components/PricingStatsBar';
import { PricingToolbar } from './pricing/components/PricingToolbar';
import { PricingTable } from './pricing/components/PricingTable';
import { DiagnosisModal } from './pricing/components/DiagnosisModal';
import { usePricingData } from './pricing/hooks/usePricingData';
import { usePricingActions } from './pricing/hooks/usePricingActions';
import { usePricingFilters } from './pricing/hooks/usePricingFilters';

const VALID_TYPES: ProductType[] = ['filament', 'printer', 'accessory'];

export default function PricingData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramType = searchParams.get('type') as ProductType | null;
  const initialType: ProductType = paramType && VALID_TYPES.includes(paramType) ? paramType : 'filament';
  const [activeType, setActiveType] = useState<ProductType>(initialType);

  // Selection & expansion state
  const [selectedStoreKeys, setSelectedStoreKeys] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Data hook
  const { productGroups, stats, isLoading, vendors } = usePricingData(activeType);

  // Filter hook
  const {
    search, setSearch,
    vendorFilter, setVendorFilter,
    statusFilter, setStatusFilter,
    filtered,
    searchPlaceholder,
  } = usePricingFilters(productGroups, activeType);

  // Actions hook
  const actions = usePricingActions(activeType, productGroups, filtered);

  // Tab change handler — reset all state
  const handleTabChange = useCallback((type: string) => {
    const newType = type as ProductType;
    setActiveType(newType);
    setSearchParams({ type: newType });
    setSelectedStoreKeys(new Set());
    setExpandedProducts(new Set());
    setSearch('');
    setVendorFilter('all');
    setStatusFilter('all');
  }, [setSearchParams, setSearch, setVendorFilter, setStatusFilter]);

  // Sync URL param when it changes externally
  useEffect(() => {
    const p = searchParams.get('type') as ProductType | null;
    if (p && VALID_TYPES.includes(p) && p !== activeType) {
      setActiveType(p);
    }
  }, [searchParams, activeType]);

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Toggle select store
  const toggleSelectStore = useCallback((key: string) => {
    setSelectedStoreKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  // All visible store keys
  const allVisibleStoreKeys = useMemo(() => {
    const keys: string[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        keys.push(s.storeKey);
      }
    }
    return keys;
  }, [filtered]);

  const allVisibleSelected = allVisibleStoreKeys.length > 0 && allVisibleStoreKeys.every(k => selectedStoreKeys.has(k));

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedStoreKeys(new Set());
    } else {
      setSelectedStoreKeys(new Set(allVisibleStoreKeys));
    }
  }, [allVisibleSelected, allVisibleStoreKeys]);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedProducts(new Set(filtered.map(g => g.productLineId)));
  }, [filtered]);

  const collapseAll = useCallback(() => {
    setExpandedProducts(new Set());
  }, []);

  // Collect selected stores for bulk actions
  const selectedStores = useMemo(() => {
    const stores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (selectedStoreKeys.has(s.storeKey)) stores.push(s);
      }
    }
    return stores;
  }, [filtered, selectedStoreKeys]);

  // Stale stores for "Test All Stale" / "Resync Stale"
  const staleStores = useMemo(() => {
    const stores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.linkStatus === 'stale' || s.linkStatus === 'unknown') stores.push(s);
      }
    }
    return stores;
  }, [filtered]);

  const config = PRODUCT_TYPE_CONFIGS[activeType];

  // Keyboard shortcut: Ctrl+Shift+A to select all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toggleSelectAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSelectAll]);

  if (isLoading) {
    return (
      <AdminLayout>
        <PageLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Pricing Data"
          description={`Raw pricing, link health & regional price overview — ${stats.totalProducts} ${config.pluralLabel.toLowerCase()}, ${stats.totalVariants} variants`}
          icon={DollarSign}
          iconColor="text-emerald-400"
        />

        <Tabs value={activeType} onValueChange={handleTabChange}>
          <TabsList className="bg-muted/50 border border-border/50">
            {VALID_TYPES.map(type => {
              const cfg = PRODUCT_TYPE_CONFIGS[type];
              const Icon = cfg.icon;
              const tabColor = type === 'filament' ? 'data-[state=active]:border-b-emerald-400'
                : type === 'printer' ? 'data-[state=active]:border-b-blue-400'
                : 'data-[state=active]:border-b-orange-400';
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className={`gap-1.5 border-b-2 border-b-transparent ${tabColor}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.pluralLabel}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeType} className="mt-4 space-y-4">
            <PricingStatsBar stats={stats} onStatusFilter={setStatusFilter} />

            <PricingToolbar
              productType={activeType}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={searchPlaceholder}
              vendorFilter={vendorFilter}
              onVendorFilterChange={setVendorFilter}
              vendors={vendors}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              filteredCount={filtered.length}
              allVisibleSelected={allVisibleSelected}
              selectedCount={selectedStoreKeys.size}
              onToggleSelectAll={toggleSelectAll}
              onExpandAll={expandAll}
              onCollapseAll={collapseAll}
              isBusy={actions.isBusy}
              bulkTesting={actions.bulkTesting}
              bulkSyncing={actions.bulkSyncing}
              onTestSelected={() => actions.testBatch(selectedStores)}
              onTestAllStale={() => actions.testBatch(staleStores)}
              onSyncSelected={() => actions.syncBatch(selectedStores)}
              onSyncStale={() => actions.syncBatch(staleStores)}
              totalFailureCount={actions.totalFailureCount}
              diagnosisResult={actions.diagnosisResult}
              isDiagnosing={actions.isDiagnosing}
              onDiagnose={actions.handleDiagnoseFailures}
              onShowDiagnosis={() => actions.setShowDiagnosisModal(true)}
              onExportPricing={actions.handleExportPricing}
              onExportChanges={actions.handleExportChanges}
              isClearingInactiveCache={actions.isClearingInactiveCache}
              onClearInactiveCache={actions.handleClearInactiveStoreCache}
              isPopulatingUrls={actions.isPopulatingUrls}
              onPopulateUrls={() => actions.handlePopulateRegionalUrls(vendorFilter)}
              canPopulateUrls={actions.canPopulateUrls}
              onCancel={actions.handleCancel}
              bulkProgress={actions.bulkProgress}
              bulkSyncProgress={actions.bulkSyncProgress}
              stats={stats}
            />

            <PricingTable
              productType={activeType}
              filtered={filtered}
              testResults={actions.testResults}
              syncResults={actions.syncResults}
              isBusy={actions.isBusy}
              onTestUrl={actions.testSingleUrl}
              onSyncPrice={actions.syncSinglePrice}
              expandedProducts={expandedProducts}
              onToggleExpand={toggleExpand}
              selectedStoreKeys={selectedStoreKeys}
              onToggleSelectStore={toggleSelectStore}
              allVisibleSelected={allVisibleSelected}
              onToggleSelectAll={toggleSelectAll}
            />
          </TabsContent>
        </Tabs>

        <DiagnosisModal
          productType={activeType}
          diagnosisResult={actions.diagnosisResult}
          showModal={actions.showDiagnosisModal}
          onClose={actions.setShowDiagnosisModal}
          searchResults={actions.searchResults}
          bulkSearchProgress={actions.bulkSearchProgress}
          onSearchStore={actions.handleSearchStore}
          onSearchAllBroken={actions.handleSearchAllBroken}
          onApplyAllFixes={actions.handleApplyAllFixes}
          onRetryTransient={actions.handleRetryTransient}
        />
      </div>
    </AdminLayout>
  );
}
