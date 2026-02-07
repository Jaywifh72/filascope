import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { Button } from "@/components/ui/button";
import { MiniFilamentCard } from "@/components/compare/MiniFilamentCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Minimal floating pill shown on non-filament pages when items are in compare.
 * Clicking expands a sheet with the full tray contents.
 */
export function CompareTrayPill() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { items, count, removeItem, clearAll } = useCompare();

  if (count === 0) return null;

  const canCompare = count >= 2;

  const handleCompare = () => {
    const ids = items.map((i) => i.id).join(",");
    navigate(`/compare?ids=${ids}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Pill */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-[60]",
          "flex items-center gap-2 px-4 py-2.5 rounded-full",
          "bg-card/95 backdrop-blur-md",
          "border border-primary/30 shadow-lg shadow-black/20",
          "hover:border-primary/50 hover:shadow-primary/10",
          "transition-all duration-200",
          "lg:bottom-6 lg:right-6"
        )}
        aria-label={`${count} filaments in compare tray`}
      >
        <GitCompare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {count} filament{count !== 1 ? "s" : ""} in compare
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Expanded Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[60vh] rounded-t-2xl px-0"
        >
          <SheetHeader className="px-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-base">
                <GitCompare className="w-4 h-4 text-primary" />
                Compare Tray
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {count}
                </span>
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item, index) => (
                <MiniFilamentCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  cardIndex={index}
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center gap-2 safe-area-inset-bottom"
               style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearAll();
                setIsOpen(false);
              }}
              className="min-h-[44px]"
            >
              Clear All
            </Button>
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className="flex-1 min-h-[44px] font-semibold"
            >
              Compare {count} Material{count !== 1 ? "s" : ""}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
