import { BookOpen, Lightbulb, TrendingUp, ArrowRight, Thermometer, Droplets, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialReferenceEmptyStateProps {
  onSelectMaterial?: (material: string) => void;
  className?: string;
}

const quickTips = [
  {
    icon: Thermometer,
    title: "Check Print Temps",
    description: "Each material has ideal temperature ranges for best results",
  },
  {
    icon: Droplets,
    title: "Moisture Sensitivity",
    description: "Some materials absorb moisture - storage matters!",
  },
  {
    icon: Shield,
    title: "Nozzle Compatibility",
    description: "Abrasive filaments may require hardened nozzles",
  },
];

const featuredMaterials = [
  { id: "PLA", name: "PLA", badge: "Most Popular", description: "Easy to print, great for beginners" },
  { id: "PETG", name: "PETG", badge: "Versatile", description: "Durable with good chemical resistance" },
  { id: "ASA", name: "ASA", badge: "Outdoor Use", description: "UV-resistant for outdoor applications" },
];

export function MaterialReferenceEmptyState({
  onSelectMaterial,
  className,
}: MaterialReferenceEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center py-8 px-4",
      "animate-in fade-in-0 duration-300",
      className
    )}>
      {/* Main Illustration */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150 opacity-40" />
        
        <div className="relative bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-6">
          <BookOpen className="w-12 h-12 text-primary" strokeWidth={1.5} />
          
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
        Material Reference Library
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
        Select a material from the sidebar to explore detailed print settings, 
        mechanical properties, and compatibility information.
      </p>

      {/* Quick Tips Section */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Quick Tips
          </h4>
        </div>
        
        <div className="space-y-2">
          {quickTips.map((tip) => (
            <div
              key={tip.title}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50"
            >
              <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                <tip.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Materials */}
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Start With These
          </h4>
        </div>
        
        <div className="grid gap-2">
          {featuredMaterials.map((material) => (
            <button
              key={material.id}
              onClick={() => onSelectMaterial?.(material.id)}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg",
                "bg-gray-800/50 hover:bg-gray-800 border border-gray-700",
                "hover:border-cyan-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/[0.08]",
                "transition-all duration-200 text-left"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-foreground">
                  {material.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {material.badge}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        Data sourced from manufacturer TDS sheets and community testing
      </p>
    </div>
  );
}
