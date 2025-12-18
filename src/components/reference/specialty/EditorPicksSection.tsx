import { getFeaturedTools, SpecialtyTool } from "@/lib/specialtyData";
import FeaturedToolCard from "./FeaturedToolCard";

interface EditorPicksSectionProps {
  tools?: SpecialtyTool[];
}

export default function EditorPicksSection({ tools }: EditorPicksSectionProps) {
  const featuredTools = tools ?? getFeaturedTools();

  if (featuredTools.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby="editor-picks-heading">
      {/* Section Header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="text-[28px]" aria-hidden="true">⭐</span>
        <div>
          <h2 
            id="editor-picks-heading" 
            className="text-2xl font-bold text-foreground mb-1.5"
          >
            Editor's Picks
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
    </section>
  );
}
