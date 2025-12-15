import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, BadgeCheck, Zap, Radio, Info, Search, Star, Clock, CheckCircle2, Store } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom Plastic Spool Icon
const PlasticSpoolIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v6" />
    <path d="M12 15v6" />
    <path d="M3 12h6" />
    <path d="M15 12h6" />
  </svg>
);

// Custom Cardboard Spool Icon (with recycling indicator)
const CardboardSpoolIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M9 9l-2-2" />
    <path d="M15 9l2-2" />
    <path d="M9 15l-2 2" />
    <path d="M15 15l2 2" />
  </svg>
);

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

interface AutomatedBrand {
  id: string;
  brand_name: string;
  brand_slug: string;
  display_name: string;
  description: string | null;
  platform_type: string;
  featured: boolean | null;
  scraping_enabled: boolean | null;
  last_scrape_at: string | null;
  product_count: number | null;
  products_with_urls: number | null;
  color_primary: string | null;
  website_url: string | null;
}

// ColorStack component for displaying brand's color range
const ColorStack = ({ colors }: { colors: string[] }) => {
  const displayColors = colors.slice(0, 6);
  const remainingCount = colors.length - 6;
  
  if (displayColors.length === 0) return null;
  
  return (
    <div className="flex items-center justify-center mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center">
        {displayColors.map((color, index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-full border border-border -ml-1 first:ml-0"
            style={{ 
              backgroundColor: color,
              zIndex: displayColors.length - index 
            }}
          />
        ))}
        {remainingCount > 0 && (
          <span className="ml-1.5 text-xs font-mono text-muted-foreground">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
};

const getPlatformColor = (platform: string) => {
  const colors: Record<string, string> = {
    shopify: "bg-green-500/20 text-green-400 border-green-500/30",
    amazon: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    woocommerce: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    bigcommerce: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    magento: "bg-red-500/20 text-red-400 border-red-500/30",
    custom: "bg-muted text-muted-foreground border-border",
  };
  return colors[platform] || colors.custom;
};

const getSyncStatus = (lastScrape: string | null) => {
  if (!lastScrape) return { color: "bg-muted-foreground", label: "Never synced" };
  const hours = (Date.now() - new Date(lastScrape).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return { color: "bg-green-500", label: "Synced recently" };
  if (hours < 72) return { color: "bg-amber-500", label: "Synced 1-3 days ago" };
  return { color: "bg-red-500", label: "Needs sync" };
};

const formatLastScrape = (date: string | null) => {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Brands = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Fetch automated brands metadata
  const { data: automatedBrands } = useQuery({
    queryKey: ["automated-brands-metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_brands")
        .select("*")
        .eq("is_visible", true)
        .order("display_order");
      
      if (error) throw error;
      return data as AutomatedBrand[];
    },
  });

  // Fetch filament stats (existing logic)
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor, spool_material, transmission_distance, high_speed_capable, color_hex")
        .not("vendor", "is", null);
      
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
        automated: ab,
      };
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
        automated: null,
      }));

    return [...fromAutomated, ...additionalBrands].sort((a, b) => b.count - a.count);
  }, [brands, automatedBrands]);

  // Get featured brands
  const featuredBrands = useMemo(() => {
    return mergedBrands.filter(b => b.automated?.featured);
  }, [mergedBrands]);

  // Get platform counts
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mergedBrands.forEach(b => {
      const platform = b.automated?.platform_type || "other";
      counts[platform] = (counts[platform] || 0) + 1;
    });
    return counts;
  }, [mergedBrands]);

  const platforms = Object.keys(platformCounts).sort();

  // Filter brands
  const filteredBrands = useMemo(() => {
    return mergedBrands.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           brand.automated?.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = !selectedPlatform || 
                             (brand.automated?.platform_type === selectedPlatform) ||
                             (!brand.automated && selectedPlatform === "other");
      return matchesSearch && matchesPlatform;
    });
  }, [mergedBrands, searchQuery, selectedPlatform]);

  // Stats
  const totalProducts = brands?.reduce((sum, b) => sum + b.count, 0) || 0;
  const automatedCount = automatedBrands?.filter(b => b.scraping_enabled).length || 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Filament Brands</h1>
          <p className="text-muted-foreground mb-4">
            Browse {brands?.length || 0} filament brands with live price tracking
          </p>
        </div>

        {/* Featured Brands Section */}
        {featuredBrands.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h2 className="text-xl font-semibold">Featured Brands</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {featuredBrands.map((brand) => {
                const logoUrl = getBrandLogo(brand.name);
                const syncStatus = getSyncStatus(brand.automated?.last_scrape_at || null);
                
                return (
                  <div
                    key={brand.name}
                    className="relative bg-card border border-primary/30 rounded-lg p-4 hover:border-primary transition-all cursor-pointer group"
                    style={{ 
                      borderTopColor: brand.automated?.color_primary || undefined,
                      borderTopWidth: brand.automated?.color_primary ? "3px" : undefined 
                    }}
                    onClick={() => navigate(`/brands/${encodeURIComponent(brand.name)}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-background rounded-lg p-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <Package className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {brand.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">{brand.count} filaments</p>
                      </div>
                    </div>
                    {brand.automated?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {brand.automated.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs ${getPlatformColor(brand.automated?.platform_type || "other")}`}>
                        {brand.automated?.platform_type || "manual"}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${syncStatus.color}`} />
                        <span>{formatLastScrape(brand.automated?.last_scrape_at || null)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Platform Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span className="font-mono">LEGEND:</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-help">
                  <PlasticSpoolIcon className="w-3.5 h-3.5" />
                  Plastic
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-mono text-xs">Standard plastic spools. Durable and reusable, but not eco-friendly.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-help">
                  <CardboardSpoolIcon className="w-3.5 h-3.5" />
                  Cardboard
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-mono text-xs">Eco-friendly cardboard spools. Recyclable but may absorb moisture - store in dry conditions.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-primary/20 text-primary border border-primary/30 cursor-help">
                  <Zap className="w-3.5 h-3.5" />
                  High Speed
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-mono text-xs">Optimized for high-speed printing (300+ mm/s). Enhanced flow and cooling properties.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-help">
                  <Radio className="w-3.5 h-3.5" />
                  RFID/NFC
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-mono text-xs">Spools with RFID/NFC chips for automatic material detection. Distance shows read range in meters.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30 cursor-help">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-mono text-xs">Lab-tested brand with verified specifications and quality control.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Brands Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading brands...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => {
              const logoUrl = getBrandLogo(brand.name);
              const isVerified = VERIFIED_BRANDS.includes(brand.name);
              const syncStatus = getSyncStatus(brand.automated?.last_scrape_at || null);
              
              return (
                <div 
                  key={brand.name} 
                  className="bg-card border border-border rounded-lg hover:border-primary transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/brands/${encodeURIComponent(brand.name)}`)}
                >
                  <div className="p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-full h-24 flex items-center justify-center bg-background/50 rounded-lg p-4 relative">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={brand.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        {/* Sync status indicator */}
                        {brand.automated && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${syncStatus.color}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{syncStatus.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-center space-y-2 w-full">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-inter font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {brand.name}
                          </h3>
                          {isVerified && (
                            <BadgeCheck className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="font-mono text-sm text-muted-foreground">{brand.count} filaments</p>
                        
                        {/* Platform badge */}
                        {brand.automated && (
                          <Badge variant="outline" className={`text-xs ${getPlatformColor(brand.automated.platform_type)}`}>
                            <Store className="w-3 h-3 mr-1" />
                            {brand.automated.platform_type}
                          </Badge>
                        )}
                        
                        {/* Feature Tags */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                          {brand.spoolMaterial === "Cardboard" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <CardboardSpoolIcon className="w-3 h-3" />
                              Cardboard
                            </span>
                          )}
                          {brand.spoolMaterial === "Plastic" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              <PlasticSpoolIcon className="w-3 h-3" />
                              Plastic
                            </span>
                          )}
                          {brand.spoolMaterial === "Mixed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground border border-border">
                              <PlasticSpoolIcon className="w-3 h-3" />
                              Mixed
                            </span>
                          )}
                          {brand.hasHighSpeed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-primary/20 text-primary border border-primary/30">
                              <Zap className="w-3 h-3" />
                              High Speed
                            </span>
                          )}
                          {brand.avgTransmissionDistance != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              <Radio className="w-3 h-3" />
                              {brand.avgTransmissionDistance}m
                            </span>
                          )}
                        </div>
                        
                        {/* Color Stack */}
                        <ColorStack colors={brand.colors} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <p className="text-3xl font-bold text-primary">{automatedCount}</p>
              <p className="text-sm text-muted-foreground">Automated Sync</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{platforms.length}</p>
              <p className="text-sm text-muted-foreground">Platforms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;
