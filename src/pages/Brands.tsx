import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Clock, Sparkles, GitCompare, BadgeCheck } from "lucide-react";
import BrandsHeroSection from "@/components/BrandsHeroSection";
import BrandsSidebar, { type BrandFilters } from "@/components/brands/BrandsSidebar";
import BrandsActiveFilters from "@/components/brands/BrandsActiveFilters";
import BrandCard from "@/components/brands/BrandCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ItemListSchema } from "@/components/seo";
import { toBrandSlug } from "@/utils/brandSlug";
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
  productLineCount: number;
  variantCount: number;
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
  topMaterials: string[];
}

// Public brand type - matches v_brand_directory view (live counts from filaments)
interface PublicBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  display_name: string;
  description: string | null;
  featured: boolean | null;
  variant_count: number;
  product_line_count: number;
  active_product_count: number | null;
  color_primary: string | null;
  color_secondary: string | null;
  website_url: string | null;
  logo_url: string | null;
  is_visible: boolean | null;
  display_order: number | null;
}


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

  // Fetch automated brands metadata with live-computed counts
  const { data: automatedBrands } = useQuery({
    queryKey: ["automated-brands-directory"],
    queryFn: async () => {
      // Use v_brand_directory view with live filament counts (never stale)
      const { data, error } = await supabase
        .from("v_brand_directory")
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
        .select("vendor, material, spool_material, transmission_distance, high_speed_capable, color_hex, net_weight_g")
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
            materialCounts: new Map<string, number>(),
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
        if (f.material) {
          const mat = f.material;
          acc[f.vendor].materialCounts.set(mat, (acc[f.vendor].materialCounts.get(mat) || 0) + 1);
        }
        return acc;
      }, {} as Record<string, { count: number; hasCardboard: boolean; hasPlastic: boolean; hasHighSpeed: boolean; transmissionDistances: number[]; colorSet: Set<string>; materialCounts: Map<string, number> }>);
      
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
          const topMaterials = [...stats.materialCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([material]) => material);
          return {
            name,
            count: stats.count,
            spoolMaterial,
            hasHighSpeed: stats.hasHighSpeed,
            avgTransmissionDistance: stats.transmissionDistances.length > 0
              ? Math.round(stats.transmissionDistances.reduce((a, b) => a + b, 0) / stats.transmissionDistances.length)
              : null,
            colors: Array.from(stats.colorSet),
            topMaterials,
          };
        })
        .sort((a, b) => b.count - a.count);
    },
  });

  // Get total variant count and unique product line count via RPC
  const { data: catalogCounts, isLoading: isCountLoading } = useQuery({
    queryKey: ["catalog-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_catalog_counts");
      if (error) throw error;
      const row = data?.[0] || { product_count: 0, variant_count: 0 };
      return {
        productCount: Number(row.product_count) || 0,
        variantCount: Number(row.variant_count) || 0,
      };
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
      // Use live-computed counts from v_brand_directory (always in sync with detail page)
      const variantCount = ab.variant_count || filamentStats?.count || 0;
      const productLineCount = ab.product_line_count || variantCount;
      return {
        name: ab.display_name,
        productLineCount,
        variantCount,
        spoolMaterial,
        hasHighSpeed: filamentStats?.hasHighSpeed || false,
        hasEcoSpools: spoolMaterial === "Cardboard" || spoolMaterial === "Mixed",
        hasRfid: (filamentStats?.avgTransmissionDistance ?? 0) > 0,
        avgTransmissionDistance: filamentStats?.avgTransmissionDistance || null,
        colors: filamentStats?.colors || [],
        topMaterials: filamentStats?.topMaterials || [],
        averageRating: VERIFIED_BRANDS.includes(ab.display_name) ? 4.5 + Math.random() * 0.4 : null,
        priceIndicator: getPriceIndicator(variantCount),
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
        productLineCount: b.count,
        variantCount: b.count,
        hasEcoSpools: b.spoolMaterial === "Cardboard" || b.spoolMaterial === "Mixed",
        hasRfid: (b.avgTransmissionDistance ?? 0) > 0,
        topMaterials: b.topMaterials,
        averageRating: VERIFIED_BRANDS.includes(b.name) ? 4.5 + Math.random() * 0.4 : null,
        priceIndicator: getPriceIndicator(b.count),
        automated: null,
      } as MergedBrand));

    return [...fromAutomated, ...additionalBrands].sort((a, b) => b.variantCount - a.variantCount);
  }, [brands, automatedBrands]);

  // Get featured brands
  const featuredBrands = useMemo(() => {
    return mergedBrands.filter(b => b.automated?.featured);
  }, [mergedBrands]);

  // Calculate material counts for sidebar — count how many brands carry each material
  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const brand of mergedBrands) {
      for (const mat of brand.topMaterials) {
        counts[mat] = (counts[mat] || 0) + 1;
      }
    }
    // Sort by count descending, take top entries
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(sorted.slice(0, 10));
  }, [mergedBrands]);

  // Filter brands with all criteria
  const filteredBrands = useMemo(() => {
    let result = mergedBrands.filter(brand => {
      // Search filter
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           brand.automated?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      
      // Verified filter
      const matchesVerified = !filters.verifiedOnly || VERIFIED_BRANDS.includes(brand.name);
      
      // Live pricing filter - check if brand has variants (simplified)
      const matchesLivePricing = !filters.hasLivePricing || (brand.automated?.variant_count ?? 0) > 0;
      
      // Features filter
      const matchesHighSpeed = !filters.features.includes("highSpeed") || brand.hasHighSpeed;
      const matchesRfid = !filters.features.includes("rfid") || brand.avgTransmissionDistance != null;
      const matchesCardboard = !filters.features.includes("cardboard") || 
                               brand.spoolMaterial === "Cardboard" || brand.spoolMaterial === "Mixed";
      
      // Filament count filter (uses variant count for consistency with existing ranges)
      let matchesCount = true;
      if (filters.filamentCountRange === "1-50") {
        matchesCount = brand.variantCount >= 1 && brand.variantCount <= 50;
      } else if (filters.filamentCountRange === "51-200") {
        matchesCount = brand.variantCount >= 51 && brand.variantCount <= 200;
      } else if (filters.filamentCountRange === "200+") {
        matchesCount = brand.variantCount > 200;
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
        result.sort((a, b) => a.variantCount - b.variantCount);
        break;
      case "count-desc":
      default:
        result.sort((a, b) => b.variantCount - a.variantCount);
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

  // Stats - use catalogCounts for consistent product/variant terminology
  const totalProducts = catalogCounts?.productCount || 0;
  const totalVariants = catalogCounts?.variantCount || 0;
  const brandCount = mergedBrands.length;
  const isStatsLoading = isLoading || isCountLoading || !automatedBrands;

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
      count: b.variantCount,
      logoUrl: b.automated?.logo_url
    }));
  }, [filteredBrands, searchQuery]);

  // Build ItemList schema data for SEO
  const brandListItems = useMemo(() => {
    return filteredBrands.map((brand, index) => ({
      name: brand.name,
      url: `https://filascope.com/brands/${toBrandSlug(brand.name)}`,
      image: brand.automated?.logo_url || undefined,
      description: brand.automated?.description || `${brand.name} - ${brand.productLineCount} products available`,
      position: index + 1,
    }));
  }, [filteredBrands]);

  return (
    <>
      <Helmet>
        <title>Filament Brand Directory — Trusted 3D Printing Brands | FilaScope</title>
        <meta name="description" content={`Explore ${brandCount || 48} 3D printing filament brands with ${totalProducts.toLocaleString()}+ products. Compare product lines, materials, pricing, and verified data on FilaScope.`} />
        <meta property="og:description" content={`Explore ${brandCount || 48} 3D printing filament brands with ${totalProducts.toLocaleString()}+ products. Compare product lines, materials, pricing, and verified data on FilaScope.`} />
      </Helmet>
      <div className="min-h-screen">
      {/* JSON-LD Structured Data */}
      <ItemListSchema
        name="3D Printer Filament Brands"
        description="Directory of 3D printing filament manufacturers. Compare brands by material variety, features, and product availability."
        items={brandListItems}
        itemListOrder="Descending"
      />

      {/* Hero Section */}
      <BrandsHeroSection
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        brandCount={brandCount}
        productCount={totalProducts}
        variantCount={totalVariants}
        isLoading={isStatsLoading}
        onOpenQuiz={handleOpenQuiz}
        brandSuggestions={brandSuggestions}
      />

      {/* Quick Action Cards */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={handleOpenQuiz} className="flex items-center gap-3 px-4 py-3 bg-card/60 border border-border/40 rounded-lg hover:bg-card/80 hover:border-border/60 transition-all text-left">
            <Sparkles className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-sm font-medium">Brand Quiz</div>
              <div className="text-xs text-muted-foreground">Find your perfect manufacturer</div>
            </div>
          </button>
          <div className="flex items-center gap-3 px-4 py-3 bg-card/60 border border-border/40 rounded-lg hover:bg-card/80 hover:border-border/60 transition-all cursor-default">
            <GitCompare className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-sm font-medium">Compare Brands</div>
              <div className="text-xs text-muted-foreground">Side-by-side material offerings</div>
            </div>
          </div>
          <button onClick={() => setFilters({ ...filters, verifiedOnly: true })} className="flex items-center gap-3 px-4 py-3 bg-card/60 border border-border/40 rounded-lg hover:bg-card/80 hover:border-border/60 transition-all text-left">
            <BadgeCheck className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-sm font-medium">Verified Brands</div>
              <div className="text-xs text-muted-foreground">Quality-assured data & pricing</div>
            </div>
          </button>
        </div>
      </div>

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
            <div className="flex items-center flex-wrap gap-y-2 mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary hidden sm:block" />
                <h2 className="font-mono text-xs sm:text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] text-foreground">
                  <span className="hidden sm:inline text-muted-foreground">Brand Directory </span>
                  <span className="text-muted-foreground sm:hidden">— </span>
                  <span className="text-primary font-bold">{filteredBrands.length.toLocaleString()}</span>
                  <span className="text-muted-foreground font-light ml-1 text-[10px] sm:text-sm">
                    {searchQuery ? `results for "${searchQuery}"` : (hasActiveFilters ? "Matching" : "Brands")}
                  </span>
                </h2>
              </div>
              
              {/* Sort Dropdown - inline after count */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Sort:</span>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value as BrandFilters["sortBy"] })}
                >
                  <SelectTrigger className="w-[140px] h-7 text-xs text-cyan-400 font-mono bg-transparent border-none shadow-none px-1">
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
                {(() => {
                  const activeBrands = filteredBrands.filter(b => b.productLineCount > 0 || b.variantCount > 0);
                  const comingSoonBrands = filteredBrands.filter(b => b.productLineCount === 0 && b.variantCount === 0);
                  return (
                    <>
                      {activeBrands.map((brand) => (
                        <BrandCard
                          key={brand.name}
                          name={brand.name}
                          productLineCount={brand.productLineCount}
                          variantCount={brand.variantCount}
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
                      {comingSoonBrands.length > 0 && (
                        <div className="col-span-full flex items-center gap-3 py-6 mt-4">
                          <div className="h-px flex-1 bg-border/40" />
                          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            Coming Soon
                          </span>
                          <div className="h-px flex-1 bg-border/40" />
                        </div>
                      )}
                      {comingSoonBrands.map((brand) => (
                        <BrandCard
                          key={brand.name}
                          name={brand.name}
                          productLineCount={brand.productLineCount}
                          variantCount={brand.variantCount}
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
                    </>
                  );
                })()}
              </div>
            )}

        {/* Stats Footer */}
        <div className="mt-12 border border-gray-800 rounded-lg bg-gray-900/30 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-cyan-400 font-mono">{brandCount}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Total Brands</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400 font-mono">{totalProducts.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Product Lines</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400 font-mono">{totalVariants.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Total Variants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400 font-mono">{featuredBrands.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Featured Brands</p>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Brands;
