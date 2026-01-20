import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PrinterInventoryItem {
  id: string;
  printer_id: string;
  retailer_id: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stock_quantity: number | null;
  price: number | null;
  currency: string;
  product_url: string | null;
  estimated_ship_days: number | null;
  last_checked: string;
  retailers?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    trust_score: number | null;
  };
}

export function usePrinterInventory(printerId: string | undefined) {
  return useQuery({
    queryKey: ['printer-inventory', printerId],
    queryFn: async () => {
      if (!printerId) return [];
      
      const { data, error } = await supabase
        .from('printer_inventory')
        .select(`
          *,
          retailers (
            id,
            name,
            slug,
            logo_url,
            trust_score
          )
        `)
        .eq('printer_id', printerId);
      
      if (error) {
        console.error('Error fetching printer inventory:', error);
        return [];
      }
      
      return data as PrinterInventoryItem[];
    },
    enabled: !!printerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

export function getAggregatedStockStatus(
  inventory: PrinterInventoryItem[],
  isDiscontinued?: boolean
): 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued' {
  // If product is discontinued, always show discontinued
  if (isDiscontinued) {
    return 'discontinued';
  }
  
  // If no inventory data, default to unknown (show as out-of-stock)
  if (!inventory || inventory.length === 0) {
    return 'out-of-stock';
  }
  
  // Check if any retailer has stock
  const hasInStock = inventory.some(item => item.stock_status === 'in_stock');
  const hasLowStock = inventory.some(item => item.stock_status === 'low_stock');
  const hasPreorder = inventory.some(item => item.stock_status === 'preorder');
  
  if (hasInStock) {
    return 'in-stock';
  }
  
  if (hasLowStock || hasPreorder) {
    return 'low-stock';
  }
  
  return 'out-of-stock';
}

export function getBestPriceFromInventory(inventory: PrinterInventoryItem[]): {
  price: number | null;
  retailer: string | null;
  url: string | null;
} {
  if (!inventory || inventory.length === 0) {
    return { price: null, retailer: null, url: null };
  }
  
  // Filter to in-stock items with prices
  const availableItems = inventory.filter(
    item => (item.stock_status === 'in_stock' || item.stock_status === 'low_stock') 
      && item.price !== null
  );
  
  if (availableItems.length === 0) {
    return { price: null, retailer: null, url: null };
  }
  
  // Find the lowest price
  const bestItem = availableItems.reduce((best, current) => 
    (current.price! < best.price!) ? current : best
  );
  
  return {
    price: bestItem.price,
    retailer: bestItem.retailers?.name || null,
    url: bestItem.product_url
  };
}
