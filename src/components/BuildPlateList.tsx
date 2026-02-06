import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, ChevronDown } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import AccessoryCard from "@/components/AccessoryCard";
import { cn } from "@/lib/utils";

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

  // Sort filtered plates
  const sortedBuildPlates = useMemo(() => {
    const sorted = [...filteredBuildPlates];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => (a.price || 999999) - (b.price || 999999));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "alphabetical":
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredBuildPlates, sortBy]);

  // Group by brand
  const groupedBuildPlates = useMemo(() => {
    const groups: Record<string, BuildPlate[]> = {};
    
    sortedBuildPlates.forEach(bp => {
      const brand = bp.brand || "Unknown";
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(bp);
    });
    
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [sortedBuildPlates]);

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
          {Array.from({ length: 6 }).map((_, i) => (
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
          <span className="text-primary">{filteredBuildPlates.length}</span>{" "}
          <span className="text-foreground">build plates</span>
        </h2>

        {/* Filters - Full width on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Input
            type="text"
            placeholder="Search build plates..."
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
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grouped list */}
      {filteredBuildPlates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No build plates found matching your criteria
        </div>
      ) : (
        <div className="space-y-0">
          {groupedBuildPlates.map(([brand, plates], index) => {
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
                  {brandLogo && (
                    <img
                      src={brandLogo}
                      alt={brand}
                      className="h-6 w-auto object-contain"
                    />
                  )}
                  <h3 className="text-lg font-bold text-white">{brand}</h3>
                  <span className="bg-primary/20 text-primary rounded-full px-2 py-0.5 text-sm">
                    {plates.length}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )} 
                  />
                </button>

                {/* Build plate grid - Single column on mobile */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                    {plates.map((plate) => {
                      const specs = plate.specs as Record<string, unknown> | null;
                      const surface = specs?.surface as string | undefined;
                      const isMagnetic = specs?.magnetic as boolean | undefined;
                      const maxTemp = specs?.max_temp_c as number | undefined;
                      
                      const badges: { label: string }[] = [];
                      if (isMagnetic) badges.push({ label: "Magnetic" });
                      if (surface) badges.push({ label: surface });
                      
                      return (
                        <AccessoryCard
                          key={plate.id}
                          id={plate.id}
                          name={plate.name}
                          brand={plate.brand || "Unknown"}
                          price={null}
                          priceUsd={plate.price}
                          imageUrl={plate.image_url}
                          href={`/build-plates/${plate.id}`}
                          type="build_plate"
                          discontinued={plate.product_url === 'DISCONTINUED'}
                          badges={badges}
                          specs={
                            maxTemp ? (
                              <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3" />
                                <span>Up to {maxTemp}°C</span>
                              </div>
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
