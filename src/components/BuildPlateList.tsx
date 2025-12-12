import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Square, Thermometer } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plates.map((plate) => {
                  const specs = plate.specs as Record<string, unknown> | null;
                  const surface = specs?.surface as string | undefined;
                  const isMagnetic = specs?.magnetic as boolean | undefined;
                  const maxTemp = specs?.max_temp_c as number | undefined;
                  
                  return (
                    <Link key={plate.id} to={`/build-plates/${plate.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex">
                          {/* Product Image - Left Side */}
                          <div className="relative w-28 h-28 shrink-0 bg-muted/30">
                            {plate.image_url ? (
                              <img
                                src={plate.image_url}
                                alt={plate.name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Square className="h-10 w-10 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Card Content - Right Side */}
                          <div className="flex-1 p-3 min-w-0 flex flex-col">
                            {/* Header with Name and Price */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold line-clamp-1">{plate.name}</h4>
                                {surface && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">{surface}</span>
                                )}
                              </div>
                              {/* Price */}
                              <div className="shrink-0 text-right">
                                {plate.price && (
                                  <div className="text-sm font-bold text-primary">
                                    ${plate.price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Specs - Compact */}
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                              {maxTemp && (
                                <div className="flex items-center gap-1">
                                  <Thermometer className="h-3 w-3" />
                                  <span>Up to {maxTemp}°C</span>
                                </div>
                              )}
                            </div>

                            {/* Badges and Brand Logo Row */}
                            <div className="flex items-end justify-between gap-2 mt-auto pt-1.5">
                              <div className="flex flex-wrap gap-1">
                                {isMagnetic && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Magnetic</Badge>
                                )}
                              </div>
                              {/* Brand Logo - Bottom Right */}
                              {brandLogo && (
                                <div className="shrink-0 px-2 py-1.5 bg-muted/50 rounded border border-border/30">
                                  <img 
                                    src={brandLogo} 
                                    alt={`${brand} logo`}
                                    className="h-10 w-auto object-contain max-w-[120px]"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
