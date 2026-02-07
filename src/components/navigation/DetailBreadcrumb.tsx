import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

export interface BreadcrumbSegment {
  label: string;
  href: string;
}

interface DetailBreadcrumbProps {
  segments: BreadcrumbSegment[];
  /** Override the mobile "← Back to X" parent label */
  mobileBackLabel?: string;
}

/**
 * Breadcrumb navigation for detail pages.
 * Desktop: Home > Section > Brand > Product
 * Mobile: ← Back to [parent]
 * Includes JSON-LD BreadcrumbList schema for SEO.
 */
export function DetailBreadcrumb({ segments, mobileBackLabel }: DetailBreadcrumbProps) {
  const isMobile = useIsMobile();

  // Build full chain: Home + segments
  const fullChain: BreadcrumbSegment[] = [
    { label: "Home", href: "/" },
    ...segments,
  ];

  // Parent is second-to-last in the full chain (for mobile back link)
  const parent = fullChain.length >= 2 ? fullChain[fullChain.length - 2] : null;
  const current = fullChain[fullChain.length - 1];

  // JSON-LD schema items
  const schemaItems = fullChain.map((seg) => ({
    name: seg.label,
    url: `https://filascope.com${seg.href}`,
  }));

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />

      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
        {isMobile ? (
          /* Mobile: compact back link */
          parent && (
            <Link
              to={parent.href}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {mobileBackLabel || parent.label}</span>
            </Link>
          )
        ) : (
          /* Desktop: full breadcrumb trail */
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {fullChain.map((seg, i) => {
              const isLast = i === fullChain.length - 1;
              const isHome = i === 0;

              return (
                <li key={seg.href} className="inline-flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  {isLast ? (
                    <span
                      className="font-medium text-foreground truncate max-w-[280px]"
                      aria-current="page"
                    >
                      {seg.label}
                    </span>
                  ) : (
                    <Link
                      to={seg.href}
                      className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {isHome && <Home className="w-3.5 h-3.5" />}
                      <span>{seg.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </nav>
    </>
  );
}
