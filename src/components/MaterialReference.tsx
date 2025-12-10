import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  Beaker, 
  History, 
  FlaskConical, 
  GitBranch, 
  ThumbsUp, 
  ThumbsDown, 
  Factory, 
  Sparkles,
  ChevronRight,
  Info,
  Building2,
  Calendar,
  Users,
  Atom,
  Layers
} from "lucide-react";
import { MATERIAL_CATEGORIES, MATERIAL_INFO, getMaterialInfo } from "@/lib/materialHierarchy";
import { getMaterialReference, MATERIAL_REFERENCE_DATA, type MaterialReferenceInfo } from "@/lib/materialReferenceData";
import { cn } from "@/lib/utils";

const SectionCard = ({ 
  icon: Icon, 
  title, 
  children,
  iconColor = "text-primary"
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
  iconColor?: string;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon className={cn("w-4 h-4", iconColor)} />
      <h4 className="font-semibold text-foreground">{title}</h4>
    </div>
    <div className="text-sm text-muted-foreground space-y-2 pl-6">
      {children}
    </div>
  </div>
);

const InfoList = ({ items, icon: Icon }: { items?: string[]; icon?: React.ElementType }) => {
  if (!items || items.length === 0) return <span className="text-muted-foreground/60 italic">No data available</span>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          {Icon ? <Icon className="w-3 h-3 mt-1 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 mt-1 shrink-0 text-muted-foreground" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const MaterialDetailView = ({ reference, basicInfo }: { reference: MaterialReferenceInfo; basicInfo: any }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">{reference.fullName}</h2>
          <Badge variant="outline">{reference.name}</Badge>
        </div>
        {basicInfo?.description && (
          <p className="text-muted-foreground">{basicInfo.description}</p>
        )}
      </div>

      <Separator />

      {/* Origin & History */}
      <Accordion type="single" collapsible defaultValue="origin" className="space-y-2">
        <AccordionItem value="origin" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <span className="font-semibold">Origin & History</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">Year Invented</span>
                  <p className="text-sm font-medium">{reference.origin.yearInvented || "Unknown"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">Original Company</span>
                  <p className="text-sm font-medium">{reference.origin.originalCompany || "Unknown"}</p>
                </div>
              </div>
            </div>
            
            {reference.origin.keyMilestones && reference.origin.keyMilestones.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Key Milestones</h5>
                <div className="space-y-2 pl-2 border-l-2 border-muted">
                  {reference.origin.keyMilestones.map((milestone, i) => (
                    <p key={i} className="text-sm text-muted-foreground pl-3">{milestone}</p>
                  ))}
                </div>
              </div>
            )}

            {reference.origin.majorManufacturers && (
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Major Manufacturers
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {reference.origin.majorManufacturers.map((mfr, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{mfr}</Badge>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Chemical Composition */}
        <AccordionItem value="composition" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">Chemical Composition</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Atom className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">Base Polymer</span>
                  <p className="text-sm font-medium">{reference.composition.basePolymer}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FlaskConical className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">Chemical Family</span>
                  <p className="text-sm font-medium">{reference.composition.chemicalFamily}</p>
                </div>
              </div>
            </div>

            {reference.composition.keyAdditives && (
              <div>
                <h5 className="text-sm font-medium mb-2">Key Additives</h5>
                <InfoList items={reference.composition.keyAdditives} />
              </div>
            )}

            {reference.composition.specialFillers && reference.composition.specialFillers.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Special Fillers</h5>
                <div className="flex flex-wrap gap-1.5">
                  {reference.composition.specialFillers.map((filler, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{filler}</Badge>
                  ))}
                </div>
              </div>
            )}

            {reference.composition.coloringAgents && (
              <div>
                <h5 className="text-sm font-medium mb-2">Coloring Agents</h5>
                <p className="text-sm text-muted-foreground">{reference.composition.coloringAgents}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Material Family Context */}
        <AccordionItem value="family" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Material Family Context</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {reference.familyContext.parentPolymer && (
              <div>
                <h5 className="text-sm font-medium mb-1">Parent Polymer</h5>
                <p className="text-sm text-muted-foreground">{reference.familyContext.parentPolymer}</p>
              </div>
            )}

            {reference.familyContext.variants && (
              <div>
                <h5 className="text-sm font-medium mb-2">Variants</h5>
                <div className="flex flex-wrap gap-1.5">
                  {reference.familyContext.variants.map((variant, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{variant}</Badge>
                  ))}
                </div>
              </div>
            )}

            {reference.familyContext.chemicalComparison && (
              <div>
                <h5 className="text-sm font-medium mb-1">Chemical Comparison</h5>
                <p className="text-sm text-muted-foreground">{reference.familyContext.chemicalComparison}</p>
              </div>
            )}

            {reference.familyContext.evolution && (
              <div>
                <h5 className="text-sm font-medium mb-1">Evolution</h5>
                <p className="text-sm text-muted-foreground">{reference.familyContext.evolution}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Strengths */}
        <AccordionItem value="strengths" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Strengths</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {reference.strengths.uniqueProperties && (
              <div>
                <h5 className="text-sm font-medium mb-2">Unique Properties</h5>
                <InfoList items={reference.strengths.uniqueProperties} />
              </div>
            )}

            {reference.strengths.bestUseScenarios && (
              <div>
                <h5 className="text-sm font-medium mb-2">Best Use Scenarios</h5>
                <InfoList items={reference.strengths.bestUseScenarios} />
              </div>
            )}

            {reference.strengths.advantagesOverCompetitors && (
              <div>
                <h5 className="text-sm font-medium mb-2">Advantages Over Competitors</h5>
                <InfoList items={reference.strengths.advantagesOverCompetitors} />
              </div>
            )}

            {reference.strengths.whyChooseThis && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <h5 className="text-sm font-medium mb-1 text-green-600">Why Choose This?</h5>
                <p className="text-sm text-muted-foreground">{reference.strengths.whyChooseThis}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Weaknesses */}
        <AccordionItem value="weaknesses" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Weaknesses</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {reference.weaknesses.limitations && (
              <div>
                <h5 className="text-sm font-medium mb-2">Limitations</h5>
                <InfoList items={reference.weaknesses.limitations} />
              </div>
            )}

            {reference.weaknesses.commonProblems && (
              <div>
                <h5 className="text-sm font-medium mb-2">Common Problems</h5>
                <InfoList items={reference.weaknesses.commonProblems} />
              </div>
            )}

            {reference.weaknesses.environmentalConcerns && (
              <div>
                <h5 className="text-sm font-medium mb-2">Environmental Concerns</h5>
                <InfoList items={reference.weaknesses.environmentalConcerns} />
              </div>
            )}

            {reference.weaknesses.whenNotToUse && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <h5 className="text-sm font-medium mb-2 text-red-600">When NOT to Use</h5>
                <InfoList items={reference.weaknesses.whenNotToUse} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Practical Context */}
        <AccordionItem value="practical" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Practical Context</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Cost Position:</span>
              <Badge variant={
                reference.practicalContext.costPosition === 'Budget' ? 'secondary' :
                reference.practicalContext.costPosition === 'Standard' ? 'outline' :
                reference.practicalContext.costPosition === 'Premium' ? 'default' :
                'destructive'
              }>
                {reference.practicalContext.costPosition}
              </Badge>
            </div>

            {reference.practicalContext.industryAdoption && (
              <div>
                <h5 className="text-sm font-medium mb-2">Industry Adoption</h5>
                <div className="flex flex-wrap gap-1.5">
                  {reference.practicalContext.industryAdoption.map((industry, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{industry}</Badge>
                  ))}
                </div>
              </div>
            )}

            {reference.practicalContext.commonApplications && (
              <div>
                <h5 className="text-sm font-medium mb-2">Common Applications</h5>
                <InfoList items={reference.practicalContext.commonApplications} />
              </div>
            )}

            {reference.practicalContext.safetyStandards && (
              <div>
                <h5 className="text-sm font-medium mb-2">Safety Standards</h5>
                <InfoList items={reference.practicalContext.safetyStandards} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Trivia */}
        <AccordionItem value="trivia" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Trivia & Background</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            {reference.trivia.whyInvented && (
              <div>
                <h5 className="text-sm font-medium mb-1">Why It Was Invented</h5>
                <p className="text-sm text-muted-foreground">{reference.trivia.whyInvented}</p>
              </div>
            )}

            {reference.trivia.funFacts && (
              <div>
                <h5 className="text-sm font-medium mb-2">Fun Facts</h5>
                <InfoList items={reference.trivia.funFacts} />
              </div>
            )}

            {reference.trivia.controversies && (
              <div>
                <h5 className="text-sm font-medium mb-2">Controversies & Criticisms</h5>
                <InfoList items={reference.trivia.controversies} />
              </div>
            )}

            {reference.trivia.marketAdoption && (
              <div>
                <h5 className="text-sm font-medium mb-1">Market Adoption</h5>
                <p className="text-sm text-muted-foreground">{reference.trivia.marketAdoption}</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const MaterialReference = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Get all materials organized by category
  const allMaterials = useMemo(() => {
    const materials: { name: string; category: string; hasReference: boolean }[] = [];
    
    MATERIAL_CATEGORIES.forEach(category => {
      category.materials.forEach(materialName => {
        materials.push({
          name: materialName,
          category: category.name,
          hasReference: !!MATERIAL_REFERENCE_DATA[materialName],
        });
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

  const selectedReference = selectedMaterial ? getMaterialReference(selectedMaterial) : null;
  const selectedBasicInfo = selectedMaterial ? getMaterialInfo(selectedMaterial) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
      {/* Material List */}
      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Materials</CardTitle>
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
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedMaterials).map(([category, materials]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {category}
                  </h4>
                  <div className="space-y-1">
                    {materials.map(({ name, hasReference }) => (
                      <button
                        key={name}
                        onClick={() => setSelectedMaterial(name)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all text-left",
                          selectedMaterial === name
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <span className="text-sm text-foreground">{name}</span>
                        {hasReference ? (
                          <Badge variant="default" className="text-[10px] h-4 px-1.5">Reference</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 opacity-50">Basic</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Material Detail */}
      <div>
        {!selectedMaterial ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Select a Material</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a material from the list to view its complete reference information.
                </p>
              </div>
            </div>
          </Card>
        ) : selectedReference ? (
          <Card className="p-6">
            <MaterialDetailView reference={selectedReference} basicInfo={selectedBasicInfo} />
          </Card>
        ) : (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{selectedMaterial}</h2>
                <Badge variant="outline">Basic Info</Badge>
              </div>
              {selectedBasicInfo?.description && (
                <p className="text-muted-foreground">{selectedBasicInfo.description}</p>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-5 h-5" />
                  <span className="text-sm">
                    Detailed reference information is not yet available for this material. 
                    Basic properties and use cases are shown from the comparison database.
                  </span>
                </div>
              </div>

              {selectedBasicInfo && (
                <div className="space-y-4 mt-6">
                  <div>
                    <h4 className="font-semibold mb-2">Properties</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Printability:</span>{" "}
                        <span className="font-medium">{selectedBasicInfo.properties.printability}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Strength:</span>{" "}
                        <span className="font-medium">{selectedBasicInfo.properties.strength}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Flexibility:</span>{" "}
                        <span className="font-medium">{selectedBasicInfo.properties.flexibility}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Heat Resistance:</span>{" "}
                        <span className="font-medium">{selectedBasicInfo.properties.heatResistance}</span>
                      </div>
                    </div>
                  </div>

                  {selectedBasicInfo.useCases && (
                    <div>
                      <h4 className="font-semibold mb-2">Use Cases</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedBasicInfo.useCases.map((useCase, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{useCase}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBasicInfo.requirements && (
                    <div>
                      <h4 className="font-semibold mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {selectedBasicInfo.requirements.map((req, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MaterialReference;
