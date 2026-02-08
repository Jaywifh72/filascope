import { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useDatabasePriceAlerts } from '@/hooks/useDatabasePriceAlerts';
import { useRegion } from '@/contexts/RegionContext';
import { cn } from '@/lib/utils';

interface PriceAlertPopoverProps {
  filamentId: string;
  currentPricePerKg: number | null;
  productTitle?: string | null;
  isConverted?: boolean;
}

export function PriceAlertPopover({
  filamentId,
  currentPricePerKg,
  productTitle,
  isConverted = false,
}: PriceAlertPopoverProps) {
  const { user } = useAuth();
  const { formatPrice, currency, region } = useRegion();
  const {
    hasAlert,
    getAlert,
    setAlert,
    removeAlert,
    isSettingAlert,
    setGuestAlert,
    isSettingGuestAlert,
  } = useDatabasePriceAlerts();

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');

  const existingAlert = getAlert(filamentId);
  const alertExists = hasAlert(filamentId);

  // Pre-fill target price at 15% below current
  useEffect(() => {
    if (open && !alertExists) {
      const suggested = currentPricePerKg
        ? (currentPricePerKg * 0.85).toFixed(2)
        : '';
      setTargetPrice(suggested);
      setIsEditing(false);
    } else if (open && alertExists && existingAlert) {
      setTargetPrice(existingAlert.target_price.toFixed(2));
      setIsEditing(false);
    }
  }, [open, alertExists, currentPricePerKg, existingAlert]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    if (user) {
      setAlert({
        filamentId,
        targetPrice: price,
        currentPrice: currentPricePerKg ?? undefined,
        currency,
        region,
      });
    } else {
      if (!email.trim() || !email.includes('@')) return;
      setGuestAlert({
        filamentId,
        targetPrice: price,
        currentPrice: currentPricePerKg ?? undefined,
        email: email.trim(),
      });
    }
    setOpen(false);
    setIsEditing(false);
  };

  const handleRemove = () => {
    removeAlert(filamentId);
    setOpen(false);
    setIsEditing(false);
  };

  const formattedCurrent = currentPricePerKg
    ? formatPrice(currentPricePerKg, { showApproximate: isConverted })
    : null;

  // Extract short product name for toast
  const shortName = productTitle
    ? productTitle.split(' ').slice(0, 3).join(' ')
    : 'this filament';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200",
                "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                alertExists
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-label={alertExists ? "Manage price alert" : "Set price alert"}
            >
              {alertExists ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {alertExists ? "Manage price alert" : "Set price alert"}
        </TooltipContent>
      </Tooltip>

      <PopoverContent className="w-72 p-4" align="end" side="bottom">
        {/* Existing alert — show details or edit form */}
        {alertExists && existingAlert && !isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Alert Active</span>
            </div>

            <div className="space-y-1.5 text-sm">
              {formattedCurrent && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Current:</span>
                  <span className="font-medium text-foreground">{formattedCurrent}/kg</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Alert below:</span>
                <span className="font-medium text-primary">
                  {formatPrice(existingAlert.target_price)}/kg
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleRemove}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          /* Create / Edit form */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {isEditing ? 'Edit Price Alert' : 'Set Price Alert'}
              </span>
            </div>

            {formattedCurrent && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Current:</span>
                <span className="font-medium text-foreground">{formattedCurrent}/kg</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="target-price" className="text-xs font-medium text-muted-foreground">
                Notify me below:
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
                <Input
                  id="target-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="pl-12 h-9 text-sm"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  /kg
                </span>
              </div>
            </div>

            {/* Email field for guests */}
            {!user && (
              <div className="space-y-1.5">
                <Label htmlFor="alert-email" className="text-xs font-medium text-muted-foreground">
                  Your email:
                </Label>
                <Input
                  id="alert-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className={cn(
                  "flex-1",
                  "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                disabled={isSettingAlert || isSettingGuestAlert}
              >
                {(isSettingAlert || isSettingGuestAlert) ? 'Saving...' : isEditing ? 'Update Alert' : 'Set Alert'}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              We'll email you when the price drops below your target.
            </p>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
