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
      <div className="overflow-x-auto scrollbar-hide">
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
                "relative px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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

// Placeholder components for each tab - to be replaced with actual content
export function OverviewTabContent() {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-muted/30 border border-border/50 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Overview</h3>
        <p className="text-muted-foreground">
          Overview content will be displayed here. This includes community ratings, advantages, and general information.
        </p>
      </div>
    </div>
  );
}

export function SpecificationsTabContent() {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-muted/30 border border-border/50 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Specifications</h3>
        <p className="text-muted-foreground">
          Detailed specifications will be displayed here. This includes build volume, print speed, temperatures, and technical details.
        </p>
      </div>
    </div>
  );
}

export function MaterialsTabContent() {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-muted/30 border border-border/50 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Materials</h3>
        <p className="text-muted-foreground">
          Material compatibility information will be displayed here. This includes supported filaments and material recommendations.
        </p>
      </div>
    </div>
  );
}

export function ConnectivityTabContent() {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-muted/30 border border-border/50 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Connectivity</h3>
        <p className="text-muted-foreground">
          Connectivity and software information will be displayed here. This includes firmware, software, and network features.
        </p>
      </div>
    </div>
  );
}

export function PricingTabContent() {
  return (
    <div className="space-y-6">
      <div className="p-8 bg-muted/30 border border-border/50 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Pricing & Availability</h3>
        <p className="text-muted-foreground">
          Pricing history, deals, and availability information will be displayed here.
        </p>
      </div>
    </div>
  );
}
