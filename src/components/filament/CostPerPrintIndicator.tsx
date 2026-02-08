import { useRegion } from "@/contexts/RegionContext";

interface CostPerPrintIndicatorProps {
  pricePerKg: number | null;
  isConverted?: boolean;
}

/**
 * Estimates cost per 100g print based on spool price-per-kg.
 * Reference model: ~100g typical print (100×100×50mm, 20% infill).
 */
export function CostPerPrintIndicator({ pricePerKg, isConverted = false }: CostPerPrintIndicatorProps) {
  const { formatPrice } = useRegion();

  if (!pricePerKg || pricePerKg <= 0) return null;

  // 100g = 0.1 kg
  const costPer100g = pricePerKg * 0.1;

  return (
    <span className="text-xs text-muted-foreground">
      {formatPrice(costPer100g, { showApproximate: isConverted })} per 100g print
    </span>
  );
}
