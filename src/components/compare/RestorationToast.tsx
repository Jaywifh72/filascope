import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RestorationToastProps {
  itemCount: number;
  savedDate: Date;
  onDismiss: () => void;
  onStartFresh: () => void;
}

export function RestorationToast({ 
  itemCount, 
  savedDate, 
  onDismiss, 
  onStartFresh 
}: RestorationToastProps) {
  const formattedDate = savedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });

  return (
    <div className={cn(
      "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
      "bg-card/95 backdrop-blur-md border border-primary/30 rounded-lg",
      "shadow-lg px-4 py-3 flex items-center gap-4",
      "animate-fade-in"
    )}>
      <div className="flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '2s' }} />
        <span className="text-sm">
          Restored {itemCount} item{itemCount > 1 ? 's' : ''} from {formattedDate}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartFresh}
          className="h-7 text-xs"
        >
          Start Fresh
        </Button>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
