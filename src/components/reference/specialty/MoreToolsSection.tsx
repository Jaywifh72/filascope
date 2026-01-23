import { getStandardTools, SpecialtyTool } from "@/lib/specialtyData";
import CompactToolCard from "./CompactToolCard";

interface MoreToolsSectionProps {
  tools?: SpecialtyTool[];
}

export default function MoreToolsSection({ tools }: MoreToolsSectionProps) {
  const standardTools = tools ?? getStandardTools();

  if (standardTools.length === 0) return null;

  return (
    <section className="mb-12" aria-labelledby="more-tools-heading">
      {/* Section Header */}
      <div className="mb-6">
        <h2 
          id="more-tools-heading" 
          className="text-2xl font-bold text-foreground mb-1.5"
        >
          More Specialty Tools
        </h2>
        <p className="text-sm font-medium text-muted-foreground">
          Additional utilities for specific workflows
        </p>
      </div>

      {/* Compact Grid - 4 columns on wide, 3 on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {standardTools.map((tool, index) => (
          <CompactToolCard key={tool.id} tool={tool} index={index} />
        ))}
      </div>
    </section>
  );
}
