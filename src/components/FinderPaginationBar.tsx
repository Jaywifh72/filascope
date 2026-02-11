import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FinderPaginationBarProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  displayedCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  
  const pages: (number | "ellipsis")[] = [];
  
  // Always show first page
  pages.push(0);
  
  if (current > 2) pages.push("ellipsis");
  
  // Pages around current
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  
  if (current < total - 3) pages.push("ellipsis");
  
  // Always show last page
  if (total > 1) pages.push(total - 1);
  
  return pages;
}

export function FinderPaginationBar({
  currentPage,
  totalCount,
  pageSize,
  displayedCount,
  onPageChange,
  onPageSizeChange,
}: FinderPaginationBarProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const showingStart = currentPage * pageSize + 1;
  const showingEnd = Math.min((currentPage + 1) * pageSize, totalCount);
  const pages = getPageNumbers(currentPage, totalPages);

  const scrollToRegistry = () => {
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

        {/* Center: Page buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", currentPage === 0 && "opacity-50 pointer-events-none")}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={false}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md text-sm transition-colors",
                  p === currentPage
                    ? "bg-cyan-500 text-black font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {p + 1}
              </button>
            )
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", currentPage >= totalPages - 1 && "opacity-50 pointer-events-none")}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={false}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Per page + Back to top */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 hidden sm:flex">
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
            onClick={scrollToRegistry}
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
