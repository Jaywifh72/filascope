import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeColorHex } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickSummaryBarProps {
  colorHex: string | null | undefined;
  productName: string;
  material: string | null | undefined;
  formattedPrice: string | null;
  buyUrl: string | null | undefined;
  storeName: string | null | undefined;
  /** Ref to the hero section element to observe */
  heroRef: React.RefObject<HTMLDivElement>;
}

export function QuickSummaryBar({
  colorHex,
  productName,
  material,
  formattedPrice,
  buyUrl,
  storeName,
  heroRef,
}: QuickSummaryBarProps) {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-80px 0px 0px 0px',
      }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroRef]);

  const truncatedName = productName.length > 30
    ? productName.slice(0, 30) + '…'
    : productName;

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-150 ease-in-out",
        visible ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 h-10 px-4 bg-muted/95 backdrop-blur-sm border-b border-border/40 rounded-none">
        {/* Color swatch */}
        {colorHex && (
          <div
            className="w-5 h-5 rounded-full ring-1 ring-white/20 flex-shrink-0"
            style={{ backgroundColor: normalizeColorHex(colorHex) }}
          />
        )}

        {/* Product name */}
        <span className="text-sm font-medium text-foreground/90 truncate">
          {truncatedName}
        </span>

        {/* Material badge - hidden on mobile */}
        {material && !isMobile && (
          <>
            <span className="text-xs bg-muted-foreground/15 text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">
              {material}
            </span>
            <div className="border-r border-border/60 h-4 flex-shrink-0" />
          </>
        )}

        {/* Price */}
        {formattedPrice && (
          <span className="text-sm font-semibold text-emerald-400 flex-shrink-0 whitespace-nowrap">
            {formattedPrice}
          </span>
        )}

        {/* Buy link - hidden on mobile */}
        {buyUrl && storeName && !isMobile && (
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:text-primary/80 transition-colors duration-150 flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
          >
            Buy at {storeName}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
