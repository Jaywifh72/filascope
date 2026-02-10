import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingDown, Sparkles, AlertTriangle } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { normalizeColorHex } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useRegionalFiltering, type FilamentWithRegion } from "@/hooks/useRegionalFiltering";
import { Skeleton } from "@/components/ui/skeleton";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";

interface Filament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity: number | null;
  featured_image: string | null;
  value_score: number | null;
  printability_index: number | null;
  created_at: string | null;
  // Regional fields for filtering
  product_url?: string | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  product_url_au?: string | null;
  product_url_jp?: string | null;
}

const BentoGrid = () => {
  const { formatPrice, currencyInfo } = useCurrency();
  const { filterByRegion, currentRegion } = useRegionalFiltering();
  
  // Fetch featured filament candidates (highest rated by value_score)
  const { data: featuredCandidates } = useQuery({
    queryKey: ["featured-filament-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .not("value_score", "is", null)
        .not("featured_image", "is", null)
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .order("value_score", { ascending: false })
        .limit(20); // Fetch more to filter by region
      
      if (error) throw error;
      return data as (Filament & FilamentWithRegion)[];
    },
  });

  // Apply regional filtering and get top result
  const featuredFilament = useMemo(() => {
    if (!featuredCandidates) return undefined;
    const filtered = filterByRegion(featuredCandidates);
    return filtered[0] as Filament | undefined;
  }, [featuredCandidates, filterByRegion]);

  // Fetch price drops candidates (items with lower current price)
  const { data: priceDropCandidates } = useQuery({
    queryKey: ["price-drops-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .not("variant_price", "is", null)
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .order("variant_price", { ascending: true })
        .limit(30); // Fetch more to filter by region
      
      if (error) throw error;
      return data as (Filament & FilamentWithRegion)[];
    },
  });

  // Apply regional filtering and get top 5
  const priceDrops = useMemo(() => {
    if (!priceDropCandidates) return undefined;
    const filtered = filterByRegion(priceDropCandidates);
    return filtered.slice(0, 5) as Filament[];
  }, [priceDropCandidates, filterByRegion]);

  // Fetch new arrivals candidates (most recently created)
  const { data: newArrivalCandidates } = useQuery({
    queryKey: ["new-arrival-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .not("featured_image", "is", null)
        .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
        .order("created_at", { ascending: false })
        .limit(20); // Fetch more to filter by region
      
      if (error) throw error;
      return data as (Filament & FilamentWithRegion)[];
    },
  });

  // Apply regional filtering and get top result
  const newArrival = useMemo(() => {
    if (!newArrivalCandidates) return undefined;
    const filtered = filterByRegion(newArrivalCandidates);
    return filtered[0] as Filament | undefined;
  }, [newArrivalCandidates, filterByRegion]);


  const getTrueCost = (filament: Filament) => {
    if (!filament.variant_price) return null;
    const pricePerKg = computePricePerKg(filament.variant_price, filament.net_weight_g, filament.pack_quantity);
    // Validate: must be reasonable per-kg price
    if (!pricePerKg || pricePerKg < 5 || pricePerKg > 500) return null;
    return pricePerKg;
  };

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-4 p-6 max-w-[1800px] mx-auto">
      {/* Featured Filament - 2x2 Large Block */}
      <Link 
        to={featuredFilament ? `/filament/${featuredFilament.id}` : "#"}
        className="col-span-2 row-span-2 group relative overflow-hidden rounded-xl bg-card/50 backdrop-blur-md border border-border/50 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {featuredFilament && (
          <>
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Filament of the Week
              </Badge>
            </div>
            
            <div className="h-full flex flex-col">
              {featuredFilament.featured_image && (
                <div className="flex-1 relative min-h-[200px]">
                  <img 
                    src={featuredFilament.featured_image} 
                    alt={featuredFilament.product_title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
              )}
              
              <div className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  {featuredFilament.vendor && (
                    <BrandLogo
                      src={getBrandLogo(featuredFilament.vendor)}
                      brandName={featuredFilament.vendor}
                      size="md"
                    />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{featuredFilament.vendor}</p>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                      {featuredFilament.product_title}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {featuredFilament.material && (
                    <Badge variant="secondary" className="text-sm">
                      {featuredFilament.material}
                    </Badge>
                  )}
                  {getTrueCost(featuredFilament) && (
                    <span className="font-mono text-lg font-bold text-[#ff6b00]">
                      {formatPrice(getTrueCost(featuredFilament), false)}/{currencyInfo.code === 'JPY' ? '' : 'kg'}
                    </span>
                  )}
                  {featuredFilament.value_score && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                      Score: {featuredFilament.value_score.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {!featuredFilament && (
          <div className="h-full flex flex-col">
            <Skeleton className="flex-1 min-h-[200px] rounded-none" />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        )}
      </Link>

      {/* Price Drops - 1x2 Tall Block */}
      <div className="col-span-1 row-span-2 rounded-xl bg-card/50 backdrop-blur-md border border-border/50 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-500 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-foreground">Price Drops</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Best value finds</p>
        </div>
        
        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100%-60px)]">
          {priceDrops?.map((filament) => (
            <Link 
              key={filament.id}
              to={`/filament/${filament.id}`}
              className="flex items-center gap-3 p-2 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-green-500/30 transition-all group"
            >
              <div 
                className="w-8 h-8 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: normalizeColorHex(filament.color_hex) }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate group-hover:text-green-400 transition-colors">
                  {filament.product_title}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{filament.vendor}</p>
                  {filament.color_hex && (
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                      #{filament.color_hex.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {getTrueCost(filament) && (
                <span className="font-mono text-xs font-bold text-[#ff6b00] shrink-0">
                  {formatPrice(getTrueCost(filament), false)}
                </span>
              )}
            </Link>
          ))}
          
          {!priceDrops && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-10 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Arrival - 1x1 Small Block */}
      <Link 
        to={newArrival ? `/filament/${newArrival.id}` : "#"}
        className="col-span-1 row-span-1 group rounded-xl bg-card/50 backdrop-blur-md border border-border/50 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-500 overflow-hidden"
      >
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border/50 bg-gradient-to-r from-purple-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-foreground text-sm">New Arrival</h3>
            </div>
          </div>
          
          {newArrival && (
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                {newArrival.featured_image ? (
                  <img 
                    src={newArrival.featured_image} 
                    alt={newArrival.product_title}
                    className="w-12 h-12 object-cover rounded-lg border border-border/50"
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-lg border border-border/50"
                    style={{ backgroundColor: normalizeColorHex(newArrival.color_hex) }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{newArrival.vendor}</p>
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-purple-400 transition-colors">
                    {newArrival.product_title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                {newArrival.material && (
                  <Badge variant="outline" className="text-xs">
                    {newArrival.material}
                  </Badge>
                )}
                {getTrueCost(newArrival) && (
                  <span className="font-mono text-sm font-bold text-[#ff6b00]">
                    {formatPrice(getTrueCost(newArrival), false)}/kg
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Community Alert - 1x1 Small Block */}
      <div className="col-span-1 row-span-1 rounded-xl bg-card/50 backdrop-blur-md border border-border/50 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-500 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border/50 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-foreground text-sm">Community Alert</h3>
            </div>
          </div>
          
          <div className="flex-1 p-3 flex flex-col justify-center">
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-medium text-amber-400">⚠️ Batch #402 Recalled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sunlu PLA+ White - Check your spool codes
                </p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs font-medium text-cyan-400">📢 New Stock Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prusament Galaxy Black back in stock
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoGrid;
