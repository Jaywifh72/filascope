import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, DollarSign, Database, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PrinterBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
}

interface Props {
  onSyncStart: (brandId: string | 'all', brandName: string) => void;
  syncing: boolean;
}

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

export function PriceSyncBrandSelector({ onSyncStart, syncing }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(''); // 'all' or brand UUID

  const { data: brands } = useQuery({
    queryKey: ['printer-brands-price-sync'],
    queryFn: async () => {
      const { data } = await supabase
        .from('printer_brands')
        .select('id, brand')
        .order('brand');
      return (data || []).map(row => ({
        id: row.id,
        brand_name: row.brand,
        brand_slug: toSlug(row.brand),
      })) as PrinterBrand[];
    },
  });

  // Printer count + last price update for selected brand
  const { data: brandMeta } = useQuery({
    queryKey: ['price-sync-brand-meta', selectedValue],
    queryFn: async () => {
      let query = supabase
        .from('printers')
        .select('id, prices_last_updated_at')
        .neq('status', 'discontinued');

      if (selectedValue !== 'all') {
        query = query.eq('brand_id', selectedValue);
      }

      const { data } = await query;
      if (!data) return { count: 0, lastSync: null };

      const lastSync = data.reduce((latest: string | null, p: any) => {
        if (!p.prices_last_updated_at) return latest;
        if (!latest) return p.prices_last_updated_at;
        return p.prices_last_updated_at > latest ? p.prices_last_updated_at : latest;
      }, null);

      return { count: data.length, lastSync };
    },
    enabled: !!selectedValue,
  });

  const selectedBrand = useMemo(
    () => brands?.find(b => b.id === selectedValue),
    [brands, selectedValue]
  );

  const displayName = selectedValue === 'all' ? 'All Brands' : selectedBrand?.brand_name || '';

  const handleSync = () => {
    if (!selectedValue) return;
    const name = selectedValue === 'all' ? 'All Brands' : selectedBrand?.brand_name || '';
    onSyncStart(selectedValue === 'all' ? 'all' : selectedBrand!.id, name);
  };

  return (
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
                  {selectedValue ? (
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
                          setSelectedValue('all');
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedValue === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium">All Brands</span>
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            sync all
                          </Badge>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Brands">
                      {brands?.map(brand => (
                        <CommandItem
                          key={brand.id}
                          value={brand.brand_name}
                          onSelect={() => {
                            setSelectedValue(brand.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedValue === brand.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span>{brand.brand_name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Meta + sync button */}
          {selectedValue && (
            <div className="flex items-center gap-4 pt-8">
              <div className="flex items-center gap-1.5 text-sm">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium">{brandMeta?.count ?? '...'}</span>
                <span className="text-muted-foreground">printers</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{timeAgo(brandMeta?.lastSync || null)}</span>
              </div>

              <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                {syncing ? 'Syncing...' : 'Sync Prices'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
