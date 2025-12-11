import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingDown, TrendingUp, Check, X, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface FilamentWithAnomaly {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity: number | null;
  pricePerKg: number | null;
  anomalyType: 'too_low' | 'too_high' | 'missing_weight' | 'missing_price';
  materialAvg: number | null;
  deviation: number | null;
}

interface MaterialStats {
  material: string;
  count: number;
  avgPricePerKg: number;
  stdDev: number;
  minPrice: number;
  maxPrice: number;
}

export default function AdminPriceAnomalies() {
  const [activeTab, setActiveTab] = useState("flagged");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price?: string; weight?: string; pack?: string }>({});
  const queryClient = useQueryClient();

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["admin-filaments-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, variant_price, net_weight_g, pack_quantity")
        .order("material");
      if (error) throw error;
      return data;
    },
  });

  // Calculate material statistics
  const materialStats = useMemo(() => {
    if (!filaments) return new Map<string, MaterialStats>();
    
    const stats = new Map<string, MaterialStats>();
    const materialGroups = new Map<string, number[]>();

    // Group prices by material
    filaments.forEach((f) => {
      if (!f.material || !f.variant_price || !f.net_weight_g) return;
      const weightKg = f.net_weight_g / 1000;
      const packQty = f.pack_quantity || 1;
      const pricePerKg = f.variant_price / (packQty * weightKg);
      
      if (pricePerKg < 0.5 || pricePerKg > 500) return; // Skip obvious errors
      
      const material = f.material.toUpperCase();
      if (!materialGroups.has(material)) {
        materialGroups.set(material, []);
      }
      materialGroups.get(material)!.push(pricePerKg);
    });

    // Calculate stats for each material
    materialGroups.forEach((prices, material) => {
      if (prices.length < 3) return; // Need at least 3 samples
      
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      
      stats.set(material, {
        material,
        count: prices.length,
        avgPricePerKg: avg,
        stdDev,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      });
    });

    return stats;
  }, [filaments]);

  // Detect anomalies
  const anomalies = useMemo(() => {
    if (!filaments) return [];
    
    const flagged: FilamentWithAnomaly[] = [];
    const THRESHOLD = 2; // Standard deviations

    filaments.forEach((f) => {
      // Missing weight
      if (f.variant_price && !f.net_weight_g) {
        flagged.push({
          ...f,
          pricePerKg: null,
          anomalyType: 'missing_weight',
          materialAvg: null,
          deviation: null,
        });
        return;
      }

      // Missing price
      if (!f.variant_price && f.net_weight_g) {
        flagged.push({
          ...f,
          pricePerKg: null,
          anomalyType: 'missing_price',
          materialAvg: null,
          deviation: null,
        });
        return;
      }

      if (!f.variant_price || !f.net_weight_g || !f.material) return;

      const weightKg = f.net_weight_g / 1000;
      const packQty = f.pack_quantity || 1;
      const pricePerKg = f.variant_price / (packQty * weightKg);
      const material = f.material.toUpperCase();
      const stats = materialStats.get(material);

      if (!stats) return;

      const deviation = (pricePerKg - stats.avgPricePerKg) / stats.stdDev;

      // Too low (likely missing pack quantity or scraping error)
      if (deviation < -THRESHOLD && pricePerKg < 5) {
        flagged.push({
          ...f,
          pricePerKg,
          anomalyType: 'too_low',
          materialAvg: stats.avgPricePerKg,
          deviation,
        });
      }
      // Too high (likely bulk price not divided)
      else if (deviation > THRESHOLD && pricePerKg > 100) {
        flagged.push({
          ...f,
          pricePerKg,
          anomalyType: 'too_high',
          materialAvg: stats.avgPricePerKg,
          deviation,
        });
      }
    });

    return flagged.sort((a, b) => {
      // Sort by severity (deviation magnitude)
      const aScore = Math.abs(a.deviation || 0);
      const bScore = Math.abs(b.deviation || 0);
      return bScore - aScore;
    });
  }, [filaments, materialStats]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("filaments")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-filaments-pricing"] });
      toast.success("Filament updated");
      setEditingId(null);
      setEditValues({});
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleSaveEdit = (id: string) => {
    const updates: Record<string, unknown> = {};
    if (editValues.price) updates.variant_price = parseFloat(editValues.price);
    if (editValues.weight) updates.net_weight_g = parseInt(editValues.weight);
    if (editValues.pack) updates.pack_quantity = parseInt(editValues.pack);
    
    if (Object.keys(updates).length === 0) {
      toast.error("No changes to save");
      return;
    }
    
    updateMutation.mutate({ id, updates });
  };

  const startEdit = (f: FilamentWithAnomaly) => {
    setEditingId(f.id);
    setEditValues({
      price: f.variant_price?.toString() || "",
      weight: f.net_weight_g?.toString() || "",
      pack: f.pack_quantity?.toString() || "1",
    });
  };

  const getAnomalyBadge = (type: string) => {
    switch (type) {
      case 'too_low':
        return <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Too Low</Badge>;
      case 'too_high':
        return <Badge variant="destructive" className="gap-1"><TrendingUp className="h-3 w-3" /> Too High</Badge>;
      case 'missing_weight':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> No Weight</Badge>;
      case 'missing_price':
        return <Badge variant="secondary" className="gap-1"><DollarSign className="h-3 w-3" /> No Price</Badge>;
      default:
        return null;
    }
  };

  const tooLowCount = anomalies.filter(a => a.anomalyType === 'too_low').length;
  const tooHighCount = anomalies.filter(a => a.anomalyType === 'too_high').length;
  const missingCount = anomalies.filter(a => a.anomalyType === 'missing_weight' || a.anomalyType === 'missing_price').length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Price Anomaly Detection</h1>
          <p className="text-muted-foreground">Flag filaments with suspicious pricing for review</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-filaments-pricing"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalies.length}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Too Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{tooLowCount}</div>
            <p className="text-xs text-muted-foreground">Likely missing pack qty</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-destructive" /> Too High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{tooHighCount}</div>
            <p className="text-xs text-muted-foreground">Likely bulk price error</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" /> Missing Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missingCount}</div>
            <p className="text-xs text-muted-foreground">Weight or price missing</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flagged">Flagged Items ({anomalies.length})</TabsTrigger>
          <TabsTrigger value="stats">Material Statistics ({materialStats.size})</TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : anomalies.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No price anomalies detected!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Pack Qty</TableHead>
                      <TableHead className="text-right">$/kg</TableHead>
                      <TableHead className="text-right">Avg $/kg</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="max-w-[200px]">
                          <Link 
                            to={`/filaments/${f.id}`} 
                            className="text-sm font-medium hover:underline line-clamp-2"
                          >
                            {f.product_title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{f.vendor}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.material || "—"}</Badge>
                        </TableCell>
                        <TableCell>{getAnomalyBadge(f.anomalyType)}</TableCell>
                        <TableCell className="text-right">
                          {editingId === f.id ? (
                            <Input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                              className="w-20 h-8"
                            />
                          ) : (
                            f.variant_price ? `$${f.variant_price.toFixed(2)}` : "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === f.id ? (
                            <Input
                              type="number"
                              value={editValues.weight}
                              onChange={(e) => setEditValues({ ...editValues, weight: e.target.value })}
                              className="w-20 h-8"
                            />
                          ) : (
                            f.net_weight_g ? `${f.net_weight_g}g` : "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === f.id ? (
                            <Input
                              type="number"
                              value={editValues.pack}
                              onChange={(e) => setEditValues({ ...editValues, pack: e.target.value })}
                              className="w-16 h-8"
                            />
                          ) : (
                            f.pack_quantity || 1
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {f.pricePerKg ? (
                            <span className={f.anomalyType === 'too_low' ? 'text-blue-500' : f.anomalyType === 'too_high' ? 'text-destructive' : ''}>
                              ${f.pricePerKg.toFixed(2)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {f.materialAvg ? `$${f.materialAvg.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell>
                          {editingId === f.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(f.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEdit(f)}>
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Avg $/kg</TableHead>
                    <TableHead className="text-right">Std Dev</TableHead>
                    <TableHead className="text-right">Min $/kg</TableHead>
                    <TableHead className="text-right">Max $/kg</TableHead>
                    <TableHead className="text-right">Range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(materialStats.values())
                    .sort((a, b) => b.count - a.count)
                    .map((stat) => (
                      <TableRow key={stat.material}>
                        <TableCell>
                          <Badge variant="outline">{stat.material}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{stat.count}</TableCell>
                        <TableCell className="text-right font-mono">${stat.avgPricePerKg.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          ±${stat.stdDev.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          ${stat.minPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          ${stat.maxPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          ${(stat.maxPrice - stat.minPrice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
