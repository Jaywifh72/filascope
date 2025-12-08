import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Search, ExternalLink, Check, X, Loader2, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

type Filament = {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  amazon_link_us: string | null;
  amazon_link_uk: string | null;
  amazon_link_de: string | null;
};

type Region = 'us' | 'uk' | 'de';

const REGION_CONFIG: Record<Region, { label: string; domain: string; flag: string }> = {
  us: { label: 'US', domain: 'amazon.com', flag: '🇺🇸' },
  uk: { label: 'UK', domain: 'amazon.co.uk', flag: '🇬🇧' },
  de: { label: 'DE', domain: 'amazon.de', flag: '🇩🇪' },
};

export default function AdminAmazonLinks() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(['us', 'uk', 'de']);
  const [showMissingOnly, setShowMissingOnly] = useState(true);
  const [editingLinks, setEditingLinks] = useState<Record<string, Record<Region, string>>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchFilaments();
    }
  }, [isAdmin]);

  const fetchFilaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("filaments")
      .select("id, product_title, vendor, material, amazon_link_us, amazon_link_uk, amazon_link_de")
      .order("vendor", { ascending: true })
      .order("product_title", { ascending: true });

    if (error) {
      toast.error("Failed to fetch filaments");
      console.error(error);
    } else {
      setFilaments(data || []);
    }
    setLoading(false);
  };

  const toggleRegion = (region: Region) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const generateSearchUrl = (filament: Filament, region: Region) => {
    const searchQuery = encodeURIComponent(`${filament.vendor || ''} ${filament.product_title} ${filament.material || ''} filament`.trim());
    const domain = REGION_CONFIG[region].domain;
    return `https://www.${domain}/s?k=${searchQuery}`;
  };

  const handleLinkChange = (filamentId: string, region: Region, value: string) => {
    setEditingLinks(prev => ({
      ...prev,
      [filamentId]: {
        ...prev[filamentId],
        [region]: value
      }
    }));
  };

  const getEditedLink = (filamentId: string, region: Region, original: string | null) => {
    return editingLinks[filamentId]?.[region] ?? original ?? '';
  };

  const hasChanges = (filament: Filament) => {
    const edited = editingLinks[filament.id];
    if (!edited) return false;
    
    return (
      (edited.us !== undefined && edited.us !== (filament.amazon_link_us || '')) ||
      (edited.uk !== undefined && edited.uk !== (filament.amazon_link_uk || '')) ||
      (edited.de !== undefined && edited.de !== (filament.amazon_link_de || ''))
    );
  };

  const saveLinks = async (filament: Filament) => {
    const edited = editingLinks[filament.id];
    if (!edited) return;

    setSavingIds(prev => new Set(prev).add(filament.id));

    const updates: Record<string, string | null> = {};
    if (edited.us !== undefined) updates.amazon_link_us = edited.us || null;
    if (edited.uk !== undefined) updates.amazon_link_uk = edited.uk || null;
    if (edited.de !== undefined) updates.amazon_link_de = edited.de || null;

    const { error } = await supabase
      .from("filaments")
      .update(updates)
      .eq("id", filament.id);

    if (error) {
      toast.error("Failed to save links");
      console.error(error);
    } else {
      toast.success("Links saved");
      setFilaments(prev => prev.map(f => 
        f.id === filament.id 
          ? { ...f, ...updates }
          : f
      ));
      setEditingLinks(prev => {
        const next = { ...prev };
        delete next[filament.id];
        return next;
      });
    }

    setSavingIds(prev => {
      const next = new Set(prev);
      next.delete(filament.id);
      return next;
    });
  };

  const filteredFilaments = filaments.filter(f => {
    const matchesSearch = !searchTerm || 
      f.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.material?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (showMissingOnly) {
      const hasMissingLink = selectedRegions.some(region => {
        const linkField = `amazon_link_${region}` as keyof Filament;
        return !f[linkField];
      });
      return hasMissingLink;
    }

    return true;
  });

  const stats = {
    total: filaments.length,
    missingUS: filaments.filter(f => !f.amazon_link_us).length,
    missingUK: filaments.filter(f => !f.amazon_link_uk).length,
    missingDE: filaments.filter(f => !f.amazon_link_de).length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Amazon Link Finder</h1>
            <p className="text-muted-foreground">Find and add Amazon links for filaments across regions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Filaments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">🇺🇸 Missing US</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-orange-500">{stats.missingUS}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">🇬🇧 Missing UK</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-orange-500">{stats.missingUK}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">🇩🇪 Missing DE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-orange-500">{stats.missingDE}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, vendor, or material..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Regions:</span>
                  {(Object.keys(REGION_CONFIG) as Region[]).map(region => (
                    <Button
                      key={region}
                      variant={selectedRegions.includes(region) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRegion(region)}
                    >
                      {REGION_CONFIG[region].flag} {REGION_CONFIG[region].label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="missing-only"
                    checked={showMissingOnly}
                    onCheckedChange={(checked) => setShowMissingOnly(checked === true)}
                  />
                  <label htmlFor="missing-only" className="text-sm cursor-pointer">
                    Missing links only
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Filaments ({filteredFilaments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    {selectedRegions.map(region => (
                      <TableHead key={region}>
                        {REGION_CONFIG[region].flag} {REGION_CONFIG[region].label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFilaments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={selectedRegions.length + 2} className="text-center py-8 text-muted-foreground">
                        No filaments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFilaments.slice(0, 50).map(filament => (
                      <TableRow key={filament.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{filament.product_title}</p>
                            <div className="flex gap-2 mt-1">
                              {filament.vendor && (
                                <Badge variant="outline" className="text-xs">{filament.vendor}</Badge>
                              )}
                              {filament.material && (
                                <Badge variant="secondary" className="text-xs">{filament.material}</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {selectedRegions.map(region => {
                          const linkField = `amazon_link_${region}` as keyof Filament;
                          const currentLink = filament[linkField] as string | null;
                          const editedLink = getEditedLink(filament.id, region, currentLink);
                          const hasLink = !!currentLink;

                          return (
                            <TableCell key={region}>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  {hasLink ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Input
                                    placeholder="Paste Amazon link..."
                                    value={editedLink}
                                    onChange={(e) => handleLinkChange(filament.id, region, e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs h-7"
                                  onClick={() => window.open(generateSearchUrl(filament, region), '_blank')}
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Search {REGION_CONFIG[region].domain}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={!hasChanges(filament) || savingIds.has(filament.id)}
                            onClick={() => saveLinks(filament)}
                          >
                            {savingIds.has(filament.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredFilaments.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing first 50 of {filteredFilaments.length} results. Use search to narrow down.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
