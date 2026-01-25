import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { CURRENCIES } from '@/config/currencies';
import { CurrencyCode, CurrencyExchangeRate } from '@/types/regional';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  rate: CurrencyExchangeRate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditExchangeRateDialog({ rate, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rateValue, setRateValue] = useState('');
  const [source, setSource] = useState('manual');

  // Populate form when rate changes
  useEffect(() => {
    if (rate) {
      setRateValue(rate.rate.toString());
      setSource(rate.source || 'manual');
    }
  }, [rate]);

  // Calculate inverse rate
  const inverseRate = rateValue && parseFloat(rateValue) > 0 
    ? (1 / parseFloat(rateValue)).toFixed(6) 
    : '';

  // Calculate rate change percentage
  const rateChange = rate && rateValue 
    ? ((parseFloat(rateValue) - rate.rate) / rate.rate * 100).toFixed(2)
    : null;

  const updateRateMutation = useMutation({
    mutationFn: async () => {
      if (!rate) return;
      
      const newRate = parseFloat(rateValue);
      if (!newRate || newRate <= 0) {
        throw new Error('Invalid rate value');
      }

      const { error } = await supabase
        .from('currency_exchange_rates')
        .update({
          rate: newRate,
          inverse_rate: 1 / newRate,
          source: source,
          fetched_at: new Date().toISOString(),
        })
        .eq('id', rate.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exchange-rates'] });
      toast({ title: 'Exchange rate updated successfully' });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update exchange rate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateValue) {
      toast({
        title: 'Missing rate value',
        description: 'Please enter an exchange rate',
        variant: 'destructive',
      });
      return;
    }
    updateRateMutation.mutate();
  };

  if (!rate) return null;

  const targetConfig = CURRENCIES[rate.target_currency as CurrencyCode];
  const baseConfig = CURRENCIES[rate.base_currency as CurrencyCode];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Exchange Rate</DialogTitle>
          <DialogDescription>
            Update the {rate.base_currency} → {rate.target_currency} exchange rate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Currency Pair Display */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {rate.base_currency}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge className="font-mono">
                  {rate.target_currency}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {targetConfig?.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {formatDistanceToNow(new Date(rate.fetched_at), { addSuffix: true })}
            </p>
          </div>

          {/* Current Rate */}
          <div className="space-y-1">
            <Label className="text-muted-foreground">Current Rate</Label>
            <p className="font-mono text-lg">
              1 {rate.base_currency} = {rate.rate.toFixed(6)} {rate.target_currency}
            </p>
          </div>

          {/* New Rate Input */}
          <div className="space-y-2">
            <Label>New Exchange Rate *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                1 {rate.base_currency} =
              </span>
              <Input
                type="number"
                step="0.000001"
                min="0.000001"
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                placeholder="0.000000"
                className="font-mono"
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {rate.target_currency}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {inverseRate && (
                <span className="text-muted-foreground">
                  Inverse: 1 {rate.target_currency} = {inverseRate} {rate.base_currency}
                </span>
              )}
              {rateChange && parseFloat(rateChange) !== 0 && (
                <Badge 
                  variant={parseFloat(rateChange) > 0 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {parseFloat(rateChange) > 0 ? '+' : ''}{rateChange}%
                </Badge>
              )}
            </div>
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
          {rateValue && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Example Conversion</p>
              <p className="text-sm text-muted-foreground">
                {baseConfig?.symbol}100 {rate.base_currency} = {targetConfig?.symbol}
                {(100 * parseFloat(rateValue)).toFixed(2)} {rate.target_currency}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRateMutation.isPending || !rateValue}>
              {updateRateMutation.isPending ? 'Updating...' : 'Update Rate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
