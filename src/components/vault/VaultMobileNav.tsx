import { useRef, useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Heart,
  ShoppingBag,
  FolderOpen,
  Star,
  FileText,
  Bell,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VaultTab } from "./VaultSidebar";

interface MobileNavItem {
  id: VaultTab;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortLabel: string;
}

const mobileNavItems: MobileNavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home", shortLabel: "Home" },
  { id: "wishlist", icon: Heart, label: "Wishlist", shortLabel: "Wish" },
  { id: "purchased", icon: ShoppingBag, label: "Purchased", shortLabel: "Bought" },
  { id: "projects", icon: FolderOpen, label: "Projects", shortLabel: "Projects" },
  { id: "reviews", icon: Star, label: "Reviews", shortLabel: "Reviews" },
  { id: "notes", icon: FileText, label: "Notes", shortLabel: "Notes" },
  { id: "alerts", icon: Bell, label: "Alerts", shortLabel: "Alerts" },
  { id: "history", icon: History, label: "History", shortLabel: "History" },
];

interface VaultMobileNavProps {
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
}

export function VaultMobileNav({ activeTab, onTabChange }: VaultMobileNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftFade(scrollLeft > 4);
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFades);
      ro.disconnect();
    };
  }, [updateFades]);

  // Scroll active tab into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector("[data-active='true']") as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <div className="relative">
      {/* Left fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide -mx-1 px-1"
      >
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              data-active={isActive}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {/* Short labels below 640px, full labels otherwise */}
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
    </div>
  );
}
