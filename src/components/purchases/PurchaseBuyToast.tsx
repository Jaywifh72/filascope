import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseCheck } from "@/hooks/useUserPurchases";
import { MarkPurchasedDialog } from "./MarkPurchasedDialog";
import { cn } from "@/lib/utils";

interface PurchaseBuyToastProps {
  productId: string;
  productType: "filament" | "printer";
  productName: string;
  currentPrice?: number | null;
  storeName?: string;
  /** Set to true when user clicks a buy link */
  triggered: boolean;
  onDismiss: () => void;
}

export function PurchaseBuyToast({
  productId,
  productType,
  productName,
  currentPrice,
  storeName,
  triggered,
  onDismiss,
}: PurchaseBuyToastProps) {
  const { user } = useAuth();
  const { data: existingPurchase } = usePurchaseCheck(productId, productType);
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (!triggered || !user || existingPurchase) return;

    // Show after 5 seconds
    const showTimer = setTimeout(() => setVisible(true), 5000);

    // Auto-hide after 15 seconds total (10s visible)
    const hideTimer = setTimeout(dismiss, 15000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [triggered, user, existingPurchase, dismiss]);

  if (!visible || !user) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "bg-card border border-border/60 rounded-xl shadow-xl",
          "px-4 py-3 flex items-center gap-3",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
          "max-w-md w-[calc(100%-2rem)]"
        )}
      >
        <ShoppingBag className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm text-foreground">Did you buy this?</span>
        <Button
          size="sm"
          variant="default"
          className="shrink-0"
          onClick={() => {
            setDialogOpen(true);
            setVisible(false);
          }}
        >
          Mark as Purchased
        </Button>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <MarkPurchasedDialog
        productId={productId}
        productType={productType}
        productName={productName}
        currentPrice={currentPrice}
        storeName={storeName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
