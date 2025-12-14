import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Check, 
  ArrowRight,
  Shield,
  Box,
  Utensils,
  Zap,
  Thermometer,
  Printer,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Award,
  Clock,
  BarChart3,
  Bell,
  BellRing,
  PiggyBank,
  Scale,
  Crown,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "./LikeButton";
import { getMaterialAverage, getScoreComparison } from "@/lib/materialAverages";
import { getPriceContext } from "@/lib/materialPriceTiers";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { PriceSparkline } from "./PriceSparkline";

// Material badge colors matching the plan
const MATERIAL_BADGE_COLORS: Record<string, string> = {
  "PLA": "bg-blue-500/15 border-blue-500/40 text-blue-400",
  "PETG": "bg-teal-500/15 border-teal-500/40 text-teal-400",
  "ABS": "bg-orange-500/15 border-orange-500/40 text-orange-400",
  "ASA": "bg-red-500/15 border-red-500/40 text-red-400",
  "TPU": "bg-purple-500/15 border-purple-500/40 text-purple-400",
  "Nylon": "bg-green-500/15 border-green-500/40 text-green-400",
  "PC": "bg-gray-500/15 border-gray-500/40 text-gray-400",
  "PEEK": "bg-amber-500/15 border-amber-500/40 text-amber-400",
  "PVA": "bg-sky-500/15 border-sky-500/40 text-sky-400",
  "HIPS": "bg-lime-500/15 border-lime-500/40 text-lime-400",
};

function getMaterialBadgeClass(material: string): string {
  // Extract base material (e.g., "PLA" from "PLA+", "PLA Silk", etc.)
  const baseMaterial = material?.split(/[\s\-+]/)[0]?.toUpperCase() || "";
  return MATERIAL_BADGE_COLORS[baseMaterial] || "bg-primary/15 border-primary/40 text-primary";
}

interface Filament {
  id: string;
  product_title: string;
  vendor?: string | null;
  material?: string | null;
  color_hex?: string | null;
  color_family?: string | null;
  variant_price?: number | null;
  net_weight_g?: number | null;
  pack_quantity?: number | null;
  value_score?: number | null;
  ease_of_printing_score?: number | null;
  strength_index?: number | null;
  printability_index?: number | null;
  is_nozzle_abrasive?: boolean | null;
  spool_ams_fit?: boolean | null;
  food_contact_rating?: string | null;
  high_speed_capable?: boolean | null;
  nozzle_temp_max_c?: number | null;
  tg_c?: number | null;
  diameter_nominal_mm?: number | null;
  featured_image?: string | null;
  updated_at?: string | null;
}

interface FilamentCardProps {
  filament: Filament;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
  colorMatchPercent?: number | null;
  priceTrend?: number | null; // percentage, negative = price drop
}

export function FilamentCard({
  filament,
  isSelected = false,
  onToggleCompare,
  colorMatchPercent,
  priceTrend,
}: FilamentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate price per kg
  const packQty = filament.pack_quantity || 1;
  const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : null;
  const pricePerKg = (filament.variant_price && weightKg)
    ? filament.variant_price / (weightKg * packQty)
    : null;
  const isValidPrice = pricePerKg && pricePerKg > 0 && pricePerKg < 500;

  // Score calculations
  const overallScore = filament.value_score || 7.0;
  const printScore = filament.ease_of_printing_score || filament.printability_index || 7;
  const strengthScore = filament.strength_index || 7;
  // Derive value score from price efficiency (lower price = higher value)
  const valueScore = pricePerKg ? Math.max(1, Math.min(10, 10 - (pricePerKg / 10))) : 6;

  // Material average comparison
  const materialAvg = getMaterialAverage(filament.material);
  const scoreComparison = getScoreComparison(overallScore, materialAvg);

  // Check for limited data
  const dataPoints = [
    filament.ease_of_printing_score,
    filament.strength_index,
    filament.printability_index,
    filament.variant_price,
  ].filter(v => v !== null && v !== undefined);
  const hasLimitedData = dataPoints.length < 3;

  // Format update date
  const getUpdateDate = () => {
    if (!filament.updated_at) return null;
    const date = new Date(filament.updated_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Score count-up animation
  useEffect(() => {
    if (!hasAnimated) {
      const duration = 600;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setDisplayScore(overallScore * eased);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setHasAnimated(true);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setDisplayScore(overallScore);
    }
  }, [overallScore, hasAnimated]);

  // Get max temp
  const maxTemp = filament.nozzle_temp_max_c || filament.tg_c;

  // Print difficulty based on ease_of_printing_score
  const getPrintDifficulty = () => {
    const score = filament.ease_of_printing_score || 7;
    if (score >= 7) return { label: "Easy", color: "text-green-400 bg-green-500/15" };
    if (score >= 4) return { label: "Medium", color: "text-amber-400 bg-amber-500/15" };
    return { label: "Advanced", color: "text-orange-400 bg-orange-500/15" };
  };

  const printDifficulty = getPrintDifficulty();

  // Score color coding
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-primary";
    return "text-amber-400";
  };

  // Check if score qualifies for special treatment
  const isTopRated = overallScore >= 8.0;
  const hasGlow = overallScore >= 8.5;

  // Score bar component
  const ScoreBar = ({ value, max = 10 }: { value: number; max?: number }) => (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            value >= 8 ? "bg-green-500" : value >= 6 ? "bg-primary" : "bg-amber-500"
          )}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", getScoreColor(value))}>
        {value.toFixed(0)}
      </span>
    </div>
  );

  // Price Section Component (internal)
  const PriceSection = ({ 
    filamentId, 
    pricePerKg, 
    material, 
    priceTrend: propTrend 
  }: { 
    filamentId: string; 
    pricePerKg: number | null; 
    material: string | null | undefined;
    priceTrend: number | null | undefined;
  }) => {
    const [alertOpen, setAlertOpen] = useState(false);
    const [targetPrice, setTargetPrice] = useState("");
    
    const priceHistory = usePriceHistory(filamentId, pricePerKg);
    const { hasAlert, setAlert, removeAlert, getAlert } = usePriceAlerts();
    
    const priceContext = pricePerKg ? getPriceContext(pricePerKg, material) : null;
    const alertSet = hasAlert(filamentId);
    const existingAlert = getAlert(filamentId);
    
    // Use fetched trend or prop trend
    const trendPercent = priceHistory.trendPercent ?? propTrend;
    
    const handleSetAlert = () => {
      const price = parseFloat(targetPrice);
      if (price > 0) {
        setAlert(filamentId, price);
        setAlertOpen(false);
        setTargetPrice("");
      }
    };
    
    const handleRemoveAlert = () => {
      removeAlert(filamentId);
      setAlertOpen(false);
    };

    const PriceContextIcon = priceContext?.iconName === "piggy-bank" ? PiggyBank 
      : priceContext?.iconName === "crown" ? Crown 
      : Scale;

    if (!pricePerKg) {
      return (
        <div className="mb-4">
          <span className="text-lg text-muted-foreground">Price unavailable</span>
        </div>
      );
    }

    return (
      <div className="mb-4 space-y-1.5">
        {/* Main Price Row */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-baseline gap-2 cursor-help">
                <span className="text-2xl font-bold text-primary font-mono">
                  ${pricePerKg.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">/kg</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="w-56 p-3 bg-card border-border"
              sideOffset={8}
            >
              {priceHistory.prices.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">30-Day Price History</p>
                  <PriceSparkline 
                    prices={priceHistory.prices}
                    currentPrice={pricePerKg}
                    min={priceHistory.min}
                    max={priceHistory.max}
                  />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Low</span>
                      <p className="font-medium text-green-400">${priceHistory.min.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg</span>
                      <p className="font-medium">${priceHistory.avg.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">High</span>
                      <p className="font-medium text-red-400">${priceHistory.max.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No price history available</p>
              )}
            </TooltipContent>
          </Tooltip>
          
          {/* Trend Indicator */}
          {trendPercent !== null && trendPercent !== undefined && Math.abs(trendPercent) >= 2 && (
            <span className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trendPercent < 0 ? "text-green-400" : "text-red-400"
            )}>
              {trendPercent < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {Math.abs(trendPercent)}%
            </span>
          )}
          
          {/* Price Alert Bell */}
          <Popover open={alertOpen} onOpenChange={setAlertOpen}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "p-1 rounded-full transition-colors",
                  alertSet 
                    ? "text-primary bg-primary/20" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                aria-label={alertSet ? "Price alert set" : "Set price alert"}
              >
                {alertSet ? (
                  <BellRing className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" side="top">
              <div className="space-y-3">
                <div className="text-sm font-medium">Price Alert</div>
                {alertSet ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Alert set for: <span className="text-primary font-mono">${existingAlert?.targetPrice.toFixed(2)}/kg</span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleRemoveAlert}
                      className="w-full"
                    >
                      Remove Alert
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Current: <span className="font-mono">${pricePerKg.toFixed(2)}/kg</span>
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          placeholder="Target"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="pl-6 h-8 text-sm"
                          step="0.01"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleSetAlert}
                        disabled={!targetPrice || parseFloat(targetPrice) <= 0}
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Best Price Badge */}
        {(priceHistory.isBestIn6Months || priceHistory.isBestIn30Days) && (
          <Badge className="best-price-badge bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400 text-[10px] px-2 py-0.5 gap-1">
            <Sparkles className="w-3 h-3" />
            {priceHistory.isBestIn6Months ? "Best price in 6 months!" : "Best price in 30 days!"}
          </Badge>
        )}
        
        {/* Price Context Label */}
        {priceContext && (
          <div className={cn("flex items-center gap-1 text-xs", priceContext.colorClass)}>
            <PriceContextIcon className="w-3 h-3" />
            <span>{priceContext.label}</span>
          </div>
        )}
      </div>
    );
  };

  // Display title without brand name
  const getDisplayTitle = () => {
    const title = filament.product_title || "";
    const vendor = filament.vendor || "";
    if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
      return title.slice(vendor.length).trim();
    }
    return title;
  };

  const brandLogo = filament.vendor ? getBrandLogo(filament.vendor) : null;

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-5 transition-all duration-200 ease-out",
        "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1",
        isSelected 
          ? "border-2 border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compare Checkbox - Top Left (shows on hover) */}
      <div 
        className={cn(
          "absolute top-3 left-3 transition-opacity duration-200",
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleCompare?.(filament.id)}
          aria-label={`Add ${filament.product_title} to comparison`}
          className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Selected Check Badge */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-5 h-5 bg-primary rounded flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}

      {/* Favorite Button - Top Right */}
      <div className="absolute top-3 right-3">
        <LikeButton filamentId={filament.id} size="sm" />
      </div>

      {/* Header: Brand + Material Badge */}
      <div className="flex items-center justify-between mb-3 pr-8">
        <div className="flex items-center gap-2">
          {brandLogo ? (
            <img 
              src={brandLogo} 
              alt={`${filament.vendor} logo`}
              className="w-8 h-8 rounded object-contain bg-muted p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">
                {filament.vendor?.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {filament.vendor}
          </span>
        </div>
        
        {filament.material && (
          <Badge 
            variant="outline"
            className={cn(
              "text-xs font-semibold px-2 py-0.5",
              getMaterialBadgeClass(filament.material)
            )}
          >
            {filament.material.split(" ")[0]}
          </Badge>
        )}
      </div>

      {/* Main Title */}
      <h3 className="font-semibold text-lg text-foreground leading-tight mb-3 line-clamp-2">
        {getDisplayTitle()}
      </h3>

      {/* Color Swatch (if available) */}
      {filament.color_hex && (
        <div className="flex items-center gap-2 mb-3">
          <div 
            className="w-6 h-6 rounded border border-border shadow-sm"
            style={{ backgroundColor: filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}` }}
          />
          <span className="text-xs text-muted-foreground font-mono uppercase">
            {filament.color_hex.startsWith('#') ? filament.color_hex : `#${filament.color_hex}`}
          </span>
          {colorMatchPercent !== null && colorMatchPercent !== undefined && (
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded",
              colorMatchPercent >= 95 ? "bg-green-500/20 text-green-400" :
              colorMatchPercent >= 85 ? "bg-primary/20 text-primary" :
              "bg-amber-500/20 text-amber-400"
            )}>
              {colorMatchPercent}% match
            </span>
          )}
        </div>
      )}

      {/* Score Section */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 mb-3 cursor-help">
            <div className={cn(
              "flex items-center gap-2",
              hasGlow && "score-glow"
            )}>
              <Star className={cn("w-5 h-5 fill-current", getScoreColor(overallScore))} />
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                getScoreColor(overallScore),
                hasLimitedData && "opacity-70"
              )}>
                {displayScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>
            
            {/* Top Rated Badge */}
            {isTopRated && !hasLimitedData && (
              <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400 text-[10px] px-1.5 py-0 gap-0.5">
                <Award className="w-3 h-3" />
                Top Rated
              </Badge>
            )}
            
            {/* Limited Data Warning */}
            {hasLimitedData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-amber-500/15 border-amber-500/40 text-amber-400 text-[10px] px-1.5 py-0 gap-0.5 cursor-help">
                    <AlertTriangle className="w-3 h-3" />
                    Limited Data
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  Score based on limited specifications - may not be fully representative
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-72 p-4 bg-card border-border"
          sideOffset={8}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">FilaScope Score</p>
            <span className={cn("text-lg font-bold", getScoreColor(overallScore))}>
              {overallScore.toFixed(1)}/10
            </span>
          </div>
          
          {/* Visual Score Bars */}
          <div className="space-y-2.5 mb-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Printability</span>
              </div>
              <ScoreBar value={printScore} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Strength</span>
              </div>
              <ScoreBar value={strengthScore} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Value for Money</span>
              </div>
              <ScoreBar value={valueScore} />
            </div>
          </div>
          
          {/* Material Comparison */}
          {scoreComparison && materialAvg && (
            <div className="flex items-center gap-2 py-2 border-t border-border">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={cn(
                "text-xs font-medium",
                scoreComparison.isAbove ? "text-green-400" : "text-amber-400"
              )}>
                {scoreComparison.text} for {filament.material?.split(" ")[0]}
              </span>
              <span className="text-xs text-muted-foreground">
                (avg: {materialAvg.toFixed(1)})
              </span>
            </div>
          )}
          
          {/* Last Updated */}
          {getUpdateDate() && (
            <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last updated: {getUpdateDate()}
            </div>
          )}
        </TooltipContent>
      </Tooltip>

      <p className="text-xs text-muted-foreground mb-4">
        (based on durability, printability, value)
      </p>

      {/* Price Section */}
      <PriceSection 
        filamentId={filament.id}
        pricePerKg={isValidPrice ? pricePerKg : null}
        material={filament.material}
        priceTrend={priceTrend}
      />

      {/* Properties Section */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {filament.is_nozzle_abrasive === false && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-500/10 border-green-500/30 text-green-400 gap-1">
            <Shield className="w-3 h-3" />
            Brass Safe
          </Badge>
        )}
        {filament.spool_ams_fit && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-500/10 border-blue-500/30 text-blue-400 gap-1">
            <Box className="w-3 h-3" />
            AMS Fit
          </Badge>
        )}
        {filament.food_contact_rating && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-green-500/10 border-green-500/30 text-green-400 gap-1">
            <Utensils className="w-3 h-3" />
            Food Safe
          </Badge>
        )}
        {filament.high_speed_capable && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/10 border-primary/30 text-primary gap-1">
            <Zap className="w-3 h-3" />
            High Speed
          </Badge>
        )}
      </div>

      {/* Additional Properties Line */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        {maxTemp && (
          <span className="flex items-center gap-1">
            <Thermometer className="w-3 h-3" />
            Max {maxTemp}°C
          </span>
        )}
        {filament.diameter_nominal_mm && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span>{filament.diameter_nominal_mm}mm</span>
          </>
        )}
        <span className="text-muted-foreground/50">•</span>
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 gap-0.5", printDifficulty.color)}>
          <Printer className="w-2.5 h-2.5" />
          {printDifficulty.label}
        </Badge>
      </div>

      {/* CTA Section */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 border-primary/50 text-primary transition-all duration-200",
            isHovered && "bg-primary text-primary-foreground border-primary"
          )}
          onClick={(e) => {
            e.preventDefault();
            onToggleCompare?.(filament.id);
          }}
          aria-label={`Add ${filament.product_title} to comparison`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Added
            </>
          ) : (
            "Compare"
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link to={`/filament/${filament.id}`}>
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default FilamentCard;
