import { useState, useEffect } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PriceConfidence } from "@/hooks/usePriceFreshness";

const STORAGE_KEY = "filascope_skip_price_verification";

interface PriceVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeUrl: string;
  lastVerifiedAt: Date | string | null;
  priceConfidence: PriceConfidence;
  onContinue: () => void;
}

/**
 * Shows a verification prompt when users click buy for products with stale pricing.
 * Allows users to opt-out of future warnings via localStorage.
 */
export function PriceVerificationDialog({
  open,
  onOpenChange,
  storeName,
  storeUrl,
  lastVerifiedAt,
  priceConfidence,
  onContinue,
}: PriceVerificationDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onOpenChange(false);
    onContinue();
  };

  const timeAgoText = lastVerifiedAt
    ? formatDistanceToNow(
        typeof lastVerifiedAt === "string" ? new Date(lastVerifiedAt) : lastVerifiedAt,
        { addSuffix: false }
      )
    : "an unknown time";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Verify Price at Store
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-muted-foreground">
            Our price data for this product is from{" "}
            <strong className="text-foreground">{timeAgoText}</strong> ago.
          </p>
          <p className="text-muted-foreground">
            The current price at <strong className="text-foreground">{storeName}</strong> may be
            different. You're being redirected to the store to see the latest pricing.
          </p>

          {priceConfidence === "stale" && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-400">
                ⚠️ This price data is over 30 days old and is likely outdated.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 pb-2">
          <Checkbox
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label
            htmlFor="dont-show-again"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don't show this again
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} className="gap-2">
            Continue to {storeName}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage price verification dialog state.
 * Handles checking localStorage preference and determining when to show.
 */
export function usePriceVerification() {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    storeName: string;
    storeUrl: string;
    lastVerifiedAt: Date | string | null;
    priceConfidence: PriceConfidence;
  } | null>(null);

  const shouldSkipVerification = (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  };

  const resetPreference = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Call this when user clicks a buy/check price button.
   * Returns true if navigation should proceed immediately (high confidence or user opted out).
   * Returns false if dialog should be shown first.
   */
  const handleBuyClick = (params: {
    storeName: string;
    storeUrl: string;
    lastVerifiedAt: Date | string | null;
    priceConfidence: PriceConfidence;
  }): boolean => {
    const { priceConfidence } = params;

    // High/medium confidence or user opted out - proceed immediately
    if (
      priceConfidence === "high" ||
      priceConfidence === "medium" ||
      shouldSkipVerification()
    ) {
      return true;
    }

    // Low/stale/unknown confidence - show dialog
    setPendingNavigation(params);
    setShowDialog(true);
    return false;
  };

  const handleContinue = () => {
    if (pendingNavigation?.storeUrl) {
      window.open(pendingNavigation.storeUrl, "_blank", "noopener,noreferrer");
    }
    setPendingNavigation(null);
  };

  const handleClose = () => {
    setShowDialog(false);
    setPendingNavigation(null);
  };

  return {
    showDialog,
    setShowDialog: handleClose,
    pendingNavigation,
    handleBuyClick,
    handleContinue,
    resetPreference,
  };
}
