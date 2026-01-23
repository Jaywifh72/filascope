import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BrandsHeroSection from "@/components/BrandsHeroSection";
import BrandsSidebar, { type BrandFilters } from "@/components/brands/BrandsSidebar";
import BrandsActiveFilters from "@/components/brands/BrandsActiveFilters";
import BrandCard from "@/components/brands/BrandCard";
import { toast } from "sonner";

// Interface for merged brand data with materials
interface MergedBrand {
  name: string;
  count: number;
  spoolMaterial: "Cardboard" | "Plastic" | "Mixed" | null;
  hasHighSpeed: boolean;
  avgTransmissionDistance: number | null;
  colors: string[];
  topMaterials: string[];
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

const getSyncStatus = (lastScrape: string | null) => {
  if (!lastScrape) return { color: "bg-muted-foreground", label: "Never synced" };
  const hours = (Date.now() - new Date(lastScrape).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return { color: "bg-green-500", label: "Synced recently" };
  if (hours < 72) return { color: "bg-amber-500", label: "Synced 1-3 days ago" };
  return { color: "bg-red-500", label: "Needs sync" };
};


const Brands = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
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

  // Merge automated brand metadata with filament stats - automated_brands is PRIMARY source
  const mergedBrands = useMemo(() => {
    if (!automatedBrands) return [];
    
    // Start with all automated brands as the primary source
    const fromAutomated = automatedBrands.map(ab => {
      const filamentStats = brands?.find(
        b => b.name.toLowerCase() === ab.brand_name.toLowerCase() ||
             b.name.toLowerCase() === ab.display_name.toLowerCase()
      );
      return {
        name: ab.display_name,
        count: filamentStats?.count || ab.product_count || 0,
        spoolMaterial: filamentStats?.spoolMaterial || null,
        hasHighSpeed: filamentStats?.hasHighSpeed || false,
        avgTransmissionDistance: filamentStats?.avgTransmissionDistance || null,
        colors: filamentStats?.colors || [],
        topMaterials: detectMaterialsForBrand(ab.display_name),
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
        topMaterials: detectMaterialsForBrand(b.name),
        automated: null,
      } as MergedBrand));

    return [...fromAutomated, ...additionalBrands].sort((a, b) => b.count - a.count);
  }, [brands, automatedBrands]);

  // Get featured brands
  const featuredBrands = useMemo(() => {
    return mergedBrands.filter(b => b.automated?.featured);
  }, [mergedBrands]);

  // Get platform counts - simplified since public view doesn't have platform_type
  const platformCounts = useMemo(() => {
    return { "all": mergedBrands.length };
  }, [mergedBrands.length]);

  const platforms = Object.keys(platformCounts).filter(p => p !== "all").sort();

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
      
      // Platform filter - removed since public view doesn't have platform_type
      const matchesPlatform = !selectedPlatform || true;
      
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
      
      return matchesSearch && matchesPlatform && matchesVerified && matchesLivePricing && 
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
  }, [mergedBrands, searchQuery, selectedPlatform, filters]);

  // Check if any filters are active (besides default sort)
  const hasActiveFilters = filters.materials.length > 0 || 
                          filters.features.length > 0 || 
                          filters.verifiedOnly || 
                          filters.hasLivePricing || 
                          filters.filamentCountRange !== null;

  // Stats
  const totalProducts = brands?.reduce((sum, b) => sum + b.count, 0) || 0;
  const brandCount = automatedBrands?.length || 0;

  const handleOpenQuiz = () => {
    toast.info("Brand Quiz coming soon!", {
      description: "We're building a personalized brand matching experience."
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <BrandsHeroSection
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        brandCount={brandCount}
        productCount={totalProducts}
        onOpenQuiz={handleOpenQuiz}
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
            {/* Platform Filter Tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                variant={selectedPlatform === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
              >
                All ({mergedBrands.length})
              </Button>
              {platforms.map((platform) => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform)}
                  className="capitalize"
                >
                  {platform} ({platformCounts[platform]})
                </Button>
              ))}
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <BrandsActiveFilters
                filters={filters}
                onFiltersChange={setFilters}
                className="mb-4"
              />
            )}

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-primary font-semibold">{filteredBrands.length}</span> of {mergedBrands.length} brands
              </p>
            </div>

            {/* Brands Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading brands...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBrands.map((brand) => (
                  <BrandCard
                    key={brand.name}
                    name={brand.name}
                    count={brand.count}
                    isVerified={VERIFIED_BRANDS.includes(brand.name)}
                    hasHighSpeed={brand.hasHighSpeed}
                    topMaterials={brand.topMaterials}
                    logoUrl={brand.automated?.logo_url}
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
              <p className="text-3xl font-bold text-primary">{platforms.length}</p>
              <p className="text-sm text-muted-foreground">Platforms</p>
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
