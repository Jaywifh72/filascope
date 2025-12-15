import { useMemo } from "react";

export interface ComparisonPreviewData {
  current: {
    name: string;
    price: number | null;
    pricePerKg: number | null;
    strength: number | null;
    ease: number | null;
  };
  comparison: {
    name: string;
    price: number | null;
    pricePerKg: number | null;
    strength: number | null;
    ease: number | null;
  };
  diffs: {
    price: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
    strength: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
    ease: { value: number; formatted: string; better: "current" | "comparison" | "same" } | null;
  };
}

interface FilamentData {
  product_title: string;
  variant_price: number | null;
  net_weight_g: number | null;
  strength_index: number | null;
  printability_index: number | null;
}

function getPricePerKg(price: number | null, weight: number | null): number | null {
  if (!price || !weight || weight === 0) return null;
  return (price / weight) * 1000;
}

function formatDiff(diff: number, prefix: string = ""): string {
  if (diff === 0) return "same";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${prefix}${diff.toFixed(diff % 1 === 0 ? 0 : 2)}`;
}

function determineBetter(
  currentVal: number | null,
  comparisonVal: number | null,
  lowerIsBetter: boolean = false
): "current" | "comparison" | "same" {
  if (currentVal === null || comparisonVal === null) return "same";
  if (currentVal === comparisonVal) return "same";
  
  if (lowerIsBetter) {
    return currentVal < comparisonVal ? "current" : "comparison";
  }
  return currentVal > comparisonVal ? "current" : "comparison";
}

export function useComparisonPreview(
  currentFilament: FilamentData | null,
  comparisonFilament: FilamentData | null
): ComparisonPreviewData | null {
  return useMemo(() => {
    if (!currentFilament || !comparisonFilament) return null;

    const currentPriceKg = getPricePerKg(currentFilament.variant_price, currentFilament.net_weight_g);
    const comparisonPriceKg = getPricePerKg(comparisonFilament.variant_price, comparisonFilament.net_weight_g);

    // Calculate diffs
    const priceDiff = currentPriceKg !== null && comparisonPriceKg !== null
      ? comparisonPriceKg - currentPriceKg
      : null;
    
    const strengthDiff = currentFilament.strength_index !== null && comparisonFilament.strength_index !== null
      ? comparisonFilament.strength_index - currentFilament.strength_index
      : null;
    
    const easeDiff = currentFilament.printability_index !== null && comparisonFilament.printability_index !== null
      ? comparisonFilament.printability_index - currentFilament.printability_index
      : null;

    return {
      current: {
        name: currentFilament.product_title,
        price: currentFilament.variant_price,
        pricePerKg: currentPriceKg,
        strength: currentFilament.strength_index,
        ease: currentFilament.printability_index
      },
      comparison: {
        name: comparisonFilament.product_title,
        price: comparisonFilament.variant_price,
        pricePerKg: comparisonPriceKg,
        strength: comparisonFilament.strength_index,
        ease: comparisonFilament.printability_index
      },
      diffs: {
        price: priceDiff !== null ? {
          value: priceDiff,
          formatted: formatDiff(priceDiff, "$"),
          better: determineBetter(currentPriceKg, comparisonPriceKg, true)
        } : null,
        strength: strengthDiff !== null ? {
          value: strengthDiff,
          formatted: formatDiff(strengthDiff),
          better: determineBetter(currentFilament.strength_index, comparisonFilament.strength_index)
        } : null,
        ease: easeDiff !== null ? {
          value: easeDiff,
          formatted: formatDiff(easeDiff),
          better: determineBetter(currentFilament.printability_index, comparisonFilament.printability_index)
        } : null
      }
    };
  }, [currentFilament, comparisonFilament]);
}
