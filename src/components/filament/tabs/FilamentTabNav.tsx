import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type FilamentTab = "overview" | "specifications" | "compatibility" | "pricing" | "community";

interface TabConfig {
  id: FilamentTab;
  label: string;
  hash: string;
  badge?: "coming-soon" | "new";
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", hash: "#overview" },
  { id: "specifications", label: "Specifications", hash: "#specifications" },
  { id: "compatibility", label: "Compatibility", hash: "#compatibility" },
  { id: "pricing", label: "Pricing", hash: "#pricing" },
  { id: "community", label: "Community", hash: "#community", badge: "coming-soon" },
];

interface FilamentTabNavProps {
  activeTab: FilamentTab;
  onTabChange: (tab: FilamentTab) => void;
}

export function FilamentTabNav({ activeTab, onTabChange }: FilamentTabNavProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Handle scroll to detect sticky state
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const rect = tabsRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 64); // 64px = main nav height (top-16)
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync with URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as FilamentTab;
    if (TABS.find((t) => t.id === hash)) {
      onTabChange(hash);
    }
  }, [onTabChange]);

  const handleTabClick = (tab: TabConfig) => {
    onTabChange(tab.id);
    window.history.replaceState(null, "", tab.hash);
  };

  return (
    <div
      ref={tabsRef}
      className={cn(
        "sticky top-16 z-30 -mx-4 lg:-mx-0 px-4 lg:px-0 transition-all duration-200",
        isSticky && "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
      )}
    >
      {/* Horizontal scroll container for mobile with snap behavior */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory">
        <nav
          className="flex gap-1 min-w-max py-3 snap-start"
          role="tablist"
          aria-label="Filament details tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation snap-start",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "active:scale-95 transition-transform min-h-[44px]",
                "flex items-center gap-2",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.badge === "coming-soon" && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-4 font-normal border-amber-500/50 text-amber-500 bg-amber-500/10"
                >
                  Soon
                </Badge>
              )}
              {tab.badge === "new" && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-4 font-normal border-primary/50 text-primary bg-primary/10"
                >
                  New
                </Badge>
              )}
              {/* Active indicator - teal underline */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

interface FilamentTabContentProps {
  activeTab: FilamentTab;
  children: React.ReactNode;
}

export function FilamentTabContent({ activeTab, children }: FilamentTabContentProps) {
  return (
    <div
      id={`tabpanel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`tab-${activeTab}`}
      className="mt-6"
    >
      {children}
    </div>
  );
}
