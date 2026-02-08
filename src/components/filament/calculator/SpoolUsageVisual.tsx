import React from 'react';
import { Package, Printer, ShoppingCart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SpoolUsageVisualProps {
  spoolWeight: number; // Total spool weight in grams
  usagePerPrint: number; // Grams used per print
  currentSpoolRemaining?: number; // Optional: grams remaining in current spool
  filamentName: string;
  filamentPrice: number;
  onShare?: () => void;
  buyMoreUrl?: string;
  /** Currency symbol (e.g., "C$", "€") */
  currencySymbol?: string;
  /** Currency code (e.g., "CAD", "EUR") */
  currencyCode?: string;
  /** Whether price is a converted estimate */
  isConverted?: boolean;
}

export const SpoolUsageVisual: React.FC<SpoolUsageVisualProps> = ({
  spoolWeight,
  usagePerPrint,
  currentSpoolRemaining,
  filamentName,
  filamentPrice,
  onShare,
  buyMoreUrl,
  currencySymbol = '$',
  currencyCode = 'USD',
  isConverted = false,
}) => {
  // Calculate metrics
  const remaining = currentSpoolRemaining ?? spoolWeight;
  const usagePercent = Math.min(100, (usagePerPrint / spoolWeight) * 100);
  const remainingPercent = (remaining / spoolWeight) * 100;
  const printsRemaining = Math.floor(remaining / usagePerPrint);
  const isRunningLow = printsRemaining <= 3;

  const prefix = isConverted ? '~' : '';
  const costPerPrint = (usagePerPrint / 1000) * filamentPrice;
  const printsPerSpool = Math.floor(spoolWeight / usagePerPrint);
  const costPerPrintFromSpool = filamentPrice / printsPerSpool;
  
  // Visual spool representation
  const spoolSegments = 10;
  const filledSegments = Math.round((remainingPercent / 100) * spoolSegments);
  const usedByThisPrint = Math.ceil((usagePercent / 100) * spoolSegments);

  return (
    <div className="space-y-4">
      {/* Spool Visualization */}
      <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Spool Usage
          </h4>
          <span className="text-xs text-muted-foreground">
            {spoolWeight}g spool
          </span>
        </div>

        {/* Progress Bar with Print Usage Overlay */}
        <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden mb-3">
          {/* Remaining filament */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
            style={{ width: `${remainingPercent}%` }}
          />
          {/* This print usage indicator */}
          <div 
            className="absolute inset-y-0 bg-amber-500/60 rounded-full transition-all duration-300"
            style={{ 
              left: `${Math.max(0, remainingPercent - usagePercent)}%`,
              width: `${Math.min(usagePercent, remainingPercent)}%`
            }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className="text-xs font-bold text-primary-foreground drop-shadow-md">
              {remaining.toFixed(0)}g left
            </span>
            <span className="text-xs font-medium text-white/80 drop-shadow-md">
              -{usagePerPrint.toFixed(1)}g
            </span>
          </div>
        </div>

        {/* Segment Visualization */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: spoolSegments }).map((_, i) => {
            const segmentIndex = spoolSegments - 1 - i;
            const isFilled = segmentIndex < filledSegments;
            const isUsedByPrint = segmentIndex >= (filledSegments - usedByThisPrint) && segmentIndex < filledSegments;
            
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-300",
                  isFilled 
                    ? isUsedByPrint 
                      ? "bg-amber-500" 
                      : "bg-primary"
                    : "bg-muted/40"
                )}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Remaining</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">This print</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted/40" />
            <span className="text-muted-foreground">Empty</span>
          </div>
        </div>
      </div>

      {/* Prints Remaining Card */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        isRunningLow 
          ? "bg-destructive/10 border-destructive/30" 
          : "bg-success/10 border-success/30"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isRunningLow ? "bg-destructive/20" : "bg-success/20"
          )}>
            <Printer className={cn(
              "w-5 h-5",
              isRunningLow ? "text-destructive" : "text-success"
            )} />
          </div>
          <div>
            <div className={cn(
              "text-2xl font-extrabold",
              isRunningLow ? "text-destructive" : "text-success"
            )}>
              {printsRemaining} {printsRemaining === 1 ? 'print' : 'prints'}
            </div>
            <div className="text-xs text-muted-foreground">
              remaining with current spool
            </div>
          </div>
        </div>
        
        {isRunningLow && buyMoreUrl && (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => window.open(buyMoreUrl, '_blank')}
            className="gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy More
          </Button>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {prefix}{currencySymbol}{costPerPrint.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Cost/Print
          </div>
        </div>
        <div className="bg-muted/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {printsPerSpool}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Prints/Spool
          </div>
        </div>
        <div className="bg-muted/20 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-foreground">
            {prefix}{currencySymbol}{costPerPrintFromSpool.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {currencyCode}/Print
          </div>
        </div>
      </div>

      {/* Share Button */}
      {onShare && (
        <Button 
          variant="outline" 
          onClick={onShare}
          className="w-full gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Calculation
        </Button>
      )}
    </div>
  );
};
