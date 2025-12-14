import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { specialtyTools, categoryLabels, pricingLabels, SpecialtyTool } from "@/lib/specialtyData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, ExternalLink, X, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench } from "lucide-react";

type SortField = 'name' | 'easeOfUse' | 'featureDepth' | 'valueForMoney' | 'communitySupport' | 'printFocus';
type SortDirection = 'asc' | 'desc';

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

const RatingDot = ({ rating }: { rating: number }) => {
  const getColor = (r: number) => {
    if (r >= 4) return 'bg-green-500';
    if (r >= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className={`w-3 h-3 rounded-full ${getColor(rating)}`} />
      <span className="text-sm text-muted-foreground">{rating}/5</span>
    </div>
  );
};

const SortHeader = ({ 
  label, 
  field, 
  currentSort, 
  currentDirection, 
  onSort 
}: { 
  label: string; 
  field: SortField; 
  currentSort: SortField; 
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) => (
  <TableHead 
    className="cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      {currentSort === field && (
        currentDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </div>
  </TableHead>
);

export default function ReferenceSpecialty() {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setPricingFilter('all');
  };

  const hasActiveFilters = categoryFilter !== 'all' || pricingFilter !== 'all';

  const filteredAndSortedTools = useMemo(() => {
    let filtered = [...specialtyTools];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (pricingFilter !== 'all') {
      filtered = filtered.filter(t => t.pricingModel === pricingFilter);
    }

    return filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'easeOfUse':
          aVal = a.ratings.easeOfUse;
          bVal = b.ratings.easeOfUse;
          break;
        case 'featureDepth':
          aVal = a.ratings.featureDepth;
          bVal = b.ratings.featureDepth;
          break;
        case 'valueForMoney':
          aVal = a.ratings.valueForMoney;
          bVal = b.ratings.valueForMoney;
          break;
        case 'communitySupport':
          aVal = a.ratings.communitySupport;
          bVal = b.ratings.communitySupport;
          break;
        case 'printFocus':
          aVal = a.ratings.printFocus;
          bVal = b.ratings.printFocus;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [sortField, sortDirection, categoryFilter, pricingFilter]);

  const categories = Object.entries(categoryLabels);
  const pricingModels = Object.entries(pricingLabels);

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Specialty Tools & Sites</h1>
          <p className="text-muted-foreground">
            Essential utilities, platforms, and resources for advanced 3D printing workflows.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={pricingFilter} onValueChange={setPricingFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pricing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pricing</SelectItem>
              {pricingModels.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}

          <span className="text-sm text-muted-foreground ml-auto">
            Showing {filteredAndSortedTools.length} of {specialtyTools.length} tools
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium">Rating Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Excellent (4-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Average (3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Limited (1-2)</span>
          </div>
        </div>

        {/* Comparison Matrix */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Comparison Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader label="Tool" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <SortHeader label="Ease of Use" field="easeOfUse" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortHeader label="Features" field="featureDepth" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortHeader label="Value" field="valueForMoney" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortHeader label="Community" field="communitySupport" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortHeader label="Print Focus" field="printFocus" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          {getCategoryIcon(tool.category)}
                          {categoryLabels[tool.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pricingLabels[tool.pricingModel]}</Badge>
                      </TableCell>
                      <TableCell><RatingDot rating={tool.ratings.easeOfUse} /></TableCell>
                      <TableCell><RatingDot rating={tool.ratings.featureDepth} /></TableCell>
                      <TableCell><RatingDot rating={tool.ratings.valueForMoney} /></TableCell>
                      <TableCell><RatingDot rating={tool.ratings.communitySupport} /></TableCell>
                      <TableCell><RatingDot rating={tool.ratings.printFocus} /></TableCell>
                      <TableCell>
                        <a 
                          href={tool.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredAndSortedTools.map((tool) => (
                <AccordionItem key={tool.id} value={tool.id}>
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
                        <p className="text-muted-foreground">{tool.competitivePosition}</p>
                      </div>

                      {/* Future Outlook */}
                      <div>
                        <h4 className="font-semibold mb-2">Future Outlook</h4>
                        <p className="text-muted-foreground">{tool.futureOutlook}</p>
                      </div>

                      {/* Visit Button */}
                      <div className="pt-4">
                        <Button asChild>
                          <a href={tool.website} target="_blank" rel="noopener noreferrer">
                            Visit {tool.name} <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
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
