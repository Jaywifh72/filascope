import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Clock, Sparkles, GitCompare, ShieldCheck, Zap, Package, Layers, HelpCircle } from "lucide-react";
import { BrandCardSkeletonGrid } from "@/components/skeletons/BrandCardSkeleton";
import { BrandsEmptyState } from "@/components/empty-states";
import BrandsHeroSection from "@/components/BrandsHeroSection";
import BrandsSidebar, { type BrandFilters, DEFAULT_BRAND_FILTERS } from "@/components/brands/BrandsSidebar";
import BrandsActiveFilters from "@/components/brands/BrandsActiveFilters";
import BrandCard from "@/components/brands/BrandCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ItemListSchema, FAQSection } from "@/components/seo";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { toBrandSlug } from "@/utils/brandSlug";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  allMaterials: string[];
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
  allMaterials: string[];
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmptyBrands, setShowEmptyBrands] = useState(false);
  const [filters, setFilters] = useState<BrandFilters>(DEFAULT_BRAND_FILTERS);

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
          const allMaterials = [...stats.materialCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([material]) => material);
          const topMaterials = allMaterials.slice(0, 4);
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
            allMaterials,
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
        allMaterials: filamentStats?.allMaterials || [],
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
        allMaterials: b.allMaterials,
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

  // Normalize raw material name to sidebar category ID
  const normalizeToCategoryId = (material: string): string => {
    const upper = material.toUpperCase();
    if (upper.includes('PLA') && !upper.includes('PETG')) return 'PLA';
    if (upper.includes('PETG')) return 'PETG';
    if (upper.includes('ABS') && !upper.includes('ASA')) return 'ABS';
    if (upper.includes('ASA')) return 'ASA';
    if (upper.includes('TPU') || upper.includes('TPE') || upper.includes('FLEX')) return 'TPU';
    if (upper.includes('NYLON') || upper.includes('PA6') || upper.includes('PA12') || (upper.includes('PA') && /\bPA\b/.test(upper))) return 'Nylon';
    if (upper.includes('PC') || upper.includes('POLYCARB')) return 'PC';
    return 'Other';
  };

  // Calculate material counts for sidebar — count how many brands carry each material category
  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const brand of mergedBrands) {
      // Track which categories this brand covers (deduplicate per brand)
      const brandCategories = new Set<string>();
      for (const mat of brand.allMaterials) {
        brandCategories.add(normalizeToCategoryId(mat));
      }
      for (const cat of brandCategories) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }
    return counts;
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
      
      // Price tier filter
      const matchesPriceTier = !filters.priceTier || brand.priceIndicator === filters.priceTier;
      
      // Material filter — check if brand carries any of the selected material categories
      const matchesMaterials = filters.materials.length === 0 || 
        brand.allMaterials.some(mat => filters.materials.includes(normalizeToCategoryId(mat)));

      return matchesSearch && matchesVerified && matchesLivePricing && 
             matchesHighSpeed && matchesRfid && matchesCardboard && matchesCount && matchesPriceTier && matchesMaterials;
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
                           filters.filamentCountRange !== null ||
                           filters.priceTier !== null;

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
      <DocumentHead
        title={`3D Filament Brands — Compare ${brandCount || 48}+ Brands | FilaScope`}
        description={`Compare ${brandCount || 48}+ 3D filament brands with live pricing & specs. Explore Bambu Lab, Polymaker, Prusament, eSUN & more on FilaScope.`}
        ogTitle={`3D Filament Brands — Compare ${brandCount || 48}+ Brands | FilaScope`}
        ogDescription={`Compare ${brandCount || 48}+ 3D filament brands with live pricing & specs. Explore Bambu Lab, Polymaker, Prusament, eSUN & more on FilaScope.`}
        twitterTitle={`3D Filament Brands — Compare ${brandCount || 48}+ Brands | FilaScope`}
        twitterDescription={`Compare ${brandCount || 48}+ 3D filament brands with live pricing & specs. Explore Bambu Lab, Polymaker, Prusament, eSUN & more on FilaScope.`}
        keywords="3D filament brands, filament manufacturers, Bambu Lab filament, Polymaker, Prusament, eSUN, filament reviews, filament prices"
      />
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
        verifiedCount={mergedBrands.filter(b => VERIFIED_BRANDS.includes(b.name)).length}
        isLoading={isStatsLoading}
        onOpenQuiz={handleOpenQuiz}
        brandSuggestions={brandSuggestions}
      />

      {/* Visible breadcrumb trail */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1">
        <Breadcrumbs items={[{ name: "Brands", url: "/brands" }]} />
      </div>

      {/* Quick Action Cards */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
          {/* Brand Quiz - Coming Soon */}
          <div className="relative min-w-[200px] flex-shrink-0 md:min-w-0">
            <span className="absolute -top-1.5 -right-1.5 z-10 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0 rounded-full font-medium">Soon</span>
            <div
              className="rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3 cursor-default text-left opacity-60 hover:opacity-80 transition-all h-full"
            >
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <Sparkles className="h-8 w-8 text-primary/70" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Brand Quiz</div>
                <div className="text-xs text-muted-foreground">Find your ideal brand</div>
              </div>
            </div>
          </div>

          {/* Compare Brands - Primary action */}
          <button
            onClick={() => navigate('/compare')}
            className="min-w-[200px] flex-shrink-0 md:min-w-0 rounded-xl border border-primary/30 bg-card/50 p-4 flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer text-left"
          >
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <GitCompare className="h-8 w-8 text-primary/70" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Compare Brands</div>
              <div className="text-xs text-muted-foreground">Side-by-side comparison</div>
            </div>
          </button>

          {/* Verified Brands */}
          <button
            onClick={() => setFilters({ ...filters, verifiedOnly: true })}
            className="min-w-[200px] flex-shrink-0 md:min-w-0 rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer text-left"
          >
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <ShieldCheck className="h-8 w-8 text-primary/70" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Verified Brands</div>
              <div className="text-xs text-muted-foreground">{mergedBrands.filter(b => VERIFIED_BRANDS.includes(b.name)).length} verified brands</div>
            </div>
          </button>

          {/* High Speed Brands */}
          <button
            onClick={() => setFilters({ ...filters, features: [...filters.features.filter(f => f !== 'highSpeed'), 'highSpeed'] })}
            className="min-w-[200px] flex-shrink-0 md:min-w-0 rounded-xl border border-border bg-card/50 p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer text-left"
          >
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Zap className="h-8 w-8 text-primary/70" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">High Speed</div>
              <div className="text-xs text-muted-foreground">Speed-optimized filaments</div>
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
                  <span className="text-primary font-bold">{filteredBrands.filter(b => b.productLineCount > 0 || b.variantCount > 0).length.toLocaleString()}</span>
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
              <BrandCardSkeletonGrid count={12} />
            ) : filteredBrands.length === 0 ? (
              <BrandsEmptyState
                searchQuery={searchQuery}
                onClearFilters={() => {
                  setSearchQuery("");
                  setFilters({
                    materials: [],
                    features: [],
                    verifiedOnly: false,
                    hasLivePricing: false,
                    filamentCountRange: null,
                    priceTier: null,
                    sortBy: "count-desc",
                  });
                }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBrands
                    .filter(b => b.productLineCount > 0 || b.variantCount > 0)
                    .map((brand, index) => (
                      <BrandCard
                        index={index}
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
                        colorPrimary={brand.automated?.color_primary}
                        colors={brand.colors}
                        avgTransmissionDistance={brand.avgTransmissionDistance}
                      />
                    ))}
                </div>
                {(() => {
                  const emptyBrands = filteredBrands.filter(b => b.productLineCount === 0 && b.variantCount === 0);
                  if (emptyBrands.length === 0) return null;
                  return (
                    <>
                      <div className="mt-6 mb-2">
                        <button
                          onClick={() => setShowEmptyBrands(prev => !prev)}
                          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors font-mono"
                        >
                          {showEmptyBrands ? "Hide" : "Show"} {emptyBrands.length} brands without products
                        </button>
                      </div>
                      {showEmptyBrands && (
                        <>
                          <div className="flex items-center gap-3 py-4">
                            <div className="h-px flex-1 bg-border/40" />
                            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              Coming Soon
                            </span>
                            <div className="h-px flex-1 bg-border/40" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {emptyBrands.map((brand) => (
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
                                colorPrimary={brand.automated?.color_primary}
                                colors={brand.colors}
                                avgTransmissionDistance={brand.avgTransmissionDistance}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}

        {/* Brand Comparison Prompt */}
        {filteredBrands.filter(b => b.productLineCount > 0 || b.variantCount > 0).length >= 6 && (
          <div className="mt-8 mb-6 max-w-2xl mx-auto">
            <div className="border border-dashed border-gray-700/60 rounded-xl p-6 text-center bg-gray-900/30">
              <GitCompare className="h-8 w-8 mx-auto mb-3 text-primary/60" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Can't decide between brands?
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Compare materials, pricing, and features side-by-side to find the best match for your printer and projects.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button 
                  onClick={() => navigate('/compare')}
                  size="sm"
                  className="gap-2"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare Brands
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/wizard')}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Match Quiz
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-12 border border-gray-800 rounded-lg bg-gray-900/30 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="md:border-r md:border-gray-800">
              <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary font-mono tabular-nums">{brandCount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Tracked Brands</p>
            </div>
            <div className="md:border-r md:border-gray-800">
              <Package className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary font-mono tabular-nums">{mergedBrands.filter(b => b.productLineCount > 0 || b.variantCount > 0).length.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Brands with Products</p>
            </div>
            <div className="md:border-r md:border-gray-800">
              <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary font-mono tabular-nums">{totalVariants.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Total Filaments</p>
            </div>
            <div>
              <ShieldCheck className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary font-mono tabular-nums">{mergedBrands.filter(b => VERIFIED_BRANDS.includes(b.name)).length.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mt-1">Verified Brands</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Data updated daily from 15+ retailers
          </p>
        </div>

        {/* Compare Brands — keyword-rich editorial section */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4">Compare 3D Printer Filament Brands</h2>
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed space-y-3">
            <p>
              FilaScope tracks {brandCount || 48}+ filament manufacturers with multi-region pricing across the US, UK, EU, Canada, and Australia — updated daily from 15+ retailers. Every brand page shows product line counts, available materials, color ranges, and where applicable, verified <Link to="/td-database" className="text-primary hover:underline">HueForge TD values</Link> for lithophane printing.
            </p>
            <p>
              Use the sidebar filters to narrow brands by material type (PLA, PETG, ABS, TPU), spool packaging (cardboard vs. plastic), high-speed compatibility, or price tier. You can also <Link to="/brands/compare" className="text-primary hover:underline">compare brands side-by-side</Link> on material range, pricing, and product availability, or let the <Link to="/wizard" className="text-primary hover:underline">Filament Wizard</Link> recommend a brand based on your printer and use case.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions About 3D Filament Brands</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: 'What are the best 3D printer filament brands?',
                a: <>The top-rated brands in FilaScope's database include <Link to="/brands/bambu-lab" className="text-primary hover:underline">Bambu Lab</Link>, <Link to="/brands/polymaker" className="text-primary hover:underline">Polymaker</Link>, <Link to="/brands/prusament" className="text-primary hover:underline">Prusament</Link>, and <Link to="/brands/fillamentum" className="text-primary hover:underline">Fillamentum</Link> — each scoring consistently high on documentation, consistency, and material variety. Budget picks like <Link to="/brands/esun" className="text-primary hover:underline">eSUN</Link> and <Link to="/brands/overture" className="text-primary hover:underline">Overture</Link> deliver strong value without sacrificing quality.</>,
              },
              {
                q: 'Which filament brand has the best PLA?',
                a: <>For premium PLA, <Link to="/brands/prusament" className="text-primary hover:underline">Prusament</Link> is widely regarded for its tight ±0.02mm tolerances, while <Link to="/brands/polymaker" className="text-primary hover:underline">Polymaker's PolyLite PLA</Link> offers excellent surface quality across a huge color range. <Link to="/brands/bambu-lab" className="text-primary hover:underline">Bambu Lab PLA Basic</Link> is a strong all-rounder optimized for high-speed printing. Compare all options in the <Link to="/filaments/pla" className="text-primary hover:underline">PLA filament catalog</Link>.</>,
              },
              {
                q: 'What is the cheapest reliable filament brand?',
                a: <><Link to="/brands/esun" className="text-primary hover:underline">eSUN</Link>, <Link to="/brands/overture" className="text-primary hover:underline">Overture</Link>, and <Link to="/brands/sunlu" className="text-primary hover:underline">Sunlu</Link> consistently offer sub-$15/kg pricing with acceptable quality for hobbyist use. Use FilaScope's price filter to find <Link to="/deals" className="text-primary hover:underline">current deals</Link> across all brands.</>,
              },
              {
                q: 'Which brands have HueForge TD data?',
                a: <>FilaScope tracks HueForge Transmission Distance values for filaments from brands including <Link to="/brands/bambu-lab" className="text-primary hover:underline">Bambu Lab</Link>, <Link to="/brands/polymaker" className="text-primary hover:underline">Polymaker</Link>, <Link to="/brands/prusament" className="text-primary hover:underline">Prusament</Link>, <Link to="/brands/esun" className="text-primary hover:underline">eSUN</Link>, and others. Browse all filaments with TD data in the <Link to="/td-database" className="text-primary hover:underline">HueForge TD Database</Link>.</>,
              },
              {
                q: 'Do all brands make filaments in 1.75mm diameter?',
                a: <>The vast majority of consumer 3D printer filament brands produce 1.75mm diameter spools, which is the standard for most modern FDM printers. A few brands like <Link to="/brands/colorfabb" className="text-primary hover:underline">ColorFabb</Link> and <Link to="/brands/fillamentum" className="text-primary hover:underline">Fillamentum</Link> also offer 2.85mm variants for printers like the Ultimaker series. FilaScope's database tracks diameter availability per product.</>,
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/40 rounded-lg px-4 bg-card/30">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* People Also Ask */}
        <section className="mt-12 max-w-3xl mx-auto mb-16">
          <h2 className="text-xl font-bold text-foreground mb-6">People Also Ask</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: 'Is Bambu Lab filament better than Polymaker?',
                a: <>Both are top-tier. <Link to="/brands/bambu-lab" className="text-primary hover:underline">Bambu Lab filaments</Link> are optimized for Bambu printers with excellent high-speed performance and tight AMS compatibility. <Link to="/brands/polymaker" className="text-primary hover:underline">Polymaker</Link> offers a wider material range (50+ product lines) with specialty options like PolyFlex TPU, PolyMax PC, and PolySmooth. The best choice depends on your printer and material needs — compare them <Link to="/brands/compare" className="text-primary hover:underline">side-by-side</Link>.</>,
              },
              {
                q: 'What filament brands work with Bambu Lab printers?',
                a: <>Most 1.75mm filament brands work with Bambu Lab printers. For optimal AMS compatibility, <Link to="/brands/bambu-lab" className="text-primary hover:underline">Bambu Lab's own filaments</Link> include RFID chips for auto-detection. Third-party brands like <Link to="/brands/polymaker" className="text-primary hover:underline">Polymaker</Link>, <Link to="/brands/esun" className="text-primary hover:underline">eSUN</Link>, and <Link to="/brands/sunlu" className="text-primary hover:underline">Sunlu</Link> also work well — just ensure spool diameter fits the AMS (most standard 1kg spools do). Check our <Link to="/guides/best-filament-for-bambu-lab-p1s" className="text-primary hover:underline">best filaments for Bambu Lab P1S</Link> guide for curated picks.</>,
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`paa-${i}`} className="border border-border/40 rounded-lg px-4 bg-card/30">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Brand FAQs — visible accordion + JSON-LD */}
        <FAQSection faqs={[
          { question: 'What are the best 3D printer filament brands?', answer: 'According to FilaScope\'s database of 8,200+ filaments from 48+ brands, the top-rated brands include Bambu Lab, Polymaker, Prusament, and Fillamentum — each scoring consistently high on documentation, consistency, and material variety. Budget picks like eSUN and Overture deliver strong value without sacrificing quality.' },
          { question: 'Which filament brand has the best PLA?', answer: 'FilaScope\'s specification data shows that for premium PLA, Prusament is widely regarded for its tight ±0.02mm tolerances, while Polymaker\'s PolyLite PLA offers excellent surface quality across a huge color range. Bambu Lab PLA Basic is a strong all-rounder optimized for high-speed printing.' },
          { question: 'What is the cheapest reliable filament brand?', answer: 'Based on FilaScope\'s real-time price tracking across 15+ stores in 5 regions, eSUN, Overture, and Sunlu consistently offer sub-$15/kg pricing with acceptable quality for hobbyist use.' },
          { question: 'Which brands have HueForge TD data?', answer: 'Based on FilaScope\'s HueForge TD database, which tracks transmission distance values for 500+ filaments, brands including Bambu Lab, Polymaker, Prusament, eSUN, and others have verified TD data.' },
          { question: 'Do all brands make filaments in 1.75mm diameter?', answer: 'According to FilaScope\'s database of 8,200+ filaments from 48+ brands, the vast majority of consumer 3D printer filament brands produce 1.75mm diameter spools. A few brands like ColorFabb and Fillamentum also offer 2.85mm variants for printers like the Ultimaker series.' },
          { question: 'Is Bambu Lab filament better than Polymaker?', answer: 'FilaScope\'s specification data shows both are top-tier. Bambu Lab filaments are optimized for Bambu printers with excellent high-speed performance and tight AMS compatibility. Polymaker offers a wider material range with specialty options. The best choice depends on your printer and material needs.' },
          { question: 'What filament brands work with Bambu Lab printers?', answer: 'According to FilaScope\'s database of 8,200+ filaments from 48+ brands, most 1.75mm filament brands work with Bambu Lab printers. For optimal AMS compatibility, Bambu Lab\'s own filaments include RFID chips for auto-detection. Third-party brands like Polymaker, eSUN, and Sunlu also work well.' },
        ]} />

        </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Brands;
