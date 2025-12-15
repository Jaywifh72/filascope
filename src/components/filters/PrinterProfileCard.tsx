import { Printer, Check, Box, Thermometer, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

interface PrinterProfileCardProps {
  printerId: string;
  modelName: string;
  brand: string;
  imageUrl?: string;
  buildVolume?: { x: number; y: number; z: number };
  maxTemp?: number;
  price?: number;
  compatibilityScore?: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function PrinterProfileCard({
  modelName,
  brand,
  imageUrl,
  buildVolume,
  maxTemp,
  price,
  compatibilityScore = 95,
  isSelected,
  onClick,
}: PrinterProfileCardProps) {
  const { formatPrice } = useCurrency();

  // Price tier calculation
  const priceTier = price
    ? price < 400
      ? { label: "Budget Friendly", color: "text-green-500" }
      : price < 800
      ? { label: "Mid-Range", color: "text-amber-500" }
      : { label: "Premium", color: "text-purple-500" }
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all",
        "hover:bg-primary/5 hover:border-primary/30",
        isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border/50 bg-card"
      )}
    >
      <div className="flex gap-4">
        {/* Printer Image */}
        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={modelName}
              className="w-full h-full object-contain"
            />
          ) : (
            <Printer className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Printer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground truncate">
                {modelName}
              </h4>
              <p className="text-sm text-muted-foreground">{brand}</p>
            </div>
            {isSelected && (
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
            {buildVolume && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Box className="h-3.5 w-3.5" />
                <span>
                  {buildVolume.x}×{buildVolume.y}×{buildVolume.z}mm
                </span>
              </div>
            )}
            {maxTemp && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5" />
                <span>{maxTemp}°C max</span>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={priceTier?.color}>
                  {formatPrice(price)} <span className="text-muted-foreground">({priceTier?.label})</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Percent className="h-3.5 w-3.5" />
              <span className="text-green-500">{compatibilityScore}% compatible</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
