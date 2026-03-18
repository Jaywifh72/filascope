import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Box, Cpu, DollarSign, ShoppingCart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { PhaseStepperBar } from '@/components/admin/brand-sync/PhaseStepperBar';
import { BrandSelectorCard } from '@/components/admin/brand-sync/BrandSelectorCard';
import { ScanProgressCard } from '@/components/admin/brand-sync/ScanProgressCard';
import { DeltaReviewPanel } from '@/components/admin/brand-sync/DeltaReviewPanel';
import { ImportProgressCard } from '@/components/admin/brand-sync/ImportProgressCard';
import { ImportCompleteCard } from '@/components/admin/brand-sync/ImportCompleteCard';
import { SyncHistoryTable } from '@/components/admin/brand-sync/SyncHistoryTable';
import { useCatalogSync } from '@/hooks/useCatalogSync';

// Printer-specific imports
import { PrinterBrandSelectorCard } from '@/components/admin/printer-sync/PrinterBrandSelectorCard';
import { PrinterDeltaReviewPanel } from '@/components/admin/printer-sync/PrinterDeltaReviewPanel';
import { PrinterImportProgressCard } from '@/components/admin/printer-sync/PrinterImportProgressCard';
import { usePrinterCatalogSync } from '@/hooks/usePrinterCatalogSync';
import { PriceSyncSection } from '@/components/admin/price-sync/PriceSyncSection';
import { AmazonPriceSyncSection } from '@/components/admin/amazon-sync/AmazonPriceSyncSection';

// Re-export types for backward compatibility
export type { SyncItem, SyncJob } from '@/hooks/useCatalogSync';

type ProductType = 'filaments' | 'printers';

export default function BrandCatalogSync() {
  const [productType, setProductType] = useState<ProductType>('filaments');

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        icon={RefreshCw}
        title="Brand Catalog Sync"
        description={
          productType === 'filaments'
            ? 'Scan brand storefronts, review new filaments, and import to the database'
            : 'Scan brand storefronts, review new printers, and import to the database'
        }
      />

      {/* Product Type Toggle */}
      <ToggleGroup
        type="single"
        value={productType}
        onValueChange={(v) => { if (v) setProductType(v as ProductType); }}
        className="justify-start"
      >
        <ToggleGroupItem value="filaments" aria-label="Filaments" className="gap-1.5 px-4">
          <Box className="w-4 h-4" />
          Filaments
        </ToggleGroupItem>
        <ToggleGroupItem value="printers" aria-label="Printers" className="gap-1.5 px-4">
          <Cpu className="w-4 h-4" />
          Printers
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Render mode-specific workflow */}
      {productType === 'filaments' ? (
        <FilamentSyncWorkflow />
      ) : (
        <PrinterSyncWorkflow />
      )}

      {/* ─── Brand Price Sync Section ─── */}
      <Separator className="my-8" />

      <AdminPageHeader
        icon={DollarSign}
        title="Brand Price Sync"
        description="Fetch current printer prices from regional stores and compare against the database"
      />

      <PriceSyncSection />

      {/* ─── Amazon Price Sync Section ─── */}
      <Separator className="my-8" />

      <AdminPageHeader
        icon={ShoppingCart}
        title="Amazon Price Sync"
        description="Fetch current filament prices from Amazon marketplaces via PA-API and update listings"
      />

      <AmazonPriceSyncSection />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Filament Sync Workflow (existing, unchanged logic)
// ────────────────────────────────────────────────────────────

function FilamentSyncWorkflow() {
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

  const [brandInfo, setBrandInfo] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const handleScanStart = useCallback((brandId: string, configId: string, brandName: string, brandSlug: string) => {
    setBrandInfo({ id: brandId, name: brandName, slug: brandSlug });
    startScan(brandId, configId);
  }, [startScan]);

  const handleStartImport = useCallback((itemIds: string[]) => {
    if (!brandInfo) return;
    setSelectedItemIds(itemIds);
  }, [brandInfo]);

  const handleConfirmImport = useCallback(() => {
    if (!brandInfo || selectedItemIds.length === 0) return;
    startImport(selectedItemIds, brandInfo.id, brandInfo.name, brandInfo.slug);
  }, [startImport, selectedItemIds, brandInfo]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedItemIds([]);
    if (brandInfo) {
      queryClient.invalidateQueries({ queryKey: ['brand-filament-count', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['brand-last-sync', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-history', brandInfo.id] });
    }
  }, [reset, queryClient, brandInfo]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    }
  }, [error]);

  const showImportConfirmation = phase === 'delta' && selectedItemIds.length > 0;

  return (
    <>
      {/* Phase Stepper */}
      <PhaseStepperBar
        phase={showImportConfirmation ? 'importing' : phase}
        productLabel="filament"
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
          productLabel="filaments"
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
          productLabel="filament"
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
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Printer Sync Workflow
// ────────────────────────────────────────────────────────────

function PrinterSyncWorkflow() {
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
    updateItem,
    skipItem,
    retryFailedItem,
    reset,
  } = usePrinterCatalogSync();

  const [brandInfo, setBrandInfo] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const handleScanStart = useCallback((brandId: string, configId: string, brandName: string, brandSlug: string) => {
    setBrandInfo({ id: brandId, name: brandName, slug: brandSlug });
    startScan(brandId, configId);
  }, [startScan]);

  const handleStartImport = useCallback((itemIds: string[]) => {
    if (!brandInfo) return;
    setSelectedItemIds(itemIds);
  }, [brandInfo]);

  const handleConfirmImport = useCallback(() => {
    if (!brandInfo || selectedItemIds.length === 0) return;
    startImport(selectedItemIds, brandInfo.id, brandInfo.name, brandInfo.slug);
  }, [startImport, selectedItemIds, brandInfo]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedItemIds([]);
    if (brandInfo) {
      queryClient.invalidateQueries({ queryKey: ['printer-brand-count', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['printer-brand-last-sync', brandInfo.id] });
      queryClient.invalidateQueries({ queryKey: ['sync-history', brandInfo.id] });
    }
  }, [reset, queryClient, brandInfo]);

  useEffect(() => {
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    }
  }, [error]);

  const showImportConfirmation = phase === 'delta' && selectedItemIds.length > 0;

  // The printer hook's scanJob is PrinterSyncJob which uses printer_products_found
  // We pass productsFoundCount to override ScanProgressCard's internal logic
  const printerProductsFound = scanJob?.printer_products_found ?? undefined;

  return (
    <>
      {/* Phase Stepper */}
      <PhaseStepperBar
        phase={showImportConfirmation ? 'importing' : phase}
        productLabel="printer"
        scanStats={scanJob ? {
          discovered: (scanJob.new_count ?? 0) + (scanJob.changed_count ?? 0) + (scanJob.matched_count ?? 0),
          newCount: scanJob.new_count ?? 0,
        } : null}
        importStats={importResult ? { imported: importResult.imported } : null}
      />

      {/* PrinterBrandSelectorCard — always visible (except during import/complete) */}
      {phase !== 'importing' && phase !== 'complete' && !showImportConfirmation && (
        <PrinterBrandSelectorCard
          onScanStart={handleScanStart}
          isScanning={phase === 'scanning' || phase === 'processing'}
        />
      )}

      {/* Phase 1b: Scanning / Processing in progress */}
      {(phase === 'scanning' || phase === 'processing') && (
        <ScanProgressCard
          brandName={brandInfo?.name ?? 'Brand'}
          scanJob={scanJob as any}
          statusMessage={scanStatusMessage}
          productLabel="printers"
          productsFoundCount={printerProductsFound}
        />
      )}

      {/* Phase 2: Delta Review */}
      {phase === 'delta' && !showImportConfirmation && (
        <PrinterDeltaReviewPanel
          items={items}
          stats={deltaStats}
          onStartImport={handleStartImport}
          importing={importing}
          onUpdateItem={updateItem}
          onSkipItem={skipItem}
        />
      )}

      {/* Phase 2b: Import Confirmation */}
      {showImportConfirmation && (
        <PrinterImportProgressCard
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
        <PrinterImportProgressCard
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
          productLabel="printer"
        />
      )}

      {/* Sync History — not shown for printer sync (runs in-memory, no brand_sync_jobs records) */}
    </>
  );
}
