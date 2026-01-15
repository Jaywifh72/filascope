import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  brand_name: string;
  brand_slug: string;
  display_name: string;
}

interface Filament {
  id: string;
  product_title: string;
  material: string | null;
  use_case_tags: string[] | null;
  industry_tags: string[] | null;
  tds_url: string | null;
}

export function CompletionCheckPanel() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all brands
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["completion-check-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_brands")
        .select("id, brand_name, brand_slug, display_name")
        .eq("is_visible", true)
        .order("display_name");
      
      if (error) throw error;
      return data as Brand[];
    },
  });

  // Fetch filaments for selected brand
  const { data: filaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ["completion-check-filaments", selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      
      const brand = brands?.find(b => b.brand_slug === selectedBrand);
      if (!brand) return [];

      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, material, use_case_tags, industry_tags, tds_url")
        .ilike("vendor", brand.brand_name)
        .order("product_title");
      
      if (error) throw error;
      return data as Filament[];
    },
    enabled: !!selectedBrand && !!brands,
  });

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    if (!searchQuery.trim()) return brands;
    
    const query = searchQuery.toLowerCase();
    return brands.filter(b => 
      b.brand_name.toLowerCase().includes(query) ||
      b.display_name.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);

  // Calculate stats for selected brand
  const stats = useMemo(() => {
    if (!filaments) return null;
    
    const total = filaments.length;
    const withTds = filaments.filter(f => f.tds_url).length;
    const withMaterial = filaments.filter(f => f.material).length;
    const withTags = filaments.filter(f => 
      (f.use_case_tags && f.use_case_tags.length > 0) || 
      (f.industry_tags && f.industry_tags.length > 0)
    ).length;

    return {
      total,
      withTds,
      withMaterial,
      withTags,
      tdsPercent: total > 0 ? Math.round((withTds / total) * 100) : 0,
      materialPercent: total > 0 ? Math.round((withMaterial / total) * 100) : 0,
      tagsPercent: total > 0 ? Math.round((withTags / total) * 100) : 0,
    };
  }, [filaments]);

  const handleBrandToggle = (brandSlug: string) => {
    setSelectedBrand(prev => prev === brandSlug ? null : brandSlug);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <CardTitle>Completion Check</CardTitle>
        </div>
        <CardDescription>
          Select a brand to view its filament data completeness summary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brand Selection Panel */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[500px] border rounded-lg p-2">
              {brandsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand.brand_slug}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedBrand === brand.brand_slug 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleBrandToggle(brand.brand_slug)}
                    >
                      <Checkbox
                        checked={selectedBrand === brand.brand_slug}
                        onCheckedChange={() => handleBrandToggle(brand.brand_slug)}
                      />
                      <span className="text-sm font-medium">{brand.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Filament Summary Table */}
          <div className="lg:col-span-2 space-y-4">
            {selectedBrand ? (
              <>
                {/* Stats Summary */}
                {stats && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Filaments</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{stats.materialPercent}%</div>
                      <div className="text-xs text-muted-foreground">With Material</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{stats.tagsPercent}%</div>
                      <div className="text-xs text-muted-foreground">With Tags</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{stats.tdsPercent}%</div>
                      <div className="text-xs text-muted-foreground">With TDS</div>
                    </div>
                  </div>
                )}

                {/* Filaments Table */}
                <ScrollArea className="h-[440px] border rounded-lg">
                  {filamentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filaments && filaments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-background">Filament Name</TableHead>
                          <TableHead className="sticky top-0 bg-background">Material</TableHead>
                          <TableHead className="sticky top-0 bg-background">Tags</TableHead>
                          <TableHead className="sticky top-0 bg-background text-center">TDS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filaments.map((filament) => {
                          const allTags = [
                            ...(filament.use_case_tags || []),
                            ...(filament.industry_tags || [])
                          ];
                          
                          return (
                            <TableRow key={filament.id}>
                              <TableCell className="font-medium max-w-[250px] truncate">
                                {filament.product_title}
                              </TableCell>
                              <TableCell>
                                {filament.material ? (
                                  <Badge variant="secondary">{filament.material}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                {allTags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {allTags.slice(0, 3).map((tag, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {allTags.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{allTags.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {filament.tds_url ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      No filaments found for this brand
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex items-center justify-center h-[500px] border rounded-lg bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a brand to view filament details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
