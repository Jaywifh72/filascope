import { useState, useEffect, useRef } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BrandTab } from '@/components/brands/tabs/BrandTabNav';

interface BrandQuickNavProps {
  brandName: string;
  brandLogo: string | null;
  isVerified?: boolean;
  website?: string;
  activeTab: BrandTab;
  onTabChange: (tab: BrandTab) => void;
  /** Ref to the hero element — nav shows when hero scrolls out of view */
  heroRef: React.RefObject<HTMLDivElement>;
  onVisitWebsite?: () => void;
}

const TABS: { id: BrandTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
];

export function BrandQuickNav({
  brandName,
  brandLogo,
  isVerified,
  website,
  activeTab,
  onTabChange,
  heroRef,
  onVisitWebsite,
}: BrandQuickNavProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px' }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <nav
      aria-label="Brand quick navigation"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-md border-b border-border/50',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Left: logo + name */}
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo src={brandLogo} brandName={brandName} size="sm" className="rounded" />
          <span className="text-sm font-semibold text-foreground truncate">{brandName}</span>
          {isVerified && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Center: tab links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                window.history.replaceState(null, '', `#${tab.id}`);
              }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                activeTab === tab.id
                  ? 'text-primary font-medium bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: CTA */}
        {website && (
          <Button
            size="sm"
            variant="default"
            className="flex-shrink-0 group"
            onClick={onVisitWebsite}
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            <span className="hidden sm:inline">Visit Website</span>
            <ExternalLink className="w-3 h-3 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </nav>
  );
}
