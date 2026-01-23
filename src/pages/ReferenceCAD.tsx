import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Check, X, DollarSign, Monitor, FileType, Wifi, Star, Table, FileText } from "lucide-react";
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
import { CADComparisonProvider } from "@/contexts/CADComparisonContext";
import { CADFilterProvider } from "@/contexts/CADFilterContext";
import { 
  SoftwareBadges,
} from "@/components/reference/CADBadges";
import { CADStaffPickCard, staffPicks } from "@/components/reference/CADStaffPickCard";
import { CADRecommendationsSidebar } from "@/components/reference/CADRecommendationsSidebar";
import { CADProfileFilterPills, ProfileFilter } from "@/components/reference/CADProfileFilterPills";

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

          {/* Sticky Tab Navigation */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
              <nav className="flex gap-1" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all relative",
                      "border-b-2 -mb-[1px]",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count && (
                      <span className={cn(
                        "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                        activeTab === tab.id
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
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
                      
                      {/* Profile Filter Pills */}
                      <div className="mb-6">
                        <CADProfileFilterPills 
                          activeFilter={profileFilter} 
                          onChange={setProfileFilter} 
                        />
                      </div>
                      
                      {/* Staff Pick Cards */}
                      <div className="flex gap-5 overflow-x-auto pb-4 items-stretch">
                        {staffPicks.map((pick) => (
                          <CADStaffPickCard
                            key={pick.name}
                            pick={pick}
                            onViewDetails={() => handleLearnMore(pick.name.toLowerCase().replace(/\s+/g, '-'))}
                          />
                        ))}
                      </div>
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
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground max-md:text-xl mb-2">Full Comparison Table</h2>
                  <p className="text-muted-foreground">
                    Compare all {cadComparison.length} CAD software tools with detailed specifications
                  </p>
                </div>

                {/* Filter Bar */}
                <CADFilterBar />

                {/* 3-Tier Comparison System */}
                <CADThreeTierComparison 
                  onViewDetails={handleLearnMore}
                />
              </section>
            )}

            {/* DETAILED PROFILES TAB */}
            {activeTab === "profiles" && (
              <section className="py-6 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground max-md:text-xl mb-2">Detailed Profiles</h2>
                  <p className="text-muted-foreground">
                    In-depth information about each CAD software including pricing, features, and technical specs
                  </p>
                </div>

                <Accordion type="multiple" className="space-y-4" value={expandedAccordion} onValueChange={setExpandedAccordion}>
                  {cadData.map((software, index) => (
                    <AccordionItem 
                      key={software.id} 
                      value={software.id}
                      id={`accordion-${software.id}`}
                      className="border border-border rounded-lg bg-card px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 text-left flex-1">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                          {cadLogos[software.name] && (
                            <img 
                              src={cadLogos[software.name]} 
                              alt={`${software.name} logo`}
                              className={`w-8 h-8 rounded object-contain ${needsBrightness(software.name) ? 'brightness-150 invert' : ''}`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h2 className="text-xl font-semibold text-foreground">{software.name}</h2>
                              {/* Find matching software data for badges */}
                              {(() => {
                                const matchedSoftware = cadComparison.find(s => 
                                  software.name.toLowerCase().includes(s.name.toLowerCase()) ||
                                  s.name.toLowerCase().includes(software.name.split(' ')[0].toLowerCase())
                                );
                                if (matchedSoftware) {
                                  return (
                                    <SoftwareBadges
                                      priceType={matchedSoftware.priceType}
                                      overallScore={matchedSoftware.overallScore}
                                      skillLevel={matchedSoftware.skillLevel}
                                      compact
                                    />
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{software.summary}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="space-y-6">
                          {/* Summary */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Summary</h3>
                            <p className="text-muted-foreground">{software.summary}</p>
                          </div>

                          {/* Architecture Overview */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Architecture & Market Position</h3>
                            <p className="text-muted-foreground">{software.architectureOverview}</p>
                          </div>

                          {/* Additive Manufacturing Workflow */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Additive Manufacturing Workflow</h3>
                            <ul className="space-y-2">
                              {software.additiveWorkflow.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Pricing Table */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Pricing & Licensing</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-2 px-3 text-sm font-medium text-foreground">License Tier</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-foreground">Cost</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-foreground">Features & Limitations</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {software.pricing.map((tier, i) => (
                                    <tr key={i} className="border-b border-border/50">
                                      <td className="py-2 px-3 text-sm font-medium text-primary">{tier.tier}</td>
                                      <td className="py-2 px-3 text-sm text-amber-400 font-mono">{tier.cost}</td>
                                      <td className="py-2 px-3 text-sm text-muted-foreground">{tier.features}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                Strengths
                              </h3>
                              <ul className="space-y-2">
                                {software.strengths.map((strength, i) => (
                                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                                <X className="w-5 h-5 text-red-500" />
                                Weaknesses
                              </h3>
                              <ul className="space-y-2">
                                {software.weaknesses.map((weakness, i) => (
                                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                                    <span className="text-red-500 mt-0.5">✗</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Technical Specifications */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Technical Specifications</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <DollarSign className="w-3 h-3" />
                                  Price
                                </div>
                                <p className="text-sm font-medium text-foreground">{software.technicalSpecs.price}</p>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Monitor className="w-3 h-3" />
                                  Supported OS
                                </div>
                                <p className="text-sm font-medium text-foreground">{software.technicalSpecs.supportedOS}</p>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <FileType className="w-3 h-3" />
                                  File Support
                                </div>
                                <p className="text-sm font-medium text-foreground">{software.technicalSpecs.fileSupport}</p>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Wifi className="w-3 h-3" />
                                  Connectivity
                                </div>
                                <p className="text-sm font-medium text-foreground">{software.technicalSpecs.connectivity}</p>
                              </div>
                            </div>
                          </div>

                          {/* Important Links */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Important Links</h3>
                            <div className="flex flex-wrap gap-2">
                              {software.links.website && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={software.links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                </Button>
                              )}
                              {software.links.download && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={software.links.download} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Download
                                  </a>
                                </Button>
                              )}
                              {software.links.source && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={software.links.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Source Code
                                  </a>
                                </Button>
                              )}
                              {software.links.documentation && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={software.links.documentation} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Documentation
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* Mobile footer spacer */}
          <div className="h-20 lg:hidden" />

          {/* Comparison Components */}
          <CADComparisonSidebar />
          <CADComparisonMobile />
          <CADComparisonModal onViewDetails={handleLearnMore} />
        </div>
      </CADComparisonProvider>
    </CADFilterProvider>
  );
};

export default ReferenceCAD;