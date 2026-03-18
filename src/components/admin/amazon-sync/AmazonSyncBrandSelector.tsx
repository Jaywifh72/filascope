import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronsUpDown, Check, ShoppingCart, Database, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BrandOption {
  slug: string;
  name: string;
  count: number;
}

interface Props {
  onSyncStart: (brandSlug: string | null, marketplace: string | null, label: string) => void;
  syncing: boolean;
}

const MARKETPLACES = [
  { value: 'all', label: 'All Marketplaces' },
  { value: 'US', label: '🇺🇸 US (amazon.com)' },
  { value: 'UK', label: '🇬🇧 UK (amazon.co.uk)' },
  { value: 'DE', label: '🇩🇪 DE (amazon.de)' },
  { value: 'CA', label: '🇨🇦 CA (amazon.ca)' },
  { value: 'FR', label: '🇫🇷 FR (amazon.fr)' },
  { value: 'IT', label: '🇮🇹 IT (amazon.it)' },
  { value: 'ES', label: '🇪🇸 ES (amazon.es)' },
  { value: 'AU', label: '🇦🇺 AU (amazon.com.au)' },
  { value: 'JP', label: '🇯🇵 JP (amazon.co.jp)' },
];

function toSlug(brand: string): string {
  return brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AmazonSyncBrandSelector({ onSyncStart, syncing }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>(''); // '' or 'all' or slug
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');

  // Get filament brands that have Amazon links
  const { data: brands } = useQuery({
    queryKey: ['amazon-sync-brands'],
    queryFn: async () => {
      // Get distinct vendors that have at least one amazon_link_us
      const { data } = await supabase
        .from('filaments')
        .select('vendor')
        .not('amazon_link_us', 'is', null)
        .neq('amazon_link_us', '');

      if (!data) return [];

      // Count per vendor
      const counts: Record<string, number> = {};
      for (const row of data) {
        const v = row.vendor;
        if (!v) continue;
        counts[v] = (counts[v] || 0) + 1;
      }

      return Object.entries(counts)
        .map(([name, count]) => ({
          slug: toSlug(name),
          name,
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) as BrandOption[];
    },
  });

  const totalWithLinks = useMemo(
    () => brands?.reduce((sum, b) => sum + b.count, 0) ?? 0,
    [brands]
  );

  // Last sync run
  const { data: lastRun } = useQuery({
    queryKey: ['amazon-sync-last-run', selectedBrand],
    queryFn: async () => {
      let query = supabase
        .from('amazon_sync_runs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (selectedBrand && selectedBrand !== 'all') {
        query = query.eq('brand_slug', selectedBrand);
      }

      const { data } = await query;
      return data?.[0]?.created_at ?? null;
    },
    enabled: !!selectedBrand,
  });

  const selectedBrandObj = useMemo(
    () => brands?.find(b => b.slug === selectedBrand),
    [brands, selectedBrand]
  );

  const displayName = selectedBrand === 'all'
    ? 'All Brands'
    : selectedBrandObj?.name || '';

  const displayCount = selectedBrand === 'all'
    ? totalWithLinks
    : selectedBrandObj?.count ?? 0;

  const handleSync = () => {
    if (!selectedBrand) return;
    const brandSlug = selectedBrand === 'all' ? null : selectedBrand;
    const mp = selectedMarketplace === 'all' ? null : selectedMarketplace;
    const mpLabel = selectedMarketplace === 'all' ? 'all marketplaces' : selectedMarketplace;
    const label = `${displayName} — ${mpLabel}`;
    onSyncStart(brandSlug, mp, label);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-6 flex-wrap">
          {/* Brand selector */}
          <div className="flex-1 min-w-[220px] space-y-3">
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
                    <span>{displayName}</span>
                  ) : (
                    <span className="text-muted-foreground">Choose a brand or sync all...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search brands..." />
                  <CommandList>
                    <CommandEmpty>No brand found.</CommandEmpty>
                    <CommandGroup heading="Options">
                      <CommandItem
                        value="__all__"
                        onSelect={() => {
                          setSelectedBrand('all');
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedBrand === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium">All Brands</span>
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            {totalWithLinks} filaments
                          </Badge>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Brands">
                      {brands?.map(brand => (
                        <CommandItem
                          key={brand.slug}
                          value={brand.name}
                          onSelect={() => {
                            setSelectedBrand(brand.slug);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedBrand === brand.slug ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span>{brand.name}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">
                              {brand.count}
                            </Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Marketplace selector */}
          <div className="w-[220px] space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Marketplace</label>
            <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map(mp => (
                  <SelectItem key={mp.value} value={mp.value}>
                    {mp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meta + sync button */}
          {selectedBrand && (
            <div className="flex items-center gap-4 pt-8">
              <div className="flex items-center gap-1.5 text-sm">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{displayCount}</span>
                <span className="text-muted-foreground">filaments</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{timeAgo(lastRun)}</span>
              </div>

              <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                {syncing ? 'Syncing...' : 'Sync Amazon Prices'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
