import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "filascope_quickmatch_mobile_dismissed";

export function MobileQuickMatchPrompt() {
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return;

    setDismissed(false);

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.5) {
        setVisible(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setDismissed(true);
    }, 300);
  };

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-3 flex items-center justify-between gap-3 transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <span className="text-sm text-foreground">
        Need help? Try Quick Match →
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link to="/wizard">Quick Match</Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
