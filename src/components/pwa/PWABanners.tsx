import { useState, useEffect } from "react";
import { X, WifiOff, Wifi, Download, Share, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useOffline } from "@/hooks/useOffline";

/**
 * PWA Install Banner
 * 
 * Shows a dismissible banner prompting users to install the app.
 * Only appears for returning users who haven't dismissed it.
 */
export const PWAInstallBanner = () => {
  const { canInstall, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Only show banner after a short delay for returning users
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("pwa-visited");
    
    if (hasVisitedBefore) {
      const timer = setTimeout(() => {
        if (canInstall || isIOS) {
          setIsVisible(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem("pwa-visited", "true");
    }
  }, [canInstall, isIOS]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        setIsVisible(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissPrompt();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Install Banner */}
      <div 
        className={cn(
          "fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50",
          "bg-card border border-primary/30 rounded-xl p-4 shadow-lg shadow-primary/10",
          "animate-slide-up-bounce"
        )}
        role="banner"
        aria-label="Install app banner"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install FilaScope</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get the full app experience with offline access and faster loading.
            </p>
            
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isIOS ? "How to Install" : "Install App"}
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div 
            className="bg-card border border-border rounded-xl p-6 max-w-sm w-full animate-slide-up-bounce"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4">Install on iPhone/iPad</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm">Tap the <Share className="w-4 h-4 inline text-primary" /> Share button</p>
                  <p className="text-xs text-muted-foreground">In the Safari toolbar</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm">Tap "Add to Home Screen" <Plus className="w-4 h-4 inline text-primary" /></p>
                  <p className="text-xs text-muted-foreground">Scroll down if needed</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm">Tap "Add" to confirm</p>
                  <p className="text-xs text-muted-foreground">FilaScope will appear on your home screen</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowIOSInstructions(false)}
              variant="outline"
              className="w-full mt-6"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Offline Banner
 * 
 * Shows a banner when the user is offline with cached content notice.
 */
export const OfflineBanner = () => {
  const { isOffline, justReconnected, clearReconnectedState } = useOffline();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
    } else if (justReconnected) {
      // Show reconnected message briefly
      const timer = setTimeout(() => {
        setIsVisible(false);
        clearReconnectedState();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOffline, justReconnected, clearReconnectedState]);

  if (!isVisible && !isOffline && !justReconnected) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-0 right-0 z-40 px-4 py-2",
        "flex items-center justify-center gap-2",
        "text-sm font-medium",
        isOffline 
          ? "bg-warning/20 text-warning border-b border-warning/30"
          : "bg-success/20 text-success border-b border-success/30"
      )}
      role="alert"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline — showing cached content</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online — syncing your data</span>
        </>
      )}
    </div>
  );
};

/**
 * Update Available Banner
 * 
 * Shows when a new version of the app is available.
 */
export const UpdateBanner = ({ onUpdate }: { onUpdate: () => void }) => {
  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-card border border-primary/30 rounded-xl p-4 shadow-lg"
      role="alert"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium">Update available</p>
          <p className="text-xs text-muted-foreground">
            A new version is ready to install
          </p>
        </div>
        <Button onClick={onUpdate} size="sm">
          Update
        </Button>
      </div>
    </div>
  );
};
