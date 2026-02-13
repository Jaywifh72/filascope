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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "shrink-0 border-r border-border/40 bg-card/30 rounded-xl transition-all duration-200",
          collapsed ? "w-14" : "w-52"
        )}
      >
        <nav className="flex flex-col gap-1 p-2">
          {/* Collapse toggle */}
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="mb-1 flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-150"
                >
                  {collapsed ? (
                    <PanelLeft className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {collapsed ? "Expand sidebar" : "Collapse sidebar"}
              </TooltipContent>
            </Tooltip>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const count = item.countKey ? counts[item.countKey] : undefined;
            const hasCount = count !== undefined && count > 0;

            const button = (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as VaultTab)}
                className={cn(
                  "group flex items-center gap-3 py-2 px-3 text-sm transition-all duration-150 cursor-pointer relative rounded-lg",
                  isActive
                    ? "bg-primary/10 border-l-2 border-primary text-primary font-medium rounded-l-none"
                    : "text-muted-foreground @media(hover:hover):hover:text-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors duration-150",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/70 group-hover:text-primary"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {count !== undefined && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center transition-colors duration-150",
                          isActive
                            ? "bg-primary/20 text-primary"
                            : hasCount
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground/50"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </>
                )}
                {collapsed && hasCount && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                    {hasCount && ` (${count})`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}

          {/* Settings link — separated by divider */}
          <div className="mt-2 pt-2 border-t border-border/10">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/settings"
                    className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 shrink-0 text-muted-foreground/70 group-hover:text-primary transition-colors duration-150" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  Settings
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/settings"
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 cursor-pointer"
              >
                <Settings className="w-4 h-4 shrink-0 text-muted-foreground/70 group-hover:text-primary transition-colors duration-150" />
                <span className="flex-1 text-left">Settings</span>
              </Link>
            )}
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
