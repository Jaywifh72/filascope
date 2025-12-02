import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

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
        groupedAMS.map(([brand, systems]) => (
          <div key={brand} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{brand}</h3>
              <Badge variant="secondary">{systems.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.map(ams => (
                <Link key={ams.id} to={`/ams/${ams.id}`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {/* Image */}
                    <div className="aspect-square mb-4 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
                      {ams.image_url ? (
                        <img
                          src={ams.image_url}
                          alt={ams.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.image-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`image-fallback flex flex-col items-center justify-center text-muted-foreground ${ams.image_url ? 'hidden' : ''}`}>
                        <Layers className="h-12 w-12 mb-2 opacity-30" />
                        <span className="text-xs">No image</span>
                      </div>
                    </div>

                    {/* Name */}
                    <h4 className="font-semibold mb-2 line-clamp-2">{ams.name}</h4>

                    {/* Key Specs */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ams.specs?.max_spools && (
                        <Badge variant="outline" className="text-xs">
                          {ams.specs.max_spools} Spools
                        </Badge>
                      )}
                      {ams.specs?.drying_capability && (
                        <Badge variant="outline" className="text-xs">Drying</Badge>
                      )}
                      {ams.specs?.humidity_control && (
                        <Badge variant="outline" className="text-xs">Humidity Control</Badge>
                      )}
                      {ams.specs?.color_mixing && (
                        <Badge variant="outline" className="text-xs">Color Mixing</Badge>
                      )}
                    </div>

                    {/* Price */}
                    {ams.price && (
                      <p className="text-lg font-bold text-primary">${ams.price}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
