import { Layers, Compass, ChevronDown, Star, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SlicerHeroSectionProps {
  slicerCount: number;
  onScrollToComparison: () => void;
  onSlicerClick?: (name: string) => void;
}

const topSlicers = ["UltiMaker Cura", "PrusaSlicer", "Bambu Studio", "OrcaSlicer"];

const SlicerHeroSection = ({ slicerCount, onScrollToComparison, onSlicerClick }: SlicerHeroSectionProps) => {
  const handleQuizClick = () => {
    toast("Quiz coming soon! Browse our recommendations below.", {
      icon: "🧭",
    });
    // Scroll to recommendations area
    const el = document.querySelector('[role="tablist"]');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          3D Slicer Software Guide
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Compare {slicerCount} slicers across 15 key features. Expert ratings, platform support, and feature breakdowns.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" /> Expert ratings
          </span>
          <span>•</span>
          <span>Updated {new Date().getFullYear()}</span>
          <span>•</span>
          <span>Popular: {topSlicers.map((s, i) => (
            <button
              key={s}
              onClick={() => onSlicerClick?.(s)}
              className="text-slate-300 hover:text-cyan-400 transition-colors ml-1"
            >
              {s}{i < topSlicers.length - 1 ? ',' : ''}
            </button>
          ))}</span>
        </div>
      </div>
    </section>
  );
};

export default SlicerHeroSection;
