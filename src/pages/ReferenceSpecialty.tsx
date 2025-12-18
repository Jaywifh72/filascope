import { useRef } from "react";
import { specialtyTools } from "@/lib/specialtyData";
import { SpecialtyFilterProvider, useSpecialtyFilters } from "@/contexts/SpecialtyFilterContext";
import SpecialtyToolsHeroSection from "@/components/reference/SpecialtyToolsHeroSection";
import SpecialtyFilterBar from "@/components/reference/specialty/SpecialtyFilterBar";
import EditorPicksSection from "@/components/reference/specialty/EditorPicksSection";
import MoreToolsSection from "@/components/reference/specialty/MoreToolsSection";
import NoResultsState from "@/components/reference/specialty/NoResultsState";
import CollapsibleComparisonTable from "@/components/reference/specialty/CollapsibleComparisonTable";
import ToolProfileCard from "@/components/reference/specialty/ToolProfileCard";
import ToolFinderQuiz from "@/components/reference/specialty/ToolFinderQuiz";
function FilteredToolsSections() {
  const { filteredTools, hasActiveFilters } = useSpecialtyFilters();
  
  const featuredFiltered = filteredTools.filter(t => t.tier === 'featured');
  const standardFiltered = filteredTools.filter(t => t.tier === 'standard');
  
  if (filteredTools.length === 0) {
    return <NoResultsState />;
  }
  
  return (
    <>
      <EditorPicksSection tools={featuredFiltered} />
      <MoreToolsSection tools={standardFiltered} />
    </>
  );
}

function FilteredProfiles() {
  const { filteredTools } = useSpecialtyFilters();
  
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Detailed Profiles</h2>
      <div className="space-y-6">
        {filteredTools.map((tool) => (
          <ToolProfileCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

function ReferenceSpecialtyContent() {
  const comparisonRef = useRef<HTMLDivElement>(null);

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SpecialtyToolsHeroSection onScrollToComparison={scrollToComparison} />
      
      <main className="container mx-auto px-4 py-8" ref={comparisonRef}>
        {/* Tool Finder Quiz */}
        <ToolFinderQuiz />
        
        {/* Filter Bar */}
        <SpecialtyFilterBar />
        
        {/* Filtered Tool Sections */}
        <FilteredToolsSections />
        
        {/* Collapsible Full Comparison Table */}
        <CollapsibleComparisonTable />

        {/* Detailed Profiles with Progressive Disclosure */}
        <FilteredProfiles />
      </main>
    </div>
  );
}

export default function ReferenceSpecialty() {
  return (
    <SpecialtyFilterProvider tools={specialtyTools}>
      <ReferenceSpecialtyContent />
    </SpecialtyFilterProvider>
  );
}
