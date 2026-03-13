import { useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PhaseStepperBar } from '@/components/admin/brand-sync/PhaseStepperBar';
import { BrandSelectorCard } from '@/components/admin/brand-sync/BrandSelectorCard';
import { ScanProgressCard } from '@/components/admin/brand-sync/ScanProgressCard';
import { DeltaReviewPanel } from '@/components/admin/brand-sync/DeltaReviewPanel';
import { ImportProgressCard } from '@/components/admin/brand-sync/ImportProgressCard';
import { ImportCompleteCard } from '@/components/admin/brand-sync/ImportCompleteCard';
import { SyncHistoryTable } from '@/components/admin/brand-sync/SyncHistoryTable';
import { useCatalogSync } from '@/hooks/useCatalogSync';

// Re-export types for backward compatibility
export type { SyncItem, SyncJob } from '@/hooks/useCatalogSync';

export default function BrandCatalogSync() {
  const queryClient = useQueryClient();
  const {
    phase,
    jobId,
    scanJob,
    items,
    deltaStats,
    importResult,
    error,
    importing,
    scanStatusMessage,
    startScan,
    startImport,
    retryFailedItem,
    reset,
  } = useCatalogSync();

  // Track the selected brand info — use STATE not ref so SyncHistoryTable re-renders
  const [brandInfo, setBrandInfo] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const handleScanStart = useCallback((brandId: string, configId: string, brandName: string, brandSlug: string) => {
    setBrandInfo({ id: brandId, name: brandName, slug: brandSlug });
    startScan(brandId, configId);
  }, [startScan]);

  const handleStartImport = useCallback((itemIds: string[]) => {
    if (!brandInfo) return;
    setSelectedItemIds(itemIds);
    // Don't actually import yet — show the confirmation card
  }, [brandInfo]);

  const handleConfirmImport = useCallback(() => {
    if (!brandInfo || selectedItemIds.length === 0) return;
    startImport(
      selectedItemIds,
      brandInfo.id,
      brandInfo.name,
      brandInfo.slug,
    );
  }, [startImport, selectedItemIds, brandInfo]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedItemIds([]);
    // Invalidate caches
    if (brandInfo) {
      queryClient.invalidateQueries({ queryKey: ['brand-filament-count', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['brand-last-sync', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-history', brandInfo.id] });
    }
  }, [reset, queryClient, brandInfo]);

  // Show error toast — must be in useEffect, NOT in render body
  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    }
  }, [error]);

  // Determine if we're in the "pre-import confirmation" state
  const showImportConfirmation = phase === 'delta' && selectedItemIds.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        icon={RefreshCw}
        title="Brand Catalog Sync"
        description="Scan brand storefronts, review new filaments, and import to the database"
      />

      {/* Phase Stepper */}
      <PhaseStepperBar
        phase={showImportConfirmation ? 'importing' : phase}
        scanStats={scanJob ? {
          discovered: (scanJob.new_count ?? 0) + (scanJob.changed_count ?? 0) + (scanJob.matched_count ?? 0),
          newCount: scanJob.new_count ?? 0,
        } : null}
        importStats={importResult ? { imported: importResult.imported } : null}
      />

      {/* BrandSelectorCard — always visible (except during import/complete) */}
      {phase !== 'importing' && phase !== 'complete' && !showImportConfirmation && (
        <BrandSelectorCard
          onScanStart={handleScanStart}
          isScanning={phase === 'scanning' || phase === 'processing'}
        />
      )}

      {/* Phase 1b: Scanning / Processing in progress */}
      {(phase === 'scanning' || phase === 'processing') && (
        <ScanProgressCard
          brandName={brandInfo?.name ?? 'Brand'}
          scanJob={scanJob}
          statusMessage={scanStatusMessage}
        />
      )}

      {/* Phase 2: Delta Review */}
      {phase === 'delta' && !showImportConfirmation && (
        <DeltaReviewPanel
          items={items}
          stats={deltaStats}
          onStartImport={handleStartImport}
          importing={importing}
        />
      )}

      {/* Phase 2b: Import Confirmation */}
      {showImportConfirmation && (
        <ImportProgressCard
          items={items.filter(i => selectedItemIds.includes(i.id) || i.status === 'price_changed')}
          selectedCount={selectedItemIds.length}
          importing={false}
          error={null}
          onConfirm={handleConfirmImport}
          onCancel={() => setSelectedItemIds([])}
        />
      )}

      {/* Phase 3: Importing */}
      {phase === 'importing' && (
        <ImportProgressCard
          items={items.filter(i => selectedItemIds.includes(i.id))}
          selectedCount={selectedItemIds.length}
          importing={importing}
          error={error}
          onConfirm={handleConfirmImport}
          onCancel={() => setSelectedItemIds([])}
        />
      )}

      {/* Phase 4: Complete */}
      {phase === 'complete' && importResult && (
        <ImportCompleteCard
          result={importResult}
          brandSlug={brandInfo?.slug ?? ''}
          onReset={handleReset}
          onRetry={retryFailedItem}
        />
      )}

      {/* Sync History — always visible when a brand is selected */}
      {brandInfo && (
        <SyncHistoryTable
          brandId={brandInfo.id}
          activeJobId={jobId}
          onJobClick={() => {}}
        />
      )}
    </div>
  );
}
