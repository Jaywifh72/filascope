import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Printer, GitCompareArrows, Tag, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompare } from '@/hooks/useCompare';
import { useDealsCount } from '@/hooks/useDealsCount';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useState } from 'react';
import { MobileMoreSheet } from './MobileMoreSheet';

interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
}

export function MobileBottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items: compareItems } = useCompare();
  const compareCount = compareItems.length;
  const { data: dealsData } = useDealsCount();
  const hasDeals = dealsData && dealsData.totalVariants > 0;
  const scrollDirection = useScrollDirection();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const tabs: TabItem[] = [
    { key: 'browse', label: 'Browse', icon: Search, path: '/' },
    { key: 'printers', label: 'Printers', icon: Printer, path: '/printers' },
    { key: 'compare', label: 'Compare', icon: GitCompareArrows, path: '/compare' },
    { key: 'deals', label: 'Deals', icon: Tag, path: '/deals' },
    { key: 'more', label: 'More', icon: Menu, action: () => setMoreOpen(true) },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 md:hidden",
          "bg-background/95 backdrop-blur-xl border-t border-border/50",
          "transition-transform duration-200 ease-out",
          "motion-reduce:transition-none",
          scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = tab.path ? isActive(tab.path) : false;
            const Icon = tab.icon;
            const isCompare = tab.key === 'compare';
            const isDeals = tab.key === 'deals';

            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.action) {
                    tab.action();
                  } else if (tab.path) {
                    navigate(tab.path);
                  }
                }}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5",
                  "active:scale-95 transition-transform duration-75",
                  "motion-reduce:transform-none",
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active dot */}
                <div className={cn(
                  "w-1 h-1 rounded-full mb-0.5 transition-all duration-200",
                  active ? 'bg-primary' : 'bg-transparent'
                )} />

                {/* Icon with optional badge */}
                <div className="relative">
                  <div className={cn(
                    isCompare && compareCount > 0 && "ring-1 ring-primary/30 rounded-full p-1.5",
                    !(isCompare && compareCount > 0) && "p-0"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Compare badge */}
                  {isCompare && compareCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                      {compareCount}
                    </span>
                  )}

                  {/* Deals dot */}
                  {isDeals && hasDeals && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>

                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <MobileMoreSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
