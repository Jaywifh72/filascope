import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Handshake,
  DollarSign,
  BarChart3,
  Search,
  Link2Off,
  Printer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  ExternalLink,
  FileText,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Affiliate Hub', href: '/admin/affiliate-hub', icon: Handshake },
      { title: 'Affiliates', href: '/admin/affiliates', icon: DollarSign },
      { title: 'Pricing Data', href: '/admin/pricing-data', icon: DollarSign },
      { title: 'TD Management', href: '/admin/td-management', icon: Sun },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Analytics Dashboard', href: '/admin/analytics', icon: BarChart3 },
      { title: 'Search Analytics', href: '/admin/search-analytics', icon: Search },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Link Health', href: '/admin/link-health', icon: Link2Off },
      { title: 'Printer URL Health', href: '/admin/printer-url-health', icon: Printer },
      { title: 'Price Sync', href: '/admin/price-sync', icon: DollarSign },
      { title: 'Price Audit', href: '/admin/price-audit', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'OldAdmin Dashboard', href: '/old-admin/dashboard', icon: ExternalLink, external: true },
    ],
  },
];

const ALL_GROUP_LABELS = NAV_GROUPS.map((g) => g.label);
const STORAGE_KEY = 'admin-sidebar-config';

interface SidebarConfig {
  visibleGroups: string[];
  viewMode: 'focused' | 'all';
}

const DEFAULT_CONFIG: SidebarConfig = {
  visibleGroups: [...ALL_GROUP_LABELS],
  viewMode: 'all',
};

function loadConfig(): SidebarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: SidebarConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface AdminNewSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminNewSidebar({ collapsed, onToggle }: AdminNewSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [config, setConfig] = useState<SidebarConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const toggleViewMode = () =>
    setConfig((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'focused' ? 'all' : 'focused',
    }));

  const toggleGroup = (label: string) =>
    setConfig((prev) => {
      const has = prev.visibleGroups.includes(label);
      return {
        ...prev,
        visibleGroups: has
          ? prev.visibleGroups.filter((g) => g !== label)
          : [...prev.visibleGroups, label],
      };
    });

  const resetGroups = () =>
    setConfig((prev) => ({ ...prev, visibleGroups: [...ALL_GROUP_LABELS] }));

  const isGroupVisible = (label: string) =>
    config.viewMode === 'all' || config.visibleGroups.includes(label);

  const isGroupDefault = (label: string) =>
    config.visibleGroups.includes(label);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border shrink-0">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* View mode toggle */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-border shrink-0">
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {config.viewMode === 'focused' ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>{config.viewMode === 'focused' ? 'Focused View' : 'All Sections'}</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-4">
          {NAV_GROUPS.filter((group) => isGroupVisible(group.label)).map((group) => {
            const isDimmed =
              config.viewMode === 'all' && !isGroupDefault(group.label);

            return (
              <div
                key={group.label}
                className={cn(isDimmed && 'opacity-50')}
              >
                {!collapsed && (
                  <p className="px-3 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? currentPath === '/admin'
                        : currentPath.startsWith(item.href);
                    const Icon = item.icon;

                    const linkContent = (
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer: settings + back */}
      <div className="shrink-0 border-t border-border bg-card p-2 space-y-1">
        {/* Settings popover */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <button className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-56">
                <SidebarSettings
                  config={config}
                  onToggleGroup={toggleGroup}
                  onReset={resetGroups}
                />
              </PopoverContent>
            </Popover>
            <TooltipContent side="right">Sidebar Settings</TooltipContent>
          </Tooltip>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                <Settings className="w-4 h-4" />
                <span>Sidebar Settings</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-56">
              <SidebarSettings
                config={config}
                onToggleGroup={toggleGroup}
                onReset={resetGroups}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Back to site */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Back to Site</TooltipContent>
          </Tooltip>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Site</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

/* ---- Settings popover content ---- */

function SidebarSettings({
  config,
  onToggleGroup,
  onReset,
}: {
  config: SidebarConfig;
  onToggleGroup: (label: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Default Sections</p>
      <p className="text-xs text-muted-foreground">
        Choose which sections show in Focused view.
      </p>
      <div className="space-y-2">
        {ALL_GROUP_LABELS.map((label) => (
          <label
            key={label}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              checked={config.visibleGroups.includes(label)}
              onCheckedChange={() => onToggleGroup(label)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={onReset}
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Reset to all
      </Button>
    </div>
  );
}
