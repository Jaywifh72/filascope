import { useRef } from "react";
import { specialtyTools, categoryLabels, pricingLabels, SpecialtyTool } from "@/lib/specialtyData";
import { numericToRating, specialtyMetricTooltips } from "@/lib/platformData";
import RatingValue from "@/components/reference/repos/shared/RatingValue";
import SpecialtyToolsHeroSection from "@/components/reference/SpecialtyToolsHeroSection";
import EditorPicksSection from "@/components/reference/specialty/EditorPicksSection";
import MoreToolsSection from "@/components/reference/specialty/MoreToolsSection";
import CollapsibleComparisonTable from "@/components/reference/specialty/CollapsibleComparisonTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench } from "lucide-react";

const getCategoryIcon = (category: SpecialtyTool['category']) => {
  switch (category) {
    case 'ai-generation': return <Sparkles className="h-4 w-4" />;
    case 'filament-art': return <Palette className="h-4 w-4" />;
    case 'farm-management': return <Server className="h-4 w-4" />;
    case 'calibration': return <Ruler className="h-4 w-4" />;
    case 'cad': return <Box className="h-4 w-4" />;
    case 'repository': return <Database className="h-4 w-4" />;
    case 'remote-control': return <Wifi className="h-4 w-4" />;
    case 'mesh-tools': return <Wrench className="h-4 w-4" />;
    default: return null;
  }
};

export default function ReferenceSpecialty() {
  const comparisonRef = useRef<HTMLDivElement>(null);

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Helper to generate tool ID for navigation
  const getToolAnchorId = (toolId: string) => `tool-${toolId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <SpecialtyToolsHeroSection onScrollToComparison={scrollToComparison} />
      
      <main className="container mx-auto px-4 py-8" ref={comparisonRef}>
        {/* 2-Tier Card System */}
        <EditorPicksSection />
        <MoreToolsSection />
        
        {/* Collapsible Full Comparison Table */}
        <CollapsibleComparisonTable />

        {/* Detailed Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {specialtyTools.map((tool) => (
                <AccordionItem key={tool.id} value={tool.id} id={getToolAnchorId(tool.id)}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(tool.category)}
                        <span className="font-semibold">{tool.name}</span>
                      </div>
                      <Badge variant="secondary" className="hidden sm:inline-flex">
                        {categoryLabels[tool.category]}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-lg font-medium text-primary">{tool.tagline}</p>
                          <a 
                            href={tool.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            {tool.website} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {pricingLabels[tool.pricingModel]}
                        </Badge>
                      </div>

                      {/* Ratings Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-muted/20 rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Ease of Use</span>
                          <RatingValue rating={numericToRating(tool.ratings.easeOfUse)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.easeOfUse} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Features</span>
                          <RatingValue rating={numericToRating(tool.ratings.featureDepth)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.featureDepth} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Value</span>
                          <RatingValue rating={numericToRating(tool.ratings.valueForMoney)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.valueForMoney} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Community</span>
                          <RatingValue rating={numericToRating(tool.ratings.communitySupport)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.communitySupport} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Print Focus</span>
                          <RatingValue rating={numericToRating(tool.ratings.printFocus)} size="small" showTooltip tooltipContent={specialtyMetricTooltips.printFocus} />
                        </div>
                      </div>

                      {/* Overview */}
                      <div>
                        <h4 className="font-semibold mb-2">Overview</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{tool.overview}</p>
                      </div>

                      {/* Key Features */}
                      <div>
                        <h4 className="font-semibold mb-2">Key Features</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {tool.keyFeatures.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Pricing */}
                      <div>
                        <h4 className="font-semibold mb-2">Pricing Tiers</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {tool.pricing.map((tier, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-muted/20">
                              <div className="font-medium">{tier.tier}</div>
                              <div className="text-lg font-bold text-primary">{tier.price}</div>
                              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                {tier.features.map((f, i) => (
                                  <li key={i}>• {f}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div>
                        <h4 className="font-semibold mb-2">Technical Details</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{tool.technicalDetails}</p>
                      </div>

                      {/* Economic Model */}
                      <div>
                        <h4 className="font-semibold mb-2">Economic Model</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{tool.economicModel}</p>
                      </div>

                      {/* Competitive Position */}
                      <div>
                        <h4 className="font-semibold mb-2">Competitive Position</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{tool.competitivePosition}</p>
                      </div>

                      {/* Future Outlook */}
                      <div>
                        <h4 className="font-semibold mb-2">Future Outlook</h4>
                        <p className="text-muted-foreground whitespace-pre-line">{tool.futureOutlook}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
