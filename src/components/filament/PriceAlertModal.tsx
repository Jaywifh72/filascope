import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle2, Info } from 'lucide-react';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PriceAlertModalProps {
  filamentId: string;
  filamentName: string;
  currentPrice: number | null;
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export function PriceAlertModal({
  filamentId,
  filamentName,
  currentPrice,
  isOpen,
  onClose,
  currencySymbol = '$',
}: PriceAlertModalProps) {
  const { toast } = useToast();
  const { setAlert, removeAlert, getAlert, hasAlert } = usePriceAlerts();
  
  const existingAlert = getAlert(filamentId);
  const alertExists = hasAlert(filamentId);
  
  // Calculate reasonable default target price (10% below current)
  const defaultTarget = currentPrice ? Math.round(currentPrice * 0.9 * 100) / 100 : 20;
  
  const [targetPrice, setTargetPrice] = useState<number>(
    existingAlert?.targetPrice || defaultTarget
  );

  // Update target price when modal opens with existing alert
  useEffect(() => {
    if (isOpen) {
      setTargetPrice(existingAlert?.targetPrice || defaultTarget);
    }
  }, [isOpen, existingAlert, defaultTarget]);

  const handleSave = () => {
    if (!targetPrice || targetPrice <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Please enter a valid target price.',
        variant: 'destructive',
      });
      return;
    }

    setAlert(filamentId, targetPrice);
    toast({
      title: 'Price alert set!',
      description: `We'll notify you when the price drops below ${currencySymbol}${targetPrice.toFixed(2)}/kg.`,
    });
    onClose();
  };

  const handleRemove = () => {
    removeAlert(filamentId);
    toast({
      title: 'Price alert removed',
      description: 'You will no longer receive notifications for this filament.',
    });
    onClose();
  };

  // Calculate percentage difference
  const percentBelow = currentPrice && targetPrice 
    ? Math.round((1 - targetPrice / currentPrice) * 100)
    : 0;

  // Min/max for slider
  const minPrice = currentPrice ? Math.round(currentPrice * 0.5 * 100) / 100 : 10;
  const maxPrice = currentPrice ? Math.round(currentPrice * 1.2 * 100) / 100 : 50;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Set Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when the price drops below your target for{' '}
            <span className="font-medium text-foreground">{filamentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Price */}
          {currentPrice && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="font-semibold">{currencySymbol}{currentPrice.toFixed(2)}/kg</span>
            </div>
          )}

          {/* Target Price Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="targetPrice">Alert when price drops to</Label>
              {percentBelow > 0 && (
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  {percentBelow}% below current
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-muted-foreground">{currencySymbol}</span>
              <Input
                id="targetPrice"
                type="number"
                step="0.01"
                min={0}
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="text-lg font-semibold"
              />
              <span className="text-sm text-muted-foreground">/kg</span>
            </div>

            {/* Price Slider */}
            {currentPrice && (
              <div className="pt-2">
                <Slider
                  value={[targetPrice]}
                  onValueChange={([value]) => setTargetPrice(Math.round(value * 100) / 100)}
                  min={minPrice}
                  max={maxPrice}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{currencySymbol}{minPrice.toFixed(2)}</span>
                  <span>{currencySymbol}{maxPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Price alerts are saved locally in your browser. We'll check prices when you visit the site 
              and show a notification if your target is reached.
            </p>
          </div>

          {/* Existing Alert Status */}
          {alertExists && existingAlert && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">
                Alert set for {currencySymbol}{existingAlert.targetPrice.toFixed(2)}/kg
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {alertExists && (
            <Button
              variant="outline"
              onClick={handleRemove}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Remove Alert
            </Button>
          )}
          <Button onClick={handleSave}>
            <Bell className="w-4 h-4 mr-2" />
            {alertExists ? 'Update Alert' : 'Set Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
