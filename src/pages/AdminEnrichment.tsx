import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, AlertCircle, TrendingUp, Info, Download, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FilamentToEnrich {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  variant_price: number;
  net_weight_g: number | null;
  diameter_nominal_mm: number | null;
}

const AdminEnrichment = () => {
  const [filaments, setFilaments] = useState<FilamentToEnrich[]>([]);
  const [weights, setWeights] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchFilamentsNeedingWeight();
    }
  }, [isAdmin]);

  const fetchFilamentsNeedingWeight = async () => {
    try {
      const { data, error } = await supabase
        .from("filaments")
        .select("id, product_title, vendor, material, variant_price, net_weight_g, diameter_nominal_mm")
        .not("variant_price", "is", null)
        .or("net_weight_g.is.null,net_weight_g.eq.0")
        .order("material")
        .limit(50);

      if (error) throw error;

      setFilaments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load filaments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (id: string, value: string) => {
    setWeights(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (filamentId: string) => {
    const weightValue = weights[filamentId];
    if (!weightValue || parseFloat(weightValue) <= 0) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight in grams",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("filaments")
        .update({ net_weight_g: parseInt(weightValue) })
        .eq("id", filamentId);

      if (error) throw error;

      toast({
        title: "Weight saved",
        description: "Filament weight has been updated successfully",
      });

      // Remove from list and clear input
      setFilaments(prev => prev.filter(f => f.id !== filamentId));
      setWeights(prev => {
        const newWeights = { ...prev };
        delete newWeights[filamentId];
        return newWeights;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save weight",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(weights)
      .filter(([_, value]) => value && parseFloat(value) > 0)
      .map(([id, value]) => ({
        id,
        net_weight_g: parseInt(value)
      }));

    if (updates.length === 0) {
      toast({
        title: "No changes",
        description: "Please enter at least one weight value",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        const { error } = await supabase
          .from("filaments")
          .update({ net_weight_g: update.net_weight_g })
          .eq("id", update.id);

        if (error) throw error;
        successCount++;
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    setIsSaving(false);

    if (successCount > 0) {
      toast({
        title: "Bulk save completed",
        description: `Successfully saved ${successCount} weight value(s)`,
      });

      // Remove saved items from list
      const savedIds = updates.map(u => u.id);
      setFilaments(prev => prev.filter(f => !savedIds.includes(f.id)));
      setWeights({});
    }

    if (errors.length > 0) {
      toast({
        title: "Some errors occurred",
        description: `${errors.length} update(s) failed`,
        variant: "destructive",
      });
    }
  };

  const calculateConfidence = (
    diameter: number | null,
    material: string | null,
    estimatedWeight: number
  ): { score: number; label: string; color: string; reasons: string[] } => {
    let score = 100;
    const reasons: string[] = [];

    // Diameter impact (40% of confidence)
    if (!diameter || diameter <= 0) {
      score -= 40;
      reasons.push('No diameter data - using default 1.75mm');
    } else if (diameter < 1.5 || diameter > 3.5) {
      score -= 20;
      reasons.push('Unusual diameter - may be specialty filament');
    }

    // Material impact (40% of confidence)
    if (!material) {
      score -= 40;
      reasons.push('No material data - assuming PLA density');
    } else {
      const densities: { [key: string]: number } = {
        'PLA': 1.24, 'PLA+': 1.24, 'PETG': 1.27, 'ABS': 1.04, 'ASA': 1.07,
        'TPU': 1.21, 'Nylon': 1.14, 'PC': 1.20, 'PVA': 1.23, 'HIPS': 1.04,
        'PP': 0.90, 'PVB': 1.08, 'PCTG': 1.23, 'Co-Polyester': 1.27,
        'PEEK': 1.32, 'PPSU': 1.29, 'PEI': 1.27, 'PEBA': 1.01,
      };

      const isComposite = material.includes('-CF') || material.includes('-GF') || 
                         material.includes('Carbon') || material.includes('Glass');
      
      if (isComposite) {
        score -= 15;
        reasons.push('Composite material - density may vary by fiber content');
      } else if (!densities[material]) {
        score -= 25;
        reasons.push('Unknown material - using estimated density');
      }
    }

    // Weight bounds check (20% of confidence)
    if (estimatedWeight === 1000 && !diameter) {
      score -= 20;
      reasons.push('Default weight used - no specific calculation possible');
    } else if (estimatedWeight < 300 || estimatedWeight > 1500) {
      score -= 10;
      reasons.push('Unusual weight - verify against manufacturer specs');
    }

    // Determine label and color
    let label: string;
    let color: string;
    
    if (score >= 85) {
      label = 'High';
      color = 'text-green-600';
    } else if (score >= 65) {
      label = 'Medium';
      color = 'text-yellow-600';
    } else {
      label = 'Low';
      color = 'text-orange-600';
    }

    if (reasons.length === 0) {
      reasons.push('Complete data with standard material and diameter');
    }

    return { score, label, color, reasons };
  };

  const getMaterialDensity = (material: string | null): number => {
    // Material densities in g/cm³
    const densities: { [key: string]: number } = {
      'PLA': 1.24,
      'PLA+': 1.24,
      'PETG': 1.27,
      'ABS': 1.04,
      'ASA': 1.07,
      'TPU': 1.21,
      'Nylon': 1.14,
      'PC': 1.20,
      'PVA': 1.23,
      'HIPS': 1.04,
      'PP': 0.90,
      'PVB': 1.08,
      'PCTG': 1.23,
      'Co-Polyester': 1.27,
      // Composites (higher density due to additives)
      'Carbon Fiber': 1.30,
      'Wood Fill': 1.28,
    };

    if (!material) return 1.24; // Default to PLA density
    
    // Check for composite materials
    if (material.includes('-CF') || material.includes('Carbon')) return 1.30;
    if (material.includes('-GF') || material.includes('Glass')) return 1.35;
    if (material.includes('Wood') || material.includes('Bamboo')) return 1.28;
    
    return densities[material] || 1.24;
  };

  const calculateEstimatedWeight = (diameter: number | null, material: string | null): number => {
    // If no diameter, use standard 1kg
    if (!diameter || diameter <= 0) return 1000;
    
    const density = getMaterialDensity(material);
    
    // Calculate weight for standard spool lengths
    // Formula: Weight = π × (diameter/2)² × length × density
    // For 1.75mm PLA (density 1.24), 1kg ≈ 330 meters
    // We'll calculate based on this reference
    
    const radius_mm = diameter / 2;
    const radius_cm = radius_mm / 10;
    
    // Standard reference: 1.75mm PLA at 1kg = ~330 meters
    const referenceDiameter = 1.75;
    const referenceDensity = 1.24;
    const referenceWeight = 1000; // grams
    const referenceLength = 330; // meters
    
    // Calculate cross-sectional area ratio
    const areaRatio = Math.pow(diameter / referenceDiameter, 2);
    
    // Calculate density ratio
    const densityRatio = density / referenceDensity;
    
    // Estimated weight for same length
    const estimatedWeight = referenceWeight * areaRatio * densityRatio;
    
    // Round to nearest 50g
    return Math.round(estimatedWeight / 50) * 50;
  };

  const getSuggestedWeight = (diameter: number | null, material: string | null): number => {
    const calculated = calculateEstimatedWeight(diameter, material);
    
    // Ensure reasonable bounds (most spools are between 250g and 2000g)
    if (calculated < 250) return 250;
    if (calculated > 2000) return 1000;
    
    return calculated;
  };

  const handleBulkEstimate = async () => {
    const updates: { [key: string]: string } = {};
    
    filaments.forEach(filament => {
      if (!weights[filament.id]) {
        const estimated = getSuggestedWeight(filament.diameter_nominal_mm, filament.material);
        updates[filament.id] = estimated.toString();
      }
    });
    
    setWeights(prev => ({ ...prev, ...updates }));
    
    toast({
      title: "Weights estimated",
      description: `Generated ${Object.keys(updates).length} weight estimates based on material density and diameter`,
    });
  };

  const handleServerEstimate = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-weights');
      
      if (error) throw error;

      toast({
        title: "Server estimation completed",
        description: data.message || `Updated ${data.updated} filaments`,
      });

      // Refresh the list
      fetchFilamentsNeedingWeight();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run server estimation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<Array<{
    filament_id: string;
    product_title: string;
    status: 'success' | 'partial' | 'failed';
    prices_found: number;
    weight_found: boolean;
    sources_checked: number;
  }>>([]);
  const [showScrapingResults, setShowScrapingResults] = useState(false);
  
  const handleMasterFetchPrices = async () => {
    setIsFetchingPrices(true);
    setScrapingStatus([]);
    setShowScrapingResults(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-prices', {
        body: { filament_ids: null }, // Fetch ALL filaments
      });
      
      if (error) throw error;
      
      const weightInfo = data.weights_updated > 0 
        ? ` and ${data.weights_updated} weights` 
        : '';
      
      if (data.details) {
        setScrapingStatus(data.details);
        setShowScrapingResults(true);
      }
      
      let description = `Updated ${data.updated} products${weightInfo}. Found ${data.prices.length} total price points from ${data.processed} products.`;
      
      if (data.timeout_reached) {
        description += ` Processing was limited to avoid timeout. Click "Fetch All Prices & Weights" again to continue with the next batch.`;
      }
      
      toast({
        title: data.timeout_reached ? "Batch complete (more remain)" : "Master price fetch complete",
        description,
        duration: data.timeout_reached ? 8000 : 5000,
      });
      
      // Refresh the list
      fetchFilamentsNeedingWeight();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch prices and weights from all product URLs",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const calculatePricePerKg = (price: number, weightG: number | null): number | null => {
    if (!weightG || weightG <= 0) return null;
    return (price / weightG) * 1000;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Enrichment</h1>
              <p className="text-muted-foreground">Add weight data for filaments with pricing</p>
            </div>
          </div>
          {filaments.length > 0 && (
            <div className="flex gap-2">
              <Button 
                size="lg"
                onClick={handleMasterFetchPrices}
                disabled={isFetchingPrices}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Download className="w-5 h-5 mr-2" />
                {isFetchingPrices ? "Fetching All Data..." : "Fetch All Prices & Weights"}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleServerEstimate} 
                disabled={isSaving}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Estimate Weights
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBulkEstimate} 
                disabled={isSaving}
              >
                Auto-Fill Visible
              </Button>
              <Button 
                onClick={handleBulkSave} 
                disabled={isSaving || Object.keys(weights).length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save All ({Object.keys(weights).length})
              </Button>
            </div>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Master Price & Weight Fetching</AlertTitle>
          <AlertDescription>
            Click "Fetch All Prices & Weights" to automatically scrape prices and weight data from all product URLs (brand stores and Amazon links). 
            The system will calculate price per KG for each filament. Weight estimates can be further refined using material density calculations.
          </AlertDescription>
        </Alert>

        {/* Scraping Results */}
        {showScrapingResults && scrapingStatus.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Scraping Results</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowScrapingResults(false)}>
                Dismiss
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scrapingStatus.map((item) => (
                <div
                  key={item.filament_id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {item.product_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.sources_checked} sources checked
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge
                      variant={
                        item.status === 'success'
                          ? 'default'
                          : item.status === 'partial'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="text-xs"
                    >
                      {item.status === 'success' && '✓ Success'}
                      {item.status === 'partial' && '⚠ Partial'}
                      {item.status === 'failed' && '✗ Failed'}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {item.prices_found} price{item.prices_found !== 1 ? 's' : ''}
                      {item.weight_found && ' • weight ✓'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center pt-4 border-t border-border">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {scrapingStatus.filter(s => s.status === 'success').length}
                </p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {scrapingStatus.filter(s => s.status === 'partial').length}
                </p>
                <p className="text-xs text-muted-foreground">Partial</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {scrapingStatus.filter(s => s.status === 'failed').length}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{filaments.length}</p>
              <p className="text-sm text-muted-foreground">Need Weight Data</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{Object.keys(weights).length}</p>
              <p className="text-sm text-muted-foreground">Pending Changes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(weights).filter(id => weights[id] && parseFloat(weights[id]) > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">Ready to Save</p>
            </div>
          </div>
        </Card>

        {/* Filaments List */}
        <div className="space-y-3">
          {filaments.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-muted-foreground">
                🎉 Great! All filaments with pricing have weight data.
              </p>
            </Card>
          ) : (
            filaments.map((filament) => {
              const suggestedWeight = getSuggestedWeight(filament.diameter_nominal_mm, filament.material);
              const confidence = calculateConfidence(
                filament.diameter_nominal_mm,
                filament.material,
                suggestedWeight
              );
              const currentWeight = weights[filament.id] ? parseFloat(weights[filament.id]) : filament.net_weight_g;
              const pricePerKg = calculatePricePerKg(filament.variant_price, currentWeight);
              
              return (
                <Card key={filament.id} className="p-4">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    {/* Filament Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{filament.product_title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">{filament.vendor}</p>
                        {filament.material && (
                          <Badge variant="outline" className="text-xs">{filament.material}</Badge>
                        )}
                        {filament.diameter_nominal_mm && (
                          <span className="text-xs text-muted-foreground">{filament.diameter_nominal_mm}mm</span>
                        )}
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="text-sm min-w-[120px]">
                      <p className="text-muted-foreground">Price:</p>
                      <p className="font-semibold text-foreground">${filament.variant_price.toFixed(2)}</p>
                      {pricePerKg && (
                        <p className="text-xs text-primary mt-1">
                          ${pricePerKg.toFixed(2)}/kg
                        </p>
                      )}
                    </div>

                    {/* Confidence Score */}
                    <div className="text-sm min-w-[100px]">
                      <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <span className={`font-semibold ${confidence.color}`}>
                              {confidence.score}% {confidence.label}
                            </span>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-xs">Estimation Factors:</p>
                            <ul className="text-xs space-y-0.5">
                              {confidence.reasons.map((reason, idx) => (
                                <li key={idx}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Weight Input */}
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          Weight (g)
                          {filament.diameter_nominal_mm && (
                            <span className="ml-2 text-xs text-primary">
                              ({filament.diameter_nominal_mm}mm × {getMaterialDensity(filament.material).toFixed(2)} g/cm³)
                            </span>
                          )}
                        </label>
                        <Input
                          type="number"
                          placeholder={`Estimated: ${suggestedWeight}g`}
                          value={weights[filament.id] || ""}
                          onChange={(e) => handleWeightChange(filament.id, e.target.value)}
                          className="w-32"
                          min="1"
                          step="1"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWeightChange(filament.id, suggestedWeight.toString())}
                        className="mt-5"
                        title={`Calculated from ${filament.diameter_nominal_mm || 1.75}mm diameter and ${getMaterialDensity(filament.material).toFixed(2)} g/cm³ density`}
                      >
                        Use Estimated
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(filament.id)}
                        disabled={isSaving || !weights[filament.id] || parseFloat(weights[filament.id]) <= 0}
                        className="mt-5"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default AdminEnrichment;
