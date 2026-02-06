import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Truck, MapPin, Clock, Package, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserShipping } from "@/hooks/useUserShipping";
import { useRetailerData, Retailer } from "@/hooks/useRetailerData";
import { estimateShipping, formatDeliveryRange, ShippingEstimate } from "@/lib/shippingZones";
import { SUPPORTED_COUNTRIES } from "@/lib/importFeesCalculator";
import { PrimeBadge } from "./MembershipBenefits";

interface ShippingCalculatorProps {
  cartTotal: number;
  retailers?: Retailer[];
  className?: string;
}

interface RetailerEstimate extends ShippingEstimate {
  retailer: Retailer;
}

export function ShippingCalculator({
  cartTotal,
  retailers: propRetailers,
  className,
}: ShippingCalculatorProps) {
  const { data: fetchedRetailers } = useRetailerData();
  const retailers = propRetailers || fetchedRetailers || [];
  
  const { preferences, setZipCode, setCountry, setPrimeMember, hasZipCode } = useUserShipping();
  const [localZip, setLocalZip] = useState(preferences.zipCode);
  const [localCountry, setLocalCountry] = useState(preferences.country);
  const [isOpen, setIsOpen] = useState(false);
  const [estimates, setEstimates] = useState<RetailerEstimate[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  useEffect(() => {
    setLocalZip(preferences.zipCode);
    setLocalCountry(preferences.country);
  }, [preferences.zipCode, preferences.country]);

  const handleCalculate = () => {
    if (!localZip) return;
    
    // Save preferences
    setZipCode(localZip);
    setCountry(localCountry);
    
    // Calculate estimates for each retailer
    const newEstimates = retailers
      .filter(r => {
        // Check if retailer ships to this country
        const regions = r.regions_served || [];
        const normalizedCountry = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'PL', 'CZ'].includes(localCountry)
          ? 'EU'
          : localCountry === 'GB' ? 'UK' : localCountry;
        return regions.includes(normalizedCountry) || regions.includes(localCountry);
      })
      .map(retailer => {
        const estimate = estimateShipping(
          localZip,
          localCountry,
          cartTotal,
          retailer.free_shipping_threshold,
          retailer.flat_rate_shipping,
          'US'
        );
        return { ...estimate, retailer };
      })
      .sort((a, b) => {
        // Sort by: free first, then by cost, then by speed
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.minDays - b.minDays;
      });
    
    setEstimates(newEstimates);
    setHasCalculated(true);
    setIsOpen(true);
  };

  return (
    <Card className={cn("bg-card/50 border-border/30", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Shipping Estimate
              </CardTitle>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                isOpen && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* ZIP Code Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="zip" className="text-xs text-muted-foreground mb-1 block">
                  ZIP / Postal Code
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="zip"
                    value={localZip}
                    onChange={(e) => setLocalZip(e.target.value)}
                    placeholder="90210"
                    className="pl-8 h-9 bg-background/50"
                  />
                </div>
              </div>
              <div className="w-24">
                <Label htmlFor="country" className="text-xs text-muted-foreground mb-1 block">
                  Country
                </Label>
                <Select value={localCountry} onValueChange={setLocalCountry}>
                  <SelectTrigger className="h-9 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prime membership checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="prime"
                checked={preferences.amazonPrimeMember}
                onCheckedChange={(checked) => setPrimeMember(!!checked)}
              />
              <Label htmlFor="prime" className="text-xs flex items-center gap-1.5 cursor-pointer">
                I have <PrimeBadge small />
              </Label>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={!localZip}
              size="sm"
              className="w-full"
            >
              Calculate Shipping
            </Button>

            {/* Results */}
            {hasCalculated && estimates.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                {estimates.map((est) => (
                  <div
                    key={est.retailer.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/20"
                  >
                    <div className="flex items-center gap-2.5">
                      {est.retailer.logo_url && (
                        <img 
                          src={est.retailer.logo_url} 
                          alt={est.retailer.name}
                          className="h-6 w-6 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{est.retailer.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{est.carrier}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        est.isFree ? "text-emerald-400" : "text-foreground"
                      )}>
                        {est.isFree ? (
                          preferences.amazonPrimeMember && est.retailer.membership_program === 'prime'
                            ? 'Free with Prime'
                            : 'Free Shipping'
                        ) : (
                          `$${est.cost.toFixed(2)}`
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatDeliveryRange(est.arrivalDate.min, est.arrivalDate.max)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasCalculated && estimates.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No retailers ship to {localCountry}
              </p>
            )}

            {/* Save preference checkbox */}
            {hasCalculated && localZip && (
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="saveZip"
                  checked={preferences.zipCode === localZip}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setZipCode(localZip);
                      setCountry(localCountry);
                    }
                  }}
                />
                <Label htmlFor="saveZip" className="text-xs text-muted-foreground cursor-pointer">
                  Save as my default location
                </Label>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
