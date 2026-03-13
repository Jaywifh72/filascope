import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, ChevronsUpDown, Check, RefreshCw, Store, Database, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  brand_name: string;
  brand_slug: string;
  platform_type: string;
  base_url: string;
  logo_url?: string | null;
}

interface ScrapingConfig {
  id: string;
  brand_id: string;
  brand_name: string;
  platform: string;
  base_url: string;
  catalog_strategy?: string;
}

// Brands with built-in support — auto-config will be created on scan
const KNOWN_BRAND_SLUGS = ['sunlu', 'anycubic', 'bambu-lab'];

interface Props {
  onScanStart: (brandId: string, configId: string, brandName: string, brandSlug: string) => void;
  isScanning: boolean;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never synced';
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BrandSelectorCard({ onScanStart, isScanning }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // Load brands with scraping configs
  const { data: brands } = useQuery({
    queryKey: ['scraping-brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, platform_type, base_url, logo_url')
        .eq('scraping_enabled', true)
        .order('brand_name');
      return (data || []) as Brand[];
    },
  });

  // Load scraping configs — catalog_strategy may not exist until migration is deployed
  const { data: configs } = useQuery({
    queryKey: ['scraping-configs'],
    queryFn: async () => {
      const result = await supabase
        .from('brand_scraping_configs')
        .select('id, brand_id, brand_name, platform, base_url');
      return (result.data || []) as unknown as ScrapingConfig[];
    },
  });

  // Load filament count for selected brand
  const { data: filamentCount } = useQuery({
    queryKey: ['brand-filament-count', selectedBrandId],
    queryFn: async () => {
      const brand = brands?.find(b => b.id === selectedBrandId);
      if (!brand) return 0;
      const { count } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .eq('vendor', brand.brand_name);
      return count || 0;
    },
    enabled: !!selectedBrandId && !!brands,
  });

  // Load last sync time
  const { data: lastSync } = useQuery({
    queryKey: ['brand-last-sync', selectedBrandId],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_sync_jobs')
        .select('completed_at')
        .eq('brand_id', selectedBrandId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.completed_at || null;
    },
    enabled: !!selectedBrandId,
  });

  const selectedBrand = useMemo(() => brands?.find(b => b.id === selectedBrandId), [brands, selectedBrandId]);
  const selectedConfig = useMemo(() => configs?.find(c => c.brand_id === selectedBrandId), [configs, selectedBrandId]);

  const isKnownBrand = selectedBrand && KNOWN_BRAND_SLUGS.includes(selectedBrand.brand_slug);

  const handleScan = () => {
    if (!selectedBrand) return;
    if (!selectedConfig && !isKnownBrand) return;
    // Pass 'auto' as configId when no DB config exists but brand has built-in support
    const configId = selectedConfig?.id || 'auto';
    onScanStart(selectedBrand.id, configId, selectedBrand.brand_name, selectedBrand.brand_slug);
  };

  const platformLabel = selectedConfig?.catalog_strategy === 'per-handle-sitemap'
    ? 'Shopify (Sitemap)'
    : selectedBrand?.platform_type || 'Unknown';

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Brand selector */}
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Select Brand</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10"
                  >
                    {selectedBrand ? (
                      <div className="flex items-center gap-2">
                        {selectedBrand.logo_url && (
                          <img src={selectedBrand.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
                        )}
                        <span>{selectedBrand.brand_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Choose a brand...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search brands..." />
                    <CommandList>
                      <CommandEmpty>No brand found.</CommandEmpty>
                      <CommandGroup>
                        {brands?.map(brand => {
                          const hasConfig = configs?.some(c => c.brand_id === brand.id);
                          const isKnown = KNOWN_BRAND_SLUGS.includes(brand.brand_slug);
                          const canScan = hasConfig || isKnown;
                          return (
                            <CommandItem
                              key={brand.id}
                              value={brand.brand_name}
                              onSelect={() => {
                                setSelectedBrandId(brand.id);
                                setOpen(false);
                              }}
                              disabled={!canScan}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedBrandId === brand.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                {brand.logo_url && (
                                  <img src={brand.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                                )}
                                <span>{brand.brand_name}</span>
                                <Badge variant="secondary" className="text-[10px] ml-auto">
                                  {brand.platform_type}
                                </Badge>
                                {!canScan && (
                                  <span className="text-xs text-muted-foreground ml-1">(no config)</span>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Brand info cards */}
            {selectedBrand && (
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs font-normal">{platformLabel}</Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Store platform type determines how products are fetched</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Database className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{filamentCount ?? '...'}</span>
                      <span className="text-muted-foreground">in DB</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Number of {selectedBrand.brand_name} filaments currently in the database</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{timeAgo(lastSync || null)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {lastSync
                        ? `Last synced: ${new Date(lastSync).toLocaleString()}`
                        : 'This brand has never been synced via catalog sync'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleScan}
                      disabled={isScanning || (!selectedConfig && !isKnownBrand)}
                      className="gap-2"
                    >
                      <RefreshCw className={cn('w-4 h-4', isScanning && 'animate-spin')} />
                      {isScanning ? 'Scanning...' : 'Scan Store'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Fetches all products from the brand's store and compares against the FilaScope database to find new and changed filaments
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
