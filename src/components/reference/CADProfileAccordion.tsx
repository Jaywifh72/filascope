import { useState } from 'react';
import { ChevronDown, Check, X, ExternalLink, Plus, Monitor, DollarSign, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCADComparison, SelectedCADSoftware } from '@/contexts/CADComparisonContext';
import { cadTableData } from '@/components/reference/CADComparisonTable';
import {
  PriceBadge,
  mapPriceType,
  calculateOverallScore,
  mapSkillLevel,
  type PriceType,
  type SkillLevel
} from '@/components/reference/CADBadges';

// Logo mapping for CAD software
const cadLogos: Record<string, string> = {
  "Autodesk Fusion 360": "/images/cad/fusion360.png",
  "Blender": "/images/cad/blender.png",
  "SolidWorks": "/images/cad/solidworks.png",
  "Tinkercad": "/images/cad/tinkercad.png",
  "Maxon ZBrush": "/images/cad/zbrush.png",
  "Autodesk Meshmixer": "/images/cad/meshmixer.png",
  "FreeCAD": "/images/cad/freecad.svg",
  "Rhino 3D (Rhinoceros)": "/images/cad/rhino3d.png",
  "OpenSCAD": "/images/cad/openscad.png",
  "Onshape": "/images/cad/onshape.png",
  "Shapr3D": "/images/cad/shapr3d.png",
  "Trimble SketchUp": "/images/cad/sketchup.png",
  "Plasticity": "/images/cad/plasticity.png",
  "Autodesk Maya": "/images/cad/maya.png",
  "Autodesk 3ds Max": "/images/cad/3dsmax.svg",
  "Maxon Cinema 4D": "/images/cad/cinema4d.png",
  "Nomad Sculpt": "/images/cad/nomadsculpt.png",
  "Autodesk AutoCAD": "/images/cad/autocad.svg",
  "SelfCAD": "/images/cad/selfcad.png",
  "BlocksCAD": "/images/cad/blockscad.png",
};

const darkLogos = [
  "Autodesk Fusion 360", "Autodesk AutoCAD", "Autodesk 3ds Max", 
  "Autodesk Maya", "Autodesk Meshmixer"
];
const needsBrightness = (name: string) => darkLogos.includes(name);

// Taglines for each CAD software
const softwareTaglines: Record<string, string> = {
  "fusion-360": "Integrated CAD/CAM/CAE platform for product development",
  "blender": "Complete open-source 3D creation suite",
  "solidworks": "Industry-standard solid modeling for engineers",
  "tinkercad": "Browser-based 3D design for beginners",
  "zbrush": "Professional digital sculpting with ultra high-poly support",
  "meshmixer": "Free mesh editing and 3D print preparation",
  "freecad": "Open-source parametric CAD modeler",
  "rhino-3d": "Precision NURBS modeling with Grasshopper",
  "openscad": "Code-based CSG modeling for programmers",
  "onshape": "Cloud-native CAD with real-time collaboration",
  "shapr3d": "Touch-first CAD for iPad and desktop",
  "sketchup": "Intuitive 3D modeling with push/pull interface",
  "plasticity": "Artist-friendly CAD for industrial design",
  "maya": "Animation and VFX industry standard",
  "3ds-max": "Modifier-based 3D modeling and rendering",
  "cinema-4d": "Motion graphics and 3D design",
  "nomad-sculpt": "Mobile sculpting for iPad and Android",
  "autocad": "Industry standard for 2D drafting and 3D design",
  "selfcad": "Browser-based CAD with built-in slicer",
  "blockscad": "Visual programming for 3D modeling education",
};

// Best for descriptions
const bestForDescriptions: Record<string, string> = {
  "fusion-360": "Product designers, mechanical engineers, startups, and makers who need an all-in-one solution for design, simulation, and manufacturing.",
  "blender": "3D artists, character designers, game developers, and hobbyists creating organic models, miniatures, and artistic prints.",
  "solidworks": "Professional mechanical engineers and product designers in manufacturing industries requiring industry-standard compliance.",
  "tinkercad": "Complete beginners, educators, children, and anyone looking for the easiest entry point into 3D design.",
  "zbrush": "Digital sculptors, character artists, miniature designers, and professionals creating highly detailed organic models.",
  "meshmixer": "Anyone needing to repair, edit, or prepare existing STL files for 3D printing with support generation.",
  "freecad": "Engineers and makers who prefer open-source solutions for parametric mechanical design.",
  "rhino-3d": "Industrial designers, architects, jewelry designers, and professionals needing precise NURBS modeling.",
  "openscad": "Programmers, engineers, and makers who prefer code-based design with version control compatibility.",
  "onshape": "Teams and companies needing cloud-based CAD with version control and simultaneous multi-user editing.",
  "shapr3d": "Mobile professionals, architects, and designers who want intuitive CAD on iPad with Apple Pencil support.",
  "sketchup": "Architects, interior designers, and hobbyists creating architectural models and simple 3D designs.",
  "plasticity": "Industrial designers and artists who want CAD precision with a more intuitive, sculpt-like workflow.",
  "maya": "Animation studios, VFX artists, and game developers needing professional character animation and rigging.",
  "3ds-max": "Architectural visualization artists, game developers, and 3D modelers working in Windows environments.",
  "cinema-4d": "Motion graphics designers, advertising artists, and 3D generalists in creative industries.",
  "nomad-sculpt": "Mobile artists and hobbyists who want professional sculpting tools on tablets.",
  "autocad": "Architects, engineers, and drafters who primarily work with 2D technical drawings and documentation.",
  "selfcad": "Beginners and educators looking for an all-in-one browser-based solution with integrated slicing.",
  "blockscad": "Educators and students learning 3D modeling through visual programming blocks.",
};

interface CADSoftware {
  id: string;
  name: string;
  summary: string;
  architectureOverview: string;
  additiveWorkflow: string[];
  pricing: { tier: string; cost: string; features: string; }[];
  strengths: string[];
  weaknesses: string[];
  technicalSpecs: {
    price: string;
    supportedOS: string;
    fileSupport: string;
    connectivity: string;
  };
  links: {
    website?: string;
    download?: string;
    source?: string;
    documentation?: string;
  };
}

interface CADProfileAccordionProps {
  software: CADSoftware;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function CADProfileAccordion({ software, index, isExpanded, onToggle }: CADProfileAccordionProps) {
  const { addSoftware, removeSoftware, isInComparison, canAddMore } = useCADComparison();
  
  // Find matching table data for badges
  const matchedData = cadTableData.find(s => 
    software.name.toLowerCase().includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(software.name.split(' ')[0].toLowerCase())
  );
  
  const inComparison = isInComparison(software.id);
  
  const handleCompareToggle = () => {
    if (inComparison) {
      removeSoftware(software.id);
    } else if (canAddMore && matchedData) {
      const selected: SelectedCADSoftware = {
        id: software.id,
        name: matchedData.name,
        priceType: matchedData.priceType,
        skillLevel: matchedData.skillLevel,
        overallScore: matchedData.overallScore,
        type: matchedData.type,
        os: matchedData.os,
        ease: matchedData.ease,
        precision: matchedData.precision,
        sculpt: matchedData.sculpt,
        printReady: matchedData.printReady,
        parametric: matchedData.parametric,
        cloud: matchedData.cloud,
        perpetual: matchedData.perpetual,
        standout: matchedData.standout
      };
      addSoftware(selected);
    }
  };
  
  const tagline = softwareTaglines[software.id] || software.summary.slice(0, 60) + '...';
  const bestFor = bestForDescriptions[software.id] || "Makers and designers looking for versatile 3D modeling capabilities.";

  return (
    <div 
      id={`accordion-${software.id}`}
      className={cn(
        "border rounded-xl overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded 
          ? "border-primary/50 bg-card shadow-lg shadow-primary/5" 
          : "border-gray-700 bg-gray-800/30 hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg hover:shadow-teal-500/10"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-4 p-4 text-left transition-colors duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset",
          "rounded-xl"
        )}
        aria-expanded={isExpanded}
        aria-controls={`content-${software.id}`}
      >
        {/* Number Badge */}
        <span className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors duration-300",
          isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
        )}>
          {index + 1}
        </span>
        
        {/* Logo */}
        {cadLogos[software.name] && (
          <img 
            src={cadLogos[software.name]} 
            alt={`${software.name} logo`}
            className={cn(
              "w-9 h-9 rounded object-contain flex-shrink-0",
              needsBrightness(software.name) && "brightness-150 invert"
            )}
          />
        )}
        
        {/* Name and Tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground">{software.name}</h3>
            {matchedData && (
              <PriceBadge type={matchedData.priceType} />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{tagline}</p>
        </div>
        
        {/* Chevron with smooth rotation */}
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground flex-shrink-0",
            "transition-transform duration-300 ease-in-out",
            isExpanded && "rotate-180 text-primary"
          )} 
        />
      </button>
      
      {/* Expanded Content with grid animation for smooth height */}
      <div 
        id={`content-${software.id}`}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
        <div className="px-4 pb-6 pt-2 space-y-6 border-t border-border/50">
          {/* Summary */}
          <div>
            <p className="text-muted-foreground leading-relaxed">{software.summary}</p>
          </div>
          
          {/* Key Strengths */}
          <div>
            <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {software.strengths.slice(0, 4).map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Best For */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Best For
            </h4>
            <p className="text-sm text-muted-foreground">{bestFor}</p>
          </div>
          
          {/* Pricing & Platform Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pricing Details */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Pricing Details
              </h4>
              <div className="space-y-2">
                {software.pricing.slice(0, 3).map((tier, i) => (
                  <div key={i} className="flex justify-between items-start text-sm">
                    <span className="text-muted-foreground">{tier.tier}</span>
                    <span className="text-amber-400 font-medium">{tier.cost}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Platform Availability */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                Platform Availability
              </h4>
              <p className="text-sm text-muted-foreground mb-2">{software.technicalSpecs.supportedOS}</p>
              <p className="text-xs text-muted-foreground/70">
                Formats: {software.technicalSpecs.fileSupport}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {software.links.website && (
              <Button variant="default" size="sm" asChild>
                <a href={software.links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </a>
              </Button>
            )}
            <Button 
              variant={inComparison ? "secondary" : "outline"} 
              size="sm"
              onClick={handleCompareToggle}
              disabled={!inComparison && !canAddMore}
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                inComparison 
                  ? "bg-teal-500/20 text-teal-400 border-teal-500/50 hover:bg-teal-500/30" 
                  : "hover:bg-teal-500/20 hover:border-teal-500 hover:text-teal-400"
              )}
            >
              {inComparison ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to Compare
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Compare
                </>
              )}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default CADProfileAccordion;
