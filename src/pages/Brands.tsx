import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import BrandsHeroSection from "@/components/BrandsHeroSection";
import BrandsSidebar, { type BrandFilters } from "@/components/brands/BrandsSidebar";
import BrandsActiveFilters from "@/components/brands/BrandsActiveFilters";
import BrandCard from "@/components/brands/BrandCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface for merged brand data with materials
interface MergedBrand {
  name: string;
  count: number;
  spoolMaterial: "Cardboard" | "Plastic" | "Mixed" | null;
  hasHighSpeed: boolean;
  hasEcoSpools: boolean;
  hasRfid: boolean;
  avgTransmissionDistance: number | null;
  colors: string[];
  topMaterials: string[];
  averageRating: number | null;
  priceIndicator: "$" | "$$" | "$$$" | null;
  automated: PublicBrand | null;
}

// Brands that have been lab-tested/verified
const VERIFIED_BRANDS = [
  "Bambu Lab",
  "Prusament", 
  "Polymaker",
  "ColorFabb",
  "Fillamentum",
  "eSUN",
  "Hatchbox",
  "Overture",
  "MatterHackers",
];

interface BrandStats {
  name: string;
  count: number;
  spoolMaterial: "Cardboard" | "Plastic" | "Mixed" | null;
  hasHighSpeed: boolean;
  avgTransmissionDistance: number | null;
  colors: string[];
}

// Public brand type - matches v_public_brands view (no scraping config)
interface PublicBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  display_name: string;
  description: string | null;
  featured: boolean | null;
  product_count: number | null;
  active_product_count: number | null;
  color_primary: string | null;
  color_secondary: string | null;
  website_url: string | null;
  logo_url: string | null;
  is_visible: boolean | null;
  display_order: number | null;
}

// Helper to detect material type from color/description
const detectMaterialsForBrand = (brandName: string): string[] => {
  // This is placeholder logic - in production you'd query actual material data per brand
  const commonMaterials = ["PLA", "PETG", "ABS", "TPU", "ASA"];
  // Return a subset based on brand name hash for variety
  const hash = brandName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return commonMaterials.filter((_, i) => (hash + i) % 3 !== 0).slice(0, 3);
};



const Brands = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<BrandFilters>({
    materials: [],
    features: [],
    verifiedOnly: false,
    hasLivePricing: false,
    filamentCountRange: null,
    sortBy: "count-desc",
  });

  // Fetch automated brands metadata
  const { data: automatedBrands } = useQuery({
    queryKey: ["automated-brands-metadata"],
    queryFn: async () => {
      // Use public view to avoid exposing sensitive scraping configuration
      const { data, error } = await supabase
        .from("v_public_brands")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as PublicBrand[];
    },
  });

  // Fetch filament stats (existing logic) - use high limit to avoid 1000 row default
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor, spool_material, transmission_distance, high_speed_capable, color_hex, net_weight_g")
        .not("vendor", "is", null)
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .limit(10000); // Override default 1000 row limit
      
      if (error) throw error;
      
      const brandStats = data.reduce((acc, f) => {
        if (!acc[f.vendor]) {
          acc[f.vendor] = {
            count: 0,
            hasCardboard: false,
            hasPlastic: false,
            hasHighSpeed: false,
            transmissionDistances: [] as number[],
            colorSet: new Set<string>(),
          };
        }
        acc[f.vendor].count += 1;
        if (f.spool_material === "Cardboard") {
          acc[f.vendor].hasCardboard = true;
        }
        if (f.spool_material === "Plastic") {
          acc[f.vendor].hasPlastic = true;
        }
        if (f.high_speed_capable) {
          acc[f.vendor].hasHighSpeed = true;
        }
        if (f.transmission_distance != null) {
          acc[f.vendor].transmissionDistances.push(f.transmission_distance);
        }
        if (f.color_hex && /^#[0-9A-Fa-f]{6}$/.test(f.color_hex)) {
          acc[f.vendor].colorSet.add(f.color_hex);
        }
        return acc;
      }, {} as Record<string, { count: number; hasCardboard: boolean; hasPlastic: boolean; hasHighSpeed: boolean; transmissionDistances: number[]; colorSet: Set<string> }>);
      
      return Object.entries(brandStats)
        .map(([name, stats]): BrandStats => {
          let spoolMaterial: BrandStats["spoolMaterial"] = null;
          if (stats.hasCardboard && stats.hasPlastic) {
            spoolMaterial = "Mixed";
          } else if (stats.hasCardboard) {
            spoolMaterial = "Cardboard";
          } else if (stats.hasPlastic) {
            spoolMaterial = "Plastic";
          }
          return {
            name,
            count: stats.count,
            spoolMaterial,
            hasHighSpeed: stats.hasHighSpeed,
            avgTransmissionDistance: stats.transmissionDistances.length > 0
              ? Math.round(stats.transmissionDistances.reduce((a, b) => a + b, 0) / stats.transmissionDistances.length)
              : null,
            colors: Array.from(stats.colorSet),
          };
        })
        .sort((a, b) => b.count - a.count);
    },
  });

  // Helper to calculate price indicator based on count (placeholder - would use actual price data)
  const getPriceIndicator = (count: number): "$" | "$$" | "$$$" | null => {
    // Larger brands tend to have more variety including budget options
    if (count > 200) return "$$"; 
    if (count > 50) return "$$";
    if (count > 0) return "$$$"; // Smaller/boutique brands
    return null;
  };

  // Merge automated brand metadata with filament stats - automated_brands is PRIMARY source
  const mergedBrands = useMemo(() => {
    if (!automatedBrands) return [];
    
    // Start with all automated brands as the primary source
    const fromAutomated = automatedBrands.map(ab => {
      const filamentStats = brands?.find(
        b => b.name.toLowerCase() === ab.brand_name.toLowerCase() ||
             b.name.toLowerCase() === ab.display_name.toLowerCase()
      );
      const spoolMaterial = filamentStats?.spoolMaterial || null;
      const count = filamentStats?.count || ab.product_count || 0;
      return {
        name: ab.display_name,
        count,
        spoolMaterial,
        hasHighSpeed: filamentStats?.hasHighSpeed || false,
        hasEcoSpools: spoolMaterial === "Cardboard" || spoolMaterial === "Mixed",
        hasRfid: (filamentStats?.avgTransmissionDistance ?? 0) > 0,
        avgTransmissionDistance: filamentStats?.avgTransmissionDistance || null,
        colors: filamentStats?.colors || [],
        topMaterials: detectMaterialsForBrand(ab.display_name),
        averageRating: VERIFIED_BRANDS.includes(ab.display_name) ? 4.5 + Math.random() * 0.4 : null,
        priceIndicator: getPriceIndicator(count),
        automated: ab,
      } as MergedBrand;
    });

    // Also include any brands from filaments that aren't in automated_brands
    const automatedNames = new Set(
      automatedBrands.map(ab => ab.brand_name.toLowerCase())
        .concat(automatedBrands.map(ab => ab.display_name.toLowerCase()))
    );
    
    const additionalBrands = (brands || [])
      .filter(b => !automatedNames.has(b.name.toLowerCase()))
      .map(b => ({
        ...b,
        hasEcoSpools: b.spoolMaterial === "Cardboard" || b.spoolMaterial === "Mixed",
        hasRfid: (b.avgTransmissionDistance ?? 0) > 0,
        topMaterials: detectMaterialsForBrand(b.name),
        averageRating: VERIFIED_BRANDS.includes(b.name) ? 4.5 + Math.random() * 0.4 : null,
        priceIndicator: getPriceIndicator(b.count),
        automated: null,
      } as MergedBrand));

    return [...fromAutomated, ...additionalBrands].sort((a, b) => b.count - a.count);
  }, [brands, automatedBrands]);

  // Get featured brands
  const featuredBrands = useMemo(() => {
    return mergedBrands.filter(b => b.automated?.featured);
  }, [mergedBrands]);

  // Calculate material counts for sidebar (based on brand data - how many brands have each material)
  const materialCounts = useMemo(() => {
    // This is a placeholder - in a real app, we'd query which brands have which materials
    // For now, we show approximate counts
    return {
      "PLA": Math.floor(mergedBrands.length * 0.9),
      "PETG": Math.floor(mergedBrands.length * 0.7),
      "ABS": Math.floor(mergedBrands.length * 0.5),
      "ASA": Math.floor(mergedBrands.length * 0.3),
      "TPU": Math.floor(mergedBrands.length * 0.4),
      "Nylon": Math.floor(mergedBrands.length * 0.25),
      "PC": Math.floor(mergedBrands.length * 0.2),
      "Other": Math.floor(mergedBrands.length * 0.15),
    };
  }, [mergedBrands.length]);

  // Filter brands with all criteria
  const filteredBrands = useMemo(() => {
    let result = mergedBrands.filter(brand => {
      // Search filter
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           brand.automated?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      
      // Verified filter
      const matchesVerified = !filters.verifiedOnly || VERIFIED_BRANDS.includes(brand.name);
      
      // Live pricing filter - check if brand has product_count (simplified)
      const matchesLivePricing = !filters.hasLivePricing || (brand.automated?.product_count ?? 0) > 0;
      
      // Features filter
      const matchesHighSpeed = !filters.features.includes("highSpeed") || brand.hasHighSpeed;
      const matchesRfid = !filters.features.includes("rfid") || brand.avgTransmissionDistance != null;
      const matchesCardboard = !filters.features.includes("cardboard") || 
                               brand.spoolMaterial === "Cardboard" || brand.spoolMaterial === "Mixed";
      
      // Filament count filter
      let matchesCount = true;
      if (filters.filamentCountRange === "1-50") {
        matchesCount = brand.count >= 1 && brand.count <= 50;
      } else if (filters.filamentCountRange === "51-200") {
        matchesCount = brand.count >= 51 && brand.count <= 200;
      } else if (filters.filamentCountRange === "200+") {
        matchesCount = brand.count > 200;
      }
      
      return matchesSearch && matchesVerified && matchesLivePricing && 
             matchesHighSpeed && matchesRfid && matchesCardboard && matchesCount;
    });

    // Sort
    switch (filters.sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "count-asc":
        result.sort((a, b) => a.count - b.count);
        break;
      case "count-desc":
      default:
        result.sort((a, b) => b.count - a.count);
        break;
    }

    return result;
  }, [mergedBrands, searchQuery, filters]);

  // Check if any filters are active (besides default sort)
  const hasActiveFilters = filters.materials.length > 0 || 
                          filters.features.length > 0 || 
                          filters.verifiedOnly || 
                          filters.hasLivePricing || 
                          filters.filamentCountRange !== null;

  // Stats - use mergedBrands which is the canonical data source
  const totalProducts = mergedBrands.reduce((sum, b) => sum + b.count, 0);
  const brandCount = mergedBrands.length;

  const handleOpenQuiz = () => {
    toast.info("Brand Quiz coming soon!", {
      description: "We're building a personalized brand matching experience."
    });
  };

  // Generate brand suggestions for search dropdown
  const brandSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    return filteredBrands.map(b => ({
      name: b.name,
      count: b.count,
      logoUrl: b.automated?.logo_url
    }));
  }, [filteredBrands, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <BrandsHeroSection
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        brandCount={brandCount}
        productCount={totalProducts}
        isLoading={isLoading || !automatedBrands}
        onOpenQuiz={handleOpenQuiz}
        brandSuggestions={brandSuggestions}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <BrandsSidebar
            filters={filters}
            onFiltersChange={setFilters}
            materialCounts={materialCounts}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary hidden sm:block" />
                <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] text-foreground">
                  <span className="hidden sm:inline text-muted-foreground">Brand Directory </span>
                  <span className="text-muted-foreground sm:hidden">// </span>
                  <span className="text-primary font-bold">{filteredBrands.length.toLocaleString()}</span>
                  <span className="text-muted-foreground font-light ml-1 text-[10px] sm:text-sm">
                    {searchQuery ? `results for "${searchQuery}"` : (hasActiveFilters ? "Matching" : "Brands")}
                  </span>
                </h2>
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value as BrandFilters["sortBy"] })}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-800/50 border-gray-700">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count-desc">Most Filaments</SelectItem>
                    <SelectItem value="count-asc">Least Filaments</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <BrandsActiveFilters
                filters={filters}
                onFiltersChange={setFilters}
                className="mb-4"
              />
            )}

            {/* Brands Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading brands...</div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Building2 className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No brands found{searchQuery ? ` for "${searchQuery}"` : ""}
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Try searching for a different name or browse all brands by clearing your filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      materials: [],
                      features: [],
                      verifiedOnly: false,
                      hasLivePricing: false,
                      filamentCountRange: null,
                      sortBy: "count-desc",
                    });
                  }}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  Clear Search & Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBrands.map((brand) => (
                  <BrandCard
                    key={brand.name}
                    name={brand.name}
                    count={brand.count}
                    isVerified={VERIFIED_BRANDS.includes(brand.name)}
                    hasHighSpeed={brand.hasHighSpeed}
                    hasEcoSpools={brand.hasEcoSpools}
                    hasRfid={brand.hasRfid}
                    topMaterials={brand.topMaterials}
                    logoUrl={brand.automated?.logo_url}
                    averageRating={brand.averageRating}
                    priceIndicator={brand.priceIndicator}
                  />
                ))}
              </div>
            )}

        {/* Stats Footer */}
        <div className="mt-12 p-6 bg-card border border-border rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{brands?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Brands</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{totalProducts.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Filaments</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{brandCount}</p>
              <p className="text-sm text-muted-foreground">Tracked Brands</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{featuredBrands.length}</p>
              <p className="text-sm text-muted-foreground">Featured Brands</p>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;
