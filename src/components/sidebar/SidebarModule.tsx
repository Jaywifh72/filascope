import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SidebarModuleProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  accentColor?: "cyan" | "amber" | "green" | "red" | "orange";
  headerAction?: ReactNode;
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
  children,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  className,
  accentColor = "cyan",
  headerAction,
}: SidebarModuleProps) {
  if (isEmpty && !isLoading) {
    return null; // Don't render empty modules
  }

  return (
    <div
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
