import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BRAND_SPECIFIC_FUNCTIONS } from "@/lib/brand-sync-config";

interface BrandFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  showPlatformBadge?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "bg-green-500",
  amazon: "bg-orange-500",
  woocommerce: "bg-purple-500",
  bigcommerce: "bg-blue-500",
  magento: "bg-red-500",
  custom: "bg-zinc-500",
};

// Create a Set for O(1) lookup
const SYNC_MANAGER_BRANDS = new Set<string>(BRAND_SPECIFIC_FUNCTIONS);

export function BrandFilter({
  value,
  onChange,
  placeholder = "All Brands",
  showPlatformBadge = false,
}: BrandFilterProps) {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["automated-brands-filter-synced"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_brands")
        .select("brand_slug, display_name, platform_type, product_count")
        .eq("is_visible", true)
        .order("display_name");

      if (error) throw error;
      // Filter to only include brands in the sync manager
      return data?.filter(brand => SYNC_MANAGER_BRANDS.has(brand.brand_slug)) || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {brands?.map((brand) => (
          <SelectItem key={brand.brand_slug} value={brand.brand_slug}>
            <div className="flex items-center justify-between gap-2 w-full">
              <span>{brand.display_name}</span>
              <div className="flex items-center gap-1.5">
                {showPlatformBadge && brand.platform_type && (
                  <span
                    className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[brand.platform_type] || "bg-zinc-500"}`}
                  />
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {brand.product_count}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
