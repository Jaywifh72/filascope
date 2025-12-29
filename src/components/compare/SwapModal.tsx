import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompareItem } from "@/hooks/useCompare";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";

interface SwapModalProps {
  isOpen: boolean;
  newItem: CompareItem;
  existingItems: CompareItem[];
  onSwap: (replaceId: string) => void;
  onCancel: () => void;
}

export function SwapModal({ isOpen, newItem, existingItems, onSwap, onCancel }: SwapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-card border border-primary/30 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 swap-modal-enter">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <h3 className="text-lg font-semibold mb-4">Compare tray is full</h3>
        
        {/* New item preview */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Adding:</p>
          <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
              style={{ 
                backgroundColor: newItem.color_hex 
                  ? newItem.color_hex.startsWith('#') ? newItem.color_hex : `#${newItem.color_hex}`
                  : 'hsl(var(--muted))' 
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{cleanFilamentDisplayName(newItem.product_title)}</p>
              <p className="text-xs text-muted-foreground">{newItem.vendor} • {newItem.material}</p>
            </div>
          </div>
        </div>

        {/* Replace instruction */}
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Click one to replace:</p>
        </div>

        {/* Existing items grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {existingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSwap(item.id)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border border-border",
                "hover:border-destructive hover:bg-destructive/10 transition-all duration-200",
                "group cursor-pointer text-left"
              )}
            >
              <div 
                className="w-8 h-8 rounded border border-border flex-shrink-0 group-hover:opacity-50 transition-opacity"
                style={{ 
                  backgroundColor: item.color_hex 
                    ? item.color_hex.startsWith('#') ? item.color_hex : `#${item.color_hex}`
                    : 'hsl(var(--muted))' 
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-destructive transition-colors">
                  {cleanFilamentDisplayName(item.product_title)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{item.vendor}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}
