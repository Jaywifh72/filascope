import { ArrowRight, Scale, Sparkles, Target, Search, Beaker, Shield, Zap, Waves, type LucideIcon } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-in fade-in-0 duration-300">
      {/* Title & Subtitle — compact */}
      <Scale className="w-10 h-10 text-primary/60 mb-4" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold text-foreground mb-1 text-center">
        Your Compare Tray is Empty
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Add filaments from the catalog to compare properties, temps & specs side-by-side.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <Button
          onClick={onBrowseMaterials}
          size="lg"
          className="gap-2"
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

      {/* Compare hint */}
      <p className="mt-8 text-xs text-muted-foreground">
        Compare up to <span className="text-primary font-medium">4 filaments</span> at once
      </p>
    </div>
  );
}

export default FilamentComparisonEmptyState;
