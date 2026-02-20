import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
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
  Handshake,
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
      { title: 'Dashboard', href: '/old-admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { title: 'Filaments', href: '/old-admin/filaments', icon: Beaker },
      { title: 'Printers', href: '/old-admin/printers', icon: Printer },
      { title: 'Brands', href: '/old-admin/brands', icon: Store },
      { title: 'Brand Pipeline', href: '/old-admin/brand-pipeline', icon: FlaskConical },
      { title: 'Deals', href: '/old-admin/featured-content', icon: Star },
      { title: 'Inventory', href: '/old-admin/inventory', icon: Package },
    ],
  },
  {
    label: 'Regional',
    items: [
      { title: 'Regional Stores', href: '/old-admin/regional-stores', icon: Globe },
      { title: 'Store URLs', href: '/old-admin/store-urls', icon: Link2 },
      { title: 'Exchange Rates', href: '/old-admin/exchange-rates', icon: DollarSign },
    ],
  },
  {
    label: 'Data Quality',
    items: [
      { title: 'Data Health', href: '/old-admin/data-health', icon: Database },
      { title: 'Data Quality', href: '/old-admin/data-quality', icon: FileSearch },
      { title: 'Quality Dashboard', href: '/old-admin/data-quality-dashboard', icon: ShieldCheck },
      { title: 'Price Extraction', href: '/old-admin/brand-extraction', icon: Wrench },
      { title: 'Price Verification', href: '/old-admin/price-verification', icon: DollarSign },
      { title: 'Pricing Data', href: '/admin/pricing-data', icon: DollarSign },
      { title: 'Field Coverage', href: '/old-admin/field-coverage', icon: BarChart3 },
      { title: 'Broken Links', href: '/old-admin/broken-links', icon: Link2 },
      { title: 'Duplicates', href: '/old-admin/duplicates', icon: Copy },
      { title: 'Price Anomalies', href: '/old-admin/price-anomalies', icon: TrendingDown },
      { title: 'Product 404s', href: '/old-admin/broken-urls', icon: Link2Off },
      { title: 'Filament Audit', href: '/old-admin/filament-audit', icon: FileText },
    ],
  },
  {
    label: 'Audit Tools',
    items: [
      { title: 'Region Testing', href: '/old-admin/region-test', icon: Globe },
      { title: 'Regional Expansion', href: '/old-admin/regional-expansion', icon: MapPin },
      { title: 'Price Freshness', href: '/old-admin/price-freshness', icon: Clock },
    ],
  },
  {
    label: 'Regional Pricing',
    items: [
      { title: 'Price Import', href: '/old-admin/price-import', icon: Package },
      { title: 'Store Registry', href: '/old-admin/stores', icon: Store },
      { title: 'Exchange Rates', href: '/old-admin/exchange-rates', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Sync Monitor', href: '/old-admin/sync-monitor', icon: BarChart3 },
      { title: 'Import', href: '/old-admin/import', icon: Package },
      { title: 'Enrichment', href: '/old-admin/enrichment', icon: Sparkles },
      { title: 'Filament Scraper', href: '/old-admin/filament-scraper', icon: Wrench },
      { title: 'Amazon Links', href: '/old-admin/amazon-links', icon: Link2 },
      { title: 'Scheduler', href: '/old-admin/scheduler', icon: Calendar },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Analytics Dashboard', href: '/admin/analytics', icon: BarChart3 },
      { title: 'Module Analytics', href: '/old-admin/module-analytics', icon: BarChart3 },
      { title: 'A/B Tests', href: '/old-admin/ab-tests', icon: FlaskConical },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Users', href: '/old-admin/users', icon: Users },
      { title: 'Affiliates', href: '/old-admin/affiliates', icon: DollarSign },
      { title: 'Affiliate Hub', href: '/admin/affiliate-hub', icon: Handshake },
      { title: 'Link Health', href: '/admin/link-health', icon: Link2Off },
      { title: 'Maintenance', href: '/old-admin/maintenance', icon: AlertTriangle },
      { title: 'Site Settings', href: '/old-admin/site-settings', icon: Settings },
      { title: 'Docs', href: '/old-admin/docs', icon: BookOpen },
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
          <Link to="/old-admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">OldAdmin</span>
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
