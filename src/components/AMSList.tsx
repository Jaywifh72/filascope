import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, ChevronDown } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import AccessoryCard from "@/components/AccessoryCard";
import { cn } from "@/lib/utils";

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
  
  // Sort state
  const [sortBy, setSortBy] = useState("alphabetical");
  
  // Collapsed brand sections
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set());
  
  const toggleBrandCollapse = (brand: string) => {
    setCollapsedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };
  
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

  // Sort filtered AMS
  const sortedAMS = useMemo(() => {
    const sorted = [...filteredAMS];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 999999) - (b.price || 999999));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "spools":
        return sorted.sort((a, b) => (b.specs?.max_spools || 0) - (a.specs?.max_spools || 0));
      case "alphabetical":
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredAMS, sortBy]);

  const groupedAMS = useMemo(() => {
    const groups: Record<string, AMS[]> = {};
    sortedAMS.forEach(ams => {
      const brand = ams.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(ams);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedAMS]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Results Header */}
      <div className="flex flex-col gap-4">
        {/* Results Count */}
        <h2 className="text-xl sm:text-2xl font-semibold">
          <span className="text-primary">{filteredAMS.length}</span>{" "}
          <span className="text-foreground">AMS/MMU systems</span>
        </h2>

        {/* Filters - Full width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Input
            type="text"
            placeholder="Search AMS/MMU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-gray-800 border-gray-700 h-10"
          />

          <div className="flex gap-2 sm:gap-3">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="flex-1 sm:w-[160px] bg-gray-800 border-gray-700 h-10">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 sm:w-[160px] bg-gray-800 border-gray-700 h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="spools">Most Spools</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* AMS Grid grouped by brand */}
      {groupedAMS.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No AMS/MMU systems found</p>
        </div>
      ) : (
        <div className="space-y-0">
          {groupedAMS.map(([brand, systems], index) => {
            const brandLogo = getBrandLogo(brand);
            const isCollapsed = collapsedBrands.has(brand);
            
            return (
              <div 
                key={brand} 
                className={cn(
                  "space-y-4",
                  index > 0 && "border-t border-gray-700/50 pt-6 mt-6"
                )}
              >
                {/* Brand header */}
                <button
                  onClick={() => toggleBrandCollapse(brand)}
                  className="flex items-center gap-3 w-full text-left group hover:opacity-80 transition-opacity"
                >
                  <BrandLogo src={brandLogo} brandName={brand} size="sm" />
                  <h3 className="text-lg font-bold text-white">{brand}</h3>
                  <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-sm">
                    {systems.length}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )} 
                  />
                </button>
                
                {/* AMS grid - Single column on mobile */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
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
                          price={null}
                          priceUsd={ams.price}
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
