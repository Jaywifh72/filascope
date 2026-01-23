import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import AccessoryCard from "@/components/AccessoryCard";

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
                  {systems.map(ams => {
                    const badges: { label: string }[] = [];
                    if (ams.specs?.drying_capability) badges.push({ label: "Drying" });
                    if (ams.specs?.humidity_control) badges.push({ label: "Humidity" });
                    if (ams.specs?.color_mixing) badges.push({ label: "Color Mix" });
                    
                    return (
                      <AccessoryCard
                        key={ams.id}
                        id={ams.id}
                        name={ams.name}
                        subtitle={ams.specs?.max_spools ? `${ams.specs.max_spools} Spools` : undefined}
                        brand={ams.brand || "Unknown"}
                        price={ams.price}
                        imageUrl={ams.image_url}
                        href={`/ams/${ams.id}`}
                        type="ams_mmu"
                        badges={badges}
                        specs={
                          ams.specs?.filament_types ? (
                            <div className="line-clamp-1">{ams.specs.filament_types}</div>
                          ) : null
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
