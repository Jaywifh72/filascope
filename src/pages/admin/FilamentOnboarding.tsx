import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { PackagePlus, Loader2, AlertTriangle, Download, Ban } from 'lucide-react';
import { ExtractionResultsTable } from '@/components/admin/filament-onboarding/ExtractionResultsTable';
import { OnboardingPreviewDialog } from '@/components/admin/filament-onboarding/OnboardingPreviewDialog';
import { JobHistoryTable } from '@/components/admin/filament-onboarding/JobHistoryTable';
import { ImportConfirmDialog } from '@/components/admin/filament-onboarding/ImportConfirmDialog';
import { BrandConfigsSection } from '@/components/admin/filament-onboarding/BrandConfigsSection';
import { BulkActionPopover } from '@/components/admin/filament-onboarding/BulkActionPopover';

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

type OnboardingItem = {
  id: string;
  job_id: string;
  status: string;
  extracted_data: Record<string, unknown>;
  display_name: string | null;
  color_name: string | null;
  material_type: string | null;
  image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  variant_sku: string | null;
  is_duplicate: boolean | null;
  existing_filament_id: string | null;
  admin_override_data: Record<string, unknown> | null;
  inserted_filament_id: string | null;
  error_message: string | null;
  created_at: string | null;
};

type OnboardingJob = {
  id: string;
  brand_id: string;
  source_url: string;
  status: string;
  inserted_count: number | null;
  skipped_count: number | null;
  duplicate_count: number | null;
  created_at: string | null;
};

export default function FilamentOnboarding() {
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<OnboardingItem | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

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

  // Check scraping config for selected brand
  const { data: scrapingConfig } = useQuery({
    queryKey: ['brand-scraping-config', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data } = await supabase
        .from('brand_scraping_configs')
        .select('adapter_key, platform')
        .eq('brand_id', selectedBrandId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedBrandId,
  });

  // Load items for active job
  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ['onboarding-items', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return [];
      const { data } = await supabase
        .from('filament_onboarding_items')
        .select('*')
        .eq('job_id', activeJobId)
        .order('created_at');
      return (data ?? []) as OnboardingItem[];
    },
    enabled: !!activeJobId,
  });

  // Job history
  const { data: jobHistory, refetch: refetchJobs } = useQuery({
    queryKey: ['onboarding-job-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filament_onboarding_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return (data ?? []) as OnboardingJob[];
    },
  });

  const selectedBrand = brands?.find(b => b.id === selectedBrandId);

  const filteredBrands = brands?.filter(b =>
    !brandSearch || b.display_name.toLowerCase().includes(brandSearch.toLowerCase())
  ) ?? [];

  // Filter items by status
  const filteredItems = items?.filter(item => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'new') return !item.is_duplicate && item.status === 'extracted';
    if (statusFilter === 'duplicates') return item.is_duplicate;
    if (statusFilter === 'errors') return item.status === 'error';
    return true;
  }) ?? [];

  const newCount = items?.filter(i => !i.is_duplicate && i.status === 'extracted').length ?? 0;
  const dupCount = items?.filter(i => i.is_duplicate).length ?? 0;
  const errCount = items?.filter(i => i.status === 'error').length ?? 0;

  const handleExtract = useCallback(async () => {
    if (!selectedBrandId || !sourceUrl) return;
    setExtracting(true);
    try {
      // Create job record
      const { data: job, error: jobErr } = await supabase
        .from('filament_onboarding_jobs')
        .insert({
          brand_id: selectedBrandId,
          source_url: sourceUrl,
          status: 'pending',
        })
        .select('id')
        .single();

      if (jobErr || !job) throw new Error(jobErr?.message ?? 'Failed to create job');

      // Invoke edge function
      const { error: fnErr } = await supabase.functions.invoke('extract-filament-data', {
        body: {
          job_id: job.id,
          source_url: sourceUrl,
          adapter_key: scrapingConfig?.adapter_key ?? 'generic',
        },
      });

      if (fnErr) throw new Error(fnErr.message);

      setActiveJobId(job.id);
      setSelectedItems(new Set());
      setStatusFilter('all');
      await refetchItems();
      await refetchJobs();

      toast({
        title: 'Extraction complete',
        description: `Extracted filaments from ${selectedBrand?.display_name ?? 'brand'}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  }, [selectedBrandId, sourceUrl, scrapingConfig, selectedBrand, refetchItems, refetchJobs]);

  const handleJobClick = useCallback((jobId: string) => {
    setActiveJobId(jobId);
    setSelectedItems(new Set());
    setStatusFilter('all');
  }, []);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const importable = filteredItems.filter(i => !i.is_duplicate && i.status !== 'error' && !i.inserted_filament_id);
    if (selectedItems.size === importable.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(importable.map(i => i.id)));
    }
  };

  const selectedForImport = items?.filter(i => selectedItems.has(i.id)) ?? [];

  // Bulk override helper
  const bulkSetOverride = useCallback(async (field: string, value: string) => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    // For each selected item, merge the new field into existing admin_override_data
    const targetItems = items?.filter(i => ids.includes(i.id)) ?? [];
    const updates = targetItems.map(item => ({
      id: item.id,
      admin_override_data: {
        ...(item.admin_override_data as Record<string, unknown> ?? {}),
        [field]: value,
      },
    }));

    let errorCount = 0;
    for (const u of updates) {
      const { error } = await supabase
        .from('filament_onboarding_items')
        .update({ admin_override_data: u.admin_override_data as any })
        .eq('id', u.id);
      if (error) errorCount++;
    }

    await refetchItems();
    const label = field === 'color_family' ? 'color family' : field.replace('_', ' ');
    if (errorCount > 0) {
      toast({ title: `Updated ${ids.length - errorCount} items`, description: `${errorCount} failed`, variant: 'destructive' });
    } else {
      toast({ title: `Set ${label} to "${value}" for ${ids.length} filament${ids.length !== 1 ? 's' : ''}` });
    }
  }, [selectedItems, items, refetchItems]);

  const bulkSkip = useCallback(async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;

    const { error } = await supabase
      .from('filament_onboarding_items')
      .update({ status: 'skipped' })
      .in('id', ids);

    if (error) {
      toast({ title: 'Error skipping items', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Marked ${ids.length} filament${ids.length !== 1 ? 's' : ''} as skipped` });
      setSelectedItems(new Set());
      await refetchItems();
    }
  }, [selectedItems, refetchItems]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Section 1: Extraction Form */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <PackagePlus className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Filament Onboarding Tool</CardTitle>
              <CardDescription>Add new filaments by pasting a product URL</CardDescription>
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
                    if (selectedBrandId) setSelectedBrandId('');
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
                        {b.logo_url && (
                          <img src={b.logo_url} className="w-5 h-5 rounded object-contain" alt="" />
                        )}
                        <span>{b.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedBrandId && !scrapingConfig && (
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  No scraping config
                </Badge>
              )}
            </div>

            {/* URL input */}
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Product URL</label>
              <Input
                placeholder="Paste product page URL (e.g., https://store.sunlu.com/products/...)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>

            {/* Extract button */}
            <Button
              onClick={handleExtract}
              disabled={!selectedBrandId || !sourceUrl || extracting}
              className="shrink-0"
            >
              {extracting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Extract
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Results */}
      {activeJobId && items && items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">
                  Extracted {items.length} filaments
                </CardTitle>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">{newCount} new</Badge>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">{dupCount} duplicates</Badge>
                {errCount > 0 && (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-500">{errCount} errors</Badge>
                )}
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                  <TabsTrigger value="new">New ({newCount})</TabsTrigger>
                  <TabsTrigger value="duplicates">Duplicates ({dupCount})</TabsTrigger>
                  <TabsTrigger value="errors">Errors ({errCount})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ExtractionResultsTable
              items={filteredItems}
              selectedItems={selectedItems}
              onToggleItem={toggleItem}
              onToggleAll={toggleAll}
              onPreview={(item) => setPreviewItem(item as OnboardingItem)}
            />
          </CardContent>
        </Card>
      )}

      {/* Section 3: Sticky import bar */}
      {selectedItems.size > 0 && (
        <div className="sticky bottom-0 z-30 bg-card border border-border rounded-lg p-4 shadow-xl flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedItems.size} filament{selectedItems.size !== 1 ? 's' : ''} selected for import
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedItems(new Set())}>Cancel</Button>
            <Button onClick={() => setShowImportDialog(true)}>
              Import Selected Filaments
            </Button>
          </div>
        </div>
      )}

      {/* Section 5: Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Onboarding Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <JobHistoryTable
            jobs={jobHistory ?? []}
            activeJobId={activeJobId}
            onJobClick={handleJobClick}
          />
        </CardContent>
      </Card>

      {/* Section 6: Brand Scraping Configs */}
      <BrandConfigsSection />

      {/* Preview Dialog */}
      {previewItem && (
        <OnboardingPreviewDialog
          item={previewItem}
          open={!!previewItem}
          onOpenChange={(open) => { if (!open) setPreviewItem(null); }}
          onSave={async () => { await refetchItems(); setPreviewItem(null); }}
        />
      )}

      {/* Import Confirm Dialog */}
      <ImportConfirmDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        items={selectedForImport}
        brandName={selectedBrand?.display_name ?? 'Unknown'}
        brandSlug={selectedBrand?.brand_slug ?? ''}
        onComplete={async () => {
          setSelectedItems(new Set());
          await refetchItems();
          await refetchJobs();
        }}
      />
    </div>
  );
}
