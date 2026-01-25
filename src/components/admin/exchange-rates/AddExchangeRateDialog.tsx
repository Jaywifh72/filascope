import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CURRENCIES, CURRENCY_LIST } from '@/config/currencies';
import { CurrencyCode } from '@/types/regional';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCurrencies: CurrencyCode[];
  onSuccess: () => void;
}

export function AddExchangeRateDialog({ open, onOpenChange, existingCurrencies, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('USD');
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode | ''>('');
  const [rate, setRate] = useState('');
  const [source, setSource] = useState('manual');

  // Available currencies (not already configured for the base)
  const availableCurrencies = CURRENCY_LIST.filter(
    c => c.code !== baseCurrency && !existingCurrencies.includes(c.code)
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBaseCurrency('USD');
      setTargetCurrency('');
      setRate('');
      setSource('manual');
    }
  }, [open]);

  // Calculate inverse rate
  const inverseRate = rate && parseFloat(rate) > 0 ? (1 / parseFloat(rate)).toFixed(6) : '';

  const createRateMutation = useMutation({
    mutationFn: async () => {
      const rateValue = parseFloat(rate);
      if (!targetCurrency || !rateValue || rateValue <= 0) {
        throw new Error('Invalid rate value');
      }

      const { error } = await supabase
        .from('currency_exchange_rates')
        .insert({
          base_currency: baseCurrency,
          target_currency: targetCurrency,
          rate: rateValue,
          inverse_rate: 1 / rateValue,
          source: source,
          fetched_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exchange-rates'] });
      toast({ title: 'Exchange rate added successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add exchange rate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCurrency || !rate) {
      toast({
        title: 'Missing required fields',
        description: 'Please select a currency and enter a rate',
        variant: 'destructive',
      });
      return;
    }
    createRateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Exchange Rate</DialogTitle>
          <DialogDescription>
            Configure a new currency exchange rate from USD
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base Currency (fixed to USD) */}
          <div className="space-y-2">
            <Label>Base Currency</Label>
            <Select value={baseCurrency} onValueChange={(v) => setBaseCurrency(v as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">
                  {CURRENCIES.USD.symbol} USD - US Dollar
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All rates are relative to USD as the base currency
            </p>
          </div>

          {/* Target Currency */}
          <div className="space-y-2">
            <Label>Target Currency *</Label>
            <Select value={targetCurrency} onValueChange={(v) => setTargetCurrency(v as CurrencyCode)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency..." />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    All currencies are already configured
                  </div>
                ) : (
                  availableCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Rate Input */}
          <div className="space-y-2">
            <Label>Exchange Rate *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                1 {baseCurrency} =
              </span>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.000000"
                className="font-mono"
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {targetCurrency || '???'}
              </span>
            </div>
            {inverseRate && (
              <p className="text-xs text-muted-foreground">
                Inverse: 1 {targetCurrency} = {inverseRate} {baseCurrency}
              </p>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="api">API Fetch</SelectItem>
                <SelectItem value="google">Google Finance</SelectItem>
                <SelectItem value="xe">XE.com</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Example Conversion */}
          {rate && targetCurrency && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Example Conversion</p>
              <p className="text-sm text-muted-foreground">
                ${CURRENCIES[baseCurrency]?.symbol}100 {baseCurrency} = {CURRENCIES[targetCurrency]?.symbol}
                {(100 * parseFloat(rate)).toFixed(2)} {targetCurrency}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRateMutation.isPending || !targetCurrency || !rate}>
              {createRateMutation.isPending ? 'Adding...' : 'Add Rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
