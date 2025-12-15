import { cn } from "@/lib/utils";
import { Globe, Check, X, AlertTriangle, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateImportFees, getCountryName } from "@/lib/importFeesCalculator";
import { Link } from "react-router-dom";

interface RegionalAvailabilityProps {
  regionsServed: string[] | null;
  userCountry: string;
  productPrice: number;
  productCurrency?: string;
  retailerName: string;
  alternativeRetailers?: { name: string; slug: string }[];
  className?: string;
}

export function RegionalAvailability({
  regionsServed,
  userCountry,
  productPrice,
  productCurrency = 'USD',
  retailerName,
  alternativeRetailers,
  className,
}: RegionalAvailabilityProps) {
  const regions = regionsServed || [];
  
  // Normalize EU countries
  const normalizedCountry = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'PL', 'CZ'].includes(userCountry)
    ? 'EU'
    : userCountry === 'GB' ? 'UK' : userCountry;
  
  const shipsToUser = regions.includes(normalizedCountry) || regions.includes(userCountry);
  
  // Calculate import fees if international
  const isInternational = !shipsToUser && regions.length > 0;
  const importFees = isInternational 
    ? calculateImportFees(productPrice, productCurrency, userCountry) 
    : null;

  if (shipsToUser) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Check className="h-3 w-3 text-emerald-400" />
        <span className="text-xs text-emerald-400">
          Ships to {getCountryName(userCountry)}
        </span>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Globe className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Check availability
        </span>
      </div>
    );
  }

  // Does not ship directly - show alternatives or import info
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5">
        <X className="h-3 w-3 text-red-400" />
        <span className="text-xs text-red-400">
          {retailerName} doesn't ship to {getCountryName(userCountry)}
        </span>
      </div>

      {/* Show where they do ship */}
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-muted-foreground">Ships to:</span>
        {regions.slice(0, 4).map(region => (
          <Badge 
            key={region} 
            variant="outline" 
            className="text-[10px] px-1.5 py-0 bg-muted/30"
          >
            {getCountryName(region)}
          </Badge>
        ))}
        {regions.length > 4 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/30">
            +{regions.length - 4} more
          </Badge>
        )}
      </div>

      {/* Import fees estimate */}
      {importFees && importFees.total > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 cursor-help">
                <Calculator className="h-3 w-3" />
                <span>Est. import fees: {productCurrency} {importFees.total.toFixed(2)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              <div className="space-y-1">
                <p>Duties: {productCurrency} {importFees.duties.toFixed(2)}</p>
                <p>Taxes: {productCurrency} {importFees.taxes.toFixed(2)}</p>
                <p className="text-muted-foreground mt-1">{importFees.disclaimer}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Alternative retailers */}
      {alternativeRetailers && alternativeRetailers.length > 0 && (
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-1">
            💡 Available from:
          </p>
          <div className="flex flex-wrap gap-1">
            {alternativeRetailers.slice(0, 3).map(alt => (
              <Link key={alt.slug} to={`/brands/${alt.slug}`}>
                <Badge 
                  variant="outline" 
                  className="text-xs hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-colors"
                >
                  {alt.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ShipsToIndicatorProps {
  regionsServed: string[] | null;
  userCountry: string;
  compact?: boolean;
  className?: string;
}

export function ShipsToIndicator({
  regionsServed,
  userCountry,
  compact = false,
  className,
}: ShipsToIndicatorProps) {
  const regions = regionsServed || [];
  const normalizedCountry = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'PL', 'CZ'].includes(userCountry)
    ? 'EU'
    : userCountry === 'GB' ? 'UK' : userCountry;
  
  const shipsToUser = regions.includes(normalizedCountry) || regions.includes(userCountry);

  if (compact) {
    return shipsToUser ? (
      <Check className={cn("h-3 w-3 text-emerald-400", className)} />
    ) : (
      <X className={cn("h-3 w-3 text-red-400", className)} />
    );
  }

  return shipsToUser ? (
    <Badge variant="outline" className={cn("text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400", className)}>
      <Check className="h-3 w-3 mr-1" />
      Ships to you
    </Badge>
  ) : (
    <Badge variant="outline" className={cn("text-xs bg-red-500/10 border-red-500/30 text-red-400", className)}>
      <X className="h-3 w-3 mr-1" />
      Doesn't ship
    </Badge>
  );
}
