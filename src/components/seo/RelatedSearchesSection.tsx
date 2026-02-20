import { Search } from "lucide-react";

/**
 * RelatedSearchesSection
 * Renders keyword-rich search intent chips for a given material slug.
 * Uses plain <a> tags for maximum crawler discoverability.
 */

const MATERIAL_SEARCH_INTENTS: Record<string, string[]> = {
  pla: [
    "best PLA filament for beginners",
    "cheapest PLA filament",
    "PLA filament for HueForge",
    "best PLA for Ender 3",
    "matte PLA filament",
    "silk PLA filament",
    "PLA filament 1kg spool",
    "high speed PLA filament",
  ],
  "pla-plus": [
    "best PLA+ filament",
    "PLA+ vs PLA difference",
    "PLA+ for functional parts",
    "cheapest PLA+ filament",
    "PLA+ filament Bambu Lab",
    "strongest PLA+ filament",
  ],
  petg: [
    "best PETG filament 2026",
    "PETG for outdoor prints",
    "clear PETG filament",
    "cheapest PETG filament",
    "PETG print temperature",
    "food safe PETG",
    "PETG vs PLA strength",
    "best PETG for Bambu Lab",
  ],
  abs: [
    "best ABS filament for engineering",
    "ABS vs ASA outdoors",
    "cheapest ABS filament",
    "ABS filament warping solutions",
    "ABS for car parts",
    "enclosure for ABS printing",
  ],
  asa: [
    "best ASA filament for outdoors",
    "ASA vs ABS comparison",
    "UV resistant filament",
    "ASA for automotive parts",
    "cheapest ASA filament",
  ],
  tpu: [
    "best flexible filament",
    "TPU filament Shore hardness",
    "flexible phone case filament",
    "TPU 95A vs 87A filament",
    "cheapest TPU filament",
    "TPU print settings guide",
  ],
  nylon: [
    "best Nylon filament for strength",
    "Nylon PA12 vs PA6 filament",
    "Nylon filament moisture problem",
    "Nylon for mechanical parts",
    "CF Nylon filament",
    "cheapest Nylon filament",
  ],
  "silk-pla": [
    "best silk PLA filament",
    "silk PLA color options",
    "shiny PLA filament",
    "silk filament print settings",
    "silk rainbow filament",
    "multi-color silk filament",
  ],
  pc: [
    "best polycarbonate filament",
    "PC filament print temperature",
    "PC vs ABS strength",
    "PC-CF filament",
    "clear polycarbonate filament",
    "PC filament for engineering",
  ],
  "pla-cf": [
    "best carbon fiber PLA filament",
    "PLA-CF for structural parts",
    "carbon fiber filament stiffness",
    "PLA-CF print settings",
    "cheapest CF filament",
    "matte carbon fiber filament",
  ],
  "petg-cf": [
    "best carbon fiber PETG filament",
    "PETG-CF vs PLA-CF strength",
    "PETG carbon fiber print settings",
    "stiff PETG filament",
    "carbon fiber PETG for engineering",
  ],
  tpe: [
    "best TPE filament",
    "TPE vs TPU flexibility",
    "soft flexible filament",
    "TPE print settings",
    "waterproof TPE filament",
  ],
  pa: [
    "best PA filament",
    "PA12 vs PA6 filament",
    "engineering grade nylon",
    "PA filament moisture handling",
    "high strength nylon filament",
  ],
};

interface RelatedSearchesSectionProps {
  materialSlug: string;
  materialLabel?: string;
}

export function RelatedSearchesSection({ materialSlug, materialLabel }: RelatedSearchesSectionProps) {
  const intents = MATERIAL_SEARCH_INTENTS[materialSlug];
  if (!intents || intents.length === 0) return null;

  return (
    <section aria-label="Popular related searches" className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        Popular {materialLabel ?? materialSlug.toUpperCase()} Searches
      </h2>
      <div className="flex flex-wrap gap-2">
        {intents.map((query) => (
          <a
            key={query}
            href={`/filaments?search=${encodeURIComponent(query)}`}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
          >
            {query}
          </a>
        ))}
      </div>
    </section>
  );
}
