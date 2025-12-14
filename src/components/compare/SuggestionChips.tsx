import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompareItem } from "@/hooks/useCompare";
import { useSimilarFilaments } from "@/hooks/useSimilarFilaments";

interface SuggestionChipsProps {
  currentItem: CompareItem;
  onAdd: (item: CompareItem) => void;
}

export function SuggestionChips({ currentItem, onAdd }: SuggestionChipsProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const { similars, isLoading } = useSimilarFilaments(
    currentItem.id,
    currentItem.material,
    null, // color_family not in CompareItem
    currentItem.vendor,
    currentItem.variant_price
  );

  // Delay showing suggestions for effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || similars.length === 0) return null;

  const handleAdd = (similar: typeof similars[0]) => {
    onAdd({
      id: similar.id,
      product_title: similar.product_title,
      vendor: similar.vendor || null,
      material: similar.material || null,
      color_hex: similar.color_hex || null,
      variant_price: similar.variant_price || null,
      net_weight_g: similar.net_weight_g || null,
    });
  };

  return (
    <div className={cn(
      "mt-3 pt-3 border-t border-border/50 transition-all duration-300",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )}>
      <p className="text-xs text-muted-foreground mb-2">
        Compare with similar materials:
      </p>
      <div className="flex flex-wrap gap-2">
        {similars.slice(0, 3).map((similar) => (
          <button
            key={similar.id}
            onClick={() => handleAdd(similar)}
            className={cn(
              "suggestion-chip flex items-center gap-2 px-3 py-1.5 rounded-full",
              "bg-muted/50 border border-border hover:border-primary/50 hover:bg-primary/10",
              "transition-all duration-200 text-xs"
            )}
          >
            {similar.color_hex && (
              <div 
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ 
                  backgroundColor: similar.color_hex.startsWith('#') 
                    ? similar.color_hex 
                    : `#${similar.color_hex}` 
                }}
              />
            )}
            <span className="truncate max-w-[120px]">{similar.product_title}</span>
            <Plus className="w-3 h-3 text-primary flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
