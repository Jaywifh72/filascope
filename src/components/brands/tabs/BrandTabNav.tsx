import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type BrandTab = "overview" | "products" | "about";

interface TabConfig {
  id: BrandTab;
  label: string;
  hash: string;
}

const BASE_TABS: TabConfig[] = [
  { id: "overview", label: "Overview", hash: "#overview" },
  { id: "products", label: "Products", hash: "#products" },
  { id: "about", label: "About", hash: "#about" },
];

interface BrandTabNavProps {
  activeTab: BrandTab;
  onTabChange: (tab: BrandTab) => void;
  productCount?: number;
}

export function BrandTabNav({ activeTab, onTabChange, productCount }: BrandTabNavProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Build tabs with product count
  const TABS = BASE_TABS.map((tab) => ({
    ...tab,
    label: tab.id === "products" && productCount !== undefined
      ? `Products (${productCount})`
      : tab.label,
  }));

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
    const hash = window.location.hash.replace("#", "") as BrandTab;
    if (BASE_TABS.find((t) => t.id === hash)) {
      onTabChange(hash);
    }
  }, [onTabChange]);

  const handleTabClick = (tab: TabConfig) => {
    onTabChange(tab.id as BrandTab);
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
      {/* Horizontal scroll container for mobile */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
        <nav
          className="flex gap-1 min-w-max py-3"
          role="tablist"
          aria-label="Brand details tabs"
        >
          {TABS.map((tab) => (
            <a
              key={tab.id}
              role="tab"
              href={tab.hash}
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(tab);
              }}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation",
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
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

interface BrandTabContentProps {
  activeTab: BrandTab;
  children: React.ReactNode;
}

export function BrandTabContent({ activeTab, children }: BrandTabContentProps) {
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
