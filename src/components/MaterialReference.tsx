import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
  ChevronDown,
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
  Printer,
  BookOpen,
  FileQuestion,
  Filter,
  ChevronsUpDown,
  ArrowRight
} from "lucide-react";
import { MATERIAL_CATEGORIES, MATERIAL_INFO, getMaterialInfo } from "@/lib/materialHierarchy";
import { getMaterialReference, MATERIAL_REFERENCE_DATA, type MaterialReferenceInfo } from "@/lib/materialReferenceData";
import { printMaterialReference } from "@/components/MaterialReferencePrintable";
import { MaterialReferenceEmptyState } from "@/components/compare/MaterialReferenceEmptyState";
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

const QuickInfoCard = ({ 
  icon: Icon, 
  label, 
  iconColor = "text-primary" 
}: { 
  icon: React.ElementType; 
  label: string; 
  iconColor?: string;
}) => {
  // Split label into prefix and value for temperature chips (e.g., "Print: 190-220°C")
  const colonIndex = label.indexOf(':');
  const hasValue = colonIndex !== -1;
  const labelPrefix = hasValue ? label.slice(0, colonIndex + 1) : label;
  const labelValue = hasValue ? label.slice(colonIndex + 1) : '';

  return (
    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
      <Icon className={cn("w-4 h-4 shrink-0", iconColor)} />
      <span className="text-sm">
        <span className="text-muted-foreground">{labelPrefix}</span>
        {labelValue && <span className="text-primary font-semibold">{labelValue}</span>}
      </span>
    </div>
  );
};

const AccordionSection = ({ 
  icon: Icon, 
  title, 
  value, 
  iconColor = "text-primary",
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  value: string;
  iconColor?: string;
  children: React.ReactNode;
}) => (
  <AccordionItem 
    value={value} 
    className="border border-gray-700 rounded-lg px-4 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800/80 data-[state=open]:border-primary/30 transition-all duration-200"
  >
    <AccordionTrigger className="hover:no-underline hover:bg-gray-800/30 -mx-4 px-4 rounded-lg transition-colors duration-150 group py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 shrink-0">
          <Icon className={cn("w-4 h-4 transition-colors duration-150", iconColor)} />
        </div>
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>
    </AccordionTrigger>
    <AccordionContent className="pt-4 pb-4 space-y-4 animate-accordion-down">
      {children}
    </AccordionContent>
  </AccordionItem>
);

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mt-8 mb-3">
    <div className="w-1 h-4 rounded-full bg-cyan-500/50 shrink-0" />
    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <div className="flex-1 border-b border-slate-800/50" />
  </div>
);

const MaterialDetailView = ({ reference, basicInfo }: { reference: MaterialReferenceInfo; basicInfo: any }) => {
  const QUICK_START_SECTIONS = ["printSettings", "strengths", "weaknesses"];
  const TECHNICAL_SECTIONS = ["tds", "adhesion"];
  const CONTEXT_SECTIONS = ["practical", "family", "origin", "composition"];
  const OTHER_SECTIONS = ["postProcessing", "safety", "trivia"];
  const ALL_SECTION_VALUES = [...QUICK_START_SECTIONS, ...TECHNICAL_SECTIONS, ...CONTEXT_SECTIONS, ...OTHER_SECTIONS];

  const [openSections, setOpenSections] = useState<string[]>(["printSettings"]);

  const allExpanded = openSections.length >= ALL_SECTION_VALUES.length / 2;

  const toggleAll = () => {
    setOpenSections(allExpanded ? [] : [...ALL_SECTION_VALUES]);
  };

  const makeGroupHandler = (groupSections: string[]) => (newGroupValues: string[]) => {
    setOpenSections(prev => {
      const otherValues = prev.filter(v => !groupSections.includes(v));
      return [...otherValues, ...newGroupValues];
    });
  };

  const handlePrint = () => {
    printMaterialReference(reference);
  };

  // Determine quick info items based on material data
  const quickInfoItems = [];
  
  // Add beginner friendly if applicable (based on various signals)
  if (reference.strengths?.uniqueProperties?.some(p => 
    p.toLowerCase().includes('beginner') || 
    p.toLowerCase().includes('easy') ||
    p.toLowerCase().includes('forgiving')
  )) {
    quickInfoItems.push({ icon: ThumbsUp, label: "Beginner Friendly", color: "text-green-500" });
  }
  
  // Add print temp
  if (reference.printSettings?.nozzleTemp) {
    quickInfoItems.push({ 
      icon: Thermometer, 
      label: `Print: ${reference.printSettings.nozzleTemp.min}-${reference.printSettings.nozzleTemp.max}°C`, 
      color: "text-red-500" 
    });
  }
  
  // Add bed temp
  if (reference.printSettings?.bedTemp) {
    quickInfoItems.push({ 
      icon: Thermometer, 
      label: `Bed: ${reference.printSettings.bedTemp.min}-${reference.printSettings.bedTemp.max}°C`, 
      color: "text-orange-500" 
    });
  }
  
  // Add biodegradable if applicable
  if (reference.safety?.biodegradability?.rating?.toLowerCase().includes('yes') ||
      reference.safety?.biodegradability?.rating?.toLowerCase().includes('biodegradable')) {
    quickInfoItems.push({ icon: Leaf, label: "Biodegradable", color: "text-green-500" });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">{reference.fullName}</h2>
            <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
              {reference.name}
            </Badge>
          </div>
          {basicInfo?.description && (
            <p className="text-muted-foreground">{basicInfo.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            title="Download a printable one-page reference card for this material"
            className="gap-2 border-gray-600 border-l-2 border-l-primary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/40 shrink-0"
          >
            <Printer className="w-4 h-4" />
            Print Reference Sheet
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      {quickInfoItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickInfoItems.map((item, idx) => (
            <QuickInfoCard key={idx} icon={item.icon} label={item.label} iconColor={item.color} />
          ))}
        </div>
      )}

      {/* Browse Filaments CTA */}
      <Link
        to={`/?material=${encodeURIComponent(reference.name)}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-lg px-4 py-2 transition-all duration-150 mt-4"
      >
        Browse {reference.name} Filaments
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      <div className="my-6 border-t border-border/30" />

      {/* QUICK START Section */}
      <SectionDivider label="Quick Start" />

      <Accordion type="multiple" value={openSections} onValueChange={makeGroupHandler(QUICK_START_SECTIONS)} className="space-y-3">
        {/* Print Settings */}
        {reference.printSettings && (
          <AccordionSection icon={Settings2} title="Print Settings" value="printSettings" iconColor="text-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reference.printSettings.nozzleTemp && (
                <div className="flex items-start gap-2 bg-gray-800/30 rounded-lg p-3">
                  <Thermometer className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground">Nozzle Temperature</span>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {reference.printSettings.nozzleTemp.min}°C – {reference.printSettings.nozzleTemp.max}°C
                    </p>
                  </div>
                </div>
              )}
              {reference.printSettings.bedTemp && (
                <div className="flex items-start gap-2 bg-gray-800/30 rounded-lg p-3">
                  <Thermometer className="w-4 h-4 text-orange-500 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground">Bed Temperature</span>
                    <p className="text-sm font-mono font-medium text-foreground">
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
                  <span className="text-sm font-medium text-foreground">Cooling Fan: {reference.printSettings.coolingFan.min}-{reference.printSettings.coolingFan.max}%</span>
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
                  <span className="text-sm font-medium text-foreground">Enclosure: {reference.printSettings.enclosure.required ? 'Required' : 'Not Required'}</span>
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
                  <span className="text-sm font-medium text-foreground">
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
          </AccordionSection>
        )}

        {/* Strengths */}
        <AccordionSection icon={ThumbsUp} title="Strengths" value="strengths" iconColor="text-green-500">
          {reference.strengths.uniqueProperties && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Unique Properties</h5>
              <InfoList items={reference.strengths.uniqueProperties} />
            </div>
          )}

          {reference.strengths.bestUseScenarios && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Best Use Scenarios</h5>
              <InfoList items={reference.strengths.bestUseScenarios} />
            </div>
          )}

          {reference.strengths.advantagesOverCompetitors && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Advantages Over Competitors</h5>
              <InfoList items={reference.strengths.advantagesOverCompetitors} />
            </div>
          )}

          {reference.strengths.whyChooseThis && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <h5 className="text-sm font-medium mb-1 text-green-500">Why Choose This?</h5>
              <p className="text-sm text-muted-foreground">{reference.strengths.whyChooseThis}</p>
            </div>
          )}
        </AccordionSection>

        {/* Weaknesses */}
        <AccordionSection icon={ThumbsDown} title="Weaknesses" value="weaknesses" iconColor="text-red-500">
          {reference.weaknesses.limitations && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Limitations</h5>
              <InfoList items={reference.weaknesses.limitations} />
            </div>
          )}

          {reference.weaknesses.commonProblems && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Common Problems</h5>
              <InfoList items={reference.weaknesses.commonProblems} />
            </div>
          )}

          {reference.weaknesses.environmentalConcerns && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Environmental Concerns</h5>
              <InfoList items={reference.weaknesses.environmentalConcerns} />
            </div>
          )}

          {reference.weaknesses.whenNotToUse && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 text-red-500">When NOT to Use</h5>
              <InfoList items={reference.weaknesses.whenNotToUse} />
            </div>
          )}
        </AccordionSection>
      </Accordion>

      {/* TECHNICAL Section */}
      <SectionDivider label="Technical" />

      <Accordion type="multiple" value={openSections} onValueChange={makeGroupHandler(TECHNICAL_SECTIONS)} className="space-y-3">
        {/* Technical Data Sheet Profile */}
        {reference.tdsProfile && (
          <AccordionSection icon={FileSpreadsheet} title="Technical Data Sheet Profile" value="tds" iconColor="text-cyan-500">
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
                      <TableCell className="font-medium text-foreground">{prop.name}</TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {prop.value} {prop.unit && <span className="text-muted-foreground">{prop.unit}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{prop.implications}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionSection>
        )}

        {/* Adhesion & Multi-Material Compatibility */}
        {reference.adhesion && (
          <AccordionSection icon={Link2} title="Adhesion & Multi-Material Compatibility" value="adhesion" iconColor="text-primary">
            {reference.adhesion.bedSurfaces && (
              <div>
                <h5 className="text-sm font-medium mb-3 text-foreground">Bed Surface Compatibility</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {reference.adhesion.bedSurfaces.excellent && reference.adhesion.bedSurfaces.excellent.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <span className="text-xs font-semibold text-green-500 uppercase">Excellent</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {reference.adhesion.bedSurfaces.excellent.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-green-500/30 text-green-500">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {reference.adhesion.bedSurfaces.good && reference.adhesion.bedSurfaces.good.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <span className="text-xs font-semibold text-amber-500 uppercase">Good</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {reference.adhesion.bedSurfaces.good.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-500">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {reference.adhesion.bedSurfaces.poor && reference.adhesion.bedSurfaces.poor.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <span className="text-xs font-semibold text-red-500 uppercase">Poor</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {reference.adhesion.bedSurfaces.poor.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-500">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reference.adhesion.releaseAgents && (
              <div>
                <h5 className="text-sm font-medium mb-1 text-foreground">Release Agents</h5>
                <p className="text-sm text-muted-foreground">{reference.adhesion.releaseAgents}</p>
              </div>
            )}

            {reference.adhesion.multiMaterial && reference.adhesion.multiMaterial.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-3 text-foreground">Multi-Material Bonding</h5>
                <div className="space-y-2">
                  {reference.adhesion.multiMaterial.map((mm, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3">
                      <Badge 
                        variant="outline"
                        className="text-xs shrink-0 border-primary/30 text-primary"
                      >
                        {mm.material}
                      </Badge>
                      <div>
                        <span className={cn(
                          "text-sm font-medium",
                          mm.bondQuality === 'Strong Chemical Bond' && "text-green-500",
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
          </AccordionSection>
        )}
      </Accordion>

      {/* CONTEXT Section */}
      <SectionDivider label="Context" />

      <Accordion type="multiple" value={openSections} onValueChange={makeGroupHandler(CONTEXT_SECTIONS)} className="space-y-3">
        {/* Practical Context */}
        <AccordionSection icon={Factory} title="Practical Context" value="practical" iconColor="text-orange-500">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Cost Position:</span>
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
              <h5 className="text-sm font-medium mb-2 text-foreground">Industry Adoption</h5>
              <div className="flex flex-wrap gap-1.5">
                {reference.practicalContext.industryAdoption.map((industry, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">{industry}</Badge>
                ))}
              </div>
            </div>
          )}

          {reference.practicalContext.commonApplications && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Common Applications</h5>
              <InfoList items={reference.practicalContext.commonApplications} />
            </div>
          )}

          {reference.practicalContext.safetyStandards && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Safety Standards</h5>
              <InfoList items={reference.practicalContext.safetyStandards} />
            </div>
          )}

          <Link
            to={`/?material=${encodeURIComponent(reference.name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
          >
            Shop {reference.name} filaments
            <ArrowRight className="w-3 h-3" />
          </Link>
        </AccordionSection>

        {/* Material Family Context */}
        <AccordionSection icon={GitBranch} title="Material Family Context" value="family" iconColor="text-purple-500">
          {reference.familyContext.parentPolymer && (
            <div>
              <h5 className="text-sm font-medium mb-1 text-foreground">Parent Polymer</h5>
              <p className="text-sm text-muted-foreground">{reference.familyContext.parentPolymer}</p>
            </div>
          )}

          {reference.familyContext.variants && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Variants</h5>
              <div className="flex flex-wrap gap-1.5">
                {reference.familyContext.variants.map((variant, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">{variant}</Badge>
                ))}
              </div>
            </div>
          )}

          {reference.familyContext.chemicalComparison && (
            <div>
              <h5 className="text-sm font-medium mb-1 text-foreground">Chemical Comparison</h5>
              <p className="text-sm text-muted-foreground">{reference.familyContext.chemicalComparison}</p>
            </div>
          )}

          {reference.familyContext.evolution && (
            <div>
              <h5 className="text-sm font-medium mb-1 text-foreground">Evolution</h5>
              <p className="text-sm text-muted-foreground">{reference.familyContext.evolution}</p>
            </div>
          )}
        </AccordionSection>

        {/* Origin & History */}
        <AccordionSection icon={History} title="Origin & History" value="origin" iconColor="text-amber-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Year Invented</span>
                <p className="text-sm font-medium text-foreground">{reference.origin.yearInvented || "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Original Company</span>
                <p className="text-sm font-medium text-foreground">{reference.origin.originalCompany || "Unknown"}</p>
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
                  <a key={i} href="/brands" title="View brand">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary cursor-pointer hover:bg-primary/20 hover:scale-105 hover:shadow-sm transition-all duration-150">{mfr}</Badge>
                  </a>
                ))}
              </div>
            </div>
          )}
        </AccordionSection>

        {/* Chemical Composition */}
        <AccordionSection icon={Beaker} title="Chemical Composition" value="composition" iconColor="text-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Atom className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Base Polymer</span>
                <p className="text-sm font-medium text-foreground">{reference.composition.basePolymer}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FlaskConical className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Chemical Family</span>
                <p className="text-sm font-medium text-foreground">{reference.composition.chemicalFamily}</p>
              </div>
            </div>
          </div>

          {reference.composition.keyAdditives && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Key Additives</h5>
              <InfoList items={reference.composition.keyAdditives} />
            </div>
          )}

          {reference.composition.specialFillers && reference.composition.specialFillers.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Special Fillers</h5>
              <div className="flex flex-wrap gap-1.5">
                {reference.composition.specialFillers.map((filler, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">{filler}</Badge>
                ))}
              </div>
            </div>
          )}

          {reference.composition.coloringAgents && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Coloring Agents</h5>
              <p className="text-sm text-muted-foreground">{reference.composition.coloringAgents}</p>
            </div>
          )}
        </AccordionSection>
      </Accordion>

      {/* OTHER Section */}
      <SectionDivider label="Other" />

      <Accordion type="multiple" value={openSections} onValueChange={makeGroupHandler(OTHER_SECTIONS)} className="space-y-3">
        {/* Post-Processing */}
        {reference.postProcessing && (
          <AccordionSection icon={Paintbrush} title="Post-Processing" value="postProcessing" iconColor="text-pink-500">
            {reference.postProcessing.chemicalSmoothing && reference.postProcessing.chemicalSmoothing.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">Chemical Smoothing</h5>
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
                        <span className="font-medium text-foreground">{cs.method}</span>
                        {cs.notes && <span className="text-muted-foreground ml-1">- {cs.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reference.postProcessing.mechanical && reference.postProcessing.mechanical.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">Mechanical Processing</h5>
                <InfoList items={reference.postProcessing.mechanical} />
              </div>
            )}

            {reference.postProcessing.glues && reference.postProcessing.glues.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">Glues & Bonding</h5>
                <InfoList items={reference.postProcessing.glues} />
              </div>
            )}

            {reference.postProcessing.painting && (
              <div>
                <h5 className="text-sm font-medium mb-1 text-foreground">Painting</h5>
                <p className="text-sm text-muted-foreground">{reference.postProcessing.painting}</p>
              </div>
            )}
          </AccordionSection>
        )}

        {/* Safety & Sustainability */}
        {reference.safety && (
          <AccordionSection icon={Shield} title="Safety & Sustainability" value="safety" iconColor="text-emerald-500">
            {reference.safety.fumes && (
              <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3">
                <Wind className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Fumes (VOCs):</span>
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
              <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3">
                <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Food Safety:</span>
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
              <div className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3">
                <Leaf className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Biodegradability:</span>
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
                <h5 className="text-sm font-medium mb-2 text-foreground">Additional Notes</h5>
                <InfoList items={reference.safety.additionalNotes} />
              </div>
            )}
          </AccordionSection>
        )}

        {/* Trivia & Background - Always Last */}
        <AccordionSection icon={Sparkles} title="Trivia & Background" value="trivia" iconColor="text-yellow-500">
          {reference.trivia.whyInvented && (
            <div>
              <h5 className="text-sm font-medium mb-1 text-foreground">Why It Was Invented</h5>
              <p className="text-sm text-muted-foreground">{reference.trivia.whyInvented}</p>
            </div>
          )}

          {reference.trivia.funFacts && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Fun Facts</h5>
              <InfoList items={reference.trivia.funFacts} />
            </div>
          )}

          {reference.trivia.controversies && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-foreground">Controversies & Criticisms</h5>
              <InfoList items={reference.trivia.controversies} />
            </div>
          )}

          {reference.trivia.marketAdoption && (
            <div>
              <h5 className="text-sm font-medium mb-1 text-foreground">Market Adoption</h5>
              <p className="text-sm text-muted-foreground">{reference.trivia.marketAdoption}</p>
            </div>
          )}
        </AccordionSection>
      </Accordion>
    </div>
  );
};
// Canonical/parent materials that anchor each family
const BASE_MATERIALS = new Set([
  'PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'TPE', 'Nylon', 'PC',
  'PVA', 'HIPS', 'PP', 'POM', 'PEEK', 'PEI 1010', 'PEI 9085', 'PEKK',
  'PPS', 'PA6', 'PA12', 'PCTG', 'PEBA', 'PPA', 'TPC',
  'Pro PETG', 'Pro PCTG',
]);

const MaterialReference = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category);
  };

  const selectMaterialAndExpand = (materialName: string) => {
    setSelectedMaterial(materialName);
    // Find the category this material belongs to and expand it
    const entry = allMaterials.find(m => m.name === materialName);
    if (entry) {
      setExpandedCategory(entry.category);
    }
  };

  // Normalize material name to Title Case (e.g., "PLA-MARBLE" -> "PLA-Marble", "Pla silk" -> "PLA-Silk")
  const normalizeMaterialName = (name: string): string => {
    // First, normalize spaces and hyphens - replace spaces with hyphens for consistent formatting
    const normalized = name.replace(/\s+/g, '-');
    
    return normalized
      .split('-')
      .map((part, index) => {
        // Keep uppercase for acronyms at the start (PLA, PETG, ABS, etc.)
        if (index === 0 && part.toUpperCase() === part.toUpperCase() && part.length <= 5) {
          // Check if it looks like an acronym (all caps or known material base)
          const knownBases = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'TPE', 'PA', 'PC', 'PEEK', 'PEI', 'PP', 'PET', 'HIPS', 'PVA', 'HTPLA', 'PEBA', 'PCTG', 'PAHT', 'PPA', 'PEKK', 'PES', 'PSU', 'PPS', 'PPSU', 'CPE', 'POM', 'BIO', 'PHA', 'PCL', 'PVC', 'PMMA', 'HDPE', 'LW', 'ESD', 'FR', 'HT', 'HS', 'HP', 'CF', 'GF', 'AF'];
          if (knownBases.includes(part.toUpperCase())) {
            return part.toUpperCase();
          }
        }
        // Title case for other parts
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('-');
  };

  // Generate a deduplication key that treats spaces and hyphens as equivalent
  const getDedupeKey = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[\s-]+/g, '-') // Normalize all separators to hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special chars except hyphens
      .replace(/-+/g, '-'); // Collapse multiple hyphens
  };

  // Get all materials organized by category with case-insensitive deduplication
  const allMaterials = useMemo(() => {
    const seenNormalized = new Map<string, { name: string; normalizedName: string; category: string; hasReference: boolean; originalNames: string[] }>();
    
    MATERIAL_CATEGORIES.forEach(category => {
      category.materials.forEach(materialName => {
        const normalizedName = normalizeMaterialName(materialName);
        const key = getDedupeKey(materialName);
        const existing = seenNormalized.get(key);
        
        if (existing) {
          // Merge with existing entry - add to originalNames for database matching
          existing.originalNames.push(materialName);
          // Update hasReference if this variant has reference data
          if (MATERIAL_REFERENCE_DATA[materialName]) {
            existing.hasReference = true;
          }
        } else {
          // New unique material
          seenNormalized.set(key, {
            name: normalizedName,
            normalizedName,
            category: category.name,
            hasReference: !!getMaterialReference(materialName) || !!getMaterialReference(normalizedName),
            originalNames: [materialName],
          });
        }
      });
    });
    
    // Convert map to array and sort by category, then alphabetically within category
    const materials = Array.from(seenNormalized.values());
    materials.sort((a, b) => {
      // First sort by category order (based on MATERIAL_CATEGORIES order)
      const categoryOrder = MATERIAL_CATEGORIES.map(c => c.name);
      const aCatIndex = categoryOrder.indexOf(a.category);
      const bCatIndex = categoryOrder.indexOf(b.category);
      if (aCatIndex !== bCatIndex) return aCatIndex - bCatIndex;
      // Then sort alphabetically within category
      return a.name.localeCompare(b.name);
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

  // Look up material reference - try the selected name first, then try original variant names
  const selectedMaterialData = useMemo(() => {
    if (!selectedMaterial) return { reference: null, basicInfo: null };
    
    // Find the material entry to get original names
    const materialEntry = allMaterials.find(m => m.name === selectedMaterial);
    const namesToTry = materialEntry ? [selectedMaterial, ...materialEntry.originalNames] : [selectedMaterial];
    
    // Try each name until we find reference data
    let reference = null;
    let basicInfo = null;
    
    for (const name of namesToTry) {
      if (!reference) {
        reference = getMaterialReference(name);
      }
      if (!basicInfo) {
        basicInfo = getMaterialInfo(name);
      }
      if (reference && basicInfo) break;
    }
    
    return { reference, basicInfo };
  }, [selectedMaterial, allMaterials]);

  const selectedReference = selectedMaterialData.reference;
  const selectedBasicInfo = selectedMaterialData.basicInfo;

  const totalMaterials = allMaterials.length;
  const categoriesWithData = Object.keys(groupedMaterials).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Material List Panel */}
      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] bg-gray-800/30 border-r border-gray-700 rounded-lg overflow-hidden flex flex-col">
        {/* Panel Header */}
        <div className="px-4 py-4 border-b border-gray-700 bg-gray-900/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Materials</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="w-3 h-3 text-primary" />
              <span>{totalMaterials} types</span>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 focus:border-primary"
            />
          </div>
        </div>

        {/* Material List with independent scroll */}
        <ScrollArea className="flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600 scrollbar-track-slate-900">
          <div className="p-2">
            {Object.entries(groupedMaterials).map(([category, materials], categoryIndex) => {
              const isCollapsed = expandedCategory !== category;
              const categoryCount = materials.length;
              
              return (
                <div key={category} className={cn(categoryIndex > 0 && "border-t border-gray-700/50 mt-3 pt-3")}>
                  {/* Collapsible Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md transition-all duration-200 group border-l-2 cursor-pointer",
                      isCollapsed
                        ? "border-transparent hover:bg-slate-800/30"
                        : "bg-gray-800/50 border-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 transition-all duration-200",
                        isCollapsed
                          ? "text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 -rotate-90"
                          : "text-primary rotate-0"
                      )} />
                      <span className={cn(
                        "text-xs uppercase tracking-wide transition-colors duration-200",
                        isCollapsed
                          ? "font-normal text-gray-500 group-hover:text-foreground"
                          : "font-semibold text-foreground"
                      )}>
                        {category}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md transition-colors duration-200",
                      isCollapsed
                        ? "bg-primary/10 text-primary font-semibold"
                        : "bg-gray-700/50 text-gray-400"
                    )}>
                      {categoryCount}
                    </span>
                  </button>
                  
                  {/* Material Items */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-1">
                      {[...materials].sort((a, b) => {
                        const aBase = BASE_MATERIALS.has(a.name);
                        const bBase = BASE_MATERIALS.has(b.name);
                        if (aBase && !bBase) return -1;
                        if (!aBase && bBase) return 1;
                        return 0;
                      }).map(({ name, hasReference }) => {
                        const isBase = BASE_MATERIALS.has(name);
                        return (
                        <button
                          key={name}
                          ref={(el) => {
                            if (selectedMaterial === name && el) {
                              el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            }
                          }}
                          onClick={() => selectMaterialAndExpand(name)}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-md cursor-pointer transition-colors duration-150 text-left group/item",
                            selectedMaterial === name
                              ? "bg-primary/5 border-l-2 border-primary"
                              : "hover:bg-slate-800/50 border-l-2 border-transparent"
                          )}
                        >
                          <span className={cn(
                            "text-sm transition-colors duration-150 flex items-center gap-2",
                            selectedMaterial === name
                              ? "text-primary font-medium"
                              : isBase
                                ? "text-white font-medium group-hover/item:text-slate-100"
                                : "text-slate-400 group-hover/item:text-slate-200"
                          )}>
                            {isBase && selectedMaterial !== name && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            )}
                            {name}
                          </span>
                          <span title="Add to compare" aria-label="Add to compare" role="img" className="shrink-0 transition-all duration-150 cursor-pointer inline-flex">
                            {hasReference ? (
                              <BookOpen className={cn(
                                "w-3.5 h-3.5 transition-colors duration-150",
                                selectedMaterial === name
                                  ? "text-primary"
                                  : "text-slate-600 group-hover/item:text-cyan-400"
                              )} />
                            ) : (
                              <FileQuestion className={cn(
                                "w-3.5 h-3.5 transition-colors duration-150",
                                selectedMaterial === name
                                  ? "text-amber-500/60"
                                  : "text-slate-600 group-hover/item:text-amber-500/80"
                              )} />
                            )}
                          </span>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Material Detail Panel */}
      <div className="min-h-[400px] flex flex-col">
        {!selectedMaterial ? (
          <Card className="bg-gray-800/50 border-gray-700 flex-1 flex items-center justify-center">
            <MaterialReferenceEmptyState 
              onSelectMaterial={(material) => selectMaterialAndExpand(material)}
            />
          </Card>
        ) : selectedReference ? (
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <MaterialDetailView reference={selectedReference} basicInfo={selectedBasicInfo} />
          </Card>
        ) : (
          <Card className="p-6 bg-gray-800/50 border-gray-700">
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
