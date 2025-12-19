import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle, AlertTriangle, Sparkles, Palette, Archive } from "lucide-react";
import { BambuLabRegionalDashboard } from "@/components/admin/BambuLabRegionalDashboard";

const AdminMaintenance = () => {
  // Bambu Lab color sync state
  const [isSyncingBambuColors, setIsSyncingBambuColors] = useState(false);
  const [bambuColorsDryRun, setBambuColorsDryRun] = useState(true);
  const [bambuMaterials, setBambuMaterials] = useState<string[]>(['PLA']);
  const [bambuColorsResult, setBambuColorsResult] = useState<{
    success: boolean;
    dryRun: boolean;
    materialsProcessed?: string[];
    productsProcessed?: number;
    colorsDiscovered?: number;
    filamentsCreated?: number;
    filamentsUpdated?: number;
    filamentsSkipped?: number;
    errors?: string[];
    byMaterial?: Record<string, { products?: number; created?: number; updated?: number; skipped?: number; colors?: number }>;
    duration?: string;
  } | null>(null);
  
  const BAMBU_MATERIAL_OPTIONS = [
    { id: 'PLA', label: 'PLA', count: 16 },
    { id: 'PETG', label: 'PETG', count: 4 },
    { id: 'TPU', label: 'TPU', count: 3 },
    { id: 'ABS', label: 'ABS', count: 1 },
    { id: 'ASA', label: 'ASA', count: 1 },
    { id: 'PA', label: 'PA (Nylon)', count: 4 },
    { id: 'PC', label: 'PC', count: 2 },
    { id: 'Support', label: 'Support', count: 5 },
  ];
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runBambuLabColorSync = async () => {
    setIsSyncingBambuColors(true);
    setBambuColorsResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-bambu-pla', {
        body: { 
          dryRun: bambuColorsDryRun,
          materials: bambuMaterials,
        }
      });

      if (error) {
        throw error;
      }

      const results = data.results || {};
      setBambuColorsResult({
        success: data.success,
        dryRun: bambuColorsDryRun,
        materialsProcessed: results.materialsProcessed || bambuMaterials,
        productsProcessed: results.productsProcessed || 0,
        colorsDiscovered: results.colorsDiscovered || 0,
        filamentsCreated: results.filamentsCreated || 0,
        filamentsUpdated: results.filamentsUpdated || 0,
        filamentsSkipped: results.filamentsSkipped || 0,
        errors: results.errors || [],
        byMaterial: results.byMaterial || {},
        duration: results.duration,
      });
      toast({
        title: bambuColorsDryRun ? "Dry Run Complete" : "Scrape Complete",
        description: data.message || `${results.filamentsCreated || 0} created, ${results.filamentsUpdated || 0} updated`,
      });
    } catch (error) {
      console.error('Bambu Lab scraper error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Bambu Lab scraper",
        variant: "destructive",
      });
    } finally {
      setIsSyncingBambuColors(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scraping</h1>
          <p className="text-muted-foreground">
            Automated data scraping tools for filament brands
          </p>
        </div>
        <Link to="/admin/maintenance/archive">
          <Button variant="outline">
            <Archive className="w-4 h-4 mr-2" />
            Legacy Scrapers
          </Button>
        </Link>
      </div>

      {/* Bambu Lab Scraper Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Bambu Lab Filament Scraper</CardTitle>
          </div>
          <CardDescription>
            Scrape Bambu Lab filaments across all materials (PLA, PETG, TPU, ABS, ASA, PA, PC, Support) with regional pricing for US, CA, UK, EU, AU, JP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Materials to Scrape</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {BAMBU_MATERIAL_OPTIONS.map((material) => (
                <div key={material.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bambu-material-${material.id}`}
                    checked={bambuMaterials.includes(material.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBambuMaterials([...bambuMaterials, material.id]);
                      } else {
                        setBambuMaterials(bambuMaterials.filter(m => m !== material.id));
                      }
                    }}
                  />
                  <Label htmlFor={`bambu-material-${material.id}`} className="text-sm font-normal cursor-pointer">
                    {material.label} <span className="text-muted-foreground">({material.count})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bambu-dry-run"
              checked={bambuColorsDryRun}
              onCheckedChange={(checked) => setBambuColorsDryRun(checked === true)}
            />
            <Label htmlFor="bambu-dry-run" className="text-sm font-normal">
              Dry run (preview changes without saving)
            </Label>
          </div>

          <Button 
            onClick={runBambuLabColorSync} 
            disabled={isSyncingBambuColors || bambuMaterials.length === 0}
            className="w-full sm:w-auto"
          >
            {isSyncingBambuColors ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping {bambuMaterials.join(', ')}...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                {bambuColorsDryRun ? "Preview Scrape" : `Scrape ${bambuMaterials.length} Material(s)`}
              </>
            )}
          </Button>

          {bambuColorsResult && (
            <div className="space-y-4 pt-4 border-t">
              {bambuColorsResult.dryRun && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This was a dry run. Uncheck "Dry run" and run again to apply changes.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xl font-bold">{bambuColorsResult.productsProcessed || 0}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xl font-bold">{bambuColorsResult.colorsDiscovered || 0}</div>
                  <div className="text-xs text-muted-foreground">Colors Found</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div className="text-xl font-bold">{bambuColorsResult.filamentsCreated || 0}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <div className="text-xl font-bold">{bambuColorsResult.filamentsUpdated || 0}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xl font-bold">{bambuColorsResult.filamentsSkipped || 0}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
              </div>

              {/* Duration */}
              {bambuColorsResult.duration && (
                <div className="text-xs text-muted-foreground">
                  Completed in {bambuColorsResult.duration}
                </div>
              )}

              {/* Material Breakdown */}
              {bambuColorsResult.byMaterial && Object.keys(bambuColorsResult.byMaterial).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">By Material:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(bambuColorsResult.byMaterial).map(([material, stats]: [string, any]) => (
                      <div key={material} className="bg-muted/30 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{material}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {stats.products || 0} products, {stats.colors || 0} colors
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-green-600">+{stats.created || 0}</span>
                          <span className="text-blue-600">↻{stats.updated || 0}</span>
                          <span className="text-muted-foreground">○{stats.skipped || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {bambuColorsResult.errors && bambuColorsResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Errors ({bambuColorsResult.errors.length}):</div>
                    <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                      {bambuColorsResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {bambuColorsResult.errors.length > 5 && (
                        <li className="text-sm">... and {bambuColorsResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bambu Lab Regional Dashboard */}
      <BambuLabRegionalDashboard />
    </div>
  );
};

export default AdminMaintenance;
