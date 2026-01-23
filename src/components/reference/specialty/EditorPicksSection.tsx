import { getFeaturedTools, SpecialtyTool } from "@/lib/specialtyData";
import FeaturedToolCard from "./FeaturedToolCard";

interface EditorPicksSectionProps {
  tools?: SpecialtyTool[];
}

export default function EditorPicksSection({ tools }: EditorPicksSectionProps) {
  const featuredTools = tools ?? getFeaturedTools();

  if (featuredTools.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby="top-recommendations-heading">
      {/* Decorative gradient container */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 mb-6">
        {/* Section Header */}
        <div className="flex items-start gap-4 mb-6">
          <span className="text-[28px]" aria-hidden="true">⭐</span>
          <div>
            <h2 
              id="top-recommendations-heading" 
              className="text-2xl font-bold text-foreground mb-1.5"
            >
              Our Top Recommendations
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              The essential tools every 3D printer owner should know
            </p>
          </div>
        </div>

        {/* Featured Grid - 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {featuredTools.map((tool, index) => (
            <FeaturedToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
