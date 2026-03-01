import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveNudgeProps {
  filamentId: string;
  isAlreadySaved: boolean;
}

/**
 * Subtle non-intrusive nudge near the heart/wishlist button.
 * Shows after 10s on page if user hasn't favorited.
 * Only once per product page visit, suppressed if any save happened this session.
 */
export function SaveNudge({ filamentId, isAlreadySaved }: SaveNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already saved, already dismissed, or user has saved anything this session
    if (isAlreadySaved || dismissed) return;
    if (sessionStorage.getItem("hasWishlistSave") === "true") return;
    if (sessionStorage.getItem(`nudge_shown_${filamentId}`)) return;

    const timer = setTimeout(() => {
      // Re-check conditions at show time
      if (sessionStorage.getItem("hasWishlistSave") === "true") return;
      setVisible(true);
      sessionStorage.setItem(`nudge_shown_${filamentId}`, "true");

      // Auto-dismiss after 5s
      const dismissTimer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(dismissTimer);
    }, 10000);

    return () => clearTimeout(timer);
  }, [filamentId, isAlreadySaved, dismissed]);

  // Hide on any interaction
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => {
      setVisible(false);
      setDismissed(true);
    };
    window.addEventListener("click", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    return () => {
      window.removeEventListener("click", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [visible]);

  if (!visible || isAlreadySaved) return null;

  return (
    <div
      className={cn(
        "absolute -top-12 right-0 z-20",
        "bg-card border border-border rounded-lg shadow-lg p-2",
        "text-xs text-muted-foreground",
        "flex items-center gap-1.5",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        "motion-reduce:animate-none"
      )}
      role="tooltip"
    >
      <Heart className="w-3 h-3 text-rose-400" />
      <span>Save this for later?</span>
    </div>
  );
}
