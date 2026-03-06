import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Loader2, AlertTriangle, Settings2 } from 'lucide-react';
import { BrandSyncDashboard } from '@/components/admin/brand-sync/BrandSyncDashboard';
import { SyncResultsTabs } from '@/components/admin/brand-sync/SyncResultsTabs';
import { FilamentPreviewDialog } from '@/components/admin/brand-sync/FilamentPreviewDialog';
import { ImportProgressCard } from '@/components/admin/brand-sync/ImportProgressCard';
import { SyncHistoryTable } from '@/components/admin/brand-sync/SyncHistoryTable';
import { BrandConfigsSection } from '@/components/admin/filament-onboarding/BrandConfigsSection';
import { BulkActionPopover } from '@/components/admin/filament-onboarding/BulkActionPopover';
import { Ban } from 'lucide-react';

const MATERIAL_OPTIONS = [
  'PLA', 'PLA+', 'PETG', 'ABS', 'TPU', 'ASA', 'PA/Nylon', 'PLA Meta', 'Matte PLA', 'HSPLA',
];
const FINISH_OPTIONS = [
  'Standard', 'Matte', 'Silk/Shimmer', 'Sparkle', 'Glow-in-the-Dark',
  'Transparent', 'Neon', 'Wood Fill', 'Carbon Fiber', 'Marble',
];
const COLOR_FAMILY_OPTIONS = [
  'White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Pink',
  'Purple', 'Grey', 'Brown', 'Cream', 'Multi', 'Other',
];

export type SyncItem = {
  id: string;
  job_id: string;
  status: string;
  is_new: boolean;
  extracted_data: Record<string, unknown>;
  admin_override_data: Record<string, unknown> | null;
  display_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  color_family: string | null;
  material_type: string | null;
  finish_type: string | null;
  image_url: string | null;
  variant_image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  variant_sku: string | null;
  product_handle: string | null;
  available_regions: string[] | null;
  existing_filament_id: string | null;
  inserted_filament_id: string | null;
  price_diff: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string | null;
};

export type SyncJob = {
  id: string;
  brand_id: string;
  config_id: string | null;
  status: string;
  total_store_products: number | null;
  filament_products_found: number | null;
  skipped_products: number | null;
  new_count: number | null;
  changed_count: number | null;
  matched_count: number | null;
  error_count: number | null;
  imported_count: number | null;
  post_import_results: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  warnings: string[] | null;
};

export default function BrandCatalogSync() {
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStage, setSyncStage] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<SyncItem | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const queryClient = useQueryClient();

  // Load brands
  const { data: brands } = useQuery({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('id, brand_name, display_name, logo_url, brand_slug')
        .order('display_name');
      return data ?? [];
    },
  });

  // Default to SUNLU
  useEffect(() => {
    if (brands && brands.length > 0 && !selectedBrandId) {
      const sunlu = brands.find(b => b.brand_slug === 'sunlu');
      if (sunlu) setSelectedBrandId(sunlu.id);
    }
  }, [brands, selectedBrandId]);

  const selectedBrand = brands?.find(b => b.id === selectedBrandId);

  // Check scraping config
  const { data: scrapingConfig } = useQuery({
    queryKey: ['brand-scraping-config', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data } = await supabase
        .from('brand_scraping_configs')
        .select('id, adapter_key, platform')
        .eq('brand_id', selectedBrandId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedBrandId,
  });

  // Last synced
  const { data: lastSyncJob } = useQuery({
    queryKey: ['last-sync-job', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data } = await supabase
        .from('brand_sync_jobs')
        .select('id, completed_at, status')
        .eq('brand_id', selectedBrandId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedBrandId,
  });

  // Load items for active job
  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ['sync-items', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return [];
      const { data } = await supabase
        .from('brand_sync_items')
        .select('*')
        .eq('job_id', activeJobId)
        .order('display_name');
      return (data ?? []) as unknown as SyncItem[];
    },
    enabled: !!activeJobId,
  });

  // Poll for sync status
  useEffect(() => {
    if (!syncing || !activeJobId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('brand_sync_jobs')
        .select('status, filament_products_found, new_count, changed_count, matched_count')
        .eq('id', activeJobId)
        .maybeSingle();

      if (data) {
        if (data.status === 'completed' || data.status === 'failed') {
          setSyncing(false);
          setSyncStage('');
          refetchItems();
          queryClient.invalidateQueries({ queryKey: ['sync-history', selectedBrandId] });
          queryClient.invalidateQueries({ queryKey: ['last-sync-job', selectedBrandId] });
          queryClient.invalidateQueries({ queryKey: ['brand-sync-dashboard', selectedBrandId] });
          if (data.status === 'completed') {
            toast({
              title: 'Sync Complete',
              description: `Found ${data.new_count ?? 0} new, ${data.changed_count ?? 0} changed, ${data.matched_count ?? 0} matched`,
            });
          } else {
            toast({ title: 'Sync Failed', variant: 'destructive' });
          }
        } else if (data.filament_products_found) {
          setSyncStage(`Analyzing ${data.filament_products_found} filament products...`);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [syncing, activeJobId, refetchItems, queryClient, selectedBrandId]);

  const filteredBrands = brands?.filter(b =>
    !brandSearch || b.display_name.toLowerCase().includes(brandSearch.toLowerCase())
  ) ?? [];

  const handleSync = useCallback(async () => {
    if (!selectedBrandId || !scrapingConfig) return;
    setSyncing(true);
    setSyncStage(`Fetching catalog from store...`);

    try {
      const { data, error } = await supabase.functions.invoke('sync-brand-catalog', {
        body: { brand_id: selectedBrandId, config_id: scrapingConfig.id },
      });

      if (error) throw error;
      if (data?.job_id) {
        setActiveJobId(data.job_id);
        setSelectedItems(new Set());
      }

      // If response came back immediately (fast sync)
      if (data?.success && data?.new_count !== undefined) {
        setSyncing(false);
        setSyncStage('');
        refetchItems();
        queryClient.invalidateQueries({ queryKey: ['sync-history', selectedBrandId] });
        queryClient.invalidateQueries({ queryKey: ['last-sync-job', selectedBrandId] });
        queryClient.invalidateQueries({ queryKey: ['brand-sync-dashboard', selectedBrandId] });
        toast({
          title: 'Sync Complete',
          description: `Found ${data.new_count} new, ${data.changed_count} changed, ${data.matched_count} matched`,
        });
      }
    } catch (err: unknown) {
      setSyncing(false);
      setSyncStage('');
      const msg = err instanceof Error ? err.message : 'Sync failed';
      toast({ title: 'Sync Error', description: msg, variant: 'destructive' });
    }
  }, [selectedBrandId, scrapingConfig, refetchItems, queryClient]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = (importableIds: string[]) => {
    if (importableIds.every(id => selectedItems.has(id))) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(importableIds));
    }
  };

  const bulkSetOverride = useCallback(async (field: string, value: string) => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;
    const targetItems = items?.filter(i => ids.includes(i.id)) ?? [];
    let errorCount = 0;
    for (const item of targetItems) {
      const overrides = { ...(item.admin_override_data ?? {}), [field]: value };
      const { error } = await supabase
        .from('brand_sync_items')
        .update({ admin_override_data: overrides as any })
        .eq('id', item.id);
      if (error) errorCount++;
    }
    await refetchItems();
    const label = field === 'color_family' ? 'color family' : field.replace('_', ' ');
    toast({ title: `Set ${label} to "${value}" for ${ids.length - errorCount} items` });
  }, [selectedItems, items, refetchItems]);

  const bulkSkip = useCallback(async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('brand_sync_items')
      .update({ status: 'skipped' })
      .in('id', ids);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Marked ${ids.length} items as skipped` });
      setSelectedItems(new Set());
      await refetchItems();
    }
  }, [selectedItems, refetchItems]);

  const handleJobClick = useCallback((jobId: string) => {
    setActiveJobId(jobId);
    setSelectedItems(new Set());
  }, []);

  const lastSyncedLabel = lastSyncJob?.completed_at
    ? `Last synced: ${new Date(lastSyncJob.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    : 'Never synced';

  const selectedForImport = items?.filter(i => selectedItems.has(i.id)) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Section 1: Brand Selector Bar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Brand Catalog Sync</CardTitle>
              <CardDescription>Sync filament data from brand storefronts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {/* Brand selector */}
            <div className="w-64 space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Brand</label>
              <div className="relative">
                <Input
                  placeholder="Search brands..."
                  value={selectedBrand ? selectedBrand.display_name : brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    if (selectedBrandId) { setSelectedBrandId(''); setActiveJobId(null); }
                  }}
                  onFocus={() => { if (selectedBrandId) { setSelectedBrandId(''); setBrandSearch(''); } }}
                />
                {!selectedBrandId && brandSearch && filteredBrands.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredBrands.slice(0, 20).map(b => (
                      <button
                        key={b.id}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                        onClick={() => { setSelectedBrandId(b.id); setBrandSearch(''); }}
                      >
                        {b.logo_url && <img src={b.logo_url} className="w-5 h-5 rounded object-contain" alt="" />}
                        <span>{b.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Last synced label */}
            {selectedBrandId && (
              <span className="text-sm text-muted-foreground whitespace-nowrap pb-2">
                {lastSyncedLabel}
              </span>
            )}

            {/* Config warning / gear */}
            {selectedBrandId && !scrapingConfig && (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 shrink-0 mb-1">
                <AlertTriangle className="w-3 h-3 mr-1" />
                No scraping config
              </Badge>
            )}

            <div className="flex-1" />

            {/* Config gear */}
            {selectedBrandId && (
              <Button variant="outline" size="icon" onClick={() => setShowConfig(!showConfig)} className="shrink-0">
                <Settings2 className="w-4 h-4" />
              </Button>
            )}

            {/* Sync button */}
            {selectedBrandId && scrapingConfig ? (
              <Button onClick={handleSync} disabled={syncing} variant="primary" className="shrink-0">
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {syncing ? 'Syncing...' : `Sync ${selectedBrand?.display_name ?? 'Brand'} Catalog`}
              </Button>
            ) : selectedBrandId && !scrapingConfig ? (
              <Button variant="outline" onClick={() => setShowConfig(true)} className="shrink-0">
                <Settings2 className="w-4 h-4 mr-2" />
                Configure
              </Button>
            ) : null}
          </div>

          {/* Sync progress */}
          {syncing && syncStage && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{syncStage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Dashboard Cards */}
      {selectedBrandId && (
        <BrandSyncDashboard brandId={selectedBrandId} activeJobId={activeJobId} />
      )}

      {/* Section 3: Results Tabs */}
      {activeJobId && items && items.length > 0 && (
        <SyncResultsTabs
          items={items}
          selectedItems={selectedItems}
          onToggleItem={toggleItem}
          onToggleAll={toggleAll}
          onPreview={(item) => setPreviewItem(item)}
        />
      )}

      {/* Sticky import bar */}
      {selectedItems.size > 0 && (
        <div className="sticky bottom-0 z-30 bg-card border border-border rounded-lg p-4 shadow-xl flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedItems.size} filament{selectedItems.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>Cancel</Button>
            <BulkActionPopover label="Material" options={MATERIAL_OPTIONS} onSelect={(val) => bulkSetOverride('material', val)} />
            <BulkActionPopover label="Finish" options={FINISH_OPTIONS} onSelect={(val) => bulkSetOverride('finish_type', val)} />
            <BulkActionPopover label="Color Family" options={COLOR_FAMILY_OPTIONS} onSelect={(val) => bulkSetOverride('color_family', val)} />
            <Button variant="outline" size="sm" onClick={bulkSkip} className="gap-1">
              <Ban className="h-3 w-3" /> Skip
            </Button>
            <Button size="sm" onClick={() => setShowImport(true)}>
              Import Selected ({selectedItems.size})
            </Button>
          </div>
        </div>
      )}

      {/* Import progress */}
      {showImport && activeJobId && selectedBrand && (
        <ImportProgressCard
          jobId={activeJobId}
          brandId={selectedBrandId}
          brandName={selectedBrand.display_name}
          brandSlug={selectedBrand.brand_slug}
          itemIds={Array.from(selectedItems)}
          onComplete={() => {
            setShowImport(false);
            setSelectedItems(new Set());
            refetchItems();
            queryClient.invalidateQueries({ queryKey: ['brand-sync-dashboard', selectedBrandId] });
            queryClient.invalidateQueries({ queryKey: ['sync-history', selectedBrandId] });
          }}
          onCancel={() => setShowImport(false)}
        />
      )}

      {/* Sync History */}
      {selectedBrandId && (
        <SyncHistoryTable
          brandId={selectedBrandId}
          activeJobId={activeJobId}
          onJobClick={handleJobClick}
        />
      )}

      {/* Config section */}
      {showConfig && <BrandConfigsSection />}

      {/* Preview dialog */}
      {previewItem && (
        <FilamentPreviewDialog
          item={previewItem}
          open={!!previewItem}
          onOpenChange={(open) => { if (!open) setPreviewItem(null); }}
          onSave={() => { setPreviewItem(null); refetchItems(); }}
        />
      )}
    </div>
  );
}
