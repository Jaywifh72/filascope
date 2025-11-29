import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const getSuggestedWeight = (diameter: number | null, material: string | null): number => {
    // Standard 1kg spool weights based on common sizes
    if (!diameter) return 1000;
    
    // Most common is 1kg for 1.75mm
    if (diameter >= 1.7 && diameter <= 1.8) return 1000;
    
    // 2.85mm/3.0mm filament is sometimes 750g or 1kg
    if (diameter >= 2.8 && diameter <= 3.0) return 1000;
    
    return 1000; // Default to 1kg
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
            <Button onClick={handleBulkSave} disabled={isSaving || Object.keys(weights).length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Save All ({Object.keys(weights).length})
            </Button>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Why is this important?</AlertTitle>
          <AlertDescription>
            Adding weight data allows accurate price per kg calculations, making it easier for users to compare filament values.
            Currently showing up to 50 filaments with pricing but missing weight data.
          </AlertDescription>
        </Alert>

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
                    <div className="text-sm">
                      <p className="text-muted-foreground">Price:</p>
                      <p className="font-semibold text-foreground">${filament.variant_price.toFixed(2)}</p>
                    </div>

                    {/* Weight Input */}
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Weight (g)</label>
                        <Input
                          type="number"
                          placeholder={`Suggested: ${suggestedWeight}g`}
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
                      >
                        Use Suggested
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
  );
};

export default AdminEnrichment;
