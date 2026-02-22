import type { FilamentSearchResult } from "@/types/intelligentSearch";

interface FilamentMatchCardProps {
  filament: FilamentSearchResult;
  isIntelligentMode: boolean;
  region?: string;
}

const formatPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$", CAD: "CA$", EUR: "€", GBP: "£", AUD: "A$", JPY: "¥",
  };
  return `${symbols[currency] ?? currency + " "}${price.toFixed(currency === "JPY" ? 0 : 2)}`;
};

const FilamentMatchCard = ({ filament, isIntelligentMode }: FilamentMatchCardProps) => {
  const props = filament.properties;
  const propertyBadges: { label: string; className: string }[] = [];

  if (props) {
    if (props.heat_resistance_c != null && props.heat_resistance_c >= 80)
      propertyBadges.push({ label: `🌡️ ${props.heat_resistance_c}°C`, className: "bg-orange-950/50 text-orange-400 border-orange-800/30" });
    if (props.food_safe)
      propertyBadges.push({ label: "🍽️ Food Safe", className: "bg-emerald-950/50 text-emerald-400 border-emerald-800/30" });
    if (props.outdoor_suitable)
      propertyBadges.push({ label: "☀️ Outdoor", className: "bg-blue-950/50 text-blue-400 border-blue-800/30" });
    if (props.enclosure_required)
      propertyBadges.push({ label: "📦 Needs Enclosure", className: "bg-yellow-950/50 text-yellow-400 border-yellow-800/30" });
    if (props.drying_required)
      propertyBadges.push({ label: "💧 Needs Drying", className: "bg-yellow-950/50 text-yellow-400 border-yellow-800/30" });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{filament.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{filament.brand.name}</p>
        </div>
        {filament.price && (
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {formatPrice(filament.price.price, filament.price.currency)}
          </span>
        )}
      </div>

      {/* Material badge */}
      <div>
        <span className="bg-primary/10 text-primary border border-primary/20 text-xs rounded-full px-2.5 py-0.5">
          {filament.materialType.name}
        </span>
      </div>

      {/* Property badges */}
      {propertyBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {propertyBadges.map((b) => (
            <span key={b.label} className={`border text-xs rounded-full px-2 py-0.5 ${b.className}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Match reasons */}
      {isIntelligentMode && filament.matchReasons.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-gray-500">Why this matched:</span>
          <div className="flex flex-wrap gap-1.5">
            {filament.matchReasons.map((reason, i) => (
              <span
                key={i}
                className="bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 text-xs rounded-full px-2 py-0.5"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilamentMatchCard;
