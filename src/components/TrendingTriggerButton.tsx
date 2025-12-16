import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingTriggerButtonProps {
  onClick: () => void;
  newTrendCount: number;
  isOpen: boolean;
}

export function TrendingTriggerButton({ 
  onClick, 
  newTrendCount, 
  isOpen 
}: TrendingTriggerButtonProps) {
  const hasNewTrends = newTrendCount > 0;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
        "border-orange-400/40 text-orange-400 hover:bg-orange-400/10 hover:border-orange-400/60",
        "focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-background",
        isOpen && "bg-orange-400/15 border-orange-400/60",
        hasNewTrends && "animate-trending-pulse"
      )}
      aria-label={`View trending materials${hasNewTrends ? `, ${newTrendCount} new` : ''}`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <Flame 
        className={cn(
          "h-5 w-5 transition-transform",
          "hover:animate-flame-flicker"
        )} 
      />
      <span className="hidden sm:inline text-sm font-semibold">Trending</span>
      
      {/* Notification badge */}
      {hasNewTrends && (
        <span 
          className={cn(
            "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center",
            "bg-red-500 text-white text-[11px] font-bold rounded-full",
            "border-2 border-background"
          )}
          aria-label={`${newTrendCount} new trends`}
        >
          {newTrendCount > 9 ? '9+' : newTrendCount}
        </span>
      )}
    </button>
  );
}
