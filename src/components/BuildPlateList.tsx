import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Square } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";

interface BuildPlate {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  product_url: string | null;
  specs: Record<string, unknown> | null;
}

export default function BuildPlateList() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter values from URL params
  const searchTerm = searchParams.get("search") || "";
  const selectedBrand = searchParams.get("brand") || "all";
  
  // Update URL params when filters change
  const setSearchTerm = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    newParams.set("tab", "build-plates");
    setSearchParams(newParams, { replace: true });
  };
  
  const setSelectedBrand = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("brand", value);
    } else {
      newParams.delete("brand");
    }
    newParams.set("tab", "build-plates");
    setSearchParams(newParams, { replace: true });
  };

  const { data: buildPlates, isLoading } = useQuery({
    queryKey: ["build-plates-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("id, name, brand, price, currency, image_url, product_url, specs")
        .eq("accessory_type", "build_plate")
        .order("brand")
        .order("name");
      
      if (error) throw error;
      return data as BuildPlate[];
    },
  });

  // Get unique brands
  const brands = useMemo(() => {
    if (!buildPlates) return [];
    const brandSet = new Set(buildPlates.map(bp => bp.brand).filter(Boolean));
    return Array.from(brandSet).sort();
  }, [buildPlates]);

  // Filter build plates
  const filteredBuildPlates = useMemo(() => {
    if (!buildPlates) return [];
    
    return buildPlates.filter(bp => {
      const matchesSearch = !searchTerm || 
        bp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bp.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = selectedBrand === "all" || bp.brand === selectedBrand;
      
      return matchesSearch && matchesBrand;
    });
  }, [buildPlates, searchTerm, selectedBrand]);

  // Group by brand
  const groupedBuildPlates = useMemo(() => {
    const groups: Record<string, BuildPlate[]> = {};
    
    filteredBuildPlates.forEach(bp => {
      const brand = bp.brand || "Unknown";
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(bp);
    });
    
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBuildPlates]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="text"
          placeholder="Search build plates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">{filteredBuildPlates.length}</span> build plates
      </p>

      {/* Grouped list */}
      <div className="space-y-8">
        {groupedBuildPlates.map(([brand, plates]) => {
          const brandLogo = getBrandLogo(brand);
          
          return (
            <div key={brand} className="space-y-4">
              {/* Brand header */}
              <div className="flex items-center gap-3 border-b pb-2">
                {brandLogo && (
                  <img
                    src={brandLogo}
                    alt={brand}
                    className="h-6 w-auto object-contain"
                  />
                )}
                <h3 className="text-lg font-semibold">{brand}</h3>
                <Badge variant="secondary">{plates.length}</Badge>
              </div>

              {/* Build plate grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {plates.map((plate) => {
                  const specs = plate.specs as Record<string, unknown> | null;
                  const surface = specs?.surface as string | undefined;
                  const isMagnetic = specs?.magnetic as boolean | undefined;
                  
                  return (
                    <Link key={plate.id} to={`/build-plates/${plate.id}`}>
                      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        {/* Image */}
                        <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {plate.image_url ? (
                            <img
                              src={plate.image_url}
                              alt={plate.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.parentElement?.querySelector('.image-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`image-fallback flex flex-col items-center justify-center text-muted-foreground ${plate.image_url ? 'hidden' : ''}`}>
                            <Square className="h-12 w-12 mb-2 opacity-30" />
                            <span className="text-xs">No image</span>
                          </div>
                        </div>

                        {/* Name */}
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2">{plate.name}</h4>

                        {/* Specs badges */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {surface && (
                            <Badge variant="outline" className="text-xs">{surface}</Badge>
                          )}
                          {isMagnetic && (
                            <Badge variant="outline" className="text-xs">Magnetic</Badge>
                          )}
                        </div>

                        {/* Price */}
                        {plate.price && (
                          <p className="text-primary font-bold">
                            ${plate.price.toFixed(2)} <span className="text-sm font-medium">{plate.currency || "USD"}</span>
                          </p>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBuildPlates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No build plates found matching your criteria
        </div>
      )}
    </div>
  );
}
