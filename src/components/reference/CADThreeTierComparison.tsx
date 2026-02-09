import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ArrowRight, Plus, ChevronDown, ChevronUp, ChevronsUpDown, Trophy, Star, Gem, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PriceBadge,
  ScoreDisplay,
  SkillIcon,
  SoftwareBadges,
  mapPriceType,
  calculateOverallScore,
  mapSkillLevel,
  type PriceType,
  type SkillLevel
} from "@/components/reference/CADBadges";
import { useCADComparison, SelectedCADSoftware } from "@/contexts/CADComparisonContext";
import { useCADFilters } from "@/contexts/CADFilterContext";
import CADEmptyState from "@/components/reference/CADEmptyState";
import { cadLogos, needsBrightness } from '@/lib/cadLogos';

// Sort types
type SortColumn = 'name' | 'price' | 'type' | 'platform' | 'score' | 'level' | null;
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

// Column tooltip definitions
const COLUMN_TOOLTIPS: Record<string, string> = {
  name: "Software name. Click to sort alphabetically.",
  price: "Pricing model: Free, Freemium, Subscription, Perpetual, or One-Time purchase. Click to sort by affordability.",
  type: "Primary modeling approach: Solid, Mesh, Sculpt, NURBS, CSG, Surface, or Hybrid.",
  platform: "Supported platforms: Windows, Mac, Linux, iPad, Android, or Browser-based.",
  score: "FilaScope rating (0-10): Weighted average of ease, precision, sculpting, print-readiness, and parametric capabilities.",
  level: "Recommended skill level: Beginner (easy to learn), Intermediate, or Advanced (professional expertise).",
};

// CAD comparison data
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

// Enhanced CAD data with computed scores
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

// Name to cadData ID mapping
const nameToCadDataId: Record<string, string> = {
  "Fusion 360": "fusion-360",
  "Blender": "blender",
  "ZBrush": "zbrush",
  "FreeCAD": "freecad",
  "Rhino 3D": "rhino-3d",
  "SketchUp": "sketchup",
  "Onshape": "onshape",
  "Tinkercad": "tinkercad",
  "Maya": "maya",
  "Plasticity": "plasticity",
  "Shapr3D": "shapr3d",
  "SolidWorks": "solidworks",
  "Meshmixer": "meshmixer",
  "OpenSCAD": "openscad",
  "3ds Max": "3ds-max",
  "Cinema 4D": "cinema-4d",
  "Nomad Sculpt": "nomad-sculpt",
  "AutoCAD": "autocad",
  "SelfCAD": "selfcad",
  "BlocksCAD": "blockscad",
};

// Badge configurations
const badgeConfigs = {
  staffPick: { icon: Trophy, text: '#1 Staff Pick', color: 'cyan' },
  bestFree: { icon: Star, text: 'Best Free Option', color: 'emerald' },
  bestPro: { icon: Gem, text: 'Best Professional', color: 'purple' },
};

// Staff Picks data (3 cards)
const staffPicks = [
  {
    name: "Fusion 360",
    badge: badgeConfigs.staffPick,
    whyPicked: [
      'Best balance of power and accessibility',
      'Free for hobbyists and small businesses',
      'Industry-standard parametric CAD',
      'Excellent learning resources and community'
    ],
    bestFor: 'Most users—from beginners to professionals'
  },
  {
    name: "Blender",
    badge: badgeConfigs.bestFree,
    whyPicked: [
      'Completely free, forever, no limitations',
      'Handles modeling, sculpting, animation, rendering',
      'Massive community with endless tutorials',
      'Constantly improving with new releases'
    ],
    bestFor: 'Artists, hobbyists, and budget-conscious creators'
  },
  {
    name: "ZBrush",
    badge: badgeConfigs.bestPro,
    whyPicked: [
      'Industry standard for digital sculpting',
      'Handles millions of polygons effortlessly',
      'Used by Weta, ILM, and top studios',
      'Unmatched brush and detail tools'
    ],
    bestFor: 'Professional sculptors and character artists'
  }
];

// Popular Choices data (8 cards)
const popularChoices = [
  {
    name: "FreeCAD",
    highlight: "Open Source Parametric",
    features: [
      'Free and open source forever',
      'Full parametric modeling',
      'Active development community'
    ]
  },
  {
    name: "Rhino 3D",
    highlight: "NURBS Modeling",
    features: [
      'Industry-standard NURBS',
      'Grasshopper visual scripting',
      'Architecture & product design'
    ]
  },
  {
    name: "SketchUp",
    highlight: "Architectural Design",
    features: [
      'Intuitive push/pull interface',
      'Massive 3D warehouse',
      'Great for architecture'
    ]
  },
  {
    name: "Onshape",
    highlight: "Cloud-Based CAD",
    features: [
      'Fully browser-based',
      'Real-time collaboration',
      'Free for hobbyists'
    ]
  },
  {
    name: "Tinkercad",
    highlight: "Beginner-Friendly",
    features: [
      'Zero learning curve',
      'Browser-based, no install',
      'Perfect for learning'
    ]
  },
  {
    name: "Maya",
    highlight: "Animation & VFX",
    features: [
      'Industry standard for animation',
      'Powerful rigging tools',
      'VFX and film production'
    ]
  },
  {
    name: "Plasticity",
    highlight: "Concept Design",
    features: [
      'Lightning-fast NURBS',
      'Beautiful, modern UI',
      'Industrial design focused'
    ]
  },
  {
    name: "Shapr3D",
    highlight: "Mobile / iPad",
    features: [
      'Best-in-class iPad app',
      'Apple Pencil support',
      'Desktop-quality CAD'
    ]
  }
];

// IDs for filtering
const staffPickNames = staffPicks.map(p => p.name);
const popularNames = popularChoices.map(c => c.name);

interface CADThreeTierComparisonProps {
  onViewDetails: (cadDataId: string) => void;
}

// Helper to convert cadComparison item to SelectedCADSoftware
const toSelectedCADSoftware = (sw: typeof cadComparison[0]): SelectedCADSoftware => ({
  id: sw.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  name: sw.name,
  logo: cadLogos[sw.name],
  priceType: sw.priceType,
  overallScore: sw.overallScore,
  skillLevel: sw.skillLevel,
  type: sw.type,
  os: sw.os,
  ease: sw.ease,
  precision: sw.precision,
  sculpt: sw.sculpt,
  printReady: sw.printReady,
  parametric: sw.parametric,
  cloud: sw.cloud,
  perpetual: sw.perpetual,
  standout: sw.standout,
});

// Add to Compare Button Component
const AddToCompareButton = ({ 
  software, 
  variant = 'default' 
}: { 
  software: typeof cadComparison[0]; 
  variant?: 'default' | 'compact' | 'icon-only';
}) => {
  const { addSoftware, removeSoftware, isInComparison, canAddMore } = useCADComparison();
  const softwareId = software.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const isSelected = isInComparison(softwareId);
  const isDisabled = !isSelected && !canAddMore;

  const handleClick = () => {
    if (isDisabled) return;
    if (isSelected) {
      removeSoftware(softwareId);
    } else {
      addSoftware(toSelectedCADSoftware(software));
    }
  };

  if (variant === 'icon-only') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "h-10 w-10 transition-all",
          isSelected 
            ? "bg-cyan-400/15 border-cyan-400 text-cyan-400 hover:bg-destructive/15 hover:border-destructive hover:text-destructive" 
            : isDisabled
              ? "border-border/40 text-muted-foreground opacity-50 cursor-not-allowed"
              : "border-border/40 text-muted-foreground hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/10"
        )}
        aria-label={isSelected ? `Remove ${software.name} from comparison` : `Add ${software.name} to comparison`}
        title={isDisabled ? 'Remove an item to add more (max 4)' : undefined}
      >
        {isSelected ? <Check size={16} /> : <Plus size={16} />}
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "h-8 px-3 text-xs transition-all",
          isSelected 
            ? "bg-cyan-400/15 border-cyan-400 text-cyan-400 hover:bg-destructive/15 hover:border-destructive hover:text-destructive" 
            : isDisabled
              ? "border-border/40 text-muted-foreground opacity-50 cursor-not-allowed"
              : "border-border/40 text-muted-foreground hover:text-cyan-400 hover:border-cyan-400/30"
        )}
        title={isDisabled ? 'Remove an item to add more (max 4)' : undefined}
      >
        {isSelected ? <Check size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
        {isSelected ? 'Added' : 'Compare'}
      </Button>
    );
  }

  // Default variant
  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "flex-1 h-12 transition-all",
        isSelected 
          ? "bg-cyan-400/15 border-cyan-400 text-cyan-400 hover:bg-destructive/15 hover:border-destructive hover:text-destructive" 
          : isDisabled
            ? "border-border/40 text-muted-foreground opacity-50 cursor-not-allowed"
            : "border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400"
      )}
      title={isDisabled ? 'Remove an item to add more (max 4)' : undefined}
    >
      {isSelected ? <Check size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
      {isSelected ? 'Added' : 'Compare'}
    </Button>
  );
};

// Section Header Component
const SectionHeader = ({ 
  icon, 
  title, 
  count, 
  total 
}: { 
  icon: string; 
  title: string; 
  count: number; 
  total: number;
}) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-cyan-400/20">
    <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
      <span>{icon}</span>
      <span>{title}</span>
    </h2>
    <span className="text-sm font-medium text-muted-foreground">
      {count} of {total} software
    </span>
  </div>
);

// Staff Pick Card Component
const StaffPickCard = ({
  software,
  pickData,
  onViewDetails,
}: {
  software: typeof cadComparison[0];
  pickData: typeof staffPicks[0];
  onViewDetails: (id: string) => void;
}) => {
  const BadgeIcon = pickData.badge.icon;
  const colorClasses = {
    cyan: {
      border: 'border-cyan-400/30 hover:border-cyan-400',
      badge: 'bg-cyan-400/15 border-cyan-400/30 text-cyan-400',
      accent: 'before:bg-cyan-400',
    },
    emerald: {
      border: 'border-emerald-400/30 hover:border-emerald-400',
      badge: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400',
      accent: 'before:bg-emerald-400',
    },
    purple: {
      border: 'border-purple-400/30 hover:border-purple-400',
      badge: 'bg-purple-400/15 border-purple-400/30 text-purple-400',
      accent: 'before:bg-purple-400',
    },
  };
  const colors = colorClasses[pickData.badge.color as keyof typeof colorClasses];

  return (
    <div className={cn(
      "relative min-h-[420px] p-6 md:p-7 rounded-2xl overflow-hidden",
      "bg-card/50 border-2 flex flex-col transition-all duration-300",
      "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30",
      "before:absolute before:top-0 before:left-0 before:right-0 before:h-1",
      colors.border,
      colors.accent
    )}>
      {/* Badge */}
      <div className={cn(
        "inline-flex items-center gap-2 self-start px-3.5 py-2 mb-5 rounded-lg border text-xs font-bold uppercase tracking-wide",
        colors.badge
      )}>
        <BadgeIcon size={14} />
        <span>{pickData.badge.text}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className={cn(
          "w-[72px] h-[72px] rounded-xl bg-white/5 p-3 flex-shrink-0 flex items-center justify-center"
        )}>
          {cadLogos[software.name] && (
            <img 
              src={cadLogos[software.name]} 
              alt={`${software.name} logo`}
              className={cn(
                "w-full h-full object-contain",
                needsBrightness(software.name) && "brightness-150 invert"
              )}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-[22px] font-bold text-foreground mb-2">
            {software.name}
          </h3>
          <SoftwareBadges
            priceType={software.priceType}
            overallScore={software.overallScore}
            skillLevel={software.skillLevel}
            compact
          />
        </div>
      </div>

      {/* Why Picked */}
      <div className="flex-1 mb-5">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Why We Picked It
        </h4>
        <ul className="space-y-2.5">
          {pickData.whyPicked.map((reason, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-foreground/90">
              <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Best For */}
      <div className="px-4 py-3 mb-5 bg-cyan-400/8 border-l-[3px] border-cyan-400 rounded-r-lg">
        <span className="text-[13px] font-medium text-foreground/80">
          <span className="text-cyan-400 font-semibold">Best for:</span> {pickData.bestFor}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-auto">
        <Button
          onClick={() => onViewDetails(nameToCadDataId[software.name])}
          className="flex-1 h-12 bg-cyan-400 hover:bg-cyan-300 text-background font-semibold"
        >
          View Details
          <ArrowRight size={16} className="ml-2" />
        </Button>
        <AddToCompareButton software={software} variant="default" />
      </div>
    </div>
  );
};

// Popular Card Component
const PopularCard = ({
  software,
  choiceData,
  onViewDetails,
}: {
  software: typeof cadComparison[0];
  choiceData: typeof popularChoices[0];
  onViewDetails: (id: string) => void;
}) => (
  <div className={cn(
    "min-h-[280px] p-5 rounded-xl bg-card/30 border border-border",
    "flex flex-col transition-all duration-200",
    "hover:bg-card/50 hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
  )}>
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-lg bg-white/[0.03] p-2 flex-shrink-0 flex items-center justify-center">
        {cadLogos[software.name] && (
          <img 
            src={cadLogos[software.name]} 
            alt={`${software.name} logo`}
            className={cn(
              "w-full h-full object-contain",
              needsBrightness(software.name) && "brightness-150 invert"
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-foreground truncate">
          {software.name}
        </h4>
        <span className="text-xs font-semibold text-cyan-400">
          {choiceData.highlight}
        </span>
      </div>
    </div>

    {/* Features */}
    <ul className="flex-1 space-y-2 mb-4">
      {choiceData.features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-foreground/80">
          <Check size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>

    {/* Meta */}
    <div className="flex items-center gap-2.5 mb-4 pt-3 border-t border-border/50">
      <SoftwareBadges
        priceType={software.priceType}
        overallScore={software.overallScore}
        skillLevel={software.skillLevel}
        compact
      />
    </div>

    {/* Actions */}
    <div className="flex gap-2.5 mt-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetails(nameToCadDataId[software.name])}
        className="flex-1 h-10 border-border/50 text-foreground/80 hover:bg-white/5"
      >
        View Details
        <ArrowRight size={14} className="ml-1.5" />
      </Button>
      <AddToCompareButton software={software} variant="icon-only" />
    </div>
  </div>
);

// Sort Icon Component
const SortIcon = ({ 
  columnKey, 
  sortState 
}: { 
  columnKey: SortColumn; 
  sortState: SortState;
}) => {
  const isActive = sortState.column === columnKey;
  
  if (!isActive) {
    return <ChevronsUpDown size={14} className="text-muted-foreground/50" />;
  }
  
  return sortState.direction === 'asc' 
    ? <ChevronUp size={14} className="text-cyan-400" />
    : <ChevronDown size={14} className="text-cyan-400" />;
};

// Sortable Header Component
const SortableHeader = ({
  columnKey,
  label,
  tooltip,
  sortState,
  onSort,
  align = 'left',
}: {
  columnKey: SortColumn;
  label: string;
  tooltip: string;
  sortState: SortState;
  onSort: (key: SortColumn) => void;
  align?: 'left' | 'center' | 'right';
}) => {
  const isActive = sortState.column === columnKey;
  const alignClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  
  return (
    <th 
      className={cn(
        "py-3.5 px-4 text-xs font-bold uppercase tracking-wide whitespace-nowrap",
        "bg-background/95 backdrop-blur-sm",
        isActive ? "text-cyan-400 border-b-2 border-cyan-400" : "text-muted-foreground border-b border-border",
        "cursor-pointer select-none transition-colors hover:text-foreground hover:bg-white/[0.02]"
      )}
      onClick={() => onSort(columnKey)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSort(columnKey);
        }
      }}
      tabIndex={0}
      role="columnheader"
      aria-sort={isActive ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className={cn("flex items-center gap-1.5", alignClass)}>
        <span>{label}</span>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground/50 hover:text-cyan-400 transition-colors"
                aria-label={`Info about ${label}`}
              >
                <HelpCircle size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-[260px] text-xs font-medium bg-popover border border-border shadow-lg"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <SortIcon columnKey={columnKey} sortState={sortState} />
      </div>
    </th>
  );
};

// Full Comparison Table Component
const FullComparisonTable = ({
  software,
  onViewDetails,
}: {
  software: typeof cadComparison;
  onViewDetails: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null
  });
  const [sortAnnouncement, setSortAnnouncement] = useState('');
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for sticky header shadow
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setIsHeaderSticky(container.scrollTop > 0);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle sort click - cycles: null → desc → asc → null
  const handleSort = (columnKey: SortColumn) => {
    setSortState(prev => {
      let newState: SortState;
      if (prev.column !== columnKey) {
        newState = { column: columnKey, direction: 'desc' };
      } else if (prev.direction === 'desc') {
        newState = { column: columnKey, direction: 'asc' };
      } else {
        newState = { column: null, direction: null };
      }
      
      // Update screen reader announcement
      const columnLabels: Record<string, string> = {
        name: 'Software',
        price: 'Price',
        type: 'Type',
        platform: 'Platform',
        score: 'Score',
        level: 'Level'
      };
      
      if (newState.column && newState.direction) {
        setSortAnnouncement(
          `Table sorted by ${columnLabels[newState.column]}, ${newState.direction === 'asc' ? 'ascending' : 'descending'}`
        );
      } else {
        setSortAnnouncement('Table sort cleared');
      }
      
      return newState;
    });
  };

  // Sort functions for each column
  const sortFunctions: Record<string, (a: typeof software[0], b: typeof software[0], dir: SortDirection) => number> = {
    name: (a, b, dir) => {
      const cmp = a.name.localeCompare(b.name);
      return dir === 'asc' ? cmp : -cmp;
    },
    price: (a, b, dir) => {
      const priceOrder: Record<string, number> = { 
        free: 0, 
        freemium: 1, 
        'one-time': 2,
        perpetual: 3, 
        subscription: 4, 
        paid: 5 
      };
      const aOrder = priceOrder[a.priceType.toLowerCase()] ?? 99;
      const bOrder = priceOrder[b.priceType.toLowerCase()] ?? 99;
      const cmp = aOrder - bOrder;
      return dir === 'asc' ? cmp : -cmp;
    },
    type: (a, b, dir) => {
      const cmp = a.type.localeCompare(b.type);
      return dir === 'asc' ? cmp : -cmp;
    },
    platform: (a, b, dir) => {
      const cmp = a.os.localeCompare(b.os);
      return dir === 'asc' ? cmp : -cmp;
    },
    score: (a, b, dir) => {
      const cmp = a.overallScore - b.overallScore;
      return dir === 'asc' ? cmp : -cmp;
    },
    level: (a, b, dir) => {
      const levelOrder: Record<string, number> = { 
        beginner: 0, 
        intermediate: 1, 
        advanced: 2 
      };
      const aOrder = levelOrder[a.skillLevel.toLowerCase()] ?? 1;
      const bOrder = levelOrder[b.skillLevel.toLowerCase()] ?? 1;
      const cmp = aOrder - bOrder;
      return dir === 'asc' ? cmp : -cmp;
    }
  };

  // Sorted software array
  const sortedSoftware = useMemo(() => {
    if (!sortState.column || !sortState.direction) return software;
    
    const sortFn = sortFunctions[sortState.column];
    if (!sortFn) return software;
    
    return [...software].sort((a, b) => sortFn(a, b, sortState.direction));
  }, [software, sortState]);

  // Helper to check if a column is currently sorted
  const isSortedColumn = (columnKey: string) => sortState.column === columnKey;

  return (
    <section className="mb-16">
      {/* Screen reader sort announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {sortAnnouncement}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-5 md:p-6 bg-card/30 border border-border rounded-xl",
          "flex items-center justify-between cursor-pointer transition-all duration-200",
          "hover:bg-card/50 hover:border-border/60",
          isExpanded && "rounded-b-none border-b-0"
        )}
        aria-expanded={isExpanded}
        aria-controls="full-comparison-content"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div className="text-left">
            <h3 className="text-lg font-bold text-foreground">
              Full Comparison Table
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {software.length} more options to explore
            </p>
          </div>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center transition-transform duration-200",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown size={20} className="text-muted-foreground" />
        </div>
      </button>

      <div
        id="full-comparison-content"
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div 
          ref={tableContainerRef}
          className={cn(
            "p-5 bg-card/20 border border-t-0 border-border rounded-b-xl",
            "overflow-x-auto overflow-y-auto max-h-[600px]",
            "scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30",
            "[-webkit-overflow-scrolling:touch]"
          )}
        >
          <table className="w-full border-collapse min-w-[700px]" role="table" aria-label="CAD Software Comparison">
            <thead className={cn(
              "sticky top-0 z-10 transition-shadow duration-200",
              isHeaderSticky && "shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            )}>
              <tr>
                <SortableHeader
                  columnKey="name"
                  label="Software"
                  tooltip={COLUMN_TOOLTIPS.name}
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  columnKey="price"
                  label="Price"
                  tooltip={COLUMN_TOOLTIPS.price}
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  columnKey="type"
                  label="Type"
                  tooltip={COLUMN_TOOLTIPS.type}
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  columnKey="platform"
                  label="Platform"
                  tooltip={COLUMN_TOOLTIPS.platform}
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  columnKey="score"
                  label="Score"
                  tooltip={COLUMN_TOOLTIPS.score}
                  sortState={sortState}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  columnKey="level"
                  label="Level"
                  tooltip={COLUMN_TOOLTIPS.level}
                  sortState={sortState}
                  onSort={handleSort}
                  align="center"
                />
                <th className="py-3.5 px-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide bg-background/95 backdrop-blur-sm border-b border-border">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSoftware.map((sw) => (
                <tr 
                  key={sw.name}
                  className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
                >
                  <td className={cn(
                    "py-4 px-4 transition-colors",
                    isSortedColumn('name') && "bg-cyan-400/[0.03]"
                  )}>
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-9 h-9 rounded-md bg-white/[0.03] p-1.5 flex-shrink-0 flex items-center justify-center">
                        {cadLogos[sw.name] && (
                          <img 
                            src={cadLogos[sw.name]} 
                            alt={`${sw.name} logo`}
                            className={cn(
                              "w-full h-full object-contain",
                              needsBrightness(sw.name) && "brightness-150 invert"
                            )}
                          />
                        )}
                      </div>
                      <span className="font-semibold text-foreground">{sw.name}</span>
                    </div>
                  </td>
                  <td className={cn(
                    "py-4 px-4 transition-colors",
                    isSortedColumn('price') && "bg-cyan-400/[0.03]"
                  )}>
                    <PriceBadge type={sw.priceType} />
                  </td>
                  <td className={cn(
                    "py-4 px-4 text-sm text-muted-foreground transition-colors",
                    isSortedColumn('type') && "bg-cyan-400/[0.03]"
                  )}>
                    {sw.type}
                  </td>
                  <td className={cn(
                    "py-4 px-4 text-sm text-muted-foreground transition-colors",
                    isSortedColumn('platform') && "bg-cyan-400/[0.03]"
                  )}>
                    {sw.os}
                  </td>
                  <td className={cn(
                    "py-4 px-4 text-center transition-colors",
                    isSortedColumn('score') && "bg-cyan-400/[0.03]"
                  )}>
                    <ScoreDisplay score={sw.overallScore} size="sm" />
                  </td>
                  <td className={cn(
                    "py-4 px-4 transition-colors",
                    isSortedColumn('level') && "bg-cyan-400/[0.03]"
                  )}>
                    <div className="flex justify-center">
                      <SkillIcon level={sw.skillLevel} />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(nameToCadDataId[sw.name])}
                        className="h-8 px-3 text-xs border-border/50 text-foreground/70 hover:bg-white/5"
                      >
                        Details
                        <ArrowRight size={12} className="ml-1" />
                      </Button>
                      <AddToCompareButton software={sw} variant="compact" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// Main Component
const CADThreeTierComparison = ({ onViewDetails }: CADThreeTierComparisonProps) => {
  const { getFilteredData, hasActiveFilters, clearFilters, totalCount } = useCADFilters();
  
  // Get all staff pick software and filter them
  const staffPickSoftwareAll = staffPicks.map(pick => ({
    software: cadComparison.find(s => s.name === pick.name)!,
    pickData: pick
  }));
  const filteredStaffPickSoftware = useMemo(() => {
    const allSoftware = staffPickSoftwareAll.map(item => item.software);
    const filtered = getFilteredData(allSoftware);
    return staffPickSoftwareAll.filter(item => 
      filtered.some(f => f.name === item.software.name)
    );
  }, [getFilteredData, staffPickSoftwareAll]);

  // Get all popular software and filter them
  const popularSoftwareAll = popularChoices.map(choice => ({
    software: cadComparison.find(s => s.name === choice.name)!,
    choiceData: choice
  }));
  const filteredPopularSoftware = useMemo(() => {
    const allSoftware = popularSoftwareAll.map(item => item.software);
    const filtered = getFilteredData(allSoftware);
    return popularSoftwareAll.filter(item => 
      filtered.some(f => f.name === item.software.name)
    );
  }, [getFilteredData, popularSoftwareAll]);

  // Remaining software (not in Staff Picks or Popular) and filter them
  const remainingSoftwareAll = cadComparison.filter(
    s => !staffPickNames.includes(s.name) && !popularNames.includes(s.name)
  );
  const filteredRemainingSoftware = useMemo(() => {
    return getFilteredData(remainingSoftwareAll);
  }, [getFilteredData, remainingSoftwareAll]);

  // Check if everything is empty
  const allEmpty = filteredStaffPickSoftware.length === 0 && 
                   filteredPopularSoftware.length === 0 && 
                   filteredRemainingSoftware.length === 0;

  // If filters are active and no results, show empty state
  if (hasActiveFilters && allEmpty) {
    return (
      <div id="cad-comparison-section" className="mb-12">
        <CADEmptyState onClear={clearFilters} />
      </div>
    );
  }

  return (
    <div id="cad-comparison-section" className="mb-12">
      {/* Tier 1: Staff Picks */}
      {filteredStaffPickSoftware.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            icon="🏆"
            title="Staff Picks"
            count={filteredStaffPickSoftware.length}
            total={staffPicks.length}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaffPickSoftware.map(({ software, pickData }) => (
              <StaffPickCard
                key={software.name}
                software={software}
                pickData={pickData}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tier 2: Popular Choices */}
      {filteredPopularSoftware.length > 0 && (
        <section className="mb-16">
          <SectionHeader
            icon="⭐"
            title="Popular Choices"
            count={filteredPopularSoftware.length}
            total={popularChoices.length}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPopularSoftware.map(({ software, choiceData }) => (
              <PopularCard
                key={software.name}
                software={software}
                choiceData={choiceData}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tier 3: Full Comparison Table */}
      {filteredRemainingSoftware.length > 0 && (
        <FullComparisonTable
          software={filteredRemainingSoftware}
          onViewDetails={onViewDetails}
        />
      )}
    </div>
  );
};

export default CADThreeTierComparison;

// Export cadComparison for use in the filter provider
export { cadComparison };
