import { SkeletonBox } from "@/components/ui/skeleton-primitives";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const colWidths = ["w-[12%]", "w-[18%]", "w-[14%]", "w-[10%]", "w-[16%]", "w-[10%]", "w-[10%]", "w-[10%]"];

export function TableSkeleton({ rows = 10, columns = 6 }: TableSkeletonProps) {
  const widths = colWidths.slice(0, columns);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04]">
        {widths.map((w, i) => (
          <SkeletonBox key={i} className={cn("h-4", w)} />
        ))}
      </div>

      {/* Body */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            "flex items-center gap-3 px-4 py-3 border-t border-border/50",
            r % 2 === 0 && "bg-white/[0.02]"
          )}
        >
          {widths.map((w, i) => (
            <SkeletonBox key={i} className={cn("h-4", w)} />
          ))}
        </div>
      ))}
    </div>
  );
}
