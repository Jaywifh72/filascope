import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Printer,
  Store,
  Globe,
  DollarSign,
  Link2,
  AlertTriangle,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Beaker,
  Database,
  Wrench,
  Star,
  FlaskConical,
  Copy,
  TrendingDown,
  FileSearch,
  Sparkles,
  BookOpen,
  Link2Off,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Filaments', href: '/admin/filaments', icon: Beaker },
      { title: 'Printers', href: '/admin/printers', icon: Printer },
      { title: 'Brands', href: '/admin/brands', icon: Store },
      { title: 'Brand Pipeline', href: '/admin/brand-pipeline', icon: FlaskConical },
      { title: 'Deals', href: '/admin/featured-content', icon: Star },
      { title: 'Inventory', href: '/admin/inventory', icon: Package },
    ],
  },
  {
    label: 'Regional',
    items: [
      { title: 'Regional Stores', href: '/admin/regional-stores', icon: Globe },
      { title: 'Store URLs', href: '/admin/store-urls', icon: Link2 },
      { title: 'Exchange Rates', href: '/admin/exchange-rates', icon: DollarSign },
    ],
  },
  {
    label: 'Data Quality',
    items: [
      { title: 'Data Health', href: '/admin/data-health', icon: Database },
      { title: 'Data Quality', href: '/admin/data-quality', icon: FileSearch },
      { title: 'Price Extraction', href: '/admin/brand-extraction', icon: Wrench },
      { title: 'Price Verification', href: '/admin/price-verification', icon: DollarSign },
      { title: 'Field Coverage', href: '/admin/field-coverage', icon: BarChart3 },
      { title: 'Broken Links', href: '/admin/broken-links', icon: Link2 },
      { title: 'Duplicates', href: '/admin/duplicates', icon: Copy },
      { title: 'Price Anomalies', href: '/admin/price-anomalies', icon: TrendingDown },
      { title: 'Product 404s', href: '/admin/broken-urls', icon: Link2Off },
      { title: 'Filament Audit', href: '/admin/filament-audit', icon: FileText },
    ],
  },
  {
    label: 'Audit Tools',
    items: [
      { title: 'Region Testing', href: '/admin/region-test', icon: Globe },
      { title: 'Regional Expansion', href: '/admin/regional-expansion', icon: MapPin },
      { title: 'Price Freshness', href: '/admin/price-freshness', icon: Clock },
    ],
  },
  {
    label: 'Regional Pricing',
    items: [
      { title: 'Price Import', href: '/admin/price-import', icon: Package },
      { title: 'Store Registry', href: '/admin/stores', icon: Store },
      { title: 'Exchange Rates', href: '/admin/exchange-rates', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Import', href: '/admin/import', icon: Package },
      { title: 'Enrichment', href: '/admin/enrichment', icon: Sparkles },
      { title: 'Filament Scraper', href: '/admin/filament-scraper', icon: Wrench },
      { title: 'Amazon Links', href: '/admin/amazon-links', icon: Link2 },
      { title: 'Scheduler', href: '/admin/scheduler', icon: Calendar },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Module Analytics', href: '/admin/module-analytics', icon: BarChart3 },
      { title: 'A/B Tests', href: '/admin/ab-tests', icon: FlaskConical },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Affiliates', href: '/admin/affiliates', icon: DollarSign },
      { title: 'Maintenance', href: '/admin/maintenance', icon: AlertTriangle },
      { title: 'Site Settings', href: '/admin/site-settings', icon: Settings },
      { title: 'Docs', href: '/admin/docs', icon: BookOpen },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-border">
        {!collapsed && (
          <Link to="/admin/dashboard" className="flex items-center gap-2">
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
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <nav className="p-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href;
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
          ))}
        </nav>
      </ScrollArea>

      {/* Back to Site Link */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-border bg-card">
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
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Site</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
