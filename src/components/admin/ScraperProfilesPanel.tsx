import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Palette
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ScraperProfile {
  id: string;
  brand_slug: string;
  brand_id: string | null;
  product_structure: string;
  variant_schema: Record<string, string>;
  swatch_type: string;
  title_format_pattern: string | null;
  color_extraction_rules: string[];
  product_line_extraction_rules: string[];
  discovered_product_lines: string[];
  discovered_colors: Array<{ name: string; hex: string }>;
  color_hex_mappings: Record<string, string>;
  special_cases: string[];
  analysis_confidence: number;
  analysis_notes: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Brand {
  brand_slug: string;
  display_name: string;
  platform_type: string;
}

export function ScraperProfilesPanel() {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [analyzingBrand, setAnalyzingBrand] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['scraper-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_scraper_profiles')
        .select('*')
        .order('analysis_confidence', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(p => ({
        ...p,
        variant_schema: (p.variant_schema || {}) as Record<string, string>,
        color_extraction_rules: (p.color_extraction_rules || []) as string[],
        product_line_extraction_rules: (p.product_line_extraction_rules || []) as string[],
        discovered_product_lines: (p.discovered_product_lines || []) as string[],
        discovered_colors: (p.discovered_colors || []) as Array<{ name: string; hex: string }>,
        color_hex_mappings: (p.color_hex_mappings || {}) as Record<string, string>,
        special_cases: (p.special_cases || []) as string[],
      })) as ScraperProfile[];
    }
  });

  const { data: brands } = useQuery({
    queryKey: ['automated-brands-for-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('brand_slug, display_name, platform_type')
        .eq('scraping_enabled', true)
        .order('display_name');
      
      if (error) throw error;
      return data as Brand[];
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ brandSlug, forceRefresh }: { brandSlug: string; forceRefresh: boolean }) => {
      setAnalyzingBrand(brandSlug);
      const { data, error } = await supabase.functions.invoke('analyze-brand-website', {
        body: { brandSlug, forceRefresh }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Brand analyzed successfully');
      queryClient.invalidateQueries({ queryKey: ['scraper-profiles'] });
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
    onSettled: () => {
      setAnalyzingBrand(null);
    }
  });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedProfiles(newExpanded);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className="bg-green-500">High ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge variant="destructive">Low ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  const brandsWithoutProfiles = brands?.filter(
    b => !profiles?.some(p => p.brand_slug === b.brand_slug)
  ) || [];

  if (profilesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading scraper profiles...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Scraper Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-generated profiles that inform the scraper how to extract data from each brand's website.
            The AI analyzes product structure, variant schema, color swatches, and more.
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{profiles?.length || 0} profiles</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>{brandsWithoutProfiles.length} brands need analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Without Profiles */}
      {brandsWithoutProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Brands Needing Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {brandsWithoutProfiles.map(brand => (
                  <Button
                    key={brand.brand_slug}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left"
                    disabled={analyzingBrand === brand.brand_slug}
                    onClick={() => analyzeMutation.mutate({ brandSlug: brand.brand_slug, forceRefresh: false })}
                  >
                    {analyzingBrand === brand.brand_slug ? (
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-3 w-3 mr-2" />
                    )}
                    <span className="truncate">{brand.display_name}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Existing Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing Profiles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {profiles?.map(profile => (
                <Collapsible
                  key={profile.id}
                  open={expandedProfiles.has(profile.id)}
                  onOpenChange={() => toggleExpand(profile.id)}
                >
                  <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedProfiles.has(profile.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{profile.brand_slug}</span>
                        {getConfidenceBadge(profile.analysis_confidence)}
                        <Badge variant="outline">{profile.product_structure}</Badge>
                        <Badge variant="outline">{profile.swatch_type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {profile.last_analyzed_at 
                          ? formatDistanceToNow(new Date(profile.last_analyzed_at), { addSuffix: true })
                          : 'Never'
                        }
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-4 bg-muted/30">
                      {/* Variant Schema */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Variant Schema</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {Object.entries(profile.variant_schema || {}).map(([key, value]) => (
                            <div key={key} className="bg-background p-2 rounded">
                              <span className="text-muted-foreground">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Extraction Rules */}
                      {profile.color_extraction_rules?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Color Extraction Rules</h4>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            {profile.color_extraction_rules.map((rule, i) => (
                              <li key={i} className="text-muted-foreground">{rule}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Discovered Product Lines */}
                      {profile.discovered_product_lines?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Discovered Product Lines</h4>
                          <div className="flex flex-wrap gap-1">
                            {profile.discovered_product_lines.map((line, i) => (
                              <Badge key={i} variant="secondary">{line}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Discovered Colors */}
                      {profile.discovered_colors?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Palette className="h-4 w-4" />
                            Discovered Colors ({profile.discovered_colors.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.discovered_colors.slice(0, 20).map((color, i) => (
                              <div 
                                key={i} 
                                className="flex items-center gap-1 text-xs bg-background px-2 py-1 rounded"
                              >
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                {color.name}
                              </div>
                            ))}
                            {profile.discovered_colors.length > 20 && (
                              <Badge variant="outline">+{profile.discovered_colors.length - 20} more</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Special Cases */}
                      {profile.special_cases?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            Special Cases
                          </h4>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            {profile.special_cases.map((note, i) => (
                              <li key={i} className="text-muted-foreground">{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Analysis Notes */}
                      {profile.analysis_notes && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Analysis Notes</h4>
                          <p className="text-sm text-muted-foreground">{profile.analysis_notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={analyzingBrand === profile.brand_slug}
                          onClick={() => analyzeMutation.mutate({ brandSlug: profile.brand_slug, forceRefresh: true })}
                        >
                          {analyzingBrand === profile.brand_slug ? (
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-2" />
                          )}
                          Re-analyze
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
