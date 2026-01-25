import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ProductRow {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  last_scraped_at: string | null;
  price_confidence: string | null;
  product_url: string | null;
  type: 'filament' | 'printer';
}

interface PriceUpdateDialogProps {
  product: ProductRow | null;
  onClose: () => void;
  onUpdate: () => void;
}

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
];

const PRICE_SOURCES = [
  { value: 'manual_verification', label: 'Manual Verification' },
  { value: 'store_visit', label: 'Store Visit' },
  { value: 'email_confirmation', label: 'Email Confirmation' },
  { value: 'brand_contact', label: 'Brand Contact' },
];

export function PriceUpdateDialog({ product, onClose, onUpdate }: PriceUpdateDialogProps) {
  const [newPrice, setNewPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [storeUrl, setStoreUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('manual_verification');

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setNewPrice(product.variant_price?.toString() || '');
      setStoreUrl(product.product_url || '');
      setCurrency('USD');
      setNotes('');
      setSource('manual_verification');
    }
  }, [product]);

  const priceChange = product?.variant_price && newPrice
    ? ((parseFloat(newPrice) - product.variant_price) / product.variant_price) * 100
    : null;

  const isLargeChange = priceChange !== null && Math.abs(priceChange) > 30;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;

      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Please enter a valid positive price');
      }

      // Update the filament record
      const { error: updateError } = await supabase
        .from('filaments')
        .update({
          variant_price: priceValue,
          last_scraped_at: new Date().toISOString(),
          price_source: source,
          product_url: storeUrl || product.product_url,
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Insert into price history
      const { error: historyError } = await supabase.from('price_history').insert({
        filament_id: product.id,
        price: priceValue,
        currency: currency,
        source: source,
        notes: notes || null,
        recorded_at: new Date().toISOString(),
        region: 'US',
      });

      if (historyError) {
        console.warn('Failed to insert price history:', historyError);
        // Don't throw - the price update succeeded
      }
    },
    onSuccess: () => {
      toast.success('Price updated successfully');
      onUpdate();
    },
    onError: (error) => {
      toast.error('Failed to update price: ' + (error as Error).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Price</DialogTitle>
          <DialogDescription>
            Manually update the price for this product. This will be logged in price history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <p className="font-medium text-sm">{product?.product_title}</p>
            <p className="text-xs text-muted-foreground">{product?.vendor}</p>
            {product?.variant_price && (
              <p className="text-sm">
                Current Price: <span className="font-mono">${product.variant_price.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Price Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">New Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Change Warning */}
          {priceChange !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Price change:</span>
              <Badge
                variant="outline"
                className={
                  priceChange > 0
                    ? 'text-red-500 border-red-500/30'
                    : priceChange < 0
                    ? 'text-emerald-500 border-emerald-500/30'
                    : ''
                }
              >
                {priceChange > 0 ? '+' : ''}
                {priceChange.toFixed(1)}%
              </Badge>
            </div>
          )}

          {isLargeChange && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                This is a large price change (&gt;30%). Please verify this is correct.
              </AlertDescription>
            </Alert>
          )}

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Verification Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store URL */}
          <div className="space-y-2">
            <Label htmlFor="storeUrl">Store URL (optional)</Label>
            <Input
              id="storeUrl"
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://store.com/product"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Price'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
