import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, RefreshCw, Store, Database, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Raw row from the printer_brands table.
 * The table has `brand` (not brand_name) and no brand_slug/website_url/logo_url.
 */
interface PrinterBrandRow {
  id: string;
  brand: string;
}

/** Enriched brand used inside the component */
interface PrinterBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
}

interface Props {
  onScanStart: (brandId: string, configId: string, brandName: string, brandSlug: string) => void;
  isScanning: boolean;
}

/**
 * Printer brands with known Shopify store support — these can be scanned automatically.
 * Slugs must match the keys in KNOWN_PRINTER_BRAND_SLUGS in usePrinterCatalogSync.
 */
const KNOWN_PRINTER_BRANDS = [
  'bambu-lab', 'creality', 'elegoo', 'anycubic', 'qidi', 'qidi-tech', 'sovol',
  'kingroon', 'flsun', 'flashforge', 'snapmaker', 'ratrig', 'ankermake',
];

/** Convert brand name to slug (e.g. "Bambu Lab" → "bambu-lab") */
function toSlug(brand: string): string {
  return brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
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

export function PrinterBrandSelectorCard({ onScanStart, isScanning }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // Load printer brands from DB — table has `id` and `brand` columns
  const { data: brands } = useQuery({
    queryKey: ['printer-brands-sync'],
    queryFn: async () => {
      const { data } = await supabase
        .from('printer_brands')
        .select('id, brand')
        .order('brand');
      return (data || []).map((row: PrinterBrandRow) => ({
        id: row.id,
        brand_name: row.brand,
        brand_slug: toSlug(row.brand),
      })) as PrinterBrand[];
    },
  });

  // Load printer count for selected brand
  const { data: printerCount } = useQuery({
    queryKey: ['brand-printer-count', selectedBrandId],
    queryFn: async () => {
      const { count } = await supabase
        .from('printers')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', selectedBrandId);
      return count || 0;
    },
    enabled: !!selectedBrandId,
  });

  // Last sync time is not tracked in the DB for printer sync (runs in-memory).
  // We always show "Never synced" since printer scan results are session-only.
  const lastSync: string | null = null;

  const selectedBrand = useMemo(() => brands?.find(b => b.id === selectedBrandId), [brands, selectedBrandId]);
  const isKnownBrand = selectedBrand && KNOWN_PRINTER_BRANDS.includes(selectedBrand.brand_slug);

  const handleScan = () => {
    if (!selectedBrand) return;
    onScanStart(selectedBrand.id, 'auto', selectedBrand.brand_name, selectedBrand.brand_slug);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Brand selector */}
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Select Printer Brand</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10"
                  >
                    {selectedBrand ? (
                      <span>{selectedBrand.brand_name}</span>
                    ) : (
                      <span className="text-muted-foreground">Choose a printer brand...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search printer brands..." />
                    <CommandList>
                      <CommandEmpty>No printer brand found.</CommandEmpty>
                      <CommandGroup>
                        {brands?.map(brand => {
                          const isKnown = KNOWN_PRINTER_BRANDS.includes(brand.brand_slug);
                          return (
                            <CommandItem
                              key={brand.id}
                              value={brand.brand_name}
                              onSelect={() => {
                                setSelectedBrandId(brand.id);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedBrandId === brand.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <span>{brand.brand_name}</span>
                                {isKnown && (
                                  <Badge variant="secondary" className="text-[10px] ml-auto">
                                    auto
                                  </Badge>
                                )}
                                {!isKnown && (
                                  <span className="text-xs text-muted-foreground ml-auto">(pre-fetch)</span>
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
                      <Badge variant="outline" className="text-xs font-normal">
                        {isKnownBrand ? 'Auto' : 'Pre-fetch'}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {isKnownBrand
                        ? 'Store products are fetched automatically via API'
                        : 'Products must be pre-fetched using a scraping script'}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Database className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{printerCount ?? '...'}</span>
                      <span className="text-muted-foreground">in DB</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Number of {selectedBrand.brand_name} printers currently in the database</p>
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
                      disabled={isScanning}
                      className="gap-2"
                    >
                      <RefreshCw className={cn('w-4 h-4', isScanning && 'animate-spin')} />
                      {isScanning ? 'Scanning...' : 'Scan Store'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Fetches all products from the brand's store and compares against the FilaScope printer database
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
