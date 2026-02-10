import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCompare, CompareItem } from "@/hooks/useCompare";
import { toast } from "sonner";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";
import type { EnhancedSimilarFilament } from "@/hooks/useEnhancedSimilarFilaments";

interface QuickSwapDropdownProps {
  filament: EnhancedSimilarFilament;
  onSwapComplete?: () => void;
}

export function QuickSwapDropdown({
  filament,
  onSwapComplete,
}: QuickSwapDropdownProps) {
  const { items, removeItem, addItem, triggerGlow } = useCompare();

  const handleSwap = (itemToRemove: CompareItem) => {
    // Remove old item
    removeItem(itemToRemove.id);

    // Add new item after a brief delay for animation
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
      triggerGlow();

      toast.success("Swapped in comparison", {
        description: `Replaced "${cleanFilamentDisplayName(itemToRemove.product_title).slice(0, 30)}..." with "${cleanFilamentDisplayName(filament.product_title).slice(0, 30)}..."`,
      });

      onSwapComplete?.();
    }, 150);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
        >
          <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
          Replace...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground">
          Replace which material?
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSwap(item);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {item.featured_image ? (
                <img
                  src={item.featured_image}
                  alt={`${cleanFilamentDisplayName(item.product_title)} filament`}
                  className="h-8 w-8 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="h-8 w-8 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color_hex || "#666" }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {cleanFilamentDisplayName(item.product_title)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.vendor || "Unknown brand"}
                </p>
              </div>
              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
