import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, Search, X, Thermometer, Shield, Zap, Layers, AlertTriangle, 
  CheckCircle, Info, GitCompare, BookOpen, ChevronDown, Trophy, Droplets,
  Wind, Flame, Gauge, Factory, Paintbrush, Leaf, Settings2, Crown, SlidersHorizontal,
  Medal, Award, Beaker, Sun, DollarSign
} from "lucide-react";
import { 
  MATERIAL_CATEGORIES, 
  getMaterialInfo, 
  getMaterialCategory,
  type MaterialInfo 
} from "@/lib/materialHierarchy";
import { MATERIAL_REFERENCE_DATA, type MaterialReferenceInfo } from "@/lib/materialReferenceData";
import { cn } from "@/lib/utils";
import { getMaterialCompareList } from "@/lib/materialCompareStore";
import MaterialReference from "@/components/MaterialReference";

// Helper to get numeric value from property level for comparison
const getPropertyValue = (level: string): number => {
  const levelMap: Record<string, number> = {
    // General levels
    'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5,
    'Easy': 4, 'Hard': 2, 'Expert': 1,
    'Rigid': 1, 'Semi-Flexible': 2, 'Flexible': 3, 'Very Flexible': 4,
    'Excellent': 5, 'Good': 4, 'Difficult': 2, 'Not Possible': 1,
    'Strong Chemical Bond': 4, 'Mechanical Bond': 3, 'Weak Bond': 2, 'No Bond': 1,
    // Food Safety rankings (higher = safer)
    'FDA Approved': 8, 'Food Safe': 8, 'Generally Safe': 7, 
    'Possible (Specific Grades)': 6, 'Possible with Certification': 6, 
    'Safe with Precautions': 5, 'Limited Food Contact': 4,
    'Conditional': 3, 'Not Safe': 1, 'Not Food Safe': 1,
    // Biodegradability rankings
    'Fully Biodegradable': 5, 'Compostable': 4, 'Industrial Compostable': 3,
    'Partially Biodegradable': 2, 'Not Biodegradable': 1, 'Non-Biodegradable': 1,
  };
  return levelMap[level] || 0;
};

// Derive chemical resistance score from material data (1-5 scale)
const getChemicalResistanceScore = (refData?: MaterialReferenceInfo): number => {
  if (!refData) return 2; // Default medium-low

  // Check for chemical resistance keywords in properties
  const materialName = refData.name.toUpperCase();
  
  // Known chemically resistant materials
  if (['PETG', 'PP', 'HDPE', 'PEEK', 'PEI', 'PEKK', 'PA-CF', 'PA-GF', 'PPA', 'CPE'].some(m => materialName.includes(m))) {
    return 5;
  }
  if (['ABS', 'ASA', 'NYLON', 'PA6', 'PA12', 'PC'].some(m => materialName.includes(m))) {
    return 4;
  }
  if (['PETG', 'PET'].some(m => materialName.includes(m))) {
    return 4;
  }
  if (['TPU', 'TPE', 'FLEX'].some(m => materialName.includes(m))) {
    return 3;
  }
  if (['PLA', 'PVA', 'HIPS', 'WOOD'].some(m => materialName.includes(m))) {
    return 2;
  }
  
  return 2; // Default
};

// Derive UV stability score from material data (1-5 scale)
const getUVStabilityScore = (refData?: MaterialReferenceInfo): number => {
  if (!refData) return 2;

  const materialName = refData.name.toUpperCase();
  
  // Check weaknesses for UV degradation mentions
  const weaknesses = refData.weaknesses?.limitations?.join(' ').toLowerCase() || '';
  if (weaknesses.includes('uv') && weaknesses.includes('degrad')) {
    return 1;
  }
  
  // Known UV-stable materials
  if (['ASA', 'PMMA', 'PC-ASA'].some(m => materialName.includes(m))) {
    return 5;
  }
  if (['PETG', 'PC', 'PEEK', 'PEI', 'PP'].some(m => materialName.includes(m))) {
    return 4;
  }
  if (['ABS', 'NYLON', 'PA'].some(m => materialName.includes(m))) {
    return 3;
  }
  if (['PLA', 'TPU'].some(m => materialName.includes(m))) {
    return 2;
  }
  if (['PVA', 'HIPS'].some(m => materialName.includes(m))) {
    return 1;
  }
  
  return 2;
};

// Derive cost efficiency score from material data (1-5 scale, higher = more affordable)
const getCostEfficiencyScore = (refData?: MaterialReferenceInfo): number => {
  if (!refData) return 3;

  const costPosition = refData.practicalContext?.costPosition;
  switch (costPosition) {
    case 'Budget': return 5;
    case 'Standard': return 4;
    case 'Premium': return 2;
    case 'Industrial': return 1;
    default: return 3;
  }
};

// Extract numeric value from string, handling ranges like "50-65" by taking the midpoint
const extractNumericFromString = (value: string): number | null => {
  if (!value || typeof value !== 'string') return null;
  
  // Check for range pattern like "50-65" or "40 - 50"
  const rangeMatch = value.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return (low + high) / 2; // Use midpoint for comparison
  }
  
  // Single number
  const singleMatch = value.match(/[\d.]+/);
  return singleMatch ? parseFloat(singleMatch[0]) : null;
};

// Determine winner for a criteria (higher is better by default, can be inverted)
const getWinners = (
  materials: { name: string; value: number | string | null }[],
  higherIsBetter: boolean = true
): string[] => {
  const validMaterials = materials.filter(m => m.value !== null && m.value !== undefined && m.value !== '');
  if (validMaterials.length === 0) return [];
  
  const numericMaterials = validMaterials.map(m => {
    let numValue: number;
    if (typeof m.value === 'number') {
      numValue = m.value;
    } else {
      // Try to extract numeric value first (for values like "50-65 MPa")
      const extracted = extractNumericFromString(String(m.value));
      if (extracted !== null) {
        numValue = extracted;
      } else {
        // Fall back to qualitative level mapping
        numValue = getPropertyValue(String(m.value));
      }
    }
    return { name: m.name, value: numValue };
  });
  
  // Filter out materials with 0 value (couldn't be parsed)
  const scoredMaterials = numericMaterials.filter(m => m.value !== 0);
  if (scoredMaterials.length === 0) return [];
  
  const bestValue = higherIsBetter 
    ? Math.max(...scoredMaterials.map(m => m.value))
    : Math.min(...scoredMaterials.map(m => m.value));
  
  // Only return winners if there's a meaningful difference (>5% difference from best)
  const threshold = Math.abs(bestValue) * 0.05;
  return scoredMaterials
    .filter(m => Math.abs(m.value - bestValue) <= threshold)
    .map(m => m.name);
};

// Extract numeric value from TDS property
const extractNumericValue = (value: string): number | null => {
  return extractNumericFromString(value);
};

// Get TDS backing value for a property
const getTDSValue = (refData: MaterialReferenceInfo | undefined, propertySearch: string): string | null => {
  if (!refData?.tdsProfile?.properties) return null;
  const prop = refData.tdsProfile.properties.find(p => 
    p.name.toLowerCase().includes(propertySearch.toLowerCase())
  );
  if (!prop) return null;
  return prop.value;
};

// Get tensile strength for "Strength" property
const getTensileStrength = (refData?: MaterialReferenceInfo): string | null => {
  return getTDSValue(refData, 'tensile strength');
};

// Get elongation for "Flexibility" property  
const getElongation = (refData?: MaterialReferenceInfo): string | null => {
  return getTDSValue(refData, 'elongation');
};

// Get glass transition for "Heat Resistance" property
const getGlassTransition = (refData?: MaterialReferenceInfo): string | null => {
  const tg = getTDSValue(refData, 'glass transition');
  if (tg) return tg;
  return getTDSValue(refData, 'tg');
};

// Get nozzle temp range for "Printability" (lower = easier)
const getNozzleTempRange = (refData?: MaterialReferenceInfo): string | null => {
  if (!refData?.printSettings?.nozzleTemp) return null;
  const { min, max } = refData.printSettings.nozzleTemp;
  return `${min}-${max}`;
};

const WinnerBadge = ({ isWinner }: { isWinner: boolean }) => {
  if (!isWinner) return null;
  return (
    <div className="absolute -top-1 -right-1 z-10">
      <div className="bg-amber-500 text-amber-950 rounded-full p-1 shadow-lg">
        <Crown className="w-3 h-3" />
      </div>
    </div>
  );
};

const PropertyBar = ({ 
  level, 
  color,
  isWinner = false,
  numericValue,
  numericUnit,
}: { 
  level: 'Low' | 'Medium' | 'High' | 'Very High' | 'Easy' | 'Hard' | 'Expert' | 'Rigid' | 'Semi-Flexible' | 'Flexible' | 'Very Flexible';
  color: string;
  isWinner?: boolean;
  numericValue?: string | null;
  numericUnit?: string;
}) => {
  const getWidth = () => {
    switch (level) {
      case 'Easy':
      case 'Low':
      case 'Rigid':
        return 25;
      case 'Medium':
      case 'Semi-Flexible':
        return 50;
      case 'High':
      case 'Hard':
      case 'Flexible':
        return 75;
      case 'Very High':
      case 'Expert':
      case 'Very Flexible':
        return 100;
      default:
        return 50;
    }
  };

  return (
    <div className={cn(
      "flex flex-col gap-1 relative p-2 rounded-md transition-all",
      isWinner && "bg-amber-500/10 ring-1 ring-amber-500/30"
    )}>
      {isWinner && (
        <Trophy className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1" />
      )}
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${getWidth()}%` }}
          />
        </div>
        <span className={cn(
          "text-xs w-20",
          isWinner ? "text-amber-600 font-semibold" : "text-muted-foreground"
        )}>{level}</span>
      </div>
      {numericValue && (
        <span className={cn(
          "text-xs font-mono pl-0.5",
          isWinner ? "text-amber-600" : "text-muted-foreground/70"
        )}>
          {numericValue}{numericUnit}
        </span>
      )}
    </div>
  );
};

const ComparisonCell = ({ 
  value, 
  isWinner = false,
  unit = '',
  className = ''
}: { 
  value: string | number | null | undefined;
  isWinner?: boolean;
  unit?: string;
  className?: string;
}) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  
  return (
    <div className={cn(
      "text-sm p-2 rounded-md transition-all text-center",
      isWinner && "bg-amber-500/10 ring-1 ring-amber-500/30 font-semibold text-amber-600",
      !isWinner && "text-foreground",
      className
    )}>
      {isWinner && <Trophy className="w-3 h-3 text-amber-500 inline mr-1" />}
      {value}{unit}
    </div>
  );
};

const ComparisonRow = ({
  label,
  icon: Icon,
  materials,
  getValue,
  higherIsBetter = true,
  unit = '',
  formatValue,
}: {
  label: string;
  icon?: React.ElementType;
  materials: { name: string; refData?: MaterialReferenceInfo }[];
  getValue: (refData?: MaterialReferenceInfo) => string | number | null | undefined;
  higherIsBetter?: boolean;
  unit?: string;
  formatValue?: (value: any) => string;
}) => {
  const values = materials.map(m => ({
    name: m.name,
    value: getValue(m.refData)
  }));
  
  const winners = getWinners(
    values.map(v => ({ name: v.name, value: v.value as string | number | null })),
    higherIsBetter
  );

  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${materials.length}, minmax(0, 1fr))` }}>
        {values.map(({ name, value }) => (
          <ComparisonCell
            key={name}
            value={formatValue ? formatValue(value) : value}
            isWinner={winners.includes(name)}
            unit={unit}
          />
        ))}
      </div>
    </div>
  );
};

const ComparisonContent = () => {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [weights, setWeights] = useState({
    printability: 15,
    strength: 15,
    flexibility: 15,
    heatResistance: 15,
    chemicalResistance: 15,
    uvStability: 15,
    costEfficiency: 10,
  });

  // Load materials from store (added from Reference tab or Popular Comparisons)
  useEffect(() => {
    const syncFromStore = () => {
      const stored = getMaterialCompareList();
      if (stored.length > 0) {
        setSelectedMaterials(prev => {
          if (prev.length === 0) return stored;
          const merged = [...new Set([...prev, ...stored])].slice(0, 4);
          return merged;
        });
      }
    };
    syncFromStore();
    window.addEventListener('material-compare-changed', syncFromStore);
    return () => window.removeEventListener('material-compare-changed', syncFromStore);
  }, []);

  const allMaterials = useMemo(() => {
    const materials: { name: string; category: string; info: MaterialInfo }[] = [];
    
    MATERIAL_CATEGORIES.forEach(category => {
      category.materials.forEach(materialName => {
        const info = getMaterialInfo(materialName);
        if (info) {
          materials.push({
            name: materialName,
            category: category.name,
            info,
          });
        }
      });
    });
    
    return materials;
  }, []);

  // Filter materials by search
  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return allMaterials;
    const term = searchTerm.toLowerCase();
    return allMaterials.filter(m => 
      m.name.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term)
    );
  }, [allMaterials, searchTerm]);

  // Group by category
  const groupedMaterials = useMemo(() => {
    const grouped: Record<string, typeof allMaterials> = {};
    filteredMaterials.forEach(m => {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    });
    return grouped;
  }, [filteredMaterials]);

  const toggleMaterial = (materialName: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialName)
        ? prev.filter(m => m !== materialName)
        : prev.length < 5 ? [...prev, materialName] : prev
    );
  };

  const removeMaterial = (materialName: string) => {
    setSelectedMaterials(prev => prev.filter(m => m !== materialName));
  };

  const clearAll = () => {
    setSelectedMaterials([]);
  };

  const selectedMaterialInfos = selectedMaterials.map(name => ({
    name,
    info: getMaterialInfo(name),
    category: getMaterialCategory(name),
    refData: MATERIAL_REFERENCE_DATA[name],
  })).filter(m => m.info);

  // Calculate winners for basic properties using TDS numeric values when available
  const printabilityWinners = getWinners(
    selectedMaterialInfos.map(m => {
      // For printability, lower nozzle temp = easier, so use inverted logic
      const nozzleRange = getNozzleTempRange(m.refData);
      const numericValue = nozzleRange ? extractNumericFromString(nozzleRange) : null;
      // Fall back to qualitative if no numeric
      return { name: m.name, value: numericValue || m.info?.properties.printability || null };
    }),
    false // Lower nozzle temp = easier to print
  );
  const strengthWinners = getWinners(
    selectedMaterialInfos.map(m => {
      const tensile = getTensileStrength(m.refData);
      const numericValue = tensile ? extractNumericFromString(tensile) : null;
      return { name: m.name, value: numericValue || m.info?.properties.strength || null };
    }),
    true
  );
  const flexibilityWinners = getWinners(
    selectedMaterialInfos.map(m => {
      const elongation = getElongation(m.refData);
      const numericValue = elongation ? extractNumericFromString(elongation) : null;
      return { name: m.name, value: numericValue || m.info?.properties.flexibility || null };
    }),
    true
  );
  const heatResistanceWinners = getWinners(
    selectedMaterialInfos.map(m => {
      const tg = getGlassTransition(m.refData);
      const numericValue = tg ? extractNumericFromString(tg) : null;
      return { name: m.name, value: numericValue || m.info?.properties.heatResistance || null };
    }),
    true
  );

  // Calculate weighted scores
  const weightedScores = useMemo(() => {
    const totalWeight = weights.printability + weights.strength + weights.flexibility + 
      weights.heatResistance + weights.chemicalResistance + weights.uvStability + weights.costEfficiency;
    if (totalWeight === 0) return [];

    return selectedMaterialInfos.map(m => {
      const printValue = getPropertyValue(m.info?.properties.printability || '');
      const strengthValue = getPropertyValue(m.info?.properties.strength || '');
      const flexValue = getPropertyValue(m.info?.properties.flexibility || '');
      const heatValue = getPropertyValue(m.info?.properties.heatResistance || '');
      const chemicalValue = getChemicalResistanceScore(m.refData);
      const uvValue = getUVStabilityScore(m.refData);
      const costValue = getCostEfficiencyScore(m.refData);

      const weightedScore = (
        (printValue * weights.printability) +
        (strengthValue * weights.strength) +
        (flexValue * weights.flexibility) +
        (heatValue * weights.heatResistance) +
        (chemicalValue * weights.chemicalResistance) +
        (uvValue * weights.uvStability) +
        (costValue * weights.costEfficiency)
      ) / totalWeight;

      // Convert to 0-100 scale (max possible is 5)
      const normalizedScore = Math.round((weightedScore / 5) * 100);

      return {
        name: m.name,
        score: normalizedScore,
        breakdown: {
          printability: printValue,
          strength: strengthValue,
          flexibility: flexValue,
          heatResistance: heatValue,
          chemicalResistance: chemicalValue,
          uvStability: uvValue,
          costEfficiency: costValue,
        }
      };
    }).sort((a, b) => b.score - a.score);
  }, [selectedMaterialInfos, weights]);

  const overallWinner = weightedScores[0]?.name;
  const updateWeight = (key: keyof typeof weights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const resetWeights = () => {
    setWeights({ 
      printability: 15, 
      strength: 15, 
      flexibility: 15, 
      heatResistance: 15,
      chemicalResistance: 15,
      uvStability: 15,
      costEfficiency: 10,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
      {/* Material Selector */}
      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Select Materials
            {selectedMaterials.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
                Clear All
              </Button>
            )}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Selected chips */}
          {selectedMaterials.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedMaterials.map(name => (
                <Badge key={name} variant="default" className="gap-1 pr-1">
                  {name}
                  <button 
                    onClick={() => removeMaterial(name)}
                    className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedMaterials).map(([category, materials]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {materials.map(({ name }) => (
                      <label
                        key={name}
                        className={cn(
                          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all",
                          selectedMaterials.includes(name)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedMaterials.includes(name)}
                          onCheckedChange={() => toggleMaterial(name)}
                          disabled={!selectedMaterials.includes(name) && selectedMaterials.length >= 5}
                          className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
                        />
                        <span className="text-sm text-foreground">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <div className="space-y-6">
        {selectedMaterialInfos.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Info className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No Materials Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select materials from the left panel to compare their properties.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Best in category</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500/20 ring-1 ring-amber-500/30" />
                <span>Winner highlight</span>
              </div>
            </div>

            {/* Summary Score Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <Collapsible open={weightsOpen} onOpenChange={setWeightsOpen}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Medal className="w-5 h-5 text-primary" />
                      Summary Score
                    </CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <SlidersHorizontal className="w-4 h-4" />
                        Customize Weights
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          weightsOpen && "rotate-180"
                        )} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Adjust criteria weights</span>
                        <Button variant="ghost" size="sm" onClick={resetWeights} className="h-7 text-xs">
                          Reset to Default
                        </Button>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              Printability
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.printability}%</span>
                          </div>
                          <Slider
                            value={[weights.printability]}
                            onValueChange={([v]) => updateWeight('printability', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-amber-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              Strength
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.strength}%</span>
                          </div>
                          <Slider
                            value={[weights.strength]}
                            onValueChange={([v]) => updateWeight('strength', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                              Flexibility
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.flexibility}%</span>
                          </div>
                          <Slider
                            value={[weights.flexibility]}
                            onValueChange={([v]) => updateWeight('flexibility', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-purple-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Thermometer className="w-3.5 h-3.5 text-red-400" />
                              Heat Resistance
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.heatResistance}%</span>
                          </div>
                          <Slider
                            value={[weights.heatResistance]}
                            onValueChange={([v]) => updateWeight('heatResistance', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Beaker className="w-3.5 h-3.5 text-cyan-400" />
                              Chemical Resistance
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.chemicalResistance}%</span>
                          </div>
                          <Slider
                            value={[weights.chemicalResistance]}
                            onValueChange={([v]) => updateWeight('chemicalResistance', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-cyan-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Sun className="w-3.5 h-3.5 text-yellow-400" />
                              UV Stability
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.uvStability}%</span>
                          </div>
                          <Slider
                            value={[weights.uvStability]}
                            onValueChange={([v]) => updateWeight('uvStability', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-yellow-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              Cost Efficiency
                            </label>
                            <span className="text-sm font-medium text-foreground w-8 text-right">{weights.costEfficiency}%</span>
                          </div>
                          <Slider
                            value={[weights.costEfficiency]}
                            onValueChange={([v]) => updateWeight('costEfficiency', v)}
                            max={100}
                            step={5}
                            className="[&_[role=slider]]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>

                <CardContent className={cn(weightsOpen ? "pt-0" : "pt-4")}>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${weightedScores.length}, minmax(0, 1fr))` }}>
                    {weightedScores.map((material, index) => (
                      <div 
                        key={material.name}
                        className={cn(
                          "relative rounded-lg p-4 text-center transition-all",
                          index === 0 
                            ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-2 ring-amber-500/50" 
                            : "bg-muted/50"
                        )}
                      >
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-amber-950 rounded-full p-1.5 shadow-lg">
                            <Award className="w-4 h-4" />
                          </div>
                        )}
                        {index === 1 && weightedScores.length > 2 && (
                          <div className="absolute -top-1.5 -right-1.5 bg-slate-400 text-slate-900 rounded-full p-1 shadow">
                            <Medal className="w-3 h-3" />
                          </div>
                        )}
                        {index === 2 && weightedScores.length > 3 && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-700 text-amber-100 rounded-full p-1 shadow">
                            <Medal className="w-3 h-3" />
                          </div>
                        )}
                        <div className={cn(
                          "text-3xl font-bold mb-1",
                          index === 0 ? "text-amber-500" : "text-foreground"
                        )}>
                          {material.score}
                        </div>
                        <div className={cn(
                          "text-sm font-medium mb-2",
                          index === 0 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {material.name}
                        </div>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <div className="flex justify-between">
                            <span>Print:</span>
                            <span className={weights.printability > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.printability}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strength:</span>
                            <span className={weights.strength > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.strength}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Flex:</span>
                            <span className={weights.flexibility > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.flexibility}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Heat:</span>
                            <span className={weights.heatResistance > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.heatResistance}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Chem:</span>
                            <span className={weights.chemicalResistance > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.chemicalResistance}/5
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>UV:</span>
                            <span className={weights.uvStability > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.uvStability}/5
                            </span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span>Cost:</span>
                            <span className={weights.costEfficiency > 0 ? "text-foreground" : "text-muted-foreground/50"}>
                              {material.breakdown.costEfficiency}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Collapsible>
            </Card>

            {/* Material Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
              {selectedMaterialInfos.map(({ name, info, category }) => (
                <Card key={name} className="relative">
                  <button
                    onClick={() => removeMaterial(name)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <CardContent className="pt-6 pb-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-foreground mb-1">{name}</h3>
                      {category && (
                        <Badge variant="secondary" className="text-xs mb-3">
                          {category.name}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {info?.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Properties Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Printability */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-foreground">Printability</span>
                    <span className="text-xs text-muted-foreground">(Easy = Best)</span>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info, refData }) => (
                      <div key={name} className="text-center">
                        {info && (
                          <PropertyBar 
                            level={info.properties.printability} 
                            color="bg-amber-500" 
                            isWinner={printabilityWinners.includes(name)}
                            numericValue={getNozzleTempRange(refData)}
                            numericUnit="°C nozzle"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Strength */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-foreground">Strength</span>
                    <span className="text-xs text-muted-foreground">(Higher = Better)</span>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info, refData }) => (
                      <div key={name} className="text-center">
                        {info && (
                          <PropertyBar 
                            level={info.properties.strength} 
                            color="bg-blue-500" 
                            isWinner={strengthWinners.includes(name)}
                            numericValue={getTensileStrength(refData)}
                            numericUnit=" MPa"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Flexibility */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-foreground">Flexibility</span>
                    <span className="text-xs text-muted-foreground">(More Flexible = Higher)</span>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info, refData }) => (
                      <div key={name} className="text-center">
                        {info && (
                          <PropertyBar 
                            level={info.properties.flexibility} 
                            color="bg-purple-500" 
                            isWinner={flexibilityWinners.includes(name)}
                            numericValue={getElongation(refData)}
                            numericUnit="% elong."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Heat Resistance */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-foreground">Heat Resistance</span>
                    <span className="text-xs text-muted-foreground">(Higher = Better)</span>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info, refData }) => (
                      <div key={name} className="text-center">
                        {info && (
                          <PropertyBar 
                            level={info.properties.heatResistance} 
                            color="bg-red-500" 
                            isWinner={heatResistanceWinners.includes(name)}
                            numericValue={getGlassTransition(refData)}
                            numericUnit="°C Tg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Technical Comparison */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        Advanced Technical Comparison
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform",
                        advancedOpen && "rotate-180"
                      )} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Mechanical Properties */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        Mechanical Properties
                      </h4>
                      <div className="space-y-1 divide-y divide-border/50">
                        <ComparisonRow
                          label="Tensile Strength"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => p.name.toLowerCase().includes('tensile strength'));
                            return prop?.value || null;
                          }}
                          unit=" MPa"
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Elongation at Break"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => p.name.toLowerCase().includes('elongation'));
                            return prop?.value || null;
                          }}
                          unit="%"
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Young's Modulus"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => p.name.toLowerCase().includes('modulus'));
                            return prop?.value || null;
                          }}
                          unit=" MPa"
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Impact Strength"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => p.name.toLowerCase().includes('impact'));
                            return prop?.value || null;
                          }}
                          higherIsBetter={true}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Thermal Properties */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Thermal Properties
                      </h4>
                      <div className="space-y-1 divide-y divide-border/50">
                        <ComparisonRow
                          label="Glass Transition (Tg)"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => 
                              p.name.toLowerCase().includes('glass transition') || p.name.toLowerCase().includes('tg')
                            );
                            return prop?.value || null;
                          }}
                          unit="°C"
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Heat Deflection (HDT)"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => 
                              p.name.toLowerCase().includes('heat deflection') || p.name.toLowerCase().includes('hdt')
                            );
                            return prop?.value || null;
                          }}
                          unit="°C"
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Density"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const prop = ref?.tdsProfile?.properties.find(p => p.name.toLowerCase().includes('density'));
                            return prop?.value || null;
                          }}
                          unit=" g/cm³"
                          higherIsBetter={false}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Print Settings */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Factory className="w-4 h-4 text-green-500" />
                        Print Settings
                      </h4>
                      <div className="space-y-1 divide-y divide-border/50">
                        <ComparisonRow
                          label="Nozzle Temperature"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const settings = ref?.printSettings?.nozzleTemp;
                            return settings ? `${settings.min}-${settings.max}` : null;
                          }}
                          unit="°C"
                          higherIsBetter={false}
                        />
                        <ComparisonRow
                          label="Bed Temperature"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const settings = ref?.printSettings?.bedTemp;
                            return settings ? `${settings.min}-${settings.max}` : null;
                          }}
                          unit="°C"
                          higherIsBetter={false}
                        />
                        <ComparisonRow
                          label="Enclosure Required"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.printSettings?.enclosure?.required ? 'Yes' : 'No'}
                          formatValue={(v) => v}
                          higherIsBetter={false}
                        />
                        <ComparisonRow
                          label="Drying Temperature"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.printSettings?.drying?.temp || null}
                          unit="°C"
                          higherIsBetter={false}
                        />
                        <ComparisonRow
                          label="Drying Duration"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.printSettings?.drying?.duration || null}
                          higherIsBetter={false}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Post-Processing */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Paintbrush className="w-4 h-4 text-purple-500" />
                        Post-Processing
                      </h4>
                      <div className="space-y-1 divide-y divide-border/50">
                        <ComparisonRow
                          label="Chemical Smoothing"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const best = ref?.postProcessing?.chemicalSmoothing?.[0];
                            return best?.effectiveness || null;
                          }}
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Paintability"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => {
                            const painting = ref?.postProcessing?.painting;
                            if (!painting) return null;
                            if (painting.toLowerCase().includes('excellent') || painting.toLowerCase().includes('easy')) return 'Easy';
                            if (painting.toLowerCase().includes('difficult') || painting.toLowerCase().includes('requires')) return 'Difficult';
                            return 'Good';
                          }}
                          higherIsBetter={true}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Safety */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Leaf className="w-4 h-4 text-emerald-500" />
                        Safety & Environment
                      </h4>
                      <div className="space-y-1 divide-y divide-border/50">
                        <ComparisonRow
                          label="Fume Level"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.safety?.fumes?.level || null}
                          higherIsBetter={false}
                        />
                        <ComparisonRow
                          label="Food Safety"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.safety?.foodSafety?.rating || null}
                          formatValue={(v) => {
                            if (!v) return null;
                            if (v.toLowerCase().includes('fda') || v.toLowerCase().includes('approved')) return 'FDA Approved';
                            if (v.toLowerCase().includes('not') || v.toLowerCase().includes('unsafe')) return 'Not Safe';
                            return v;
                          }}
                          higherIsBetter={true}
                        />
                        <ComparisonRow
                          label="Biodegradability"
                          materials={selectedMaterialInfos}
                          getValue={(ref) => ref?.safety?.biodegradability?.rating || null}
                          formatValue={(v) => {
                            if (!v) return null;
                            if (v.toLowerCase().includes('biodegradable') && !v.toLowerCase().includes('not')) return 'Biodegradable';
                            if (v.toLowerCase().includes('compostable')) return 'Compostable';
                            return 'Not Biodegradable';
                          }}
                          higherIsBetter={true}
                        />
                      </div>
                    </div>

                    {/* Bed Adhesion */}
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        Bed Adhesion Surfaces
                      </h4>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                        {selectedMaterialInfos.map(({ name, refData }) => (
                          <div key={name} className="space-y-2">
                            <h5 className="text-xs font-medium text-center text-foreground">{name}</h5>
                            {refData?.adhesion?.bedSurfaces?.excellent && (
                              <div>
                                <span className="text-xs text-emerald-600 font-medium">Excellent:</span>
                                <p className="text-xs text-muted-foreground">
                                  {refData.adhesion.bedSurfaces.excellent.slice(0, 3).join(', ')}
                                </p>
                              </div>
                            )}
                            {refData?.adhesion?.bedSurfaces?.good && (
                              <div>
                                <span className="text-xs text-amber-600 font-medium">Good:</span>
                                <p className="text-xs text-muted-foreground">
                                  {refData.adhesion.bedSurfaces.good.slice(0, 3).join(', ')}
                                </p>
                              </div>
                            )}
                            {refData?.adhesion?.bedSurfaces?.poor && (
                              <div>
                                <span className="text-xs text-red-500 font-medium">Poor:</span>
                                <p className="text-xs text-muted-foreground">
                                  {refData.adhesion.bedSurfaces.poor.slice(0, 2).join(', ')}
                                </p>
                              </div>
                            )}
                            {!refData?.adhesion?.bedSurfaces && (
                              <p className="text-xs text-muted-foreground text-center">No data</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Best Use Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                  {selectedMaterialInfos.map(({ name, info }) => (
                    <div key={name} className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground text-center mb-3">{name}</h4>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {info?.useCases.map((useCase, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Requirements & Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                  {selectedMaterialInfos.map(({ name, info }) => (
                    <div key={name} className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground text-center mb-3">{name}</h4>
                      {info?.requirements && info.requirements.length > 0 ? (
                        <ul className="space-y-1.5">
                          {info.requirements.map((req, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center">
                          No special requirements
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

const MaterialCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "reference";
  const selectedMaterialParam = searchParams.get("material") || null;

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set("tab", value);
      return next;
    });
  };

  const handleMaterialSelect = (material: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (material) {
        next.set("material", material);
      } else {
        next.delete("material");
      }
      return next;
    });
  };

  const clearMaterial = () => {
    handleMaterialSelect(null);
  };

  return (
    <>
      <Helmet>
        <title>Material Knowledge Base — Filament Reference & Comparison | FilaScope</title>
        <meta name="description" content="Compare 3D printing material properties side by side. Explore strength, flexibility, temperature resistance, and printability across PLA, PETG, ABS, TPU, and more." />
      </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
          <Link
            to="/learn"
            className="text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Learn
          </Link>
          <span className="text-slate-600">/</span>
          {selectedMaterialParam ? (
            <>
              <button
                onClick={clearMaterial}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Material Knowledge Base
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-foreground font-medium">{selectedMaterialParam}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">Material Knowledge Base</span>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Materials</h1>
          <p className="text-muted-foreground">
            Compare materials side-by-side or explore comprehensive reference information.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 border-b border-border/50">
            <TabsTrigger value="reference" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reference
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Material Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <ComparisonContent />
          </TabsContent>

          <TabsContent value="reference">
            <MaterialReference onMaterialSelect={handleMaterialSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default MaterialCompare;
