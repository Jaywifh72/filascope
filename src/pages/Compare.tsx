import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GitCompare, ArrowLeft, ExternalLink } from "lucide-react";
import { getBrandLogo } from "@/lib/brandLogos";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilaments = async () => {
      const ids = searchParams.get("ids")?.split(",") || [];
      
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .in("id", ids);

      if (error) {
        console.error("Error fetching filaments:", error);
      } else {
        setFilaments(data || []);
      }
      setLoading(false);
    };

    fetchFilaments();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading filaments...</p>
      </div>
    );
  }

  if (filaments.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/finder")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finder
          </Button>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GitCompare className="w-6 h-6 text-primary" />
                Select Filaments to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>No filaments selected for comparison</p>
                <p className="text-sm mt-2">Select filaments from the Finder page to compare their properties</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getPricePerKg = (price: number | null, weight: number | null) => {
    if (!price || !weight) return null;
    return ((price / weight) * 1000).toFixed(2);
  };

  const ComparisonRow = ({ 
    label, 
    values, 
    unit = "",
    highlight = false 
  }: { 
    label: string; 
    values: (string | number | null)[]; 
    unit?: string;
    highlight?: boolean;
  }) => (
    <div className={`grid gap-4 py-3 ${highlight ? "bg-accent/50" : ""}`} style={{ gridTemplateColumns: `200px repeat(${filaments.length}, 1fr)` }}>
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      {values.map((value, idx) => (
        <div key={idx} className="text-sm">
          {value !== null && value !== undefined ? `${value}${unit}` : "—"}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/finder")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Finder
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compare Filaments</h1>
          <p className="text-muted-foreground">Side-by-side comparison of {filaments.length} filaments</p>
        </div>

        {/* Filament Headers */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${filaments.length}, 1fr)` }}>
          <div></div>
          {filaments.map((filament) => (
            <Card key={filament.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filament.vendor && getBrandLogo(filament.vendor) && (
                    <div className="flex justify-center">
                      <img
                        src={getBrandLogo(filament.vendor)!}
                        alt={filament.vendor}
                        className="h-12 object-contain"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-lg line-clamp-2">{filament.product_title}</h3>
                  <div className="space-y-2">
                    {filament.vendor && <Badge variant="secondary">{filament.vendor}</Badge>}
                    {filament.material && <Badge variant="outline">{filament.material}</Badge>}
                  </div>
                  {filament.variant_price && filament.net_weight_g && (
                    <div className="text-2xl font-bold text-primary">
                      ${getPricePerKg(filament.variant_price, filament.net_weight_g)} <span className="text-sm font-medium">USD/kg</span>
                    </div>
                  )}
                  {filament.product_url && (
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                        View Product <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Print Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Nozzle Temp Min" 
              values={filaments.map(f => f.nozzle_temp_min_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Nozzle Temp Max" 
              values={filaments.map(f => f.nozzle_temp_max_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Nozzle Temp Sweetspot" 
              values={filaments.map(f => f.nozzle_temp_sweetspot_c)} 
              unit="°C"
              highlight
            />
            <Separator />
            <ComparisonRow 
              label="Bed Temp Min" 
              values={filaments.map(f => f.bed_temp_min_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Bed Temp Max" 
              values={filaments.map(f => f.bed_temp_max_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Max Print Speed" 
              values={filaments.map(f => f.print_speed_max_mms)} 
              unit=" mm/s"
            />
            <Separator />
            <ComparisonRow 
              label="Fan Min" 
              values={filaments.map(f => f.fan_min_percent)} 
              unit="%"
            />
            <Separator />
            <ComparisonRow 
              label="Fan Max" 
              values={filaments.map(f => f.fan_max_percent)} 
              unit="%"
            />
          </CardContent>
        </Card>

        {/* Material Properties */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Tensile Strength (XY)" 
              values={filaments.map(f => f.tensile_strength_xy_mpa)} 
              unit=" MPa"
            />
            <Separator />
            <ComparisonRow 
              label="Tensile Modulus (XY)" 
              values={filaments.map(f => f.tensile_modulus_xy_mpa)} 
              unit=" MPa"
            />
            <Separator />
            <ComparisonRow 
              label="Elongation at Break" 
              values={filaments.map(f => f.elongation_break_xy_percent)} 
              unit="%"
            />
            <Separator />
            <ComparisonRow 
              label="Flexural Strength" 
              values={filaments.map(f => f.flexural_strength_mpa)} 
              unit=" MPa"
            />
            <Separator />
            <ComparisonRow 
              label="Shore Hardness D" 
              values={filaments.map(f => f.shore_hardness_d)} 
            />
            <Separator />
            <ComparisonRow 
              label="Glass Transition Temp" 
              values={filaments.map(f => f.tg_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Density" 
              values={filaments.map(f => f.density_g_cm3)} 
              unit=" g/cm³"
            />
          </CardContent>
        </Card>

        {/* Scores & Ratings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Ease of Printing" 
              values={filaments.map(f => f.ease_of_printing_score)} 
              unit="/10"
            />
            <Separator />
            <ComparisonRow 
              label="Dimensional Accuracy" 
              values={filaments.map(f => f.dimensional_accuracy_score)} 
              unit="/10"
            />
            <Separator />
            <ComparisonRow 
              label="Strength Index" 
              values={filaments.map(f => f.strength_index)} 
            />
            <Separator />
            <ComparisonRow 
              label="Printability Index" 
              values={filaments.map(f => f.printability_index)} 
            />
            <Separator />
            <ComparisonRow 
              label="Value Score" 
              values={filaments.map(f => f.value_score)} 
            />
          </CardContent>
        </Card>

        {/* Spool Specifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Spool Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Net Weight" 
              values={filaments.map(f => f.net_weight_g)} 
              unit="g"
            />
            <Separator />
            <ComparisonRow 
              label="Diameter" 
              values={filaments.map(f => f.diameter_nominal_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="Spool Outer Diameter" 
              values={filaments.map(f => f.spool_outer_d_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="Spool Width" 
              values={filaments.map(f => f.spool_width_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="AMS Compatible" 
              values={filaments.map(f => f.spool_ams_fit !== null ? (f.spool_ams_fit ? "Yes" : "No") : null)} 
            />
          </CardContent>
        </Card>

        {/* Compatibility & Care */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compatibility & Care</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Nozzle Abrasive" 
              values={filaments.map(f => f.is_nozzle_abrasive !== null ? (f.is_nozzle_abrasive ? "Yes" : "No") : null)} 
            />
            <Separator />
            <ComparisonRow 
              label="Recommended Nozzle" 
              values={filaments.map(f => f.recommended_nozzle_type)} 
            />
            <Separator />
            <ComparisonRow 
              label="Food Contact Rating" 
              values={filaments.map(f => f.food_contact_rating)} 
            />
            <Separator />
            <ComparisonRow 
              label="Drying Temperature" 
              values={filaments.map(f => f.drying_temp_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Drying Time" 
              values={filaments.map(f => f.drying_time_hours)} 
              unit=" hours"
            />
            <Separator />
            <ComparisonRow 
              label="Moisture Sensitivity" 
              values={filaments.map(f => f.moisture_sensitivity_level)} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compare;
