import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDatabasePriceAlerts } from '@/hooks/useDatabasePriceAlerts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, BellOff, Mail, TrendingDown, LogIn } from 'lucide-react';

interface DatabasePriceAlertModalProps {
  filamentId: string;
  filamentName: string;
  currentPrice: number | null;
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

export function DatabasePriceAlertModal({
  filamentId,
  filamentName,
  currentPrice,
  isOpen,
  onClose,
  currencySymbol = '$',
}: DatabasePriceAlertModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setAlert, removeAlert, getAlert, hasAlert, isSettingAlert, setGuestAlert, isSettingGuestAlert } = useDatabasePriceAlerts();
  
  const existingAlert = user ? getAlert(filamentId) : null;
  const alertExists = user ? hasAlert(filamentId) : false;
  
  // Default to 10% below current price
  const defaultTarget = currentPrice ? Math.floor(currentPrice * 0.9 * 100) / 100 : 0;
  const [targetPrice, setTargetPrice] = useState(existingAlert?.target_price ?? defaultTarget);
  const [emailNotifications, setEmailNotifications] = useState(existingAlert?.email_notifications ?? true);
  const [guestEmail, setGuestEmail] = useState('');

  // Calculate percentage off
  const percentOff = currentPrice && targetPrice 
    ? Math.round((1 - targetPrice / currentPrice) * 100) 
    : 0;

  const handleSave = () => {
    setAlert({
      filamentId,
      targetPrice,
      currentPrice: currentPrice ?? undefined,
      emailNotifications,
    });
    onClose();
  };

  const handleGuestSave = () => {
    if (!guestEmail || !guestEmail.includes('@')) return;
    setGuestAlert({
      filamentId,
      targetPrice,
      currentPrice: currentPrice ?? undefined,
      email: guestEmail,
    });
    onClose();
  };

  const handleRemove = () => {
    removeAlert(filamentId);
    onClose();
  };

  // Shared price alert form content
  const renderAlertForm = () => (
    <div className="space-y-6 py-4">
      {/* Current Price */}
      {currentPrice && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Current Price</span>
          <span className="text-lg font-semibold">{currencySymbol}{currentPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Target Price Input */}
      <div className="space-y-3">
        <Label htmlFor="target-price" className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-green-500" />
          Alert me when price drops to
        </Label>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              id="target-price"
              type="number"
              step="0.01"
              min="0"
              max={currentPrice ?? undefined}
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="pl-7"
            />
          </div>
          {percentOff > 0 && (
            <span className="text-sm text-green-500 font-medium whitespace-nowrap">
              -{percentOff}% off
            </span>
          )}
        </div>

        {/* Quick select slider */}
        {currentPrice && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-30%</span>
              <span>-20%</span>
              <span>-10%</span>
              <span>Current</span>
            </div>
            <Slider
              value={[targetPrice]}
              onValueChange={([value]) => setTargetPrice(Math.round(value * 100) / 100)}
              min={currentPrice * 0.7}
              max={currentPrice}
              step={0.01}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Guest flow: show email input + alert form
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Set Price Alert
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              {filamentName}
            </DialogDescription>
          </DialogHeader>
          
          {renderAlertForm()}

          {/* Guest email input */}
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Label htmlFor="guest-email" className="text-sm font-medium">Your email</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="you@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleGuestSave} 
              disabled={isSettingGuestAlert || targetPrice <= 0 || !guestEmail.includes('@')} 
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Set Alert
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="gap-2 text-muted-foreground">
              <LogIn className="w-4 h-4" />
              Sign in for more features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {alertExists ? 'Edit Price Alert' : 'Set Price Alert'}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {filamentName}
          </DialogDescription>
        </DialogHeader>

        {renderAlertForm()}

        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">
                Get notified when the price drops
              </p>
            </div>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {alertExists && (
            <Button variant="outline" onClick={handleRemove} className="gap-2">
              <BellOff className="w-4 h-4" />
              Remove Alert
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSettingAlert || targetPrice <= 0} className="gap-2">
            <Bell className="w-4 h-4" />
            {alertExists ? 'Update Alert' : 'Set Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
