import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Check, X, DollarSign, Monitor, FileType, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { cadData } from "@/lib/cadData";
import CADHeroSection from "@/components/reference/CADHeroSection";
import CADProfileSelector from "@/components/reference/CADProfileSelector";
import CADThreeTierComparison from "@/components/reference/CADThreeTierComparison";
import CADComparisonSidebar from "@/components/reference/CADComparisonSidebar";
import CADComparisonMobile from "@/components/reference/CADComparisonMobile";
import CADComparisonModal from "@/components/reference/CADComparisonModal";
import { CADComparisonProvider } from "@/contexts/CADComparisonContext";
import { 
  SoftwareBadges,
  mapPriceType,
  calculateOverallScore,
  mapSkillLevel,
  type PriceType,
  type SkillLevel
} from "@/components/reference/CADBadges";

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

// CAD comparison data with raw ratings
const cadComparisonRaw = [
  { name: "Fusion 360", price: "Freemium", type: "Solid/Mesh", os: "Win/Mac", ease: 4, precision: 5, sculpt: 3, printReady: 5, parametric: 5, cloud: "Yes", perpetual: "No", standout: "Integrated CAD/CAM/CAE" },
  { name: "Blender", price: "Free", type: "Mesh", os: "Win/Mac/Lin", ease: 2, precision: 3, sculpt: 5, printReady: 4, parametric: 2, cloud: "No", perpetual: "Yes", standout: "Complete 3D Suite" },
  { name: "SolidWorks", price: "Paid", type: "Solid", os: "Win", ease: 3, precision: 5, sculpt: 1, printReady: 5, parametric: 5, cloud: "Partial", perpetual: "Yes", standout: "Engineering Standard" },
  { name: "Tinkercad", price: "Free", type: "CSG", os: "Browser", ease: 5, precision: 2, sculpt: 1, printReady: 5, parametric: 1, cloud: "Yes", perpetual: "N/A", standout: "Zero Learning Curve" },
  { name: "ZBrush", price: "Subscription", type: "Sculpt", os: "Win/Mac", ease: 2, precision: 2, sculpt: 5, printReady: 4, parametric: 1, cloud: "No", perpetual: "No", standout: "Ultra High-Poly" },
  { name: "Meshmixer", price: "Free", type: "Mesh", os: "Win/Mac", ease: 3, precision: 2, sculpt: 3, printReady: 5, parametric: 1, cloud: "No", perpetual: "Yes", standout: "Tree Supports" },
  { name: "FreeCAD", price: "Free", type: "Solid", os: "Win/Mac/Lin", ease: 2, precision: 5, sculpt: 1, printReady: 4, parametric: 5, cloud: "No", perpetual: "Yes", standout: "Open Source CAD" },
  { name: "Rhino 3D", price: "Perpetual", type: "NURBS", os: "Win/Mac", ease: 3, precision: 5, sculpt: 2, printReady: 5, parametric: 3, cloud: "No", perpetual: "Yes", standout: "ShrinkWrap (v8)" },
  { name: "OpenSCAD", price: "Free", type: "CSG", os: "Win/Mac/Lin", ease: 1, precision: 5, sculpt: 1, printReady: 5, parametric: 5, cloud: "No", perpetual: "Yes", standout: "Code-Based Design" },
  { name: "Onshape", price: "Freemium", type: "Solid", os: "Browser", ease: 4, precision: 5, sculpt: 1, printReady: 4, parametric: 5, cloud: "Yes", perpetual: "No", standout: "Real-Time Collab" },
  { name: "Shapr3D", price: "Freemium", type: "Solid", os: "iPad/Win/Mac", ease: 5, precision: 4, sculpt: 1, printReady: 4, parametric: 3, cloud: "Yes", perpetual: "No", standout: "Touch-First CAD" },
  { name: "SketchUp", price: "Freemium", type: "Surface", os: "Win/Mac", ease: 5, precision: 2, sculpt: 1, printReady: 2, parametric: 1, cloud: "Partial", perpetual: "No", standout: "Push/Pull Interface" },
  { name: "Plasticity", price: "Perpetual", type: "Solid", os: "Win/Mac/Lin", ease: 4, precision: 5, sculpt: 2, printReady: 5, parametric: 1, cloud: "No", perpetual: "Yes", standout: "Artist-Friendly CAD" },
  { name: "Maya", price: "Subscription", type: "Mesh", os: "Win/Mac/Lin", ease: 2, precision: 3, sculpt: 4, printReady: 3, parametric: 2, cloud: "Partial", perpetual: "No", standout: "Animation Pipeline" },
  { name: "3ds Max", price: "Subscription", type: "Mesh", os: "Win", ease: 2, precision: 3, sculpt: 3, printReady: 4, parametric: 3, cloud: "Partial", perpetual: "No", standout: "Modifier Stack" },
  { name: "Cinema 4D", price: "Subscription", type: "Mesh", os: "Win/Mac", ease: 3, precision: 3, sculpt: 3, printReady: 4, parametric: 2, cloud: "No", perpetual: "No", standout: "Volume Meshing" },
  { name: "Nomad Sculpt", price: "One-Time", type: "Sculpt", os: "iPad/Android", ease: 4, precision: 2, sculpt: 4, printReady: 4, parametric: 1, cloud: "No", perpetual: "Yes", standout: "Mobile Sculpting" },
  { name: "AutoCAD", price: "Subscription", type: "Solid", os: "Win/Mac", ease: 2, precision: 5, sculpt: 1, printReady: 3, parametric: 4, cloud: "Partial", perpetual: "No", standout: "2D to 3D Drafting" },
  { name: "SelfCAD", price: "Freemium", type: "Hybrid", os: "Browser", ease: 4, precision: 3, sculpt: 3, printReady: 5, parametric: 2, cloud: "Yes", perpetual: "No", standout: "Built-in Slicer" },
  { name: "BlocksCAD", price: "Freemium", type: "CSG", os: "Browser", ease: 5, precision: 3, sculpt: 1, printReady: 4, parametric: 4, cloud: "Yes", perpetual: "N/A", standout: "Visual Code Blocks" },
];

// Enhanced CAD data with computed scores and mapped types
const cadComparison = cadComparisonRaw.map(item => ({
  ...item,
  priceType: mapPriceType(item.price) as PriceType,
  overallScore: calculateOverallScore({
    ease: item.ease,
    precision: item.precision,
    sculpt: item.sculpt,
    printReady: item.printReady,
    parametric: item.parametric
  }),
  skillLevel: mapSkillLevel(item.ease) as SkillLevel
}));

const ReferenceCAD = () => {
  const [expandedAccordion, setExpandedAccordion] = useState<string[]>([]);

  const handleScrollToComparison = () => {
    const section = document.getElementById('cad-comparison-section');
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleLearnMore = (cadDataId: string) => {
    // Expand the specific accordion item
    setExpandedAccordion(prev => 
      prev.includes(cadDataId) ? prev : [...prev, cadDataId]
    );
    
    // Scroll to the accordion item after a brief delay
    setTimeout(() => {
      const accordionItem = document.getElementById(`accordion-${cadDataId}`);
      if (accordionItem) {
        const headerOffset = 80;
        const elementPosition = accordionItem.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <CADComparisonProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <CADHeroSection 
          softwareCount={cadComparison.length} 
          onScrollToComparison={handleScrollToComparison}
        />

        <div className="container mx-auto px-4 py-8 lg:pr-[300px]">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Interactive Profile Selector */}
          <CADProfileSelector onScrollToComparison={handleScrollToComparison} onLearnMore={handleLearnMore} />

          {/* 3-Tier Comparison System */}
          <CADThreeTierComparison 
            onViewDetails={handleLearnMore}
          />

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
                  <span className="text-2xl font-bold text-cyan-400 font-mono">{index + 1}.</span>
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
                          <span className="text-cyan-400 mt-1">•</span>
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
                              <td className="py-2 px-3 text-sm font-medium text-cyan-400">{tier.tier}</td>
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
        </div>

        {/* Mobile footer spacer */}
        <div className="h-20 lg:hidden" />

        {/* Comparison Components */}
        <CADComparisonSidebar />
        <CADComparisonMobile />
        <CADComparisonModal onViewDetails={handleLearnMore} />
      </div>
    </CADComparisonProvider>
  );
};

export default ReferenceCAD;
