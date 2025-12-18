import { useRef } from "react";
import { specialtyTools } from "@/lib/specialtyData";
import SpecialtyToolsHeroSection from "@/components/reference/SpecialtyToolsHeroSection";
import EditorPicksSection from "@/components/reference/specialty/EditorPicksSection";
import MoreToolsSection from "@/components/reference/specialty/MoreToolsSection";
import CollapsibleComparisonTable from "@/components/reference/specialty/CollapsibleComparisonTable";
import ToolProfileCard from "@/components/reference/specialty/ToolProfileCard";

export default function ReferenceSpecialty() {
  const comparisonRef = useRef<HTMLDivElement>(null);

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SpecialtyToolsHeroSection onScrollToComparison={scrollToComparison} />
      
      <main className="container mx-auto px-4 py-8" ref={comparisonRef}>
        {/* 2-Tier Card System */}
        <EditorPicksSection />
        <MoreToolsSection />
        
        {/* Collapsible Full Comparison Table */}
        <CollapsibleComparisonTable />

        {/* Detailed Profiles with Progressive Disclosure */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Detailed Profiles</h2>
          <div className="space-y-6">
            {specialtyTools.map((tool) => (
              <ToolProfileCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
