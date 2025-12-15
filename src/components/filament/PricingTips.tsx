import { generatePricingTips } from "@/lib/pricingRules";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { Lightbulb } from "lucide-react";

interface PricingTipsProps {
  filamentId: string;
  price: number;
  vendor: string;
  quantity: number;
}

export function PricingTips({ filamentId, price, vendor, quantity }: PricingTipsProps) {
  const priceHistory = usePriceHistory(filamentId, price, 30);
  
  const tips = generatePricingTips({
    quantity,
    price,
    vendor,
    trendPercent: priceHistory.trendPercent,
    isBestIn30Days: priceHistory.isBestIn30Days,
    isBestIn6Months: priceHistory.isBestIn6Months,
  });
  
  if (tips.length === 0) return null;
  
  return (
    <div className="space-y-2">
      {tips.map((tip, index) => (
        <div 
          key={index}
          className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2"
        >
          <span className="text-base flex-shrink-0">{tip.icon}</span>
          <span>{tip.message}</span>
        </div>
      ))}
    </div>
  );
}
