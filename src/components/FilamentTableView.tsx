import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFilamentHref } from "@/lib/filamentUrl";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MaterialBadge } from "@/components/MaterialBadge";
import { LikeButton } from "@/components/LikeButton";
import { ChevronUp, ChevronDown, TreeDeciduous, Layers, Info, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegion } from "@/contexts/RegionContext";
import { resolveFilamentPrice, type FilamentForPricing } from "@/lib/resolveFilamentPrice";
import { calculateUnifiedScore, getScoreNumberColor, SCORE_EXPLANATION, type FilamentForScoring } from "@/lib/unifiedFilamentScore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PriceFreshnessCell } from "@/components/price/PriceFreshnessDot";
import { useWishlist } from "@/hooks/useWishlist";

interface Filament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  color_hex: string | null;
  color_family: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  featured_image: string | null;
  variant_available: boolean | null;
  value_score: number | null;
  product_url: string | null;
  amazon_link_us: string | null;
  pack_quantity?: number;
  wood_powder_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  carbon_fiber_percentage?: number | null;
  tds_url?: string | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  tensile_strength_xy_mpa?: number | null;
  flexural_strength_mpa?: number | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  product_url_ca?: string | null;
  product_url_uk?: string | null;
  product_url_eu?: string | null;
  high_speed_capable?: boolean | null;
  finish_type?: string | null;
  last_scraped_at?: string | null;
  transmission_distance?: number | null;
  product_handle?: string | null;
}

interface FilamentTableViewProps {
  filaments: Filament[];
  isInCompare: (id: string) => boolean;
  addItem: (item: any) => void;
  removeItem: (id: string) => void;
  getAffiliateUrl: (url: string, vendor: string | null) => string | null;
  hexSearch?: string;
  getColorMatchPercent?: (searchHex: string, filamentHex: string) => number;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

// Helper functions for composite materials
const isWoodFilament = (filament: Filament) => 
  filament.wood_powder_percentage && filament.wood_powder_percentage > 0;

const isGlassFiberFilament = (filament: Filament) => 
  filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0;

const isCarbonFiberFilament = (filament: Filament) => 
  filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0;

const getWoodPercentage = (filament: Filament) => filament.wood_powder_percentage;
const getGlassFiberPercentage = (filament: Filament) => filament.glass_fiber_percentage;
const getCarbonFiberPercentage = (filament: Filament) => filament.carbon_fiber_percentage;

// Sortable column definitions
const SORTABLE_COLUMNS: Record<string, string> = {
  "Brand": "brand",
  "Type": "material",
  "TD": "td",
  "True Cost": "true-cost",
  "Price": "price",
  "Stock": "stock",
  "Rating": "scoring",
};

/** Rating pill color based on score */
function getRatingPillClasses(score: number): string {
  if (score >= 9.0) return "bg-emerald-500/20 text-emerald-400";
  if (score >= 7.0) return "bg-cyan-500/15 text-cyan-400";
  if (score >= 5.0) return "bg-amber-500/15 text-amber-400";
  return "bg-muted/40 text-muted-foreground";
}

function SortableHeader({ 
  label, 
  sortKey, 
  sortBy, 
  onSortChange, 
  className 
}: { 
  label: string; 
  sortKey: string; 
  sortBy?: string; 
  onSortChange?: (sort: string) => void; 
  className?: string;
}) {
  const currentField = sortBy?.replace(/-(?:asc|desc)$/, '');
  const currentDir = sortBy?.endsWith('-asc') ? 'asc' : 'desc';
  const isActive = currentField === sortKey;

  const handleClick = () => {
    if (!onSortChange) return;
    if (isActive) {
      // Toggle direction
      onSortChange(`${sortKey}-${currentDir === 'desc' ? 'asc' : 'desc'}`);
    } else {
      // Default to desc for most, asc for price/true-cost
      const defaultDir = ['price', 'true-cost'].includes(sortKey) ? 'asc' : 'desc';
      onSortChange(`${sortKey}-${defaultDir}`);
    }
  };

  return (
    <th 
      className={cn(
        "py-3 px-3 text-xs font-semibold uppercase tracking-wide cursor-pointer select-none group sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "flex items-center gap-1",
        className?.includes("text-right") && "justify-end",
        className?.includes("text-center") && "justify-center"
      )}>
        <span>{label}</span>
        {isActive ? (
          currentDir === 'asc' 
            ? <ChevronUp className="h-3 w-3" /> 
            : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </div>
    </th>
  );
}

export function FilamentTableView({
  filaments,
  isInCompare,
  addItem,
  removeItem,
  getAffiliateUrl,
  hexSearch,
  getColorMatchPercent,
  sortBy,
  onSortChange,
}: FilamentTableViewProps) {
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency, hasRates } = useRegion();
  const { isInWishlist } = useWishlist();

  // Count selected items for the header badge
  const selectedCount = useMemo(
    () => filaments.filter((f) => isInCompare(f.id)).length,
    [filaments, isInCompare]
  );

  // Detect if sorted by brand for brand grouping
  const isSortedByBrand = sortBy?.startsWith("brand");

  // Compute average true cost for relative value arrows
  const avgTrueCost = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const f of filaments) {
      const resolved = resolveFilamentPrice(f as FilamentForPricing, {
        userCurrency: currency,
        convertFromCurrency: convertPrice,
        hasRates,
      });
      const ppk = resolved.pricePerKg;
      const maxValid = currency === 'JPY' || currency === 'KRW' ? 100000 : 500;
      if (ppk && ppk > 0 && ppk < maxValid) {
        sum += ppk;
        count++;
      }
    }
    return count > 0 ? sum / count : null;
  }, [filaments, currency, convertPrice, hasRates]);

  return (
    <div 
      className="relative overflow-x-auto rounded-lg border border-border/50 [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)] hover:[mask-image:none] transition-all" 
      role="region" 
      aria-label="Filament comparison table"
    >
      <table className="w-full" id="filament-table">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-2 w-8 sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border" aria-label="Selection">
              {selectedCount > 0 && (
                <span className="text-[10px] font-medium text-primary whitespace-nowrap">{selectedCount} sel.</span>
              )}
            </th>
            <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[60px] sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">Color</th>
            <SortableHeader label="Brand" sortKey="brand" sortBy={sortBy} onSortChange={onSortChange} className="min-w-[100px]" />
            <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[180px] max-w-[300px] sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">Product</th>
            <SortableHeader label="Type" sortKey="material" sortBy={sortBy} onSortChange={onSortChange} className="min-w-[80px]" />
            <SortableHeader label="TD" sortKey="td" sortBy={sortBy} onSortChange={onSortChange} className="text-center min-w-[50px]" />
            <SortableHeader label="True Cost" sortKey="true-cost" sortBy={sortBy} onSortChange={onSortChange} className="text-right min-w-[90px]" />
            <SortableHeader label="Price" sortKey="price" sortBy={sortBy} onSortChange={onSortChange} className="text-right min-w-[80px]" />
            <SortableHeader label="Stock" sortKey="stock" sortBy={sortBy} onSortChange={onSortChange} className="text-center min-w-[50px]" />
            <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center min-w-[70px] sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">Updated</th>
            <SortableHeader label="Rating" sortKey="scoring" sortBy={sortBy} onSortChange={onSortChange} className="text-right min-w-[60px]" />
            <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right min-w-[90px] sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filaments.map((filament, rowIndex) => {
            const resolved = resolveFilamentPrice(filament as FilamentForPricing, {
              userCurrency: currency,
              convertFromCurrency: convertPrice,
              hasRates,
            });
            const pricePerKg = resolved.pricePerKg;
            const maxValid = currency === 'JPY' || currency === 'KRW' ? 100000 : 500;
            const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < maxValid;
            const displayPricePerKg = isValidPrice ? pricePerKg : null;
            const pricePerSpool = resolved.pricePerSpool;
            const isConverted = resolved.isConverted;
            const prefix = isConverted ? '~' : '';
            
            const { score: overallScore, factors: scoreFactors, confidence: scoreConfidence, dataPointCount } = calculateUnifiedScore(filament as FilamentForScoring);
            
            const normalizedHex = filament.color_hex 
              ? (filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}`)
              : null;
            const isHexSearchActive = hexSearch && hexSearch.match(/^#?[0-9A-Fa-f]{6}$/);
            const searchHex = isHexSearchActive ? (hexSearch.startsWith('#') ? hexSearch : `#${hexSearch}`) : null;
            const matchPercent = searchHex && normalizedHex && getColorMatchPercent 
              ? getColorMatchPercent(searchHex, normalizedHex) 
              : null;

            const isOutOfStock = filament.variant_available === false;
            const isSelected = isInCompare(filament.id);
            const isSaved = isInWishlist(filament.id);

            // True cost relative value arrow
            const trueCostArrow = (() => {
              if (!displayPricePerKg || !avgTrueCost) return null;
              const deviation = (displayPricePerKg - avgTrueCost) / avgTrueCost;
              if (deviation < -0.15) return "low"; // notably cheaper
              if (deviation > 0.15) return "high"; // notably more expensive
              return null;
            })();

            // Brand grouping: show separator when sorted by brand and brand changes
            const showBrandSeparator = isSortedByBrand && rowIndex > 0 && filament.vendor !== filaments[rowIndex - 1]?.vendor;
            const isFirstOfBrand = isSortedByBrand && (rowIndex === 0 || filament.vendor !== filaments[rowIndex - 1]?.vendor);

            return (
              <tr 
                key={filament.id} 
                className={cn(
                  "group border-b border-border/50 transition-colors duration-150 cursor-pointer",
                  // Zebra striping
                  rowIndex % 2 === 1 && "bg-muted/10",
                  // Hover
                  "hover:bg-muted/50",
                  // Selected state
                  isSelected && "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary",
                  // Saved/wishlisted state (subtle rose tint)
                  !isSelected && isSaved && "bg-rose-500/[0.03]",
                  // Out of stock
                  isOutOfStock && "opacity-60",
                  // Brand separator
                  showBrandSeparator && "border-t-2 border-t-border/50"
                )}
                onClick={() => navigate(getFilamentHref(filament.id, filament.product_handle))}
              >
                <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={() => {
                      if (isSelected) {
                        removeItem(filament.id);
                      } else {
                        addItem({
                          id: filament.id,
                          product_title: filament.product_title,
                          vendor: filament.vendor,
                          material: filament.material,
                          color_hex: filament.color_hex,
                          variant_price: filament.variant_price,
                          net_weight_g: filament.net_weight_g,
                          featured_image: filament.featured_image,
                        });
                      }
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </td>
                <td className="py-3 px-3">
                  {normalizedHex ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="relative">
                        <div 
                          className="w-8 h-8 rounded-full ring-1 ring-border transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: normalizedHex }}
                          title={filament.color_family || 'Color'}
                        />
                        {matchPercent !== null && (
                          <div className={cn(
                            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white",
                            matchPercent >= 95 ? 'bg-emerald-500' : 
                            matchPercent >= 85 ? 'bg-blue-500' : 
                            'bg-amber-500'
                          )}>
                            {matchPercent}
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-muted-foreground uppercase">
                        {normalizedHex.slice(0, 7)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className={cn(
                    "text-sm font-medium text-foreground",
                    isFirstOfBrand && "font-semibold"
                  )}>
                    {filament.vendor}
                  </span>
                </td>
                <td className="py-3 px-3 max-w-[300px]">
                  <span className="text-sm text-muted-foreground truncate block group-hover:text-foreground transition-colors duration-150">
                    {filament.product_title}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {filament.material ? (
                      <MaterialBadge material={filament.material} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {isWoodFilament(filament) && (
                      <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600 text-[10px] px-1.5 py-0 gap-1">
                        <TreeDeciduous className="w-3 h-3" />
                        {getWoodPercentage(filament) ? `${getWoodPercentage(filament)}%` : 'Wood'}
                      </Badge>
                    )}
                    {isGlassFiberFilament(filament) && (
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-[10px] px-1.5 py-0 gap-1">
                        <Layers className="w-3 h-3" />
                        {getGlassFiberPercentage(filament) ? `${getGlassFiberPercentage(filament)}% GF` : 'GF'}
                      </Badge>
                    )}
                    {isCarbonFiberFilament(filament) && (
                      <Badge variant="outline" className="bg-slate-500/10 border-slate-500/30 text-slate-400 text-[10px] px-1.5 py-0 gap-1">
                        <Layers className="w-3 h-3" />
                        {getCarbonFiberPercentage(filament) ? `${getCarbonFiberPercentage(filament)}% CF` : 'CF'}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  {filament.transmission_distance != null ? (
                    <span className="font-mono text-sm font-semibold text-purple-400">
                      {filament.transmission_distance.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-mono text-sm font-semibold text-cyan-400 inline-flex items-center gap-0.5">
                    {trueCostArrow === "low" && <span className="text-emerald-500 text-[10px]">▼</span>}
                    {trueCostArrow === "high" && <span className="text-red-400 text-[10px]">▲</span>}
                    {displayPricePerKg ? `${prefix}${formatPrice(displayPricePerKg)}/kg` : "—"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="font-mono text-sm text-foreground">
                    {pricePerSpool ? `${prefix}${formatPrice(pricePerSpool)}` : "—"}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  {filament.variant_available !== false ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-emerald-400 hidden lg:inline">In Stock</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        In stock{filament.vendor ? ` at ${filament.vendor}` : ''}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs text-red-400/60 hidden lg:inline">Out of Stock</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <PriceFreshnessCell lastScrapedAt={filament.last_scraped_at} />
                </td>
                <td className="py-3 px-3 text-right">
                  {overallScore !== null ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1 cursor-help">
                          <span className={cn(
                            "font-mono text-xs font-semibold rounded-md px-2 py-0.5",
                            getRatingPillClasses(overallScore)
                          )}>
                            {overallScore.toFixed(1)}
                          </span>
                          <Info className="w-3 h-3 text-muted-foreground/60" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">Score Breakdown</span>
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", 
                              scoreConfidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                              scoreConfidence === 'medium' ? 'bg-cyan-500/20 text-cyan-400' :
                              'bg-orange-500/20 text-orange-400'
                            )}>
                              {dataPointCount} data points
                            </span>
                          </div>
                          <div className="space-y-1">
                            {scoreFactors.slice(0, 5).map((factor, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate pr-2">{factor.label}</span>
                                <span className="text-emerald-400 font-mono">+{factor.points.toFixed(1)}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                            {SCORE_EXPLANATION}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <LikeButton filamentId={filament.id} size="sm" />
                    <Link 
                      to={getFilamentHref(filament.id, filament.product_handle)}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
