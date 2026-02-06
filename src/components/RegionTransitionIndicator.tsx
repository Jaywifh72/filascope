import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegionTransitionIndicatorProps {
  isTransitioning: boolean;
  newRegionName?: string;
  className?: string;
}

/**
 * Shows a subtle indicator when prices are updating due to region change.
 * - Thin progress bar at top of content area
 * - After 3 seconds, shows reassurance message
 */
export function RegionTransitionIndicator({ 
  isTransitioning, 
  newRegionName,
  className 
}: RegionTransitionIndicatorProps) {
  const [showMessage, setShowMessage] = useState(false);

  // Show message after 3 seconds of loading
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowMessage(false);
    }
  }, [isTransitioning]);

  if (!isTransitioning) return null;

  return (
    <div className={cn("relative", className)}>
      {/* Thin progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden z-50">
        <div 
          className="h-full bg-primary animate-pulse"
          style={{
            animation: 'region-loading 1.5s ease-in-out infinite',
            width: '100%',
          }}
        />
      </div>

      {/* Message after 3 seconds */}
      {showMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/90 backdrop-blur-sm border border-border shadow-lg">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-foreground">
              Updating prices{newRegionName ? ` for ${newRegionName}` : ''}...
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes region-loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * Small inline spinner to show next to region flag during transition
 */
export function RegionLoadingSpinner({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  
  return (
    <Loader2 className="w-3 h-3 text-primary animate-spin ml-1" />
  );
}
