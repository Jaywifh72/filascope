import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CrawlablePaginationBarProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  displayedCount: number;
  basePath: string; // e.g. "/filaments/pla"
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | "ellipsis")[] = [];
  pages.push(0);
  if (current > 2) pages.push("ellipsis");
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push("ellipsis");
  if (total > 1) pages.push(total - 1);
  return pages;
}

/** Returns the href for a given 0-indexed page number */
function pageHref(basePath: string, page: number): string {
  if (page === 0) return basePath;
  return `${basePath}?page=${page + 1}`;
}

export function CrawlablePaginationBar({
  currentPage,
  totalCount,
  pageSize,
  displayedCount,
  basePath,
  onPageChange,
  onPageSizeChange,
}: CrawlablePaginationBarProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingStart = currentPage * pageSize + 1;
  const showingEnd = Math.min((currentPage + 1) * pageSize, totalCount);
  const pages = getPageNumbers(currentPage, totalPages);

  const scrollToTop = () => {
    const el = document.getElementById("filament-grid") || document.getElementById("filament-table");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (totalCount <= pageSize && totalPages <= 1) return null;

  return (
    <div className="border-t border-border py-4 mt-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
        {/* Left: Showing count */}
        <p className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
          Showing {showingStart}–{showingEnd} of {totalCount.toLocaleString()}
        </p>

        {/* Center: Page links (crawlable <a> tags) */}
        <div className="flex items-center gap-1">
          {/* Prev */}
          <a
            href={currentPage === 0 ? undefined : pageHref(basePath, currentPage - 1)}
            onClick={(e) => {
              if (currentPage === 0) { e.preventDefault(); return; }
              e.preventDefault();
              onPageChange(currentPage - 1);
            }}
            rel="prev"
            aria-label="Previous page"
            aria-disabled={currentPage === 0}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
              currentPage === 0
                ? "opacity-50 pointer-events-none text-muted-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </a>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`e${i}`}
                className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm"
              >
                …
              </span>
            ) : (
              <a
                key={p}
                href={pageHref(basePath, p)}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
                }}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md text-sm transition-colors",
                  p === currentPage
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {p + 1}
              </a>
            )
          )}

          {/* Next */}
          <a
            href={currentPage >= totalPages - 1 ? undefined : pageHref(basePath, currentPage + 1)}
            onClick={(e) => {
              if (currentPage >= totalPages - 1) { e.preventDefault(); return; }
              e.preventDefault();
              onPageChange(currentPage + 1);
            }}
            rel="next"
            aria-label="Next page"
            aria-disabled={currentPage >= totalPages - 1}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
              currentPage >= totalPages - 1
                ? "opacity-50 pointer-events-none text-muted-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Right: Per page + Back to top */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
                <SelectItem value="96">96</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={scrollToTop}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Top
          </button>
        </div>
      </div>
    </div>
  );
}
