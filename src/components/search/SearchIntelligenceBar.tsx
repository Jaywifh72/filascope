import { Sparkles, X, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SearchIntent } from "@/lib/searchIntentParser";

interface SearchIntelligenceBarProps {
  searchQuery: string;
  intent: SearchIntent | null;
  filteredCount: number;
  onClear: () => void;
  onMaterialOnly?: (material: string) => void;
}

export function SearchIntelligenceBar({
  searchQuery,
  intent,
  filteredCount,
  onClear,
  onMaterialOnly,
}: SearchIntelligenceBarProps) {
  if (!searchQuery.trim()) return null;

  const isZeroResults = filteredCount === 0;

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-6 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
        {/* LEFT: Intelligence summary */}
        {isZeroResults ? (
          <div className="flex items-center gap-2 flex-wrap">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              No {intent?.materialFilter ?? "filaments"} matched "{searchQuery}"
            </span>
            {intent?.materialFilter && onMaterialOnly && (
              <button
                onClick={() => onMaterialOnly(intent.materialFilter!)}
                className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full hover:bg-blue-500/25 transition-colors"
              >
                Show all {intent.materialFilter} →
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Clickable brain icon with Popover tooltip */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-muted-foreground">Search:</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 bg-card border border-border rounded-lg p-3 shadow-lg"
                side="bottom"
                align="start"
              >
                <div className="text-xs font-mono text-muted-foreground space-y-1">
                  <span className="block text-foreground font-semibold mb-2">
                    Query: "{searchQuery}"
                  </span>
                  {intent?.materialFilter && (
                    <span className="block">
                      ├─ Material detected:{" "}
                      <span className="text-blue-300">{intent.materialFilter}</span>
                    </span>
                  )}
                  {intent?.materialFilter && (
                    <span className="block">
                      ├─ Hard filter: WHERE material = '{intent.materialFilter}'
                    </span>
                  )}
                  {intent?.propertyIntent && (
                    <span className="block">
                      ├─ Property intent:{" "}
                      <span className="text-teal-300">{intent.propertyIntent.explanation}</span>
                    </span>
                  )}
                  {intent?.propertyIntent && (
                    <span className="block">
                      └─ Sort: {intent.propertyIntent.sortColumn}{" "}
                      {intent.propertyIntent.sortDirection === "asc" ? "ASC" : "DESC"}
                    </span>
                  )}
                  {!intent?.materialFilter && !intent?.propertyIntent && (
                    <span className="block">└─ Free text search on vendor name</span>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Material pill */}
            {intent?.materialFilter && (
              <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                Material: {intent.materialFilter}
              </span>
            )}

            {/* Property sort pill */}
            {intent?.propertyIntent && (
              <span className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs px-2 py-0.5 rounded-full">
                Sorted: {intent.propertyIntent.explanation}{" "}
                {intent.propertyIntent.sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}

            {/* Free text fallback */}
            {!intent?.materialFilter && !intent?.propertyIntent && (
              <span className="text-muted-foreground text-xs italic">"{searchQuery}"</span>
            )}

            {/* Result count */}
            <span className="text-amber-400 font-semibold text-xs">
              {filteredCount.toLocaleString()} result{filteredCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-4">
          <a
            href="/wizard"
            className="text-xs text-muted-foreground hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            Not finding it? Try Quick Match →
          </a>
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear search
          </button>
        </div>
      </div>
    </div>
  );
}
