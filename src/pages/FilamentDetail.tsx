import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, ShoppingCart } from "lucide-react";
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
      navigate("/finder");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/finder">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finder
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2 p-6 bg-card border-border">
            <div className="flex items-start gap-4 mb-6">
              {filament.featured_image && (
                <img
                  src={filament.featured_image}
                  alt={filament.product_title}
                  className="w-24 h-24 object-contain rounded-lg bg-muted"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {filament.product_title}
                </h1>
                <p className="text-muted-foreground mb-3">{filament.vendor}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{filament.material}</Badge>
                  {filament.color_family && (
                    <Badge variant="outline">{filament.color_family}</Badge>
                  )}
                  {filament.finish_type && (
                    <Badge variant="outline">{filament.finish_type}</Badge>
                  )}
                </div>
              </div>
              {filament.variant_price && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    ${filament.variant_price}
                  </div>
                  <div className="text-sm text-muted-foreground">per kg</div>
                </div>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3 mb-8">
              {filament.product_url && (
                <Button asChild variant="default">
                  <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy from Vendor
                  </a>
                </Button>
              )}
              {filament.amazon_link_us && (
                <Button asChild variant="outline">
                  <a href={filament.amazon_link_us} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Amazon US
                  </a>
                </Button>
              )}
              {filament.tds_url && (
                <Button asChild variant="outline">
                  <a href={filament.tds_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Tech Data Sheet
                  </a>
                </Button>
              )}
            </div>

            {/* Mechanical Properties */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Mechanical Properties
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filament.tensile_strength_xy_mpa && (
                  <PropertyItem
                    label="Tensile Strength (XY)"
                    value={`${filament.tensile_strength_xy_mpa} MPa`}
                  />
                )}
                {filament.tensile_modulus_xy_mpa && (
                  <PropertyItem
                    label="Tensile Modulus (XY)"
                    value={`${filament.tensile_modulus_xy_mpa} MPa`}
                  />
                )}
                {filament.flexural_strength_mpa && (
                  <PropertyItem
                    label="Flexural Strength"
                    value={`${filament.flexural_strength_mpa} MPa`}
                  />
                )}
                {filament.elongation_break_xy_percent && (
                  <PropertyItem
                    label="Elongation at Break"
                    value={`${filament.elongation_break_xy_percent}%`}
                  />
                )}
                {filament.shore_hardness_d && (
                  <PropertyItem
                    label="Shore Hardness (D)"
                    value={`${filament.shore_hardness_d}`}
                  />
                )}
              </div>
            </div>

            {/* Thermal Properties */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Thermal Properties
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filament.tg_c && (
                  <PropertyItem label="Glass Transition Temp (Tg)" value={`${filament.tg_c}°C`} />
                )}
                {filament.melt_temp_c && (
                  <PropertyItem label="Melt Temperature" value={`${filament.melt_temp_c}°C`} />
                )}
              </div>
            </div>

            {/* Print Settings */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Print Settings
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                  <PropertyItem
                    label="Nozzle Temperature"
                    value={`${filament.nozzle_temp_min_c || "?"} - ${filament.nozzle_temp_max_c || "?"}°C`}
                  />
                )}
                {filament.nozzle_temp_sweetspot_c && (
                  <PropertyItem
                    label="Nozzle Sweet Spot"
                    value={`${filament.nozzle_temp_sweetspot_c}°C`}
                  />
                )}
                {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                  <PropertyItem
                    label="Bed Temperature"
                    value={`${filament.bed_temp_min_c || "?"} - ${filament.bed_temp_max_c || "?"}°C`}
                  />
                )}
                {filament.print_speed_max_mms && (
                  <PropertyItem
                    label="Max Print Speed"
                    value={`${filament.print_speed_max_mms} mm/s`}
                  />
                )}
                {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                  <PropertyItem
                    label="Fan Speed"
                    value={`${filament.fan_min_percent || 0} - ${filament.fan_max_percent || 100}%`}
                  />
                )}
              </div>
            </div>

            {/* Physical Properties */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Physical Properties
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {filament.density_g_cm3 && (
                  <PropertyItem label="Density" value={`${filament.density_g_cm3} g/cm³`} />
                )}
                {filament.diameter_nominal_mm && (
                  <PropertyItem label="Diameter" value={`${filament.diameter_nominal_mm} mm`} />
                )}
                {filament.net_weight_g && (
                  <PropertyItem label="Net Weight" value={`${filament.net_weight_g}g`} />
                )}
                {filament.spool_outer_d_mm && (
                  <PropertyItem
                    label="Spool Outer Diameter"
                    value={`${filament.spool_outer_d_mm} mm`}
                  />
                )}
                {filament.spool_width_mm && (
                  <PropertyItem label="Spool Width" value={`${filament.spool_width_mm} mm`} />
                )}
              </div>
            </div>
          </Card>

          {/* Sidebar - Scores & Compatibility */}
          <div className="space-y-6">
            {/* Scores */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">Scores</h2>
              {filament.ease_of_printing_score && (
                <ScoreBar label="Ease of Printing" score={filament.ease_of_printing_score} />
              )}
              {filament.strength_index && (
                <ScoreBar label="Strength Index" score={filament.strength_index} />
              )}
              {filament.printability_index && (
                <ScoreBar label="Printability" score={filament.printability_index} />
              )}
              {filament.value_score && (
                <ScoreBar label="Value Score" score={filament.value_score} />
              )}
            </Card>

            {/* Compatibility */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Compatibility
              </h2>
              <div className="space-y-3">
                <CompatibilityItem
                  label="Brass Nozzle Safe"
                  value={!filament.is_nozzle_abrasive}
                />
                <CompatibilityItem label="AMS/MMU Friendly" value={filament.spool_ams_fit} />
                <CompatibilityItem
                  label="Food Contact Rated"
                  value={filament.food_contact_rating === "approved"}
                />
              </div>
              {filament.recommended_nozzle_type && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">Recommended Nozzle</div>
                  <div className="text-foreground font-medium">
                    {filament.recommended_nozzle_type}
                  </div>
                </div>
              )}
            </Card>

            {/* Care Instructions */}
            {(filament.drying_temp_c || filament.moisture_sensitivity_level) && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Care Instructions
                </h2>
                {filament.moisture_sensitivity_level && (
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground">Moisture Sensitivity</div>
                    <Badge variant="outline" className="mt-1">
                      {filament.moisture_sensitivity_level}
                    </Badge>
                  </div>
                )}
                {(filament.drying_temp_c || filament.drying_time_hours) && (
                  <div>
                    <div className="text-sm text-muted-foreground">Drying</div>
                    <div className="text-foreground">
                      {filament.drying_temp_c && `${filament.drying_temp_c}°C`}
                      {filament.drying_time_hours &&
                        ` for ${filament.drying_time_hours} hours`}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/30 p-3 rounded-lg">
    <div className="text-sm text-muted-foreground mb-1">{label}</div>
    <div className="text-foreground font-medium">{value}</div>
  </div>
);

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{score}/10</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
        style={{ width: `${(score / 10) * 100}%` }}
      />
    </div>
  </div>
);

const CompatibilityItem = ({ label, value }: { label: string; value?: boolean | null }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}</span>
    <Badge variant={value ? "default" : "secondary"}>
      {value === null || value === undefined ? "Unknown" : value ? "Yes" : "No"}
    </Badge>
  </div>
);

export default FilamentDetail;