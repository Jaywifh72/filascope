import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/hooks/useCompare";
import { toast } from "sonner";

interface UpgradeSuggestion {
  from: string;
  to: string;
  reason: string;
}

interface UpgradeSuggestionsProps {
  suggestions: UpgradeSuggestion[];
  onAddToCompare?: (material: string) => void;
}

export function UpgradeSuggestions({ 
  suggestions, 
  onAddToCompare 
}: UpgradeSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">
          Upgrade Suggestions
        </h4>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          Based on your purchases
        </Badge>
      </div>
      
      <div className="space-y-2">
        {suggestions.slice(0, 2).map((suggestion, idx) => (
          <UpgradeSuggestionCard
            key={idx}
            suggestion={suggestion}
            onAddToCompare={onAddToCompare}
          />
        ))}
      </div>
    </div>
  );
}

interface UpgradeSuggestionCardProps {
  suggestion: UpgradeSuggestion;
  onAddToCompare?: (material: string) => void;
}

function UpgradeSuggestionCard({ 
  suggestion, 
  onAddToCompare 
}: UpgradeSuggestionCardProps) {
  const handleClick = () => {
    if (onAddToCompare) {
      onAddToCompare(suggestion.to);
    }
    toast.success(`Looking for ${suggestion.to} options...`);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-background/50 p-3 border border-border/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">{suggestion.from}</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-primary">{suggestion.to}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {suggestion.reason}
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="text-primary hover:text-primary/80 shrink-0"
      >
        <TrendingUp className="mr-1 h-3.5 w-3.5" />
        Explore
      </Button>
    </div>
  );
}

// Cross-sell banner for related products
interface CrossSellBannerProps {
  currentMaterial: string | null;
  purchasedMaterials: string[];
}

export function CrossSellBanner({ 
  currentMaterial, 
  purchasedMaterials 
}: CrossSellBannerProps) {
  // Check if current material complements a purchased material
  const getComplement = (): string | null => {
    if (!currentMaterial) return null;
    const baseMat = currentMaterial.split(/[\s-]/)[0].toUpperCase();
    
    // Material pairing suggestions
    const pairings: Record<string, string[]> = {
      PLA: ["PETG", "TPU"],
      PETG: ["PLA", "ABS"],
      ABS: ["PETG", "ASA"],
      TPU: ["PLA", "PETG"],
    };
    
    for (const purchased of purchasedMaterials) {
      const purchasedBase = purchased.split(/[\s-]/)[0].toUpperCase();
      const pairs = pairings[purchasedBase];
      if (pairs && pairs.includes(baseMat)) {
        return purchased;
      }
    }
    
    return null;
  };

  const complement = getComplement();
  
  if (!complement) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 mb-2">
      <span className="text-primary">💡</span>
      <span>
        Goes great with your <span className="font-medium text-foreground">{complement}</span>
      </span>
    </div>
  );
}
