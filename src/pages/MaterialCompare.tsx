import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, X, Thermometer, Shield, Zap, Layers, AlertTriangle, CheckCircle, Info, GitCompare, BookOpen } from "lucide-react";
import { 
  MATERIAL_CATEGORIES, 
  MATERIAL_INFO, 
  getMaterialInfo, 
  getMaterialCategory,
  type MaterialInfo 
} from "@/lib/materialHierarchy";
import { cn } from "@/lib/utils";
import MaterialReference from "@/components/MaterialReference";

const PropertyBar = ({ 
  level, 
  color 
}: { 
  level: 'Low' | 'Medium' | 'High' | 'Very High' | 'Easy' | 'Hard' | 'Expert' | 'Rigid' | 'Semi-Flexible' | 'Flexible' | 'Very Flexible';
  color: string;
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
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${getWidth()}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-20">{level}</span>
    </div>
  );
};

const ComparisonContent = () => {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Get all available materials with info
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
  })).filter(m => m.info);

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
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info }) => (
                      <div key={name} className="text-center">
                        {info && <PropertyBar level={info.properties.printability} color="bg-amber-500" />}
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
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info }) => (
                      <div key={name} className="text-center">
                        {info && <PropertyBar level={info.properties.strength} color="bg-blue-500" />}
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
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info }) => (
                      <div key={name} className="text-center">
                        {info && <PropertyBar level={info.properties.flexibility} color="bg-purple-500" />}
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
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedMaterialInfos.length}, minmax(0, 1fr))` }}>
                    {selectedMaterialInfos.map(({ name, info }) => (
                      <div key={name} className="text-center">
                        {info && <PropertyBar level={info.properties.heatResistance} color="bg-red-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

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
  const activeTab = searchParams.get("tab") || "comparison";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Finder
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Materials</h1>
          <p className="text-muted-foreground">
            Compare materials side-by-side or explore comprehensive reference information.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Material Comparison
            </TabsTrigger>
            <TabsTrigger value="reference" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <ComparisonContent />
          </TabsContent>

          <TabsContent value="reference">
            <MaterialReference />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaterialCompare;
