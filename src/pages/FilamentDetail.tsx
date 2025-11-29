import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, ShoppingCart, ThermometerSun, Droplets, Settings, Package, Shield, Star } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilament();
  }, [id]);

  const fetchFilament = async () => {
    try {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFilament(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load filament details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading filament details...</div>
      </div>
    );
  }

  if (!filament) return null;

  const pricePerKg = filament.variant_price && filament.net_weight_g
    ? ((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finder
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {filament.featured_image && (
                  <div className="w-full md:w-48 h-48 flex-shrink-0">
                    <img
                      src={filament.featured_image}
                      alt={filament.product_title}
                      className="w-full h-full object-contain rounded-lg bg-muted border border-border"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/200?text=No+Image";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                        {filament.product_title}
                      </h1>
                      <p className="text-xl text-muted-foreground mb-3">{filament.vendor}</p>
                    </div>
                    {pricePerKg && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          ${pricePerKg}
                        </div>
                        <div className="text-sm text-muted-foreground">per kg</div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap mb-6">
                    {filament.material && !filament.material.startsWith('http') && !filament.material.startsWith('www.') && (
                      <Badge variant="default" className="text-sm px-3 py-1">{filament.material}</Badge>
                    )}
                    {filament.diameter_nominal_mm && (
                      <Badge variant="outline" className="text-sm px-3 py-1">{filament.diameter_nominal_mm}mm</Badge>
                    )}
                    {filament.color_family && !filament.color_family.startsWith('http') && !filament.color_family.startsWith('www.') && (
                      <Badge variant="outline" className="text-sm px-3 py-1">{filament.color_family}</Badge>
                    )}
                    {filament.finish_type && !filament.finish_type.startsWith('http') && !filament.finish_type.startsWith('www.') && !isFinite(Number(filament.finish_type)) && (
                      <Badge variant="outline" className="text-sm px-3 py-1">{filament.finish_type}</Badge>
                    )}
                    {filament.is_nozzle_abrasive && (
                      <Badge variant="destructive" className="text-sm px-3 py-1">Abrasive</Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {filament.product_url && (
                      <Button asChild variant="default" size="lg">
                        <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy from Store
                        </a>
                      </Button>
                    )}
                    {/* Check multiple fields for Amazon URL due to data inconsistency */}
                    {(filament.amazon_link_us || 
                      (filament.material?.startsWith('http') && filament.material.includes('amazon')) ||
                      (filament.color_family?.startsWith('http') && filament.color_family.includes('amazon')) ||
                      (filament.finish_type?.startsWith('http') && filament.finish_type.includes('amazon'))) && (
                      <Button asChild variant="amazon" size="lg">
                        <a href={
                          filament.amazon_link_us || 
                          (filament.material?.startsWith('http') ? filament.material : '') ||
                          (filament.color_family?.startsWith('http') ? filament.color_family : '') ||
                          (filament.finish_type?.startsWith('http') ? filament.finish_type : '')
                        } target="_blank" rel="noopener noreferrer">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          View on Amazon
                        </a>
                      </Button>
                    )}
                    {filament.tds_url && (
                      <Button asChild variant="outline" size="lg">
                        <a href={filament.tds_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Tech Data Sheet
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Performance Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filament.ease_of_printing_score && (
                <ScoreBar label="Ease of Printing" score={filament.ease_of_printing_score} />
              )}
              {filament.strength_index && (
                <ScoreBar label="Strength Index" score={filament.strength_index} />
              )}
              {filament.printability_index && (
                <ScoreBar label="Printability" score={filament.printability_index} />
              )}
              {filament.dimensional_accuracy_score && (
                <ScoreBar label="Dimensional Accuracy" score={filament.dimensional_accuracy_score} />
              )}
              {filament.value_score && (
                <ScoreBar label="Value Score" score={filament.value_score} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="specs" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="specs">Technical Specs</TabsTrigger>
            <TabsTrigger value="printing">Print Settings</TabsTrigger>
            <TabsTrigger value="properties">Material Properties</TabsTrigger>
            <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          </TabsList>

          {/* Technical Specs Tab */}
          <TabsContent value="specs" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Physical Properties */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    Physical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filament.diameter_nominal_mm && (
                    <PropertyRow label="Diameter" value={`${filament.diameter_nominal_mm} mm`} />
                  )}
                  {filament.net_weight_g && (
                    <PropertyRow label="Net Weight" value={`${filament.net_weight_g}g`} />
                  )}
                  {filament.density_g_cm3 && (
                    <PropertyRow label="Density" value={`${filament.density_g_cm3} g/cm³`} />
                  )}
                  {filament.spool_outer_d_mm && (
                    <PropertyRow label="Spool Outer Diameter" value={`${filament.spool_outer_d_mm} mm`} />
                  )}
                  {filament.spool_width_mm && (
                    <PropertyRow label="Spool Width" value={`${filament.spool_width_mm} mm`} />
                  )}
                  {filament.color_hex && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Color</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: filament.color_hex }}
                        />
                        <span className="text-sm font-medium text-foreground">{filament.color_hex}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Spool Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filament.product_id && (
                    <PropertyRow label="Product ID" value={filament.product_id} />
                  )}
                  {filament.variant_sku && (
                    <PropertyRow label="SKU" value={filament.variant_sku} />
                  )}
                  {filament.variant_price && (
                    <PropertyRow label="Price" value={`$${filament.variant_price}`} />
                  )}
                  {filament.variant_available !== null && (
                    <PropertyRow 
                      label="Availability" 
                      value={filament.variant_available ? "In Stock" : "Out of Stock"} 
                    />
                  )}
                  {filament.published_at && (
                    <PropertyRow 
                      label="Published" 
                      value={new Date(filament.published_at).toLocaleDateString()} 
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Print Settings Tab */}
          <TabsContent value="printing" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Temperature Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ThermometerSun className="w-5 h-5" />
                    Temperature Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                    <PropertyRow
                      label="Nozzle Temperature"
                      value={`${filament.nozzle_temp_min_c || "?"} - ${filament.nozzle_temp_max_c || "?"}°C`}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="Nozzle Sweet Spot"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                      highlight
                    />
                  )}
                  {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                    <PropertyRow
                      label="Bed Temperature"
                      value={`${filament.bed_temp_min_c || "?"} - ${filament.bed_temp_max_c || "?"}°C`}
                    />
                  )}
                  {filament.tg_c && (
                    <PropertyRow label="Glass Transition Temp (Tg)" value={`${filament.tg_c}°C`} />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow label="Melt Temperature" value={`${filament.melt_temp_c}°C`} />
                  )}
                </CardContent>
              </Card>

              {/* Print Parameters */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Print Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filament.print_speed_max_mms && (
                    <PropertyRow
                      label="Max Print Speed"
                      value={`${filament.print_speed_max_mms} mm/s`}
                    />
                  )}
                  {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                    <PropertyRow
                      label="Fan Speed"
                      value={`${filament.fan_min_percent || 0} - ${filament.fan_max_percent || 100}%`}
                    />
                  )}
                  {filament.recommended_nozzle_type && (
                    <PropertyRow
                      label="Recommended Nozzle"
                      value={filament.recommended_nozzle_type}
                      highlight
                    />
                  )}
                  {filament.nozzle_care && (
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground block mb-1">Nozzle Care</span>
                      <p className="text-sm text-foreground">{filament.nozzle_care}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Moisture & Care */}
              <Card className="bg-card border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="w-5 h-5" />
                    Moisture & Care Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  {filament.moisture_sensitivity_level && (
                    <PropertyRow
                      label="Moisture Sensitivity"
                      value={filament.moisture_sensitivity_level}
                    />
                  )}
                  {filament.drying_temp_c && (
                    <PropertyRow
                      label="Drying Temperature"
                      value={`${filament.drying_temp_c}°C`}
                    />
                  )}
                  {filament.drying_time_hours && (
                    <PropertyRow
                      label="Drying Time"
                      value={`${filament.drying_time_hours} hours`}
                    />
                  )}
                  {filament.moisture_care && (
                    <div className="md:col-span-2 py-2">
                      <span className="text-sm text-muted-foreground block mb-1">Moisture Care Instructions</span>
                      <p className="text-sm text-foreground">{filament.moisture_care}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Material Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mechanical Properties */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Mechanical Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filament.tensile_strength_xy_mpa && (
                    <PropertyRow
                      label="Tensile Strength (XY)"
                      value={`${filament.tensile_strength_xy_mpa} MPa`}
                    />
                  )}
                  {filament.tensile_modulus_xy_mpa && (
                    <PropertyRow
                      label="Tensile Modulus (XY)"
                      value={`${filament.tensile_modulus_xy_mpa} MPa`}
                    />
                  )}
                  {filament.flexural_strength_mpa && (
                    <PropertyRow
                      label="Flexural Strength"
                      value={`${filament.flexural_strength_mpa} MPa`}
                    />
                  )}
                  {filament.elongation_break_xy_percent && (
                    <PropertyRow
                      label="Elongation at Break"
                      value={`${filament.elongation_break_xy_percent}%`}
                    />
                  )}
                  {filament.shore_hardness_d && (
                    <PropertyRow
                      label="Shore Hardness (D)"
                      value={`${filament.shore_hardness_d}`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Application Tags */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Applications & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filament.use_case_tags && filament.use_case_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Use Cases</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.use_case_tags
                          .filter((tag) => !tag.startsWith('http') && !tag.startsWith('www.'))
                          .map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                      </div>
                    </div>
                  )}
                  {filament.industry_tags && filament.industry_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Industries</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.industry_tags
                          .filter((tag) => !tag.startsWith('http') && !tag.startsWith('www.'))
                          .map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Printer & Equipment Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <CompatibilityCard
                    label="Brass Nozzle Safe"
                    value={!filament.is_nozzle_abrasive}
                    description={filament.is_nozzle_abrasive ? "Requires hardened nozzle" : "Safe with brass nozzles"}
                  />
                  <CompatibilityCard
                    label="AMS/MMU Friendly"
                    value={filament.spool_ams_fit}
                    description={filament.spool_ams_fit ? "Fits in AMS/MMU systems" : "May not fit standard AMS"}
                  />
                  <CompatibilityCard
                    label="Food Contact Safe"
                    value={filament.food_contact_rating === "approved"}
                    description={filament.food_contact_rating || "Unknown"}
                  />
                </div>

                <Separator />

                {filament.recommended_nozzle_type && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Recommended Setup</h4>
                    <p className="text-sm text-muted-foreground mb-1">Nozzle Type</p>
                    <p className="text-foreground">{filament.recommended_nozzle_type}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "from-emerald-500 to-green-500";
    if (score >= 6) return "from-blue-500 to-cyan-500";
    if (score >= 4) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{score.toFixed(1)}/10</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(score)} transition-all`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

const PropertyRow = ({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-primary/5 px-3 rounded-lg' : ''}`}>
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
  </div>
);

const CompatibilityCard = ({ 
  label, 
  value, 
  description 
}: { 
  label: string; 
  value?: boolean | null; 
  description: string;
}) => {
  const getStatusColor = () => {
    if (value === true) return "bg-emerald-500/10 border-emerald-500/30";
    if (value === false) return "bg-red-500/10 border-red-500/30";
    return "bg-muted border-border";
  };

  const getStatusIcon = () => {
    if (value === true) return "✓";
    if (value === false) return "✗";
    return "?";
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-lg font-bold">
          {getStatusIcon()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

export default FilamentDetail;