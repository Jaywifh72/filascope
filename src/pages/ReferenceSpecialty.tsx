import { useRef, useState, useEffect } from "react";
import { Star, Table, FileText, ChevronDown } from "lucide-react";
import { specialtyTools } from "@/lib/specialtyData";
import { SpecialtyFilterProvider, useSpecialtyFilters } from "@/contexts/SpecialtyFilterContext";
import SpecialtyToolsHeroSection from "@/components/reference/SpecialtyToolsHeroSection";
import { SpecialtyFilterSidebar, SpecialtyMobileFilterSheet } from "@/components/reference/specialty/SpecialtyFilterSidebar";
import EditorPicksSection from "@/components/reference/specialty/EditorPicksSection";
import MoreToolsSection from "@/components/reference/specialty/MoreToolsSection";
import NoResultsState from "@/components/reference/specialty/NoResultsState";
import SpecialtyComparisonTable from "@/components/reference/specialty/SpecialtyComparisonTable";
import SpecialtyProfileAccordion from "@/components/reference/specialty/SpecialtyProfileAccordion";
import SpecialtyQuizCard from "@/components/reference/specialty/SpecialtyQuizCard";
import ToolFinderQuiz from "@/components/reference/specialty/ToolFinderQuiz";
import { cn } from "@/lib/utils";

type SpecialtyTab = "recommendations" | "comparison" | "profiles";

function RecommendationsContent({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  const { filteredTools, hasActiveFilters } = useSpecialtyFilters();
  
  const featuredFiltered = filteredTools.filter(t => t.tier === 'featured');
  const standardFiltered = filteredTools.filter(t => t.tier === 'standard');
  
  if (filteredTools.length === 0) {
    return <NoResultsState />;
  }
  
  return (
    <div className="flex gap-8">
      {/* Left Sidebar - Filters */}
      <SpecialtyFilterSidebar />
      
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <EditorPicksSection tools={featuredFiltered} />
        <MoreToolsSection tools={standardFiltered} />
      </div>
      
      {/* Right Sidebar - Quiz Card */}
      <aside className="hidden xl:block w-[280px] flex-shrink-0">
        <SpecialtyQuizCard onStartQuiz={onOpenQuiz} />
      </aside>
    </div>
  );
}

function ComparisonContent({ onLearnMore }: { onLearnMore: (id: string) => void }) {
  return (
    <div className="flex gap-8">
      <SpecialtyFilterSidebar />
      <div className="flex-1 min-w-0">
        <SpecialtyComparisonTable onLearnMore={onLearnMore} />
      </div>
    </div>
  );
}

function ProfilesContent({ expandedIds, onToggle }: { expandedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex gap-8">
      <SpecialtyFilterSidebar />
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Tool Profiles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed information about each specialty tool
          </p>
        </div>
        <SpecialtyProfileAccordion expandedIds={expandedIds} onToggle={onToggle} />
      </div>
    </div>
  );
}

function ReferenceSpecialtyContent() {
  const [activeTab, setActiveTab] = useState<SpecialtyTab>("recommendations");
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const activeButton = tabButtonRefs.current.get(activeTab);
    const indicator = tabIndicatorRef.current;
    if (activeButton && indicator) {
      const { offsetLeft, offsetWidth } = activeButton;
      indicator.style.left = `${offsetLeft}px`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: SpecialtyTab) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const contentSection = document.getElementById('specialty-content-section');
      if (contentSection) {
        const headerOffset = 80;
        const elementPosition = contentSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleScrollToComparison = () => {
    setActiveTab("comparison");
    setTimeout(() => {
      const section = document.getElementById('specialty-comparison-section');
      if (section) {
        const headerOffset = 120;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLearnMore = (toolId: string) => {
    setActiveTab("profiles");
    setExpandedAccordion(prev => prev.includes(toolId) ? prev : [...prev, toolId]);
    setTimeout(() => {
      const accordionItem = document.getElementById(`accordion-${toolId}`);
      if (accordionItem) {
        const headerOffset = 120;
        const elementPosition = accordionItem.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 150);
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const tabs = [
    { id: "recommendations" as SpecialtyTab, label: "Recommendations", icon: Star },
    { id: "comparison" as SpecialtyTab, label: "Full Comparison", icon: Table },
    { id: "profiles" as SpecialtyTab, label: "Tool Profiles", icon: FileText, count: specialtyTools.length },
  ];

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ToolFinderQuiz />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SpecialtyToolsHeroSection onScrollToComparison={handleScrollToComparison} />

      {/* Sticky Tab Navigation */}
      <div 
        ref={tabsRef}
        className={cn(
          "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-shadow duration-300",
          isScrolled && "shadow-md shadow-black/10"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
          {/* Desktop Tabs */}
          <nav className="hidden sm:flex relative" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => el && tabButtonRefs.current.set(tab.id, el)}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-sm font-medium relative z-10",
                  "transition-colors duration-200",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors duration-300",
                    activeTab === tab.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            <div 
              ref={tabIndicatorRef}
              className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
              style={{ left: 0, width: 0 }}
            />
          </nav>

          {/* Mobile Dropdown + Filter */}
          <div className="sm:hidden py-2 flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value as SpecialtyTab)}
                className={cn(
                  "w-full appearance-none bg-gray-800 border border-gray-700 rounded-lg",
                  "px-4 py-3 pr-10 text-sm font-medium text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                )}
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} {tab.count ? `(${tab.count})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <SpecialtyMobileFilterSheet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="specialty-content-section" className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8">
        {activeTab === "recommendations" && (
          <RecommendationsContent onOpenQuiz={() => setShowQuiz(true)} />
        )}
        {activeTab === "comparison" && (
          <ComparisonContent onLearnMore={handleLearnMore} />
        )}
        {activeTab === "profiles" && (
          <ProfilesContent expandedIds={expandedAccordion} onToggle={toggleAccordion} />
        )}
      </div>
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
