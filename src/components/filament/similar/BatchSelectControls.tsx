import { useState } from "react";
import { CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface BatchSelectControlsProps {
  recommendations: EnhancedSimilarFilament[];
  isMultiSelectMode: boolean;
  onToggleMode: () => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function BatchSelectControls({
  recommendations,
  isMultiSelectMode,
  onToggleMode,
  selectedIds,
  onSelectionChange,
}: BatchSelectControlsProps) {
  const { addItem, isFull, items } = useCompare();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAll = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one material");
      return;
    }

    const availableSlots = 4 - items.length;
    if (selectedIds.size > availableSlots) {
      toast.error(`Only ${availableSlots} slots available in comparison tray`);
      return;
    }

    setIsAdding(true);

    const selectedFilaments = recommendations.filter((r) =>
      selectedIds.has(r.id)
    );

    selectedFilaments.forEach((filament, index) => {
      setTimeout(() => {
        addItem({
          id: filament.id,
          product_title: filament.product_title,
          vendor: filament.vendor,
          material: filament.material,
          color_hex: null,
          variant_price: filament.variant_price,
          net_weight_g: filament.net_weight_g,
          featured_image: filament.featured_image,
        });
      }, index * 100); // Stagger adds for animation
    });

    setTimeout(() => {
      toast.success(`Added ${selectedFilaments.length} materials to compare`, {
        description: "View comparison tray at the bottom",
      });
      onSelectionChange(new Set());
      onToggleMode();
      setIsAdding(false);
    }, selectedFilaments.length * 100 + 200);
  };

  const handleCancel = () => {
    onSelectionChange(new Set());
    onToggleMode();
  };

  if (!isMultiSelectMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleMode}
        className="border-primary/30 text-primary hover:bg-primary/10"
      >
        <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
        Select Multiple
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="bg-primary/20 text-primary border-primary/30"
      >
        {selectedIds.size} selected
      </Badge>
      <Button
        size="sm"
        onClick={handleAddAll}
        disabled={selectedIds.size === 0 || isAdding || isFull}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isAdding ? "Adding..." : "Add All"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SelectableCardOverlayProps {
  filamentId: string;
  isSelected: boolean;
  onToggle: () => void;
}

export function SelectableCardOverlay({
  filamentId,
  isSelected,
  onToggle,
}: SelectableCardOverlayProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`absolute top-3 left-3 z-20 flex h-6 w-6 items-center justify-center rounded transition-all ${
        isSelected
          ? "bg-primary text-primary-foreground scale-110"
          : "bg-background/80 text-muted-foreground hover:bg-primary/20 hover:text-primary"
      }`}
    >
      {isSelected ? (
        <CheckSquare className="h-4 w-4" />
      ) : (
        <Square className="h-4 w-4" />
      )}
    </button>
  );
}
