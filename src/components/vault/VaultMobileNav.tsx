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
}

const mobileNavItems: MobileNavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "wishlist", icon: Heart, label: "Wishlist" },
  { id: "purchased", icon: ShoppingBag, label: "Purchased" },
  { id: "projects", icon: FolderOpen, label: "Projects" },
  { id: "reviews", icon: Star, label: "Reviews" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "alerts", icon: Bell, label: "Alerts" },
  { id: "history", icon: History, label: "History" },
];

interface VaultMobileNavProps {
  activeTab: VaultTab;
  onTabChange: (tab: VaultTab) => void;
}

export function VaultMobileNav({ activeTab, onTabChange }: VaultMobileNavProps) {
  return (
    <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-hide -mx-1 px-1">
      {mobileNavItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
