import { useState, useMemo } from 'react';
import { ArrowRight, Star, ChevronUp, ChevronDown, ChevronsUpDown, Monitor, Laptop, Smartphone, Globe, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCADFilters } from '@/contexts/CADFilterContext';
import { useCADComparison, SelectedCADSoftware } from '@/contexts/CADComparisonContext';
import {
  PriceBadge,
  ScoreDisplay,
  SkillIcon,
  mapPriceType,
  calculateOverallScore,
  mapSkillLevel,
  type PriceType,
  type SkillLevel
} from '@/components/reference/CADBadges';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

// Logo mapping for CAD software
const cadLogos: Record<string, string> = {
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
};

const darkLogos = ["Fusion 360", "AutoCAD", "3ds Max", "Maya", "Meshmixer"];
const needsBrightness = (name: string) => darkLogos.includes(name);

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
  "Meshmixer": "meshmixer",
  "OpenSCAD": "openscad",
  "Shapr3D": "shapr3d",
  "SolidWorks": "solidworks",
  "Plasticity": "plasticity",
  "Maya": "maya",
  "3ds Max": "3ds-max",
  "Cinema 4D": "cinema-4d",
  "Nomad Sculpt": "nomad-sculpt",
  "AutoCAD": "autocad",
  "SelfCAD": "selfcad",
  "BlocksCAD": "blockscad",
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
export const cadTableData = cadComparisonRaw.map(item => ({
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

type CADTableItem = typeof cadTableData[number];

type SortColumn = 'name' | 'score' | 'price' | 'platform' | 'level';
type SortDirection = 'asc' | 'desc';

interface CADComparisonTableProps {
  onViewDetails: (cadDataId: string) => void;
  isDetailedView: boolean;
}

// Platform icon component
const PlatformIcons = ({ os }: { os: string }) => {
  const platforms = os.toLowerCase();
  const icons: React.ReactNode[] = [];
  
  if (platforms.includes('win')) {
    icons.push(
      <TooltipProvider key="windows">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-blue-400"><Monitor className="w-4 h-4" /></span>
          </TooltipTrigger>
          <TooltipContent>Windows</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (platforms.includes('mac')) {
    icons.push(
      <TooltipProvider key="mac">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-gray-400"><Laptop className="w-4 h-4" /></span>
          </TooltipTrigger>
          <TooltipContent>macOS</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (platforms.includes('lin')) {
    icons.push(
      <TooltipProvider key="linux">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-orange-400"><Terminal className="w-4 h-4" /></span>
          </TooltipTrigger>
          <TooltipContent>Linux</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (platforms.includes('browser')) {
    icons.push(
      <TooltipProvider key="browser">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-teal-400"><Globe className="w-4 h-4" /></span>
          </TooltipTrigger>
          <TooltipContent>Browser</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (platforms.includes('ipad') || platforms.includes('android')) {
    icons.push(
      <TooltipProvider key="mobile">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-green-400"><Smartphone className="w-4 h-4" /></span>
          </TooltipTrigger>
          <TooltipContent>Mobile</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return <div className="flex gap-1.5">{icons}</div>;
};

// Skill level badge component
const SkillBadge = ({ level }: { level: SkillLevel }) => {
  const config = {
    beginner: { label: 'Beginner', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    intermediate: { label: 'Intermediate', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    advanced: { label: 'Advanced', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  };
  const c = config[level];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      c.bg, c.text, c.border
    )}>
      {c.label}
    </span>
  );
};

// Sortable header component
const SortableHeader = ({ 
  label, 
  column, 
  currentSort, 
  currentDirection, 
  onSort 
}: {
  label: string;
  column: SortColumn;
  currentSort: SortColumn | null;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}) => {
  const isActive = currentSort === column;
  
  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {isActive ? (
        currentDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
      )}
    </button>
  );
};

export function CADComparisonTable({ onViewDetails, isDetailedView }: CADComparisonTableProps) {
  const { getFilteredData } = useCADFilters();
  const { addSoftware, removeSoftware, isInComparison, canAddMore } = useCADComparison();
  
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'score' ? 'desc' : 'asc');
    }
  };
  
  const filteredData = useMemo(() => {
    return getFilteredData(cadTableData);
  }, [getFilteredData]);
  
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'score':
          comparison = a.overallScore - b.overallScore;
          break;
        case 'price': {
          const priceOrder = { free: 0, freemium: 1, paid: 2 };
          comparison = priceOrder[a.priceType] - priceOrder[b.priceType];
          break;
        }
        case 'level': {
          const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          comparison = levelOrder[a.skillLevel] - levelOrder[b.skillLevel];
          break;
        }
        case 'platform':
          comparison = a.os.localeCompare(b.os);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);
  
  const toSelectedCADSoftware = (sw: CADTableItem): SelectedCADSoftware => ({
    id: nameToCadDataId[sw.name] || sw.name.toLowerCase().replace(/\s+/g, '-'),
    name: sw.name,
    priceType: sw.priceType,
    skillLevel: sw.skillLevel,
    overallScore: sw.overallScore,
    type: sw.type,
    os: sw.os,
    ease: sw.ease,
    precision: sw.precision,
    sculpt: sw.sculpt,
    printReady: sw.printReady,
    parametric: sw.parametric,
    cloud: sw.cloud,
    perpetual: sw.perpetual,
    standout: sw.standout
  });
  
  const handleCompareToggle = (sw: typeof cadTableData[0]) => {
    const id = nameToCadDataId[sw.name] || sw.name.toLowerCase().replace(/\s+/g, '-');
    if (isInComparison(id)) {
      removeSoftware(id);
    } else if (canAddMore) {
      addSoftware(toSelectedCADSoftware(sw));
    }
  };
  
  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Monitor className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No software matches your filters</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4">
              <SortableHeader label="Name" column="name" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
            </th>
            <th className="text-left py-3 px-4">
              <SortableHeader label="Overall Score" column="score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
            </th>
            <th className="text-left py-3 px-4">
              <SortableHeader label="Price" column="price" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
            </th>
            <th className="text-left py-3 px-4">
              <SortableHeader label="Platform" column="platform" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
            </th>
            <th className="text-left py-3 px-4">
              <SortableHeader label="Level" column="level" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
            </th>
            {isDetailedView && (
              <th className="text-left py-3 px-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>
              </th>
            )}
            <th className="text-right py-3 px-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((sw, index) => {
            const id = nameToCadDataId[sw.name] || sw.name.toLowerCase().replace(/\s+/g, '-');
            const inComparison = isInComparison(id);
            
            return (
              <tr 
                key={sw.name} 
                className={cn(
                  "border-b border-border/50 transition-all duration-200",
                  "hover:bg-gray-800/50 hover:shadow-sm",
                  index % 2 === 0 ? "bg-transparent" : "bg-gray-900/20"
                )}
              >
                {/* Name with logo */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {cadLogos[sw.name] && (
                      <img 
                        src={cadLogos[sw.name]} 
                        alt={`${sw.name} logo`}
                        className={cn(
                          "w-7 h-7 rounded object-contain",
                          needsBrightness(sw.name) && "brightness-150 invert"
                        )}
                      />
                    )}
                    <span className="font-medium text-foreground">{sw.name}</span>
                  </div>
                </td>
                
                {/* Score */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className={cn(
                      "font-bold",
                      sw.overallScore >= 7.5 ? "text-green-400" :
                      sw.overallScore >= 5 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {sw.overallScore.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">/10</span>
                  </div>
                </td>
                
                {/* Price */}
                <td className="py-3 px-4">
                  <PriceBadge type={sw.priceType} />
                </td>
                
                {/* Platform */}
                <td className="py-3 px-4">
                  <PlatformIcons os={sw.os} />
                </td>
                
                {/* Level */}
                <td className="py-3 px-4">
                  <SkillBadge level={sw.skillLevel} />
                </td>
                
                {/* Type (detailed view only) */}
                {isDetailedView && (
                  <td className="py-3 px-4">
                    <span className="text-sm text-muted-foreground">{sw.type}</span>
                  </td>
                )}
                
                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCompareToggle(sw)}
                      className={cn(
                        "text-xs h-8 px-3",
                        inComparison 
                          ? "bg-primary/20 text-primary hover:bg-primary/30" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {inComparison ? "✓ Added" : "+ Compare"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(id)}
                      className="text-primary hover:text-primary/80 text-xs h-8 px-3 gap-1"
                    >
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CADComparisonTable;
