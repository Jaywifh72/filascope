import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Check, X, DollarSign, Monitor, FileType, Wifi, Star, Table, FileText, List, LayoutGrid, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { cadData } from "@/lib/cadData";
import CADHeroSection from "@/components/reference/CADHeroSection";
import CADThreeTierComparison, { cadComparison } from "@/components/reference/CADThreeTierComparison";
import CADComparisonSidebar from "@/components/reference/CADComparisonSidebar";
import CADComparisonMobile from "@/components/reference/CADComparisonMobile";
import CADComparisonModal from "@/components/reference/CADComparisonModal";
import CADFilterBar from "@/components/reference/CADFilterBar";
import { CADFilterSidebar } from "@/components/reference/CADFilterSidebar";
import { CADComparisonTable } from "@/components/reference/CADComparisonTable";
import { CADComparisonProvider } from "@/contexts/CADComparisonContext";
import { CADFilterProvider } from "@/contexts/CADFilterContext";
import { 
  SoftwareBadges,
} from "@/components/reference/CADBadges";
import { CADStaffPickCard, staffPicks } from "@/components/reference/CADStaffPickCard";
import { CADRecommendationsSidebar } from "@/components/reference/CADRecommendationsSidebar";
import { CADProfileFilterPills, ProfileFilter } from "@/components/reference/CADProfileFilterPills";
import { CADProfileAccordion } from "@/components/reference/CADProfileAccordion";
import { CADCompareTray } from "@/components/reference/CADCompareTray";

// Logo mapping for CAD software
const cadLogos: Record<string, string> = {
  // Table names
  "Fusion 360": "/images/cad/fusion360.png",
  "Blender": "/images/cad/blender.png",
  "SolidWorks": "/images/cad/solidworks.png",
  "Tinkercad": "/images/cad/tinkercad.png",
  "ZBrush": "/images/cad/zbrush.png",
  "Meshmixer": "/images/cad/meshmixer.png",
  "FreeCAD": "/images/cad/freecad.svg",
  "Rhino 3D": "/images/cad/rhino3d.png",
  "OpenSCAD": "/images/cad/openscad.png",
  "Onshape": "/images/cad/onshape.png",
  "Shapr3D": "/images/cad/shapr3d.png",
  "SketchUp": "/images/cad/sketchup.png",
  "Plasticity": "/images/cad/plasticity.png",
  "Maya": "/images/cad/maya.png",
  "3ds Max": "/images/cad/3dsmax.svg",
  "Cinema 4D": "/images/cad/cinema4d.png",
  "Nomad Sculpt": "/images/cad/nomadsculpt.png",
  "AutoCAD": "/images/cad/autocad.svg",
  "SelfCAD": "/images/cad/selfcad.png",
  "BlocksCAD": "/images/cad/blockscad.png",
  // Accordion names (from cadData)
  "Autodesk Fusion 360": "/images/cad/fusion360.png",
  "Maxon ZBrush": "/images/cad/zbrush.png",
  "Autodesk Meshmixer": "/images/cad/meshmixer.png",
  "Trimble SketchUp": "/images/cad/sketchup.png",
  "Maxon Cinema 4D": "/images/cad/cinema4d.png",
  "Autodesk Maya": "/images/cad/maya.png",
  "Autodesk 3ds Max": "/images/cad/3dsmax.svg",
  "Autodesk AutoCAD": "/images/cad/autocad.svg",
  "Rhino 3D (Rhinoceros)": "/images/cad/rhino3d.png",
};

// Dark logos that need brightness filter for dark backgrounds
const darkLogos = [
  "Fusion 360", "Autodesk Fusion 360",
  "AutoCAD", "Autodesk AutoCAD",
  "3ds Max", "Autodesk 3ds Max",
  "Maya", "Autodesk Maya",
  "Meshmixer", "Autodesk Meshmixer",
];

const needsBrightness = (name: string) => darkLogos.includes(name);

type CADTab = "recommendations" | "comparison" | "profiles";

const ReferenceCAD = () => {
  const [activeTab, setActiveTab] = useState<CADTab>("recommendations");
  const [expandedAccordion, setExpandedAccordion] = useState<string[]>([]);
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all');
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Scroll listener for sticky shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update underline indicator position
  useEffect(() => {
    const activeButton = tabButtonRefs.current.get(activeTab);
    const indicator = tabIndicatorRef.current;
    if (activeButton && indicator) {
      const { offsetLeft, offsetWidth } = activeButton;
      indicator.style.left = `${offsetLeft}px`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: CADTab) => {
    setActiveTab(tabId);
    // Smooth scroll to content
    setTimeout(() => {
      const contentSection = document.getElementById('cad-content-section');
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
    // Small delay to ensure tab content is rendered
    setTimeout(() => {
      const section = document.getElementById('cad-comparison-section');
      if (section) {
        const headerOffset = 120;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLearnMore = (cadDataId: string) => {
    // Switch to profiles tab
    setActiveTab("profiles");
    
    // Expand the specific accordion item
    setExpandedAccordion(prev => 
      prev.includes(cadDataId) ? prev : [...prev, cadDataId]
    );
    
    // Scroll to the accordion item after a brief delay
    setTimeout(() => {
      const accordionItem = document.getElementById(`accordion-${cadDataId}`);
      if (accordionItem) {
        const headerOffset = 120;
        const elementPosition = accordionItem.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 150);
  };

  const tabs = [
    { id: "recommendations" as CADTab, label: "Recommendations", icon: Star },
    { id: "comparison" as CADTab, label: "Full Comparison", icon: Table },
    { id: "profiles" as CADTab, label: "Detailed Profiles", icon: FileText, count: cadData.length },
  ];

  return (
    <CADFilterProvider softwareData={cadComparison}>
      <CADComparisonProvider>
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <CADHeroSection 
            softwareCount={cadComparison.length} 
            onScrollToComparison={handleScrollToComparison}
          />

          {/* Sticky Tab Navigation with scroll shadow */}
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
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.label.split(' ')[0]}</span>
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
                {/* Sliding underline indicator */}
                <div 
                  ref={tabIndicatorRef}
                  className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-out"
                  style={{ left: 0, width: 0 }}
                />
              </nav>

              {/* Mobile Dropdown */}
              <div className="sm:hidden py-2">
                <div className="relative">
                  <select
                    value={activeTab}
                    onChange={(e) => handleTabChange(e.target.value as CADTab)}
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
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div id="cad-content-section" className="max-w-[1600px] mx-auto px-6 lg:px-10">
            {/* Back Button */}
            <div className="py-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* RECOMMENDATIONS TAB */}
            {activeTab === "recommendations" && (
              <section className="py-6 animate-fade-in">
                <div className="flex gap-8">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-2xl p-6">
                      <h2 className="text-2xl font-bold text-foreground max-md:text-xl mb-2">Our Recommendations</h2>
                      <p className="text-muted-foreground mb-6">
                        Staff-curated recommendations based on use case and performance
                      </p>
                      
                      {/* Profile Filter Pills with Quiz Link */}
                      <div className="mb-6">
                        <CADProfileFilterPills 
                          activeFilter={profileFilter} 
                          onChange={setProfileFilter}
                          onOpenQuiz={() => {
                            // Scroll to hero quiz CTA or open modal
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      </div>
                      
                      {/* Filtered Staff Pick Cards - Fixed Grid Layout with animation */}
                      <div 
                        key={profileFilter} 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in"
                      >
                        {staffPicks
                          .filter(pick => {
                            if (profileFilter === 'all') return true;
                            return (pick.profiles as readonly string[]).includes(profileFilter);
                          })
                          .map((pick) => (
                            <CADStaffPickCard
                              key={pick.name}
                              pick={pick}
                              onViewDetails={() => handleLearnMore(pick.name.toLowerCase().replace(/\s+/g, '-'))}
                            />
                          ))}
                      </div>
                      
                      {/* Empty state when filter has no results */}
                      {staffPicks.filter(pick => {
                        if (profileFilter === 'all') return true;
                        return (pick.profiles as readonly string[]).includes(profileFilter);
                      }).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No recommendations for this profile yet.</p>
                          <button 
                            onClick={() => setProfileFilter('all')}
                            className="mt-2 text-primary hover:text-primary/80"
                          >
                            View all recommendations
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Sidebar - Comparison Builder */}
                  <div className="hidden lg:block w-[280px] flex-shrink-0">
                    <div className="sticky top-[72px]">
                      <CADRecommendationsSidebar />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* FULL COMPARISON TAB */}
            {activeTab === "comparison" && (
              <section id="cad-comparison-section" className="py-6 animate-fade-in">
                {/* Header with View Toggle */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground max-md:text-xl mb-2">Full Comparison Table</h2>
                    <p className="text-muted-foreground">
                      View all {cadComparison.length} CAD tools with detailed specifications
                    </p>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg">
                    <button
                      onClick={() => setIsDetailedView(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                        !isDetailedView 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <List className="w-4 h-4" />
                      Simplified View
                    </button>
                    <button
                      onClick={() => setIsDetailedView(true)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                        isDetailedView 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Detailed View
                    </button>
                  </div>
                </div>

                {/* Layout with sidebar */}
                <div className="flex gap-6">
                  {/* Left Sidebar - Filter */}
                  <div className="sticky top-[72px] h-fit">
                    <CADFilterSidebar />
                  </div>
                  
                  {/* Main Content - Table */}
                  <div className="flex-1 bg-card/30 border border-border rounded-xl overflow-hidden">
                    <CADComparisonTable 
                      onViewDetails={handleLearnMore}
                      isDetailedView={isDetailedView}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* DETAILED PROFILES TAB */}
            {activeTab === "profiles" && (
              <section className="py-6 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground max-md:text-xl mb-2">Detailed CAD Profiles</h2>
                  <p className="text-muted-foreground">
                    In-depth analysis of each CAD tool's features and capabilities
                  </p>
                </div>

                {/* Layout with sidebar */}
                <div className="flex gap-6">
                  {/* Left Sidebar - Filter */}
                  <div className="sticky top-[72px] h-fit">
                    <CADFilterSidebar />
                  </div>
                  
                  {/* Main Content - Accordion List */}
                  <div className="flex-1 space-y-3">
                    {cadData.map((software, index) => (
                      <CADProfileAccordion
                        key={software.id}
                        software={software}
                        index={index}
                        isExpanded={expandedAccordion.includes(software.id)}
                        onToggle={() => {
                          setExpandedAccordion(prev => 
                            prev.includes(software.id) 
                              ? prev.filter(id => id !== software.id)
                              : [...prev, software.id]
                          );
                        }}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Mobile footer spacer */}
          <div className="h-20 lg:hidden" />

          {/* Comparison Components */}
          <CADCompareTray />
          <CADComparisonMobile />
          <CADComparisonModal onViewDetails={handleLearnMore} />
        </div>
      </CADComparisonProvider>
    </CADFilterProvider>
  );
};

export default ReferenceCAD;