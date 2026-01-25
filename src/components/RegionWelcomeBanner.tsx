import { useState, useEffect } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegion } from '@/contexts/RegionContext';
import { RegionSelector } from '@/components/RegionSelector';
import { cn } from '@/lib/utils';

const BANNER_KEY = 'filascope_region_banner_dismissed';

export function RegionWelcomeBanner() {
  const { regionConfig, isLoading } = useRegion();
  const [isVisible, setIsVisible] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  useEffect(() => {
    // Only show if not previously dismissed and region is loaded
    if (isLoading) return;
    
    const dismissed = localStorage.getItem(BANNER_KEY);
    if (!dismissed) {
      // Small delay to prevent flash
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_KEY, 'true');
  };

  const handleConfirm = () => {
    handleDismiss();
  };

  if (!isVisible || isLoading) return null;

  return (
    <div 
      className={cn(
        "relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20",
        "animate-in slide-in-from-top-2 duration-300"
      )}
      role="banner"
      aria-label="Region confirmation"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left - Region info */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">
                Welcome! We've detected you're in {regionConfig.flag} {regionConfig.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Prices and store links are optimized for your location.
              </p>
            </div>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {showRegionPicker ? (
              <div className="flex items-center gap-2">
                <RegionSelector />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRegionPicker(false);
                    handleDismiss();
                  }}
                  className="text-xs"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirm}
                  className="text-xs"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Looks Good
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegionPicker(true)}
                  className="text-xs"
                >
                  Change Region
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="Dismiss region banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
