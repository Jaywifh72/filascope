import { useJsonLd } from "./useJsonLd";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Base site URL for JSON-LD; defaults to https://filascope.com */
  siteUrl?: string;
  className?: string;
}

/**
 * Visible breadcrumb trail with JSON-LD BreadcrumbList schema.
 * Uses <a href> tags (not React Router <Link>) so crawlers always see real anchors.
 */
export function Breadcrumbs({
  items,
  siteUrl = "https://filascope.com",
  className,
}: BreadcrumbsProps) {
  // Build full chain including Home at position 0 if not already present
  const chain: BreadcrumbItem[] =
    items[0]?.url === "/" ? items : [{ name: "Home", url: "/" }, ...items];

  useJsonLd(
    chain.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: chain.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${siteUrl}${item.url}`,
          })),
        }
      : null
  );

  if (chain.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1 text-sm text-muted-foreground ${className ?? ""}`}
    >
      <ol className="flex flex-wrap items-center gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
        {chain.map((item, i) => {
          const isLast = i === chain.length - 1;
          const isHome = i === 0;

          return (
            <li
              key={item.url}
              className="inline-flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {i > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  className="font-medium text-foreground truncate max-w-[220px] cursor-default"
                  aria-current="page"
                  itemProp="name"
                >
                  {item.name}
                  <meta itemProp="position" content={String(i + 1)} />
                  <meta itemProp="item" content={`${siteUrl}${item.url}`} />
                </span>
              ) : (
                <a
                  href={item.url}
                  className="inline-flex items-center gap-1 hover:text-primary hover:underline decoration-primary/50 underline-offset-4 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  itemProp="item"
                >
                  {isHome && (
                    <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span itemProp="name">{item.name}</span>
                  <meta itemProp="position" content={String(i + 1)} />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
