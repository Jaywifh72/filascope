import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Search, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface PreferredBrandsPickerProps {
  selectedBrands: string[];
  onChange: (brands: string[]) => void;
}

interface BrandItem {
  brand_slug: string;
  display_name: string;
  logo_url: string | null;
}

export function PreferredBrandsPicker({ selectedBrands, onChange }: PreferredBrandsPickerProps) {
  const [search, setSearch] = useState("");

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["all-brands-for-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_brand_directory")
        .select("brand_slug, display_name, logo_url")
        .order("display_name");
      if (error) throw error;
      return (data || []) as BrandItem[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter(b => b.display_name.toLowerCase().includes(q));
  }, [brands, search]);

  const selectedSet = new Set(selectedBrands);

  const addBrand = (slug: string) => {
    if (!selectedSet.has(slug)) onChange([...selectedBrands, slug]);
  };

  const removeBrand = (slug: string) => {
    onChange(selectedBrands.filter(s => s !== slug));
  };

  const getBrandName = (slug: string) =>
    brands.find(b => b.brand_slug === slug)?.display_name || slug;

  const getBrandLogo = (slug: string) =>
    brands.find(b => b.brand_slug === slug)?.logo_url || null;

  return (
    <div className="space-y-3">
      {/* Selected brands as removable badges */}
      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map(slug => (
            <Badge
              key={slug}
              variant="secondary"
              className="pl-1.5 pr-1 py-1 gap-1.5 text-sm"
            >
              <BrandLogo
                src={getBrandLogo(slug)}
                brandName={getBrandName(slug)}
                size="sm"
              />
              <span>{getBrandName(slug)}</span>
              <button
                type="button"
                onClick={() => removeBrand(slug)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                aria-label={`Remove ${getBrandName(slug)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands to add…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Brand list */}
      <ScrollArea className="h-[200px] rounded-md border border-border/50">
        <div className="p-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading brands…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No brands found</p>
          ) : (
            filtered.map(brand => {
              const isSelected = selectedSet.has(brand.brand_slug);
              return (
                <button
                  key={brand.brand_slug}
                  type="button"
                  disabled={isSelected}
                  onClick={() => addBrand(brand.brand_slug)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-left hover:bg-accent/50 disabled:opacity-40 disabled:cursor-default transition-colors"
                >
                  <BrandLogo
                    src={brand.logo_url}
                    brandName={brand.display_name}
                    size="sm"
                  />
                  <span className="flex-1 truncate">{brand.display_name}</span>
                  {isSelected ? (
                    <span className="text-xs text-muted-foreground">Added</span>
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {selectedBrands.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          Add brands to personalize your recommendations and filters.
        </p>
      )}
    </div>
  );
}
