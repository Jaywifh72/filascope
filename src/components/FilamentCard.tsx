import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Sparkles,
  Ruler,
  Layers,
  Gem,
  Sun,
  Leaf,
  MoreHorizontal,
  ImageOff,
  MoreVertical,
  Heart,
  Share2,
  Flag,
  Package,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "./LikeButton";
import { getMaterialAverage, getScoreComparison } from "@/lib/materialAverages";
import { getPriceContext } from "@/lib/materialPriceTiers";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useSimilarFilaments } from "@/hooks/useSimilarFilaments";
import { PriceSparkline } from "./PriceSparkline";
import { useToast } from "@/hooks/use-toast";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";

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
  variant_available?: boolean | null;
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
  finish_type?: string | null;
  carbon_fiber_percentage?: number | null;
  glass_fiber_percentage?: number | null;
  wood_powder_percentage?: number | null;
  product_url?: string | null;
  amazon_link_us?: string | null;
  amazon_link_uk?: string | null;
  amazon_link_de?: string | null;
}

// Material availability helper
function getAvailabilityStatus(filament: Filament) {
  const hasProductUrl = !!filament.product_url;
  const hasAmazonUs = !!filament.amazon_link_us;
  const hasAmazonUk = !!filament.amazon_link_uk;
  const hasAmazonDe = !!filament.amazon_link_de;
  const retailerCount = [hasProductUrl, hasAmazonUs, hasAmazonUk, hasAmazonDe].filter(Boolean).length;
  
  if (filament.variant_available === false) {
    return { status: "oos" as const, label: "Out of stock", colorClass: "availability-oos", retailerCount: 0 };
  }
  
  if (retailerCount >= 2) {
    return { status: "available" as const, label: `In stock at ${retailerCount} retailers`, colorClass: "availability-available", retailerCount };
  }
  
  if (retailerCount === 1) {
    return { status: "limited" as const, label: "Limited availability", colorClass: "availability-limited", retailerCount };
  }
  
  return { status: "limited" as const, label: "Check availability", colorClass: "availability-limited", retailerCount: 0 };
}

interface FilamentCardProps {
  filament: Filament;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
  colorMatchPercent?: number | null;
  priceTrend?: number | null; // percentage, negative = price drop
  compareCount?: number;
  maxCompare?: number;
}

export function FilamentCard({
  filament,
  isSelected = false,
  onToggleCompare,
  colorMatchPercent,
  priceTrend,
  compareCount = 0,
  maxCompare = 4,
}: FilamentCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(isSelected);
  const [imageError, setImageError] = useState(false);
  const [retailerPopoverOpen, setRetailerPopoverOpen] = useState(false);
  
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  
  // Check if compare tray is full
  const isCompareDisabled = compareCount >= maxCompare && !isSelected;

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

  // Properties Section Component (internal)
  const PropertiesSection = ({ 
    filament, 
    printDifficulty, 
    maxTemp 
  }: { 
    filament: Filament; 
    printDifficulty: { label: string; color: string };
    maxTemp: number | null | undefined;
  }) => {
    const [showAll, setShowAll] = useState(false);
    
    // Build property tags array with categories
    interface PropertyTag {
      id: string;
      label: string;
      icon: typeof Shield;
      category: 'safety' | 'compatibility' | 'special';
      colorClass: string;
    }
    
    const allTags: PropertyTag[] = [];
    
    // Safety properties
    if (filament.food_contact_rating) {
      allTags.push({
        id: 'food-safe',
        label: 'Food Safe',
        icon: Utensils,
        category: 'safety',
        colorClass: 'bg-green-500/10 border-green-500/30 text-green-400 hover:border-green-500/50'
      });
    }
    if (filament.is_nozzle_abrasive === false) {
      allTags.push({
        id: 'brass-safe',
        label: 'Brass Safe',
        icon: Shield,
        category: 'safety',
        colorClass: 'bg-green-500/10 border-green-500/30 text-green-400 hover:border-green-500/50'
      });
    }
    
    // Compatibility properties
    if (filament.spool_ams_fit) {
      allTags.push({
        id: 'ams-fit',
        label: 'AMS/MMU Fit',
        icon: Box,
        category: 'compatibility',
        colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-500/50'
      });
    }
    if (filament.is_nozzle_abrasive === false) {
      allTags.push({
        id: 'all-hotends',
        label: 'All Hotends',
        icon: Layers,
        category: 'compatibility',
        colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:border-blue-500/50'
      });
    }
    
    // Special properties
    if (filament.high_speed_capable) {
      allTags.push({
        id: 'high-speed',
        label: 'High Speed',
        icon: Zap,
        category: 'special',
        colorClass: 'bg-primary/10 border-primary/30 text-primary hover:border-primary/50'
      });
    }
    if (filament.finish_type?.toLowerCase().includes('matte')) {
      allTags.push({
        id: 'matte',
        label: 'Matte Finish',
        icon: Gem,
        category: 'special',
        colorClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:border-purple-500/50'
      });
    }
    if (filament.carbon_fiber_percentage && filament.carbon_fiber_percentage > 0) {
      allTags.push({
        id: 'carbon-fiber',
        label: 'Carbon Fiber',
        icon: Layers,
        category: 'special',
        colorClass: 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:border-gray-500/50'
      });
    }
    if (filament.glass_fiber_percentage && filament.glass_fiber_percentage > 0) {
      allTags.push({
        id: 'glass-fiber',
        label: 'Glass Fiber',
        icon: Layers,
        category: 'special',
        colorClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50'
      });
    }
    if (filament.wood_powder_percentage && filament.wood_powder_percentage > 0) {
      allTags.push({
        id: 'wood-fill',
        label: 'Wood Fill',
        icon: Leaf,
        category: 'special',
        colorClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-500/50'
      });
    }
    if (filament.material?.toLowerCase().includes('glow')) {
      allTags.push({
        id: 'glow',
        label: 'Glow in Dark',
        icon: Sun,
        category: 'special',
        colorClass: 'bg-lime-500/10 border-lime-500/30 text-lime-400 hover:border-lime-500/50'
      });
    }
    
    // Remove duplicate tags by id
    const uniqueTags = allTags.filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    );
    
    const MAX_VISIBLE = 4;
    const visibleTags = showAll ? uniqueTags : uniqueTags.slice(0, MAX_VISIBLE);
    const hiddenCount = uniqueTags.length - MAX_VISIBLE;

    return (
      <div className="mb-4 space-y-2">
        {/* Property Tags */}
        {uniqueTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => {
              const IconComponent = tag.icon;
              return (
                <Badge 
                  key={tag.id}
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-2 py-0.5 gap-1 transition-colors",
                    tag.colorClass
                  )}
                >
                  <IconComponent className="w-3 h-3" />
                  {tag.label}
                </Badge>
              );
            })}
            {!showAll && hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-3 h-3" />
                +{hiddenCount} more
              </button>
            )}
          </div>
        )}
        
        {/* Technical Specs Row */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          {maxTemp && (
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              {maxTemp}°C
            </span>
          )}
          {filament.diameter_nominal_mm && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                {filament.diameter_nominal_mm}mm
              </span>
            </>
          )}
          <span className="text-muted-foreground/40">•</span>
          <span className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
            printDifficulty.color
          )}>
            <Printer className="w-2.5 h-2.5" />
            {printDifficulty.label}
          </span>
        </div>
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
  
  // Material availability
  const availability = getAvailabilityStatus(filament);
  
  // Similar filaments hook
  const { similars: similarFilaments, count: similarCount } = useSimilarFilaments(
    filament.id,
    filament.material,
    filament.color_family,
    filament.vendor,
    filament.variant_price
  );

  const { toast } = useToast();
  
  // Handle compare with feedback
  const handleCompare = () => {
    if (isCompareDisabled) {
      toast({
        title: "Compare tray full",
        description: "Remove an item before adding more (4 max)",
        variant: "destructive"
      });
      return;
    }
    
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 500);
    
    const willBeSelected = !isSelected;
    setShowCheckmark(willBeSelected);
    onToggleCompare?.(filament.id);
    
    if (willBeSelected) {
      toast({
        title: "Added to comparison",
        description: `${compareCount + 1}/${maxCompare} filaments selected`,
      });
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/filament/${filament.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: filament.product_title,
          text: `Check out ${filament.product_title}`,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };
  
  // Handle report
  const handleReport = () => {
    window.open(`mailto:support@filascope.com?subject=Data issue: ${filament.product_title}&body=Filament ID: ${filament.id}%0D%0A%0D%0APlease describe the issue:`, "_blank");
  };

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-5 card-3d-hover overflow-hidden",
        isSelected 
          ? "border-2 border-primary bg-primary/5" 
          : "border-border hover:border-primary/50",
        isPulsing && "compare-pulse"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compare Checkbox - Top Left (shows on hover) */}
      <div 
        className={cn(
          "absolute top-3 left-3 z-10 transition-opacity duration-200",
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        )}
      >
        {isSelected ? (
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center checkmark-enter">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        ) : (
          <Checkbox
            checked={isSelected}
            disabled={isCompareDisabled}
            onCheckedChange={handleCompare}
            aria-label={`Add ${filament.product_title} to comparison`}
            className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        )}
      </div>

      {/* Quick Actions Menu - Top Right (shows on hover) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <LikeButton filamentId={filament.id} size="sm" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "p-1.5 rounded-full bg-card/80 backdrop-blur border border-border/50 card-quick-actions",
                "hover:bg-muted transition-colors"
              )}
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share this material
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/filament/${filament.id}#price`)}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View price history
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleReport} className="text-muted-foreground">
              <Flag className="w-4 h-4 mr-2" />
              Report incorrect data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header: Brand + Material Badge */}
      <div className="flex items-center justify-between mb-3 pr-8">
        <div className="flex items-center gap-2 overflow-hidden">
          {brandLogo && !imageError ? (
            <img 
              src={brandLogo} 
              alt={`${filament.vendor} logo`}
              className="w-8 h-8 rounded object-contain bg-muted p-0.5 card-image-zoom"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              {imageError ? (
                <ImageOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {filament.vendor?.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          )}
          <span className="text-sm text-muted-foreground font-medium">
            {filament.vendor || "Unknown"}
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
      <PropertiesSection filament={filament} printDifficulty={printDifficulty} maxTemp={maxTemp} />

      {/* Availability Status */}
      <Popover open={retailerPopoverOpen} onOpenChange={setRetailerPopoverOpen}>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "flex items-center gap-2 text-xs px-2 py-1.5 rounded border mb-3 w-full justify-center transition-colors",
              availability.colorClass
            )}
          >
            <Package className="w-3 h-3" />
            <span>{availability.label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="top">
          <p className="text-xs font-medium mb-2">Available at:</p>
          <div className="space-y-2">
            {filament.product_url && (
              <a 
                href={getAffiliateUrl(filament.product_url, filament.vendor)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <span>{filament.vendor || "Official Store"}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
            {filament.amazon_link_us && (
              <a 
                href={getAmazonUrl(filament.amazon_link_us, "us")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <span>Amazon US</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
            {filament.amazon_link_uk && (
              <a 
                href={getAmazonUrl(filament.amazon_link_uk, "uk")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <span>Amazon UK</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
            {filament.amazon_link_de && (
              <a 
                href={getAmazonUrl(filament.amazon_link_de, "de")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <span>Amazon DE</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
            {availability.retailerCount === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No retailers found
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Similar Materials Badge */}
      {similarCount > 0 && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
              <Layers className="w-3 h-3" />
              <span>{similarCount} similar materials</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 p-3" side="top">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Similar Materials</p>
            <div className="space-y-1">
              {similarFilaments.slice(0, 3).map((sim) => {
                const simWeightKg = sim.net_weight_g ? sim.net_weight_g / 1000 : null;
                const simPricePerKg = sim.variant_price && simWeightKg 
                  ? sim.variant_price / simWeightKg 
                  : null;
                
                return (
                  <Link 
                    key={sim.id} 
                    to={`/filament/${sim.id}`}
                    className="similar-mini-card"
                  >
                    {sim.color_hex && (
                      <div 
                        className="w-5 h-5 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: sim.color_hex.startsWith('#') ? sim.color_hex : `#${sim.color_hex}` }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sim.product_title}</p>
                      <p className="text-xs text-muted-foreground">{sim.vendor}</p>
                    </div>
                    {simPricePerKg && (
                      <span className="text-xs font-mono text-primary">
                        ${simPricePerKg.toFixed(0)}/kg
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <Link 
              to={`/finder?material=${encodeURIComponent(filament.material || "")}&color=${encodeURIComponent(filament.color_family || "")}`}
              className="block text-xs text-primary hover:underline mt-2 text-center"
            >
              See all alternatives →
            </Link>
          </HoverCardContent>
        </HoverCard>
      )}

      {/* CTA Section */}
      <div className="cta-slide-container flex items-center gap-2 pt-3 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isCompareDisabled}
              className={cn(
                "flex-1 border-primary/50 text-primary transition-all duration-200",
                isHovered && !isCompareDisabled && "bg-primary text-primary-foreground border-primary",
                isCompareDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => {
                e.preventDefault();
                handleCompare();
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
          </TooltipTrigger>
          {isCompareDisabled && (
            <TooltipContent side="top" className="text-xs">
              Compare tray full (4 max)
            </TooltipContent>
          )}
        </Tooltip>
        
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
