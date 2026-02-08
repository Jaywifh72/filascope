import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type PrinterTab = "overview" | "specifications" | "materials" | "connectivity" | "pricing";

interface TabConfig {
  id: PrinterTab;
  label: string;
  hash: string;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", hash: "#overview" },
  { id: "specifications", label: "Specifications", hash: "#specifications" },
  { id: "materials", label: "Materials", hash: "#materials" },
  { id: "connectivity", label: "Connectivity", hash: "#connectivity" },
  { id: "pricing", label: "Pricing & Availability", hash: "#pricing" },
];

interface PrinterTabNavProps {
  activeTab: PrinterTab;
  onTabChange: (tab: PrinterTab) => void;
}

export function PrinterTabNav({ activeTab, onTabChange }: PrinterTabNavProps) {
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
    const hash = window.location.hash.replace("#", "") as PrinterTab;
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
        "sticky top-16 z-30 -mx-4 lg:-mx-8 px-4 lg:px-8 transition-all duration-200",
        isSticky && "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
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
          className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0"
        >
          <nav
            className="flex gap-1 min-w-max py-3"
            role="tablist"
            aria-label="Printer details tabs"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "relative px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation",
                  "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "active:scale-95 transition-transform",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {/* Active indicator - teal underline */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

interface PrinterTabContentProps {
  activeTab: PrinterTab;
  children: React.ReactNode;
}

export function PrinterTabContent({ activeTab, children }: PrinterTabContentProps) {
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

// Re-export tab content components from tabs folder
export { OverviewTabContent } from './tabs/OverviewTabContent';
export { SpecificationsTabContent } from './tabs/SpecificationsTabContent';
export { MaterialsTabContent } from './tabs/MaterialsTabContent';
export { ConnectivityTabContent } from './tabs/ConnectivityTabContent';
export { PricingTabContent } from './tabs/PricingTabContent';
