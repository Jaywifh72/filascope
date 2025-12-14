import { Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptySlotProps {
  isAddMore?: boolean;
  isFull?: boolean;
  onClick?: () => void;
}

export function EmptySlot({ isAddMore = false, isFull = false, onClick }: EmptySlotProps) {
  if (isFull) {
    return (
      <div className="w-[200px] h-[110px] flex-shrink-0 rounded-lg border-2 border-dashed border-muted/30 flex flex-col items-center justify-center gap-1 opacity-50">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Tray Full</span>
      </div>
    );
  }

  if (isAddMore) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-[200px] h-[110px] flex-shrink-0 rounded-lg border-2 border-dashed border-primary/30",
          "flex flex-col items-center justify-center gap-1.5",
          "transition-all duration-200 hover:border-primary/60 hover:bg-primary/5",
          "focus:outline-none focus:ring-2 focus:ring-primary/40"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">Add material</span>
      </button>
    );
  }

  return (
    <div className="w-[200px] h-[110px] flex-shrink-0 rounded-lg border-2 border-dashed border-muted/20 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-muted/30" />
    </div>
  );
}
