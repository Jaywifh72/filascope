import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { REGION_LIST, REGIONS } from '@/config/regions';
import { CURRENCY_LIST } from '@/config/currencies';
import { RegionCode, CurrencyCode } from '@/types/regional';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string | null;
  onSuccess: () => void;
}

export function AddRegionalStoreDialog({ open, onOpenChange, brandId, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [selectedBrandId, setSelectedBrandId] = useState(brandId || '');
  const [regionCode, setRegionCode] = useState<RegionCode>('US');
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

  // Fetch brands for dropdown
  const { data: brands } = useQuery({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_name')
        .order('brand_name');
      if (error) throw error;
      return data;
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBrandId(brandId || '');
      setRegionCode('US');
      setStoreName('');
      setBaseUrl('');
      setProductUrlPattern('');
      setCurrencyCode('USD');
      setShipsFromCountry('');
      setFreeShippingThreshold('');
      setEstimatedShippingDays('');
      setIsPrimary(false);
      setIsActive(true);
      setNotes('');
    }
  }, [open, brandId]);

  // Auto-set currency when region changes
  useEffect(() => {
    const defaultCurrency = REGIONS[regionCode]?.defaultCurrency;
    if (defaultCurrency) {
      setCurrencyCode(defaultCurrency);
    }
  }, [regionCode]);

  // Auto-generate store name
  useEffect(() => {
    if (selectedBrandId && regionCode) {
      const brand = brands?.find(b => b.id === selectedBrandId);
      if (brand) {
        setStoreName(`${brand.brand_name} ${REGIONS[regionCode]?.name || regionCode}`);
      }
    }
  }, [selectedBrandId, regionCode, brands]);

  const createStoreMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('brand_regional_stores')
        .insert({
          brand_id: selectedBrandId,
          region_code: regionCode,
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
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands-regional-coverage'] });
      toast({ title: 'Regional store created successfully' });
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create store', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandId || !regionCode || !storeName || !baseUrl) {
      toast({ 
        title: 'Missing required fields', 
        description: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }
    createStoreMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Regional Store</DialogTitle>
          <DialogDescription>
            Configure a new regional storefront for a brand
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand & Region Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select value={regionCode} onValueChange={(v) => setRegionCode(v as RegionCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_LIST.map(region => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.flag} {region.name}
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

          {/* Currency & Shipping */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currencyCode} onValueChange={(v) => setCurrencyCode(v as CurrencyCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipsFrom">Ships From Country</Label>
              <Input
                id="shipsFrom"
                value={shipsFromCountry}
                onChange={(e) => setShipsFromCountry(e.target.value.toUpperCase())}
                placeholder="e.g., CA, US, DE"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freeShipping">Free Shipping Threshold</Label>
              <Input
                id="freeShipping"
                type="number"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                placeholder="e.g., 50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingDays">Estimated Shipping Days</Label>
              <Input
                id="shippingDays"
                type="number"
                value={estimatedShippingDays}
                onChange={(e) => setEstimatedShippingDays(e.target.value)}
                placeholder="e.g., 3"
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
            <Button type="submit" disabled={createStoreMutation.isPending}>
              {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
