import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, X, ChevronUp, Share2, Trash2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/hooks/useCompare";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MiniFilamentCard } from "./MiniFilamentCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MobileCompareTrayProps {
  onSaveForLater?: () => void;
}

export function MobileCompareTray({ onSaveForLater }: MobileCompareTrayProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { items, count, removeItem, clearAll, reorderItems } = useCompare();
  const [user, setUser] = useState<any>(null);

  // Check auth status
  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  });

  if (count === 0) return null;

  const canCompare = count >= 2;

  const handleCompare = () => {
    if (!canCompare) {
      toast.info("Add at least 2 materials to compare");
      return;
    }
    const ids = items.map(i => i.id).join(',');
    navigate(`/compare?ids=${ids}`);
    setIsOpen(false);
  };

  const handleShare = async () => {
    if (!canCompare) {
      toast.info("Add at least 2 materials to share");
      return;
    }
    
    const ids = items.map(i => i.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Filament Comparison',
          text: `Compare ${count} filaments`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Failed to share");
    }
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAll();
      setShowClearConfirm(false);
      setIsOpen(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div 
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[70]",
          "bg-card/95 backdrop-blur-xl border-t border-primary/20",
          "safe-area-inset-bottom"
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full min-h-[56px] px-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <GitCompare className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{count} material{count !== 1 ? 's' : ''} selected</p>
              {!canCompare && (
                <p className="text-xs text-muted-foreground">Add {2 - count} more to compare</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              disabled={!canCompare}
              onClick={(e) => {
                e.stopPropagation();
                handleCompare();
              }}
              className="min-h-[44px] px-4"
            >
              Compare
            </Button>
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Full Tray Modal */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-2xl px-0"
        >
          <SheetHeader className="px-4 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary" />
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

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Items Grid */}
            <div className="grid grid-cols-1 gap-3">
              {items.map((item, index) => (
                <MiniFilamentCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  cardIndex={index}
                />
              ))}
            </div>

            {/* Empty state hint */}
            {count === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Add 1 more material to enable comparison
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="sticky bottom-0 px-4 py-4 bg-background border-t border-border space-y-3 safe-area-inset-bottom">
            {/* Quick Actions Row */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={!canCompare}
                className="flex-1 min-h-[44px] gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              
              {user && onSaveForLater && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveForLater}
                  disabled={!canCompare}
                  className="flex-1 min-h-[44px] gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save
                </Button>
              )}
              
              <Button
                variant={showClearConfirm ? "destructive" : "outline"}
                size="sm"
                onClick={handleClearAll}
                className="min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                {showClearConfirm && <span className="ml-2">Confirm?</span>}
              </Button>
            </div>

            {/* Compare Button */}
            <Button
              onClick={handleCompare}
              disabled={!canCompare}
              className="w-full min-h-[48px] text-base font-semibold"
            >
              Compare {count} Material{count !== 1 ? 's' : ''}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
