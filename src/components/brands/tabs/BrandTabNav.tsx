import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type BrandTab = "overview" | "products" | "about";

interface TabConfig {
  id: BrandTab;
  label: string;
  count?: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Sliding underline position
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const TABS = BASE_TABS.map((tab) => ({
    ...tab,
    count: tab.id === "products" ? productCount : undefined,
  }));

  // Measure active tab for underline
  const updateUnderline = useCallback(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - navRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updateUnderline();
  }, [updateUnderline]);

  // Also update on resize
  useEffect(() => {
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [updateUnderline]);

  // Detect sticky state
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 64);
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
      ref={containerRef}
      className={cn(
        "sticky top-16 z-30 -mx-4 lg:-mx-0 px-4 lg:px-0 transition-all duration-200",
        isSticky
          ? "bg-gray-950/95 backdrop-blur-sm border-b border-gray-700/50 shadow-sm"
          : "border-b border-transparent"
      )}
    >
      {/* Horizontal scroll container for mobile */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory">
        <nav
          ref={navRef}
          className="relative flex gap-1 min-w-max py-2"
          role="tablist"
          aria-label="Brand details tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                id={`tab-${tab.id}`}
                data-tab-id={tab.id}
                role="tab"
                href={tab.hash}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabClick(tab);
                }}
                className={cn(
                  "relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors touch-manipulation snap-start",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "text-cyan-400 font-medium"
                    : "text-gray-400 hover:text-gray-200"
                )}
              >
                {tab.count !== undefined ? (
                  <>
                    {tab.label.replace(/ \(\d+\)$/, '')}{' '}
                    <span className="bg-gray-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                      {tab.count}
                    </span>
                  </>
                ) : (
                  tab.label
                )}
              </a>
            );
          })}

          {/* Animated sliding underline */}
          <span
            className="absolute bottom-0 h-0.5 bg-cyan-400 rounded-full transition-all duration-300 ease-out"
            style={{ left: underlineStyle.left, width: underlineStyle.width }}
          />
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
