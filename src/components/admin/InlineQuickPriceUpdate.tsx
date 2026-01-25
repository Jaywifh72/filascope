import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';

interface InlineQuickPriceUpdateProps {
  productId: string;
  currentPrice: number | null;
  onComplete: () => void;
  onCancel: () => void;
}

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'JPY'];

export function InlineQuickPriceUpdate({
  productId,
  currentPrice,
  onComplete,
  onCancel,
}: InlineQuickPriceUpdateProps) {
  const queryClient = useQueryClient();
  const [newPrice, setNewPrice] = useState(currentPrice?.toString() || '');
  const [currency, setCurrency] = useState('USD');

  const updateMutation = useMutation({
    mutationFn: async () => {
      const priceValue = parseFloat(newPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error('Invalid price');
      }

      // Update the filament record
      const { error: updateError } = await supabase
        .from('filaments')
        .update({
          variant_price: priceValue,
          last_scraped_at: new Date().toISOString(),
          price_source: 'manual_verification',
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Insert into price history
      await supabase.from('price_history').insert({
        filament_id: productId,
        price: priceValue,
        currency: currency,
        source: 'manual_verification',
        recorded_at: new Date().toISOString(),
        region: currency === 'USD' ? 'US' : currency === 'CAD' ? 'CA' : 'US',
      });
    },
    onSuccess: () => {
      toast.success('Price updated & verified');
      queryClient.invalidateQueries({ queryKey: ['admin-price-verification-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-verification-stats'] });
      onComplete();
    },
    onError: (error) => {
      toast.error('Failed: ' + (error as Error).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="w-24 pl-5 h-8 text-sm"
          placeholder="0.00"
          autoFocus
          required
        />
      </div>
      
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-20 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        type="submit" 
        size="sm" 
        variant="default"
        className="h-8 px-2"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </Button>
      
      <Button 
        type="button" 
        size="sm" 
        variant="ghost"
        className="h-8 px-2"
        onClick={onCancel}
      >
        <X className="w-4 h-4" />
      </Button>
    </form>
  );
}
