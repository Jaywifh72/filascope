import { ReactNode, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useModuleAnalytics } from "@/hooks/useModuleAnalytics";

interface SidebarModuleProps {
  icon: ReactNode;
  title: string;
  moduleName: string; // For tracking
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  accentColor?: "cyan" | "amber" | "green" | "red" | "orange";
  headerAction?: ReactNode;
  badge?: ReactNode;
  onInteraction?: () => void;
}

const accentColors = {
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  green: "text-green-400",
  red: "text-red-400",
  orange: "text-orange-400",
};

export function SidebarModule({
  icon,
  title,
  moduleName,
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  className,
  accentColor = "cyan",
  headerAction,
  badge,
  onInteraction,
}: SidebarModuleProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const { trackView, trackTimeSpent, trackScrollPast, trackClick } = useModuleAnalytics();
  const hasTrackedView = useRef(false);
  const hasInteracted = useRef(false);
  const viewStartTime = useRef<number | null>(null);
  
  // Track clicks within the module
  const handleClick = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      trackClick(moduleName);
      onInteraction?.();
    }
  }, [moduleName, trackClick, onInteraction]);
  
  // Set up IntersectionObserver for view tracking
  useEffect(() => {
    if (!moduleRef.current || isEmpty) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Module is 50%+ visible
            if (!hasTrackedView.current) {
              trackView(moduleName);
              hasTrackedView.current = true;
              viewStartTime.current = Date.now();
            }
          } else if (hasTrackedView.current && !entry.isIntersecting) {
            // Module left viewport
            if (viewStartTime.current) {
              const timeSpent = Date.now() - viewStartTime.current;
              if (!hasInteracted.current) {
                trackScrollPast(moduleName);
              } else {
                trackTimeSpent(moduleName);
              }
              viewStartTime.current = null;
            }
            hasTrackedView.current = false;
            hasInteracted.current = false;
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );
    
    observer.observe(moduleRef.current);
    
    return () => observer.disconnect();
  }, [moduleName, isEmpty, trackView, trackTimeSpent, trackScrollPast]);

  if (isEmpty && !isLoading) {
    return null; // Don't render empty modules
  }

  return (
    <div
      ref={moduleRef}
      onClick={handleClick}
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-4",
        "animate-in fade-in-0 slide-in-from-right-2 duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("text-lg", accentColors[accentColor])}>{icon}</span>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground">
            {title}
          </h3>
          {badge}
        </div>
        {headerAction}
      </div>

      {/* Separator */}
      <div className="h-px bg-border/50 mb-3" />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : isEmpty ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}
