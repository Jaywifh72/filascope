import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, CircleDot, Package } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export default function NozzleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

  // Fetch all nozzles
  const { data: nozzles, isLoading } = useQuery({
    queryKey: ["nozzles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("accessory_type", "nozzle")
        .order("brand")
        .order("name");

      if (error) throw error;
      return data as Accessory[];
    },
  });

  // Get unique brands
  const brands = useMemo(() => {
    if (!nozzles) return [];
    const brandSet = new Set<string>();
    nozzles.forEach(n => {
      if (n.brand) brandSet.add(n.brand);
    });
    return Array.from(brandSet).sort();
  }, [nozzles]);

  // Filter nozzles
  const filteredNozzles = useMemo(() => {
    if (!nozzles) return [];

    return nozzles.filter(nozzle => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!nozzle.name.toLowerCase().includes(search) &&
            !nozzle.brand?.toLowerCase().includes(search) &&
            !nozzle.model?.toLowerCase().includes(search)) {
          return false;
        }
      }

      if (selectedBrand !== "all" && nozzle.brand !== selectedBrand) {
        return false;
      }

      return true;
    });
  }, [nozzles, searchTerm, selectedBrand]);

  // Group nozzles by brand
  const nozzlesByBrand = useMemo(() => {
    const grouped: Record<string, Accessory[]> = {};
    
    filteredNozzles.forEach(nozzle => {
      const brand = nozzle.brand || "Unknown";
      if (!grouped[brand]) {
        grouped[brand] = [];
      }
      grouped[brand].push(nozzle);
    });

    return grouped;
  }, [filteredNozzles]);

  const sortedBrands = Object.keys(nozzlesByBrand).sort();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Search nozzles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2"
        />

        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {filteredNozzles.length} <span className="text-muted-foreground font-normal">nozzles</span>
        </h2>
      </div>

      {/* Nozzles by Brand */}
      {filteredNozzles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No nozzles found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedBrands.map(brand => (
            <div key={brand} className="space-y-4">
              {/* Brand Header */}
              <div className="flex items-center gap-4 border-b pb-2">
                {getBrandLogo(brand) && (
                  <img
                    src={getBrandLogo(brand)!}
                    alt={`${brand} logo`}
                    className="h-8 w-auto object-contain"
                  />
                )}
                <h3 className="text-xl font-semibold">{brand}</h3>
                <Badge variant="secondary">{nozzlesByBrand[brand].length}</Badge>
              </div>

              {/* Nozzle Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nozzlesByBrand[brand].map(nozzle => {
                  const specs = nozzle.specs as Record<string, unknown> | null;
                  
                  return (
                    <Link key={nozzle.id} to={`/nozzles/${nozzle.id}`}>
                      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        {/* Image */}
                        {nozzle.image_url && (
                          <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={nozzle.image_url}
                              alt={nozzle.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {/* Name */}
                        <h4 className="font-semibold text-sm line-clamp-2 mb-2">{nozzle.name}</h4>

                        {/* Quick Specs */}
                        <div className="space-y-1.5 text-xs">
                          {specs?.diameter && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CircleDot className="h-3.5 w-3.5" />
                              <span>{String(specs.diameter)}mm</span>
                            </div>
                          )}
                          
                          {specs?.material && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Package className="h-3.5 w-3.5" />
                              <span>{String(specs.material)}</span>
                            </div>
                          )}

                          {specs?.max_temp && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Thermometer className="h-3.5 w-3.5" />
                              <span>Up to {String(specs.max_temp)}°C</span>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {specs?.hardened && (
                            <Badge variant="outline" className="text-xs">Hardened</Badge>
                          )}
                          {nozzle.model && (
                            <Badge variant="secondary" className="text-xs">{nozzle.model}</Badge>
                          )}
                        </div>

                        {/* Price */}
                        {nozzle.price && (
                          <div className="mt-3 pt-3 border-t">
                            <span className="font-bold text-primary">
                              ${nozzle.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
