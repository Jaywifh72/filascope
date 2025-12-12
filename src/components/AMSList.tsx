import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";

interface AMS {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  image_url: string | null;
  product_url: string | null;
  specs: {
    max_spools?: number;
    spool_size?: string;
    humidity_control?: boolean;
    drying_capability?: boolean;
    max_temp_c?: number;
    filament_types?: string;
    compatible_models?: string;
    color_mixing?: boolean;
    material_detection?: boolean;
    wireless?: boolean;
    dimensions?: string;
    weight_kg?: number;
  } | null;
}

export default function AMSList() {
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
    newParams.set("tab", "ams");
    setSearchParams(newParams, { replace: true });
  };
  
  const setSelectedBrand = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("brand", value);
    } else {
      newParams.delete("brand");
    }
    newParams.set("tab", "ams");
    setSearchParams(newParams, { replace: true });
  };

  const { data: amsSystems, isLoading } = useQuery({
    queryKey: ["ams-systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("accessory_type", "ams_mmu")
        .order("brand", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as unknown as AMS[];
    },
  });

  const brands = useMemo(() => {
    if (!amsSystems) return [];
    const uniqueBrands = [...new Set(amsSystems.map(a => a.brand).filter(Boolean))];
    return uniqueBrands.sort();
  }, [amsSystems]);

  const filteredAMS = useMemo(() => {
    if (!amsSystems) return [];
    
    return amsSystems.filter(ams => {
      const matchesSearch = !searchTerm || 
        ams.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ams.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBrand = selectedBrand === "all" || ams.brand === selectedBrand;
      
      return matchesSearch && matchesBrand;
    });
  }, [amsSystems, searchTerm, selectedBrand]);

  const groupedAMS = useMemo(() => {
    const groups: Record<string, AMS[]> = {};
    filteredAMS.forEach(ams => {
      const brand = ams.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(ams);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAMS]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
          placeholder="Search AMS/MMU systems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue placeholder="All Brands" />
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
      <div className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground">{filteredAMS.length}</span> multi-material systems
      </div>

      {/* AMS Grid grouped by brand */}
      {groupedAMS.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No AMS/MMU systems found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedAMS.map(([brand, systems]) => {
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
                  <Badge variant="secondary">{systems.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {systems.map(ams => (
                    <Link key={ams.id} to={`/ams/${ams.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex">
                          {/* Product Image - Left Side */}
                          <div className="relative w-28 h-28 shrink-0 bg-muted/30">
                            {ams.image_url ? (
                              <img
                                src={ams.image_url}
                                alt={ams.name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Layers className="h-10 w-10 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Card Content - Right Side */}
                          <div className="flex-1 p-3 min-w-0 flex flex-col">
                            {/* Header with Name and Price */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold line-clamp-1">{ams.name}</h4>
                                {ams.specs?.max_spools && (
                                  <span className="text-xs text-muted-foreground">{ams.specs.max_spools} Spools</span>
                                )}
                              </div>
                              {/* Price */}
                              <div className="shrink-0 text-right">
                                {ams.price && (
                                  <div className="text-sm font-bold text-primary">
                                    ${ams.price}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Specs - Compact */}
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                              {ams.specs?.filament_types && (
                                <div className="line-clamp-1">{ams.specs.filament_types}</div>
                              )}
                            </div>

                            {/* Badges and Brand Logo Row */}
                            <div className="flex items-end justify-between gap-2 mt-auto pt-1.5">
                              <div className="flex flex-wrap gap-1">
                                {ams.specs?.drying_capability && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Drying</Badge>
                                )}
                                {ams.specs?.humidity_control && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Humidity</Badge>
                                )}
                                {ams.specs?.color_mixing && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Color Mix</Badge>
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
