import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingDealAlertCTAProps {
  onClickAlerts: () => void;
}

export function FloatingDealAlertCTA({ onClickAlerts }: FloatingDealAlertCTAProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("filascope_deal_alert_float_dismissed") === "true"
  );

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
      // Show after scrolling 600px (roughly 3 cards), hide near top
      const scrollY = window.scrollY;
      setVisible(scrollY > 600);
    };

    // Debounced scroll listener
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem("filascope_deal_alert_float_dismissed", "true");
  };

  if (dismissed || !visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-40 flex items-center gap-2 motion-safe:animate-fade-in"
      )}
    >
      <button
        onClick={onClickAlerts}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 transition-colors"
      >
        <Bell className="h-4 w-4" />
        Get deal alerts
      </button>
      <button
        onClick={handleDismiss}
        className="p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
