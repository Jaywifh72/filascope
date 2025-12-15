import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryStatus {
  id: string;
  filament_id: string;
  retailer_id: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stock_quantity: number | null;
  last_checked: string;
  price: number | null;
  currency: string;
  product_url: string | null;
  estimated_ship_days: number | null;
}

export function useInventoryStatus(filamentId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', filamentId],
    queryFn: async () => {
      if (!filamentId) return [];
      
      const { data, error } = await supabase
        .from('filament_inventory')
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
        .eq('filament_id', filamentId);
      
      if (error) {
        console.error('Error fetching inventory:', error);
        return [];
      }
      
      return data as (InventoryStatus & { retailers: { id: string; name: string; slug: string; logo_url: string | null; trust_score: number | null } })[];
    },
    enabled: !!filamentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
}

export function getStockStatusDisplay(status: InventoryStatus['stock_status'], quantity: number | null): {
  label: string;
  color: 'green' | 'amber' | 'red' | 'blue' | 'gray';
  urgency: boolean;
} {
  switch (status) {
    case 'in_stock':
      if (quantity !== null && quantity <= 5) {
        return { 
          label: `Low Stock - Only ${quantity} left`, 
          color: 'amber', 
          urgency: true 
        };
      }
      if (quantity !== null && quantity > 10) {
        return { label: `In Stock (${quantity}+)`, color: 'green', urgency: false };
      }
      if (quantity !== null) {
        return { label: `In Stock (${quantity})`, color: 'green', urgency: false };
      }
      return { label: 'In Stock', color: 'green', urgency: false };
    
    case 'low_stock':
      return { 
        label: quantity ? `Low Stock - ${quantity} left` : 'Low Stock', 
        color: 'amber', 
        urgency: true 
      };
    
    case 'out_of_stock':
      return { label: 'Out of Stock', color: 'red', urgency: false };
    
    case 'preorder':
      return { label: 'Pre-order', color: 'blue', urgency: false };
    
    default:
      return { label: 'Check Availability', color: 'gray', urgency: false };
  }
}

// Simulated inventory generation for demo (when no real data exists)
export function generateSimulatedInventory(filamentId: string): InventoryStatus[] {
  const statuses: InventoryStatus['stock_status'][] = ['in_stock', 'in_stock', 'low_stock', 'in_stock'];
  const quantities = [15, 8, 2, null];
  
  return [
    {
      id: `sim-amazon-${filamentId}`,
      filament_id: filamentId,
      retailer_id: 'amazon',
      stock_status: statuses[Math.floor(Math.random() * statuses.length)],
      stock_quantity: quantities[Math.floor(Math.random() * quantities.length)],
      last_checked: new Date().toISOString(),
      price: null,
      currency: 'USD',
      product_url: null,
      estimated_ship_days: 2,
    },
    {
      id: `sim-bambu-${filamentId}`,
      filament_id: filamentId,
      retailer_id: 'bambu-lab',
      stock_status: 'in_stock',
      stock_quantity: 25,
      last_checked: new Date().toISOString(),
      price: null,
      currency: 'USD',
      product_url: null,
      estimated_ship_days: 3,
    },
  ];
}
