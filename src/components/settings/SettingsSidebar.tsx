import { cn } from "@/lib/utils";
import {
  User,
  Printer,
  SlidersHorizontal,
  Shield,
  UserCog,
  Bell,
} from "lucide-react";

export type SettingsSection =
  | "profile"
  | "printing"
  | "preferences"
  | "privacy"
  | "account"
  | "notifications";

interface NavItem {
  id: SettingsSection;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "printing", icon: Printer, label: "Printing Setup" },
  { id: "preferences", icon: SlidersHorizontal, label: "Preferences" },
  { id: "privacy", icon: Shield, label: "Privacy" },
  { id: "account", icon: UserCog, label: "Account" },
  { id: "notifications", icon: Bell, label: "Notifications" },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <aside className="shrink-0 w-full lg:w-56">
      <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible p-1 lg:p-0">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 text-primary",
                !isActive && "text-muted-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
