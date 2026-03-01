import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActiveFilter {
  id: string;
  label: string;
  type: 'material' | 'brand' | 'price' | 'property' | 'color';
}

interface ActiveFilterTagsProps {
  filters: ActiveFilter[];
  onRemove: (filterId: string, type: ActiveFilter['type']) => void;
  onClearAll: () => void;
}

interface AnimatedTagProps {
  filter: ActiveFilter;
  onRemove: (filterId: string, type: ActiveFilter['type']) => void;
}

function AnimatedTag({ filter, onRemove }: AnimatedTagProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    // Remove entering state after animation
    const timer = setTimeout(() => setIsEntering(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    // Wait for exit animation before actually removing
    setTimeout(() => {
      onRemove(filter.id, filter.type);
    }, 150);
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-primary/50 bg-primary/10 text-foreground px-3 py-1 h-7 gap-1.5 cursor-pointer shrink-0",
        "transition-all duration-150 hover:bg-primary/20 hover:scale-105",
        isEntering && "filter-tag-enter",
        isExiting && "filter-tag-exit"
      )}
      onClick={handleRemove}
    >
      {filter.label}
      <X className="h-3 w-3" />
    </Badge>
  );
}

export function ActiveFilterTags({ filters, onRemove, onClearAll }: ActiveFilterTagsProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showCleared, setShowCleared] = useState(false);

  if (filters.length === 0 && !showCleared) return null;

  const handleClearAll = () => {
    setIsClearing(true);
    // Stagger out then clear
    setTimeout(() => {
      onClearAll();
      setIsClearing(false);
      setShowCleared(true);
      setTimeout(() => setShowCleared(false), 1000);
    }, 150);
  };

  return (
    <div className="bg-muted/30 border-b border-border relative z-10">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 min-h-12 py-2 flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Active Filters:</span>
        <div 
          className={cn(
            "flex flex-wrap items-center gap-2 flex-1 overflow-x-auto transition-opacity duration-150",
            isClearing && "opacity-0"
          )}
        >
          {filters.map((filter, index) => (
            <AnimatedTag
              key={`${filter.type}-${filter.id}`}
              filter={filter}
              onRemove={onRemove}
            />
          ))}
        </div>
        {filters.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground shrink-0 h-7"
          >
            Clear All
          </Button>
        ) : showCleared ? (
          <span className="text-xs text-success font-medium flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" />
            Cleared
          </span>
        ) : null}
      </div>
    </div>
  );
}
