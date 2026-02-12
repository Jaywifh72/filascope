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
  { id: "community", label: "Community", hash: "#community" },
];

export interface TabCounts {
  pricing?: number;
  community?: number;
  compatibility?: number;
}

interface FilamentTabNavProps {
  activeTab: FilamentTab;
  onTabChange: (tab: FilamentTab) => void;
  counts?: TabCounts;
}

export function FilamentTabNav({ activeTab, onTabChange, counts }: FilamentTabNavProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

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

  // Detect horizontal scroll position for fade indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateFades = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftFade(scrollLeft > 4);
      setShowRightFade(scrollLeft + clientWidth < scrollWidth - 4);
    };

    updateFades();
    container.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);
    return () => {
      container.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
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
        isSticky
          ? "bg-[hsl(220,30%,5%)]/90 backdrop-blur-md border-b border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          : "bg-transparent"
      )}
    >
      {/* Horizontal scroll container for mobile with fade edges */}
      <div className="relative">
        {/* Left fade indicator */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none lg:hidden" />
        )}
        {/* Right fade indicator */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none lg:hidden" />
        )}

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory"
        >
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
                  "relative px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation snap-start",
                  "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "active:scale-95 transition-transform min-h-[44px]",
                  "flex items-center gap-2",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground transition-colors duration-150"
                )}
              >
                {tab.label}
                {/* Contextual count */}
                {counts && tab.id in counts && counts[tab.id as keyof TabCounts] != null && (
                  <span className="text-muted-foreground text-xs font-normal">
                    ({counts[tab.id as keyof TabCounts]})
                  </span>
                )}
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
                {/* Active indicator - cyan underline */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
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
      data-tab={activeTab}
      className="mt-6"
    >
      {children}
    </div>
  );
}
