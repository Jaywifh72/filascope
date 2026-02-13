import { ArrowRight, Scale, Sparkles, Target, Search, GitCompare, BarChart3, Beaker, Shield, Zap, Waves, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { addMaterialToCompare } from "@/lib/materialCompareStore";
import { toast } from "sonner";

interface PopularComparison {
  id: string;
  materials: [string, string];
  description: string;
  icon: LucideIcon;
}

const popularComparisons: PopularComparison[] = [
  {
    id: "pla-vs-petg",
    materials: ["PLA", "PETG"],
    description: "Beginner choice vs. stronger alternative",
    icon: Beaker,
  },
  {
    id: "abs-vs-asa",
    materials: ["ABS", "ASA"],
    description: "Indoor vs. UV-resistant outdoor prints",
    icon: Shield,
  },
  {
    id: "pla-vs-pla-plus",
    materials: ["PLA", "PLA+"],
    description: "Standard vs. enhanced properties",
    icon: Zap,
  },
  {
    id: "tpu-vs-tpe",
    materials: ["TPU", "TPE"],
    description: "Common flexible vs. super soft",
    icon: Waves,
  },
];

const quickStartMaterials = [
  { name: "Bambu Lab PLA Basic", slug: "bambu-pla-basic" },
  { name: "Polymaker PolyLite PETG", slug: "polymaker-polylite-petg" },
  { name: "Prusament ASA", slug: "prusament-asa" },
];

interface FilamentComparisonEmptyStateProps {
  onBrowseMaterials: () => void;
}

export function FilamentComparisonEmptyState({
  onBrowseMaterials,
}: FilamentComparisonEmptyStateProps) {
  const navigate = useNavigate();

  const handleComparisonClick = (comparison: PopularComparison) => {
    const [a, b] = comparison.materials;
    addMaterialToCompare(a);
    addMaterialToCompare(b);
    toast.success(`${a} vs ${b} added to comparison`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in-0 duration-300">
      {/* Main Illustration */}
      <div className="relative mb-8">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 opacity-40" />
        
        {/* Main icon container */}
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-8 transition-transform duration-300 hover:scale-105">
          <Scale className="w-16 h-16 text-primary" strokeWidth={1.5} />
          
          {/* Decorative dots */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary/60 rounded-full" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
        Your Compare Tray is Empty
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Add filaments from the Materials page to compare their properties, 
        print settings, and performance metrics side-by-side.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <Button 
          onClick={onBrowseMaterials} 
          size="lg"
          className="gap-2 transition-all duration-150 hover:scale-105"
        >
          <Search className="w-4 h-4" />
          Browse Materials
        </Button>
        
        <Button 
          asChild
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Link to="/wizard">
            <Target className="w-4 h-4" />
            Try Quick Match
          </Link>
        </Button>
      </div>

      {/* Popular Comparisons Section */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Popular Comparisons
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularComparisons.map((comparison) => (
            <button
              key={comparison.id}
              onClick={() => handleComparisonClick(comparison)}
              className={cn(
                "group flex items-center justify-between",
                "bg-gray-800/50 hover:bg-gray-800 border border-gray-700",
                "hover:border-cyan-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/[0.08]",
                "rounded-lg p-4 transition-all duration-200",
                "text-left"
              )}
            >
              <comparison.icon className="w-5 h-5 text-primary/50 shrink-0 mr-3" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {comparison.materials[0]}
                  </span>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <span className="font-semibold text-foreground">
                    {comparison.materials[1]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {comparison.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </div>

      {/* Comparison table preview hint */}
      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground">
          Compare up to <span className="text-primary font-medium">4 filaments</span> at once
        </p>
      </div>

      {/* How It Works */}
      <div className="mt-12 w-full max-w-2xl">
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          How It Works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {[
            { step: "01", icon: Search, title: "Browse Materials", subtitle: "Select materials from the reference library" },
            { step: "02", icon: GitCompare, title: "Add to Tray", subtitle: "Click the compare icon to add up to 4" },
            { step: "03", icon: BarChart3, title: "Compare Side-by-Side", subtitle: "View properties, temps & specs together" },
          ].map((item) => (
            <div key={item.step} className="text-center p-4 rounded-lg border border-border/30 bg-muted/30">
              <p className="text-[10px] font-mono text-primary/40 mb-1">{item.step}</p>
              <item.icon className="w-8 h-8 mx-auto text-primary/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilamentComparisonEmptyState;
