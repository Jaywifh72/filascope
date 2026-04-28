import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScrollCarousel, ScrollCarouselItem } from "@/components/ui/scroll-carousel";
import { Trophy, Palette, Shield, DollarSign, Zap, Sparkles } from "lucide-react";
import type { FilamentFiltersState } from "@/hooks/useSessionFilters";

interface DiscoveryZoneProps {
  resetFilters: () => void;
  updateFilter: <K extends keyof FilamentFiltersState>(key: K, value: FilamentFiltersState[K]) => void;
  unfilteredProductCount?: number;
}

const QUICK_PICKS = [
  {
    icon: Trophy,
    title: "Best for Beginners",
    subtitle: "Easy-to-print PLA & PETG",
    gradient: "from-amber-600/80 to-orange-500/80",
    border: "hover:border-amber-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("selectedMaterials", ["PLA", "PETG"]);
      update("sortBy", "score");
    },
  },
  {
    icon: Palette,
    title: "HueForge Ready",
    subtitle: "Filaments with verified TD values",
    gradient: "from-purple-600/80 to-fuchsia-500/80",
    border: "hover:border-purple-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("hasTdData", true);
    },
  },
  {
    icon: Shield,
    title: "Engineering Grade",
    subtitle: "PC, Nylon, ASA & composites",
    gradient: "from-blue-700/80 to-slate-500/80",
    border: "hover:border-blue-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("selectedMaterials", ["PC", "Nylon", "ASA"]);
    },
  },
  {
    icon: DollarSign,
    title: "Under $20/kg",
    subtitle: "Great value picks in your region",
    gradient: "from-emerald-600/80 to-green-500/80",
    border: "hover:border-emerald-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("priceRange", [0, 20]);
    },
  },
  {
    icon: Zap,
    title: "High Speed",
    subtitle: "Rated for 200mm/s+",
    gradient: "from-red-600/80 to-orange-500/80",
    border: "hover:border-red-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("highSpeed", true);
    },
  },
  {
    icon: Sparkles,
    title: "Just Added",
    subtitle: "New this week",
    gradient: "from-cyan-600/80 to-sky-500/80",
    border: "hover:border-cyan-500/40",
    apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => {
      reset();
      update("sortBy", "newest");
    },
  },
] as const;

const FACTS = [
  "PLA is made from corn starch — it's one of the most eco-friendly filaments available",
  "HueForge TD values range from 0.2 (very opaque) to 8+ (highly translucent)",
  "PETG is the #1 choice for functional parts — stronger than PLA, easier than ABS",
  "FilaScope tracks prices across 15+ retailers — so you always get the best deal",
  "ASA is like ABS but UV-resistant — perfect for outdoor prints",
  "Carbon fiber filaments require a hardened nozzle — brass nozzles will wear out fast",
  "Silk PLA prints at normal PLA temps but gives a glossy, metallic finish",
  "The most popular filament diameter is 1.75mm — used by 95%+ of desktop printers",
];

interface ComparisonLinkNav { label: string; href: string; }
interface ComparisonLinkFilter { label: string; href?: undefined; apply: (reset: DiscoveryZoneProps["resetFilters"], update: DiscoveryZoneProps["updateFilter"]) => void; }
type ComparisonLink = ComparisonLinkNav | ComparisonLinkFilter;

const COMPARISONS: ComparisonLink[] = [
  { label: "PLA vs PETG →", href: "/guides/pla-vs-petg" },
  { label: "Bambu Lab vs Polymaker →", href: "/brands" },
  { label: "Best PETG under $25 →", apply: (reset, update) => { reset(); update("selectedMaterials", ["PETG"]); update("priceRange", [0, 25]); } },
  { label: "Silk PLA comparison →", apply: (reset, update) => { reset(); update("selectedMaterials", ["PLA"]); update("silk", true); } },
];

export function DiscoveryZone({ resetFilters, updateFilter, unfilteredProductCount }: DiscoveryZoneProps) {
  const navigate = useNavigate();
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((i) => (i + 1) % FACTS.length);
        setFactVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const scrollToCatalog = useCallback(() => {
    setTimeout(() => {
      document.getElementById("catalog-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleQuickPick = useCallback((apply: (typeof QUICK_PICKS)[number]["apply"]) => {
    apply(resetFilters, updateFilter);
    scrollToCatalog();
  }, [resetFilters, updateFilter, scrollToCatalog]);

  const countLabel = unfilteredProductCount
    ? `${unfilteredProductCount.toLocaleString()}+ filaments`
    : "21,000+ filaments";

  return (
    <section className="w-full bg-gray-900/50 border-y border-gray-800 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section heading */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Discover Filaments</h3>
          <p className="text-sm text-muted-foreground mt-1">Quick entry points into our catalog</p>
        </div>

        {/* A: Quick Picks */}
        <ScrollCarousel gap={12}>
          {QUICK_PICKS.map((pick) => {
            const Icon = pick.icon;
            return (
              <ScrollCarouselItem key={pick.title}>
                <button
                  onClick={() => handleQuickPick(pick.apply)}
                  className={`min-w-[220px] h-[120px] rounded-xl bg-gradient-to-br ${pick.gradient} border border-white/10 ${pick.border} p-4 flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer`}
                >
                  <Icon className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-base font-semibold text-white">{pick.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-300/80">{pick.subtitle}</span>
                      <span className="text-[10px] bg-white/15 text-white/80 px-1.5 py-0.5 rounded-full">{countLabel}</span>
                    </div>
                  </div>
                </button>
              </ScrollCarouselItem>
            );
          })}
        </ScrollCarousel>

        {/* B: Did You Know? */}
        <div className="flex items-center gap-3 py-3 px-4 bg-gray-800/50 rounded-lg">
          <span className="text-amber-400 text-lg shrink-0">💡</span>
          <p
            className="flex-1 text-sm text-muted-foreground transition-opacity duration-300 min-h-[20px]"
            style={{ opacity: factVisible ? 1 : 0 }}
          >
            {FACTS[factIndex]}
          </p>
          <Link
            to="/guides/how-to-choose-3d-printer-filament"
            className="text-xs text-primary hover:text-primary/80 whitespace-nowrap shrink-0"
          >
            Learn more →
          </Link>
        </div>

        {/* C: Popular Comparisons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {COMPARISONS.map((cmp) =>
            cmp.href ? (
              <Link
                key={cmp.label}
                to={cmp.href}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/30 rounded-full text-sm text-gray-300 hover:text-white transition-all"
              >
                {cmp.label}
              </Link>
            ) : (
              <button
                key={cmp.label}
                onClick={() => { (cmp as ComparisonLinkFilter).apply(resetFilters, updateFilter); scrollToCatalog(); }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-cyan-500/30 rounded-full text-sm text-gray-300 hover:text-white transition-all"
              >
                {cmp.label}
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
