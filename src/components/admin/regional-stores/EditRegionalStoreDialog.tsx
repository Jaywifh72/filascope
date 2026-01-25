import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { REGIONS } from '@/config/regions';
import { CURRENCY_LIST } from '@/config/currencies';
import { BrandRegionalStore, RegionCode, CurrencyCode } from '@/types/regional';

interface Props {
  store: BrandRegionalStore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRegionalStoreDialog({ store, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [storeName, setStoreName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [productUrlPattern, setProductUrlPattern] = useState('');
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [shipsFromCountry, setShipsFromCountry] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [estimatedShippingDays, setEstimatedShippingDays] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Populate form when store changes
  useEffect(() => {
    if (store) {
      setStoreName(store.store_name);
      setBaseUrl(store.base_url);
      setProductUrlPattern(store.product_url_pattern || '');
      setCurrencyCode(store.currency_code);
      setShipsFromCountry(store.ships_from_country || '');
      setFreeShippingThreshold(store.free_shipping_threshold?.toString() || '');
      setEstimatedShippingDays(store.estimated_shipping_days?.toString() || '');
      setIsPrimary(store.is_primary);
      setIsActive(store.is_active);
      setNotes(store.notes || '');
    }
  }, [store]);

  const updateStoreMutation = useMutation({
    mutationFn: async () => {
      if (!store) return;
      const { error } = await supabase
        .from('brand_regional_stores')
        .update({
          store_name: storeName,
          base_url: baseUrl,
          product_url_pattern: productUrlPattern || null,
          currency_code: currencyCode,
          ships_from_country: shipsFromCountry || null,
          free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
          estimated_shipping_days: estimatedShippingDays ? parseInt(estimatedShippingDays) : null,
          is_primary: isPrimary,
          is_active: isActive,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands-regional-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['admin-brand-stores'] });
      toast({ title: 'Regional store updated successfully' });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update store', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !baseUrl) {
      toast({ 
        title: 'Missing required fields', 
        description: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }
    updateStoreMutation.mutate();
  };

  if (!store) return null;

  const regionConfig = REGIONS[store.region_code as RegionCode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Regional Store</DialogTitle>
          <DialogDescription>
            Update the configuration for {regionConfig?.flag} {store.store_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only Brand & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
                <span>{regionConfig?.flag}</span>
                <span>{regionConfig?.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={currencyCode} onValueChange={(v) => setCurrencyCode(v as CurrencyCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Store Details */}
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name *</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g., Creality Canada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Store URL *</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://store.example.com/en-ca"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productUrlPattern">Product URL Pattern</Label>
            <Input
              id="productUrlPattern"
              value={productUrlPattern}
              onChange={(e) => setProductUrlPattern(e.target.value)}
              placeholder="https://store.example.com/en-ca/products/{sku}"
            />
            <p className="text-xs text-muted-foreground">
              Use {'{sku}'} as placeholder for product SKU
            </p>
          </div>

          {/* Shipping Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipsFrom">Ships From</Label>
              <Input
                id="shipsFrom"
                value={shipsFromCountry}
                onChange={(e) => setShipsFromCountry(e.target.value.toUpperCase())}
                placeholder="e.g., CA"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeShipping">Free Shipping $</Label>
              <Input
                id="freeShipping"
                type="number"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                placeholder="50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingDays">Ship Days</Label>
              <Input
                id="shippingDays"
                type="number"
                value={estimatedShippingDays}
                onChange={(e) => setEstimatedShippingDays(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
              <Label>Primary Store</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any internal notes about this store..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateStoreMutation.isPending}>
              {updateStoreMutation.isPending ? 'Updating...' : 'Update Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
