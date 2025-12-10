import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Layers,
  FileSpreadsheet,
  Settings2,
  Link2,
  Paintbrush,
  Shield,
  Thermometer,
  Wind,
  Droplets,
  Leaf,
  Printer
} from "lucide-react";
import { MATERIAL_CATEGORIES, MATERIAL_INFO, getMaterialInfo } from "@/lib/materialHierarchy";
import { getMaterialReference, MATERIAL_REFERENCE_DATA, type MaterialReferenceInfo } from "@/lib/materialReferenceData";
import { printMaterialReference } from "@/components/MaterialReferencePrintable";
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
  const handlePrint = () => {
    printMaterialReference(reference);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{reference.fullName}</h2>
            <Badge variant="outline">{reference.name}</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Reference Sheet
          </Button>
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

        {/* Technical Data Sheet Profile */}
        {/* Technical Data Sheet Profile */}
        {reference.tdsProfile && (
          <AccordionItem value="tds" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
                <span className="font-semibold">Technical Data Sheet Profile</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {reference.tdsProfile.notes && (
                <p className="text-xs text-muted-foreground italic">{reference.tdsProfile.notes}</p>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Property</TableHead>
                      <TableHead className="w-[120px]">Value</TableHead>
                      <TableHead>Implications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reference.tdsProfile.properties.map((prop, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{prop.name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {prop.value} {prop.unit && <span className="text-muted-foreground">{prop.unit}</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{prop.implications}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Print Settings */}
        {reference.printSettings && (
          <AccordionItem value="printSettings" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold">Operational Rheology (Print Settings)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reference.printSettings.nozzleTemp && (
                  <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                    <Thermometer className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground">Nozzle Temperature</span>
                      <p className="text-sm font-mono font-medium">
                        {reference.printSettings.nozzleTemp.min}°C – {reference.printSettings.nozzleTemp.max}°C
                      </p>
                    </div>
                  </div>
                )}
                {reference.printSettings.bedTemp && (
                  <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                    <Thermometer className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground">Bed Temperature</span>
                      <p className="text-sm font-mono font-medium">
                        {reference.printSettings.bedTemp.min}°C – {reference.printSettings.bedTemp.max}°C
                        {reference.printSettings.bedTemp.optimal && <span className="text-muted-foreground ml-1">(optimal: {reference.printSettings.bedTemp.optimal}°C)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {reference.printSettings.coolingFan && (
                <div className="flex items-start gap-2">
                  <Wind className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Cooling Fan: {reference.printSettings.coolingFan.min}-{reference.printSettings.coolingFan.max}%</span>
                    {reference.printSettings.coolingFan.notes && (
                      <p className="text-sm text-muted-foreground">{reference.printSettings.coolingFan.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.printSettings.enclosure && (
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-[10px] font-bold",
                    reference.printSettings.enclosure.required ? "bg-amber-500 text-amber-950" : "bg-green-500 text-green-950"
                  )}>
                    {reference.printSettings.enclosure.required ? '!' : '✓'}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Enclosure: {reference.printSettings.enclosure.required ? 'Required' : 'Not Required'}</span>
                    {reference.printSettings.enclosure.notes && (
                      <p className="text-sm text-muted-foreground">{reference.printSettings.enclosure.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.printSettings.drying && (
                <div className="flex items-start gap-2">
                  <Droplets className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">
                      Drying: {reference.printSettings.drying.temp}°C for {reference.printSettings.drying.duration}
                    </span>
                    {reference.printSettings.drying.notes && (
                      <p className="text-sm text-muted-foreground">{reference.printSettings.drying.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.printSettings.additionalNotes && reference.printSettings.additionalNotes.length > 0 && (
                <div className="mt-2">
                  <InfoList items={reference.printSettings.additionalNotes} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Adhesion & Multi-Material Compatibility */}
        {reference.adhesion && (
          <AccordionItem value="adhesion" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-teal-500" />
                <span className="font-semibold">Adhesion & Multi-Material Compatibility</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {reference.adhesion.bedSurfaces && (
                <div>
                  <h5 className="text-sm font-medium mb-3">Bed Surface Compatibility</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reference.adhesion.bedSurfaces.excellent && reference.adhesion.bedSurfaces.excellent.length > 0 && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <span className="text-xs font-semibold text-green-600 uppercase">Excellent</span>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {reference.adhesion.bedSurfaces.excellent.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {reference.adhesion.bedSurfaces.good && reference.adhesion.bedSurfaces.good.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <span className="text-xs font-semibold text-amber-600 uppercase">Good</span>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {reference.adhesion.bedSurfaces.good.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {reference.adhesion.bedSurfaces.poor && reference.adhesion.bedSurfaces.poor.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <span className="text-xs font-semibold text-red-600 uppercase">Poor</span>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {reference.adhesion.bedSurfaces.poor.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reference.adhesion.releaseAgents && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Release Agents</h5>
                  <p className="text-sm text-muted-foreground">{reference.adhesion.releaseAgents}</p>
                </div>
              )}

              {reference.adhesion.multiMaterial && reference.adhesion.multiMaterial.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-3">Multi-Material Bonding</h5>
                  <div className="space-y-2">
                    {reference.adhesion.multiMaterial.map((mm, i) => (
                      <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                        <Badge 
                          variant={
                            mm.bondQuality === 'Strong Chemical Bond' ? 'default' :
                            mm.bondQuality === 'Mechanical Bond' ? 'secondary' :
                            mm.bondQuality === 'Weak Bond' ? 'outline' :
                            'destructive'
                          }
                          className="text-xs shrink-0"
                        >
                          {mm.material}
                        </Badge>
                        <div>
                          <span className={cn(
                            "text-sm font-medium",
                            mm.bondQuality === 'Strong Chemical Bond' && "text-green-600",
                            mm.bondQuality === 'No Bond' && "text-red-500"
                          )}>
                            {mm.bondQuality}
                          </span>
                          {mm.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">{mm.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Post-Processing */}
        {reference.postProcessing && (
          <AccordionItem value="postProcessing" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-pink-500" />
                <span className="font-semibold">Post-Processing</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {reference.postProcessing.chemicalSmoothing && reference.postProcessing.chemicalSmoothing.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Chemical Smoothing</h5>
                  <div className="space-y-2">
                    {reference.postProcessing.chemicalSmoothing.map((cs, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <Badge 
                          variant={
                            cs.effectiveness === 'Excellent' ? 'default' :
                            cs.effectiveness === 'Good' ? 'secondary' :
                            cs.effectiveness === 'Difficult' ? 'outline' :
                            'destructive'
                          }
                          className="text-xs shrink-0 min-w-[70px] justify-center"
                        >
                          {cs.effectiveness}
                        </Badge>
                        <div>
                          <span className="font-medium">{cs.method}</span>
                          {cs.notes && <span className="text-muted-foreground ml-1">- {cs.notes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reference.postProcessing.mechanical && reference.postProcessing.mechanical.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Mechanical Processing</h5>
                  <InfoList items={reference.postProcessing.mechanical} />
                </div>
              )}

              {reference.postProcessing.glues && reference.postProcessing.glues.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Glues & Bonding</h5>
                  <InfoList items={reference.postProcessing.glues} />
                </div>
              )}

              {reference.postProcessing.painting && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Painting</h5>
                  <p className="text-sm text-muted-foreground">{reference.postProcessing.painting}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Safety & Sustainability */}
        {reference.safety && (
          <AccordionItem value="safety" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold">Safety & Sustainability</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {reference.safety.fumes && (
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                  <Wind className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Fumes (VOCs):</span>
                      <Badge variant={
                        reference.safety.fumes.level === 'Very Low' || reference.safety.fumes.level === 'Low' ? 'default' :
                        reference.safety.fumes.level === 'Moderate' ? 'secondary' :
                        'destructive'
                      } className="text-xs">
                        {reference.safety.fumes.level}
                      </Badge>
                    </div>
                    {reference.safety.fumes.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{reference.safety.fumes.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.safety.foodSafety && (
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                  <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Food Safety:</span>
                      <Badge variant="outline" className="text-xs">
                        {reference.safety.foodSafety.rating}
                      </Badge>
                    </div>
                    {reference.safety.foodSafety.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{reference.safety.foodSafety.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.safety.biodegradability && (
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                  <Leaf className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Biodegradability:</span>
                      <Badge variant="outline" className="text-xs">
                        {reference.safety.biodegradability.rating}
                      </Badge>
                    </div>
                    {reference.safety.biodegradability.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{reference.safety.biodegradability.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {reference.safety.additionalNotes && reference.safety.additionalNotes.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium mb-2">Additional Notes</h5>
                  <InfoList items={reference.safety.additionalNotes} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Trivia & Background - Always Last */}
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
