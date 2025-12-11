import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, RefreshCw, Search, Trash2, Merge, CheckCircle,
  Package, Database, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface DuplicateCandidate {
  id: string;
  entity_type: string;
  entity_id_a: string;
  entity_id_b: string;
  confidence: string;
  match_reason: string | null;
  resolved: boolean;
  nameA?: string;
  nameB?: string;
}

const AdminDuplicates = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("filament");

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      navigate("/");
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchDuplicates();
    }
  }, [isAdmin]);

  const fetchDuplicates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("duplicate_candidates")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Enrich with names
      const enriched = await Promise.all(data.map(async (d) => {
        let nameA = "Unknown";
        let nameB = "Unknown";

        if (d.entity_type === 'filament') {
          const [resA, resB] = await Promise.all([
            supabase.from("filaments").select("product_title").eq("id", d.entity_id_a).single(),
            supabase.from("filaments").select("product_title").eq("id", d.entity_id_b).single()
          ]);
          nameA = resA.data?.product_title || "Unknown";
          nameB = resB.data?.product_title || "Unknown";
        } else if (d.entity_type === 'printer') {
          const [resA, resB] = await Promise.all([
            supabase.from("printers").select("model_name").eq("id", d.entity_id_a).single(),
            supabase.from("printers").select("model_name").eq("id", d.entity_id_b).single()
          ]);
          nameA = resA.data?.model_name || "Unknown";
          nameB = resB.data?.model_name || "Unknown";
        }

        return { ...d, nameA, nameB };
      }));

      setDuplicates(enriched);
    }
    setLoading(false);
  };

  const scanForDuplicates = async (entityType: 'filament' | 'printer') => {
    setScanning(true);
    toast.info(`Scanning for duplicate ${entityType}s...`);

    try {
      if (entityType === 'filament') {
        const { data: filaments } = await supabase
          .from("filaments")
          .select("id, product_title, vendor, variant_sku");

        if (filaments) {
          const candidates: { a: string; b: string; reason: string; confidence: string }[] = [];
          
          // Check for exact title matches within same vendor
          const titleMap = new Map<string, string[]>();
          filaments.forEach(f => {
            const key = `${f.vendor?.toLowerCase()}|${f.product_title?.toLowerCase()}`;
            if (!titleMap.has(key)) titleMap.set(key, []);
            titleMap.get(key)!.push(f.id);
          });

          titleMap.forEach((ids, key) => {
            if (ids.length > 1) {
              for (let i = 0; i < ids.length - 1; i++) {
                candidates.push({
                  a: ids[i],
                  b: ids[i + 1],
                  reason: 'Exact title match',
                  confidence: 'high'
                });
              }
            }
          });

          // Check for SKU matches
          const skuMap = new Map<string, string[]>();
          filaments.filter(f => f.variant_sku).forEach(f => {
            const key = f.variant_sku!.toLowerCase();
            if (!skuMap.has(key)) skuMap.set(key, []);
            skuMap.get(key)!.push(f.id);
          });

          skuMap.forEach((ids) => {
            if (ids.length > 1) {
              for (let i = 0; i < ids.length - 1; i++) {
                if (!candidates.some(c => 
                  (c.a === ids[i] && c.b === ids[i + 1]) || 
                  (c.a === ids[i + 1] && c.b === ids[i])
                )) {
                  candidates.push({
                    a: ids[i],
                    b: ids[i + 1],
                    reason: 'SKU match',
                    confidence: 'high'
                  });
                }
              }
            }
          });

          // Insert candidates
          for (const c of candidates) {
            // Check if already exists
            const { data: existing } = await supabase
              .from("duplicate_candidates")
              .select("id")
              .eq("entity_type", "filament")
              .or(`and(entity_id_a.eq.${c.a},entity_id_b.eq.${c.b}),and(entity_id_a.eq.${c.b},entity_id_b.eq.${c.a})`)
              .maybeSingle();

            if (!existing) {
              await supabase.from("duplicate_candidates").insert({
                entity_type: 'filament',
                entity_id_a: c.a,
                entity_id_b: c.b,
                match_reason: c.reason,
                confidence: c.confidence
              });
            }
          }

          toast.success(`Found ${candidates.length} potential duplicate filaments`);
        }
      } else {
        const { data: printers } = await supabase
          .from("printers")
          .select("id, model_name, brand_id")
          .eq("status", "active");

        if (printers) {
          const candidates: { a: string; b: string; reason: string; confidence: string }[] = [];
          
          // Check for similar names within same brand
          const brandMap = new Map<string, typeof printers>();
          printers.forEach(p => {
            if (!p.brand_id) return;
            if (!brandMap.has(p.brand_id)) brandMap.set(p.brand_id, []);
            brandMap.get(p.brand_id)!.push(p);
          });

          brandMap.forEach((brandPrinters) => {
            for (let i = 0; i < brandPrinters.length; i++) {
              for (let j = i + 1; j < brandPrinters.length; j++) {
                const nameA = brandPrinters[i].model_name.toLowerCase().replace(' 3d printer', '');
                const nameB = brandPrinters[j].model_name.toLowerCase().replace(' 3d printer', '');
                
                if (nameA === nameB) {
                  candidates.push({
                    a: brandPrinters[i].id,
                    b: brandPrinters[j].id,
                    reason: 'Name matches after normalization',
                    confidence: 'high'
                  });
                }
              }
            }
          });

          // Insert candidates
          for (const c of candidates) {
            const { data: existing } = await supabase
              .from("duplicate_candidates")
              .select("id")
              .eq("entity_type", "printer")
              .or(`and(entity_id_a.eq.${c.a},entity_id_b.eq.${c.b}),and(entity_id_a.eq.${c.b},entity_id_b.eq.${c.a})`)
              .maybeSingle();

            if (!existing) {
              await supabase.from("duplicate_candidates").insert({
                entity_type: 'printer',
                entity_id_a: c.a,
                entity_id_b: c.b,
                match_reason: c.reason,
                confidence: c.confidence
              });
            }
          }

          toast.success(`Found ${candidates.length} potential duplicate printers`);
        }
      }

      fetchDuplicates();
    } catch (error) {
      console.error("Error scanning for duplicates:", error);
      toast.error("Failed to scan for duplicates");
    } finally {
      setScanning(false);
    }
  };

  const resolveDuplicate = async (id: string, resolution: 'keep_a' | 'keep_b' | 'not_duplicate') => {
    const duplicate = duplicates.find(d => d.id === id);
    if (!duplicate) return;

    try {
      if (resolution === 'keep_a' || resolution === 'keep_b') {
        const idToDelete = resolution === 'keep_a' ? duplicate.entity_id_b : duplicate.entity_id_a;
        
        if (duplicate.entity_type === 'filament') {
          await supabase.from("filaments").delete().eq("id", idToDelete);
        } else if (duplicate.entity_type === 'printer') {
          await supabase.from("printers").delete().eq("id", idToDelete);
        }
        
        toast.success("Duplicate resolved - item deleted");
      }

      // Mark as resolved
      await supabase
        .from("duplicate_candidates")
        .update({ 
          resolved: true, 
          resolution,
          resolved_at: new Date().toISOString()
        })
        .eq("id", id);

      fetchDuplicates();
    } catch (error) {
      console.error("Error resolving duplicate:", error);
      toast.error("Failed to resolve duplicate");
    }
  };

  const filteredDuplicates = duplicates.filter(d => d.entity_type === activeTab);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return "bg-red-500/10 text-red-500 border-red-500/30";
      case 'medium': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Copy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-foreground">Duplicate Detection</h1>
          </div>
          <Button onClick={fetchDuplicates} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Scan Actions */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Scan for Duplicates</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => scanForDuplicates('filament')} 
              variant="outline" 
              size="sm"
              disabled={scanning}
            >
              <Search className="w-4 h-4 mr-2" />
              Scan Filaments
            </Button>
            <Button 
              onClick={() => scanForDuplicates('printer')} 
              variant="outline" 
              size="sm"
              disabled={scanning}
            >
              <Search className="w-4 h-4 mr-2" />
              Scan Printers
            </Button>
          </div>
          {scanning && (
            <p className="text-sm text-muted-foreground mt-2">Scanning...</p>
          )}
        </Card>

        {/* Results */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="filament">
              <Package className="w-4 h-4 mr-2" />
              Filaments ({duplicates.filter(d => d.entity_type === 'filament').length})
            </TabsTrigger>
            <TabsTrigger value="printer">
              <Database className="w-4 h-4 mr-2" />
              Printers ({duplicates.filter(d => d.entity_type === 'printer').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredDuplicates.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No duplicates found!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Run a scan to check for potential duplicates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDuplicates.map((dup) => (
                  <Card key={dup.id} className="p-4 bg-card border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <Badge className={getConfidenceColor(dup.confidence)}>
                          {dup.confidence} confidence
                        </Badge>
                        {dup.match_reason && (
                          <span className="text-sm text-muted-foreground">
                            {dup.match_reason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Option A</p>
                        <p className="font-medium text-foreground">{dup.nameA}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {dup.entity_id_a.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Option B</p>
                        <p className="font-medium text-foreground">{dup.nameB}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {dup.entity_id_b.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveDuplicate(dup.id, 'keep_a')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Keep A, Delete B
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveDuplicate(dup.id, 'keep_b')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Keep B, Delete A
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveDuplicate(dup.id, 'not_duplicate')}
                      >
                        Not a Duplicate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDuplicates;
