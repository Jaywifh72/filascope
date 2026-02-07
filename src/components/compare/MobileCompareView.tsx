import { useState, useRef } from "react";
import { ShoppingCart, ExternalLink, Trophy, ChevronLeft, ChevronRight, Lightbulb, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { getBrandLogo } from "@/lib/brandLogos";
import { cn } from "@/lib/utils";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

interface MobileCompareViewProps {
  filaments: Filament[];
  winCounts: number[];
  bestPriceIndices: number[];
  overallWinnerIndices: number[];
  totalCategories: number;
}

export function MobileCompareView({ 
  filaments, 
  winCounts, 
  bestPriceIndices, 
  overallWinnerIndices,
  totalCategories 
}: MobileCompareViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { getAffiliateUrl } = useAffiliateLinks();
  const { formatPrice } = useCurrency();
  const containerRef = useRef<HTMLDivElement>(null);

  const getPricePerKg = (f: Filament): number | null => {
    if (!f.variant_price) return null;
    return computePricePerKg(f.variant_price, f.net_weight_g, f.pack_quantity);
  };

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(filaments.length - 1, prev + 1));
  };

  const filament = filaments[activeIndex];
  const affiliateUrl = getAffiliateUrl(filament.product_url, filament.vendor);
  const pricePerKg = getPricePerKg(filament);
  const isWinner = overallWinnerIndices.includes(activeIndex);
  const isBestPrice = bestPriceIndices.includes(activeIndex);
  const inStock = filament.variant_available !== false;
  const brandLogo = filament.vendor ? getBrandLogo(filament.vendor) : null;

  // Key specs to highlight
  const keySpecs = [
    { label: "Tensile Strength", value: filament.tensile_strength_xy_mpa, unit: " MPa" },
    { label: "Glass Transition", value: filament.tg_c, unit: "°C" },
    { label: "Print Speed Max", value: filament.print_speed_max_mms, unit: " mm/s" },
    { label: "Nozzle Temp", value: filament.nozzle_temp_min_c && filament.nozzle_temp_max_c 
      ? `${filament.nozzle_temp_min_c}-${filament.nozzle_temp_max_c}` 
      : filament.nozzle_temp_sweetspot_c, unit: "°C" },
    { label: "TD (HueForge)", value: filament.transmission_distance, unit: " mm" },
    { label: "Net Weight", value: filament.net_weight_g, unit: "g" },
  ].filter(spec => spec.value !== null && spec.value !== undefined);

  return (
    <div className="md:hidden space-y-4">
      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2">
        {filaments.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              idx === activeIndex 
                ? "bg-primary w-6" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`View filament ${idx + 1}`}
          />
        ))}
      </div>

      {/* Card carousel */}
      <div className="relative" ref={containerRef}>
        {/* Navigation buttons */}
        {filaments.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-background/80 backdrop-blur"
              onClick={handlePrev}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-background/80 backdrop-blur"
              onClick={handleNext}
              disabled={activeIndex === filaments.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        <Card className={cn(
          "mx-8 transition-all",
          isWinner && "border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent"
        )}>
          <CardHeader className="pb-2">
            {/* Winner badge */}
            {isWinner && (
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <Badge className="bg-amber-500 text-amber-950">Overall Winner</Badge>
              </div>
            )}

            {/* Brand & color */}
            <div className="flex items-center gap-3">
              {filament.color_hex && (
                <div 
                  className="w-10 h-10 rounded-full border-2 border-border shrink-0"
                  style={{ backgroundColor: filament.color_hex }}
                />
              )}
              {brandLogo && (
                <img
                  src={brandLogo}
                  alt={filament.vendor || ''}
                  className="h-8 object-contain"
                />
              )}
              {filament.material && (
                <Badge variant="outline">{filament.material}</Badge>
              )}
            </div>

            <CardTitle className="text-lg mt-2 line-clamp-2">
              {filament.product_title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Price section */}
            <div className="flex items-center justify-between">
              <div>
                {pricePerKg && (
                  <p className={cn(
                    "font-mono font-bold text-2xl",
                    isBestPrice ? "text-amber-400" : "text-primary"
                  )}>
                    {formatPrice(pricePerKg)}/kg
                  </p>
                )}
                {filament.variant_price && (
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(filament.variant_price)} per spool
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{winCounts[activeIndex]}</p>
                <p className="text-xs text-muted-foreground">wins of {totalCategories}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {isBestPrice && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                  <Check className="w-3 h-3" />
                  Best Value
                </Badge>
              )}
              {filament.transmission_distance && filament.transmission_distance >= 2 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
                  <Lightbulb className="w-3 h-3" />
                  HueForge Ready
                </Badge>
              )}
              {filament.high_speed_capable && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  High Speed
                </Badge>
              )}
            </div>

            <Separator />

            {/* Key specs */}
            <div className="grid grid-cols-2 gap-3">
              {keySpecs.slice(0, 6).map((spec, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-muted-foreground text-xs">{spec.label}</p>
                  <p className="font-medium">
                    {typeof spec.value === 'string' ? spec.value : spec.value}
                    {spec.unit}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Buy button */}
            {affiliateUrl ? (
              <Button
                asChild
                size="lg"
                disabled={!inStock}
                className={cn(
                  "w-full gap-2 font-semibold text-base h-14",
                  isWinner && "bg-amber-500 hover:bg-amber-400 text-amber-950",
                  !inStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <a 
                  href={affiliateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!inStock) e.preventDefault();
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {inStock ? `Buy from ${filament.vendor}` : "Out of Stock"}
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="lg" disabled className="w-full h-14">
                No Purchase Link
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick summary */}
      <Card className="mx-4">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-3">Quick Comparison</h4>
          <div className="space-y-2">
            {filaments.map((f, idx) => {
              const fPricePerKg = getPricePerKg(f);
              const fIsWinner = overallWinnerIndices.includes(idx);
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                    idx === activeIndex ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                  )}
                >
                  {f.color_hex && (
                    <div 
                      className="w-6 h-6 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: f.color_hex }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.product_title}</p>
                    <p className="text-xs text-muted-foreground">{f.vendor}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {fPricePerKg && (
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        bestPriceIndices.includes(idx) ? "text-amber-400" : "text-primary"
                      )}>
                        {formatPrice(fPricePerKg)}/kg
                      </p>
                    )}
                    {fIsWinner && (
                      <Trophy className="w-4 h-4 text-amber-500 ml-auto" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
