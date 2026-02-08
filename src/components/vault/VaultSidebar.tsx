import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Heart,
  ShoppingBag,
  FolderOpen,
  Star,
  FileText,
  Bell,
  History,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { VaultCounts } from "@/hooks/useVaultProfile";

export type VaultTab =
  | "dashboard"
  | "wishlist"
  | "purchased"
  | "projects"
  | "reviews"
  | "notes"
  | "alerts"
  | "history";

interface NavItem {
  id: VaultTab | "settings";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  countKey?: keyof VaultCounts;
}

const navItems: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "wishlist", icon: Heart, label: "Wishlist", countKey: "wishlist" },
  { id: "purchased", icon: ShoppingBag, label: "Purchased", countKey: "purchased" },
  { id: "projects", icon: FolderOpen, label: "Projects", countKey: "projects" },
  { id: "reviews", icon: Star, label: "My Reviews", countKey: "reviews" },
  { id: "notes", icon: FileText, label: "Private Notes", countKey: "notes" },
  { id: "alerts", icon: Bell, label: "Price Alerts", countKey: "alerts" },
  { id: "history", icon: History, label: "History", countKey: "history" },
];

interface VaultSidebarProps {
  activeTab: VaultTab;
  counts: VaultCounts;
  onTabChange: (tab: VaultTab) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function VaultSidebar({
  activeTab,
  counts,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
}: VaultSidebarProps) {
  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border/40 bg-card/30 rounded-xl transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      <nav className="flex flex-col gap-1 p-2">
        {/* Collapse toggle (tablet only) */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="mb-1 justify-center"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const count = item.countKey ? counts[item.countKey] : undefined;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as VaultTab)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary border-l-2 border-primary",
                !isActive && "text-muted-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
              {collapsed && count !== undefined && count > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}

        {/* Settings link */}
        <div className="mt-2 pt-2 border-t border-border/30">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              "hover:bg-muted/50 text-muted-foreground"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Settings</span>}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
