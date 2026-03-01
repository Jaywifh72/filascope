import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegion } from '@/contexts/RegionContext';
import { RegionSelector } from '@/components/RegionSelector';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const BANNER_KEY = 'filascope_region_banner_dismissed';
const SESSION_CONFIRMED_KEY = 'filascope_region_confirmed';

export function RegionWelcomeBanner() {
  const { regionConfig, isLoading } = useRegion();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [isScrolledAway, setIsScrolledAway] = useState(false);
  const isMobile = useIsMobile();

  // Hide banner on scroll-down, show again near top
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledAway(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    // Don't show if confirmed this session or previously dismissed
    const sessionConfirmed = sessionStorage.getItem(SESSION_CONFIRMED_KEY);
    const dismissed = localStorage.getItem(BANNER_KEY);
    if (sessionConfirmed || dismissed) return;

    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const animateOut = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => setIsVisible(false), 300);
  }, []);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true');
    localStorage.setItem(BANNER_KEY, 'true');
    animateOut();
  }, [animateOut]);

  const handleConfirm = useCallback(() => {
    sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true');
    localStorage.setItem(BANNER_KEY, 'true');
    animateOut();
  }, [animateOut]);

  if (!isVisible || isLoading || isScrolledAway) return null;

  const confirmLabel = `Yes, I'm in ${regionConfig.name}`;

  // ── Compact mobile banner ──
  if (isMobile) {
    return (
      <div
        className={cn(
          "relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20",
          "transition-all duration-300",
          isAnimatingOut
            ? "-translate-y-full opacity-0"
            : "animate-in slide-in-from-top-2 duration-300"
        )}
        role="banner"
        aria-label="Region confirmation"
      >
        <div className="container mx-auto px-3 py-2">
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
                className="text-xs h-8 px-2"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm">
                  {regionConfig.flag} Prices for {regionConfig.name}
                </span>
                <button
                  onClick={() => setShowRegionPicker(true)}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConfirm}
                  className="text-xs h-7 px-2"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleDismiss}
                  aria-label="Dismiss region banner"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop banner ──
  return (
    <div 
      className={cn(
        "relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20",
        "transition-all duration-300",
        isAnimatingOut
          ? "-translate-y-full opacity-0"
          : "animate-in slide-in-from-top-2 duration-300"
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
                  {confirmLabel}
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
