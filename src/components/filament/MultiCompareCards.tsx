import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartComparisonSuggestion } from "@/lib/smartComparisonService";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

interface MultiCompareCardsProps {
  suggestions: SmartComparisonSuggestion[];
  onAddToCompare: (suggestion: SmartComparisonSuggestion) => void;
  onAddAllToCompare: () => void;
  addedIds: Set<string>;
}

function MiniCompareCard({
  suggestion,
  onAdd,
  isAdded,
  formatPrice
}: {
  suggestion: SmartComparisonSuggestion;
  onAdd: () => void;
  isAdded: boolean;
  formatPrice: (price: number | null | undefined, showCurrency?: boolean) => string;
}) {
  return (
    <div className="flex flex-col p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors min-w-[140px]">
      {/* Color swatch */}
      <div 
        className="w-full h-8 rounded-md mb-2 border border-border/30"
        style={{ 
          backgroundColor: suggestion.color_hex || "#888888"
        }}
      />
      
      {/* Product name */}
      <div className="text-sm font-medium text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">
        {suggestion.name}
      </div>
      
      {/* Vendor */}
      <div className="text-xs text-muted-foreground mb-1">
        {suggestion.vendor || "Unknown"}
      </div>
      
      {/* Price */}
      <div className="text-sm font-mono text-primary mb-2">
        {suggestion.price ? formatPrice(suggestion.price, false) : "—"}
      </div>
      
      {/* Relevance reason badge */}
      <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded mb-2 truncate">
        {suggestion.relevanceReason}
      </div>
      
      {/* Add button */}
      <Button
        size="sm"
        variant={isAdded ? "secondary" : "outline"}
        className={cn(
          "w-full h-7 text-xs",
          isAdded && "bg-green-500/10 text-green-400 border-green-500/30"
        )}
        onClick={onAdd}
        disabled={isAdded}
      >
        {isAdded ? (
          <>Added</>
        ) : (
          <>
            <Plus className="w-3 h-3 mr-1" />
            Compare
          </>
        )}
      </Button>
    </div>
  );
}

export function MultiCompareCards({
  suggestions,
  onAddToCompare,
  onAddAllToCompare,
  addedIds
}: MultiCompareCardsProps) {
  const { formatPrice } = useCurrency();
  
  if (suggestions.length === 0) return null;

  const allAdded = suggestions.every(s => addedIds.has(s.id));
  const someAdded = suggestions.some(s => addedIds.has(s.id));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Compare with {suggestions.length} similar materials
        </h4>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 text-xs",
            allAdded && "text-green-400"
          )}
          onClick={onAddAllToCompare}
          disabled={allAdded}
        >
          {allAdded ? (
            "All added"
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Add all to tray
            </>
          )}
        </Button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-3">
        {suggestions.map((suggestion) => (
          <MiniCompareCard
            key={suggestion.id}
            suggestion={suggestion}
            onAdd={() => onAddToCompare(suggestion)}
            isAdded={addedIds.has(suggestion.id)}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </div>
  );
}
