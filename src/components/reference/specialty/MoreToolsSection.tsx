import { getStandardTools } from "@/lib/specialtyData";
import CompactToolCard from "./CompactToolCard";

export default function MoreToolsSection() {
  const standardTools = getStandardTools();

  return (
    <section className="mb-12" aria-labelledby="more-tools-heading">
      {/* Section Header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="text-[28px]" aria-hidden="true">🔧</span>
        <div>
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
