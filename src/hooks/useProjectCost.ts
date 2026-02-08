import { useMemo } from "react";
import { useRegion } from "@/contexts/RegionContext";
import { resolveFilamentPrice, type FilamentForPricing } from "@/lib/resolveFilamentPrice";
import type { ProjectMaterial, ProjectAccessory } from "./useProject";

export interface MaterialCost {
  materialId: string;
  filamentName: string;
  unitPrice: number | null;
  totalCost: number | null;
  isConverted: boolean;
  quantity: number;
}

export interface ProjectCostSummaryData {
  materialsCost: number;
  accessoriesCost: number;
  totalCost: number;
  currency: string;
  itemizedMaterials: MaterialCost[];
  hasUnavailablePrices: boolean;
}

export function useProjectCost(
  materials: ProjectMaterial[],
  accessories: ProjectAccessory[]
): ProjectCostSummaryData {
  const { currency, convertPrice, hasRates } = useRegion();

  return useMemo(() => {
    let materialsCost = 0;
    let hasUnavailablePrices = false;

    const itemizedMaterials: MaterialCost[] = materials.map((m) => {
      if (!m.filament) {
        hasUnavailablePrices = true;
        return {
          materialId: m.id,
          filamentName: "Filament unavailable",
          unitPrice: null,
          totalCost: null,
          isConverted: false,
          quantity: m.quantity_spools || 1,
        };
      }

      const resolved = resolveFilamentPrice(m.filament as FilamentForPricing, {
        userCurrency: currency,
        convertFromCurrency: convertPrice,
        hasRates,
      });

      const qty = m.quantity_spools || 1;
      const unitPrice = resolved.spoolPrice;
      const totalCost = unitPrice != null ? unitPrice * qty : null;

      if (unitPrice == null) {
        hasUnavailablePrices = true;
      } else {
        materialsCost += totalCost!;
      }

      return {
        materialId: m.id,
        filamentName: m.filament.product_title,
        unitPrice,
        totalCost,
        isConverted: resolved.isConverted,
        quantity: qty,
      };
    });

    let accessoriesCost = 0;
    accessories.forEach((a) => {
      if (a.price != null) {
        // Convert accessory price if needed
        if (a.currency === currency) {
          accessoriesCost += a.price;
        } else if (hasRates) {
          accessoriesCost += convertPrice(a.price, a.currency as any);
        }
      }
    });

    return {
      materialsCost,
      accessoriesCost,
      totalCost: materialsCost + accessoriesCost,
      currency,
      itemizedMaterials,
      hasUnavailablePrices,
    };
  }, [materials, accessories, currency, convertPrice, hasRates]);
}
