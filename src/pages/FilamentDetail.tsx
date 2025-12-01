import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ExternalLink, ShoppingCart, ThermometerSun, Droplets, Settings, Package, Shield, Award, Gauge, Zap, Ruler, Wind, Flame, Snowflake, Clock, Printer, RefreshCw } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { useAuth } from "@/hooks/useAuth";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

const FilamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [filament, setFilament] = useState<Filament | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescrapingImage, setRescrapingImage] = useState(false);

  useEffect(() => {
    fetchFilament();
  }, [id]);

  const fetchFilament = async () => {
    try {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Not Found",
          description: "Filament not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
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

  const handleRescrapeImage = async () => {
    if (!id) return;
    
    setRescrapingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-images', {
        body: { 
          filamentIds: [id],
          forceRescrape: true
        }
      });

      if (error) throw error;

      toast({
        title: "Image rescrape completed",
        description: data.message || "Image rescraped successfully. Check edge function logs for details.",
        duration: 5000,
      });

      // Refresh filament data
      await fetchFilament();
    } catch (error: any) {
      toast({
        title: "Rescrape failed",
        description: error.message || "Failed to rescrape image. Check edge function logs for details.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setRescrapingImage(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
        <Button variant="ghost" asChild className="mb-6 hover:bg-accent/50 transition-colors">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finder
          </Link>
        </Button>

        {/* Hero Section */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 border-border shadow-lg mb-8 overflow-hidden animate-fade-in">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Product Image */}
              <div className="w-full lg:w-72 h-72 flex-shrink-0 relative">
                {filament.featured_image ? (
                  <img
                    src={filament.featured_image}
                    alt={filament.product_title}
                    className="w-full h-full object-contain rounded-xl bg-muted/50 border border-border p-4 hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full rounded-xl bg-muted/50 border border-border flex items-center justify-center p-6"
                  style={{ display: filament.featured_image ? 'none' : 'flex' }}
                >
                  {getBrandLogo(filament.vendor) ? (
                    <img
                      src={getBrandLogo(filament.vendor)!}
                      alt={filament.vendor || 'Brand logo'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRescrapeImage}
                    disabled={rescrapingImage}
                    className="absolute bottom-2 right-2 gap-2"
                    title="Rescrape product image with detailed logging"
                  >
                    <RefreshCw className={`w-4 h-4 ${rescrapingImage ? 'animate-spin' : ''}`} />
                    {rescrapingImage ? 'Scraping...' : 'Rescrape Image'}
                  </Button>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight">
                        {filament.product_title}
                      </h1>
                      <Link 
                        to={`/brands/${encodeURIComponent(filament.vendor || '')}`}
                        className="text-xl text-primary hover:underline inline-flex items-center gap-2 group"
                      >
                        {filament.vendor}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                    {pricePerKg && (
                      <div className="text-right bg-primary/10 px-6 py-4 rounded-xl border border-primary/20">
                        <div className="text-4xl font-bold text-primary">
                          ${pricePerKg}
                        </div>
                        <div className="text-sm text-muted-foreground">per kg</div>
                        {filament.variant_price && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ${filament.variant_price} total
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap">
                    {filament.material && (
                      <Badge variant="default" className="text-base px-4 py-1.5 font-semibold">
                        {filament.material}
                      </Badge>
                    )}
                    {filament.diameter_nominal_mm && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5">
                        {filament.diameter_nominal_mm}mm
                      </Badge>
                    )}
                    {filament.color_family && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5 flex items-center gap-2">
                        {filament.color_hex && (
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: filament.color_hex }} />
                        )}
                        {filament.color_family}
                      </Badge>
                    )}
                    {filament.finish_type && (
                      <Badge variant="secondary" className="text-sm px-3 py-1.5">{filament.finish_type}</Badge>
                    )}
                    {filament.is_nozzle_abrasive && (
                      <Badge variant="destructive" className="text-sm px-3 py-1.5 animate-pulse">⚠️ Abrasive</Badge>
                    )}
                    {filament.net_weight_g && (
                      <Badge variant="outline" className="text-sm px-3 py-1.5">
                        <Package className="w-3 h-3 mr-1" />
                        {filament.net_weight_g}g
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Scores */}
                {(filament.ease_of_printing_score || filament.strength_index || filament.value_score) && (
                  <div className="grid grid-cols-3 gap-4">
                    {filament.ease_of_printing_score && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Zap className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.ease_of_printing_score}/10</div>
                        <div className="text-xs text-muted-foreground">Ease of Printing</div>
                      </div>
                    )}
                    {filament.strength_index && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Award className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.strength_index}/10</div>
                        <div className="text-xs text-muted-foreground">Strength Index</div>
                      </div>
                    )}
                    {filament.value_score && (
                      <div className="bg-accent/30 rounded-lg p-4 text-center">
                        <Gauge className="w-5 h-5 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{filament.value_score}/10</div>
                        <div className="text-xs text-muted-foreground">Value Score</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <LikeButton filamentId={filament.id} size="lg" />
                  {filament.product_url && (
                    <Button asChild variant="default" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy from {filament.vendor}
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_us && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.amazon_link_us} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Amazon US
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_uk && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.amazon_link_uk} target="_blank" rel="noopener noreferrer">
                        Amazon UK
                      </a>
                    </Button>
                  )}
                  {filament.amazon_link_de && (
                    <Button asChild variant="outline" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.amazon_link_de} target="_blank" rel="noopener noreferrer">
                        Amazon DE
                      </a>
                    </Button>
                  )}
                  {filament.tds_url && (
                    <Button asChild variant="secondary" size="lg" className="hover:scale-105 transition-transform">
                      <a href={filament.tds_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Technical Data Sheet
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="specs" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="specs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4 mr-2" />
              Technical Specs
            </TabsTrigger>
            <TabsTrigger value="printing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Printer className="w-4 h-4 mr-2" />
              Print Settings
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Award className="w-4 h-4 mr-2" />
              Material Properties
            </TabsTrigger>
            <TabsTrigger value="compatibility" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Compatibility
            </TabsTrigger>
          </TabsList>

          {/* Technical Specs Tab */}
          <TabsContent value="specs" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Physical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="w-5 h-5 text-primary" />
                    Physical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.diameter_nominal_mm && (
                    <PropertyRow label="Filament Diameter" value={`${filament.diameter_nominal_mm} mm`} icon={<Ruler className="w-4 h-4" />} />
                  )}
                  {filament.net_weight_g && (
                    <PropertyRow label="Net Weight" value={`${filament.net_weight_g}g (${(filament.net_weight_g / 1000).toFixed(2)}kg)`} icon={<Package className="w-4 h-4" />} />
                  )}
                  {filament.density_g_cm3 && (
                    <PropertyRow label="Material Density" value={`${filament.density_g_cm3} g/cm³`} />
                  )}
                  {filament.dimensional_accuracy_score && (
                    <PropertyRow label="Dimensional Accuracy" value={`${filament.dimensional_accuracy_score}/10`} highlight />
                  )}
                </CardContent>
              </Card>

              {/* Spool Dimensions */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-primary" />
                    Spool Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.spool_outer_d_mm && (
                    <PropertyRow label="Outer Diameter" value={`${filament.spool_outer_d_mm} mm`} />
                  )}
                  {filament.spool_width_mm && (
                    <PropertyRow label="Spool Width" value={`${filament.spool_width_mm} mm`} />
                  )}
                  {filament.spool_ams_fit !== null && (
                    <PropertyRow 
                      label="AMS/MMU Compatible" 
                      value={filament.spool_ams_fit ? "✓ Yes" : "✗ No"} 
                      highlight={filament.spool_ams_fit}
                    />
                  )}
                  {filament.color_hex && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Color Code</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                          style={{ backgroundColor: filament.color_hex }}
                        />
                        <span className="text-sm font-mono text-foreground">{filament.color_hex}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-primary" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.product_id && (
                    <PropertyRow label="Product ID" value={filament.product_id} />
                  )}
                  {filament.variant_sku && (
                    <PropertyRow label="SKU" value={filament.variant_sku} />
                  )}
                  {filament.variant_available !== null && (
                    <PropertyRow 
                      label="Stock Status" 
                      value={filament.variant_available ? "✓ In Stock" : "✗ Out of Stock"} 
                      highlight={filament.variant_available}
                    />
                  )}
                  {filament.published_at && (
                    <PropertyRow 
                      label="Published" 
                      value={new Date(filament.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} 
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Indexes */}
            {(filament.printability_index || filament.strength_index || filament.value_score) && (
              <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Performance Indexes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {filament.printability_index && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.printability_index}/10</div>
                        <div className="text-sm text-muted-foreground">Printability</div>
                      </div>
                    )}
                    {filament.ease_of_printing_score && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.ease_of_printing_score}/10</div>
                        <div className="text-sm text-muted-foreground">Ease of Use</div>
                      </div>
                    )}
                    {filament.strength_index && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.strength_index}/10</div>
                        <div className="text-sm text-muted-foreground">Strength</div>
                      </div>
                    )}
                    {filament.value_score && (
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">{filament.value_score}/10</div>
                        <div className="text-sm text-muted-foreground">Value</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Print Settings Tab */}
          <TabsContent value="printing" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Temperature Settings */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flame className="w-5 h-5 text-primary" />
                    Temperature Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(filament.nozzle_temp_min_c || filament.nozzle_temp_max_c) && (
                    <PropertyRow
                      label="Nozzle Temperature Range"
                      value={`${filament.nozzle_temp_min_c || "?"} - ${filament.nozzle_temp_max_c || "?"}°C`}
                      icon={<ThermometerSun className="w-4 h-4" />}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                      highlight
                    />
                  )}
                  {(filament.bed_temp_min_c || filament.bed_temp_max_c) && (
                    <PropertyRow
                      label="Bed Temperature Range"
                      value={`${filament.bed_temp_min_c || "?"} - ${filament.bed_temp_max_c || "?"}°C`}
                      icon={<Flame className="w-4 h-4" />}
                    />
                  )}
                  {filament.tg_c && (
                    <PropertyRow label="Glass Transition (Tg)" value={`${filament.tg_c}°C`} />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow label="Melt Temperature" value={`${filament.melt_temp_c}°C`} />
                  )}
                </CardContent>
              </Card>

              {/* Print Parameters */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    Print Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.print_speed_max_mms && (
                    <PropertyRow
                      label="Maximum Print Speed"
                      value={`${filament.print_speed_max_mms} mm/s`}
                      icon={<Gauge className="w-4 h-4" />}
                    />
                  )}
                  {(filament.fan_min_percent !== null || filament.fan_max_percent !== null) && (
                    <PropertyRow
                      label="Cooling Fan Range"
                      value={`${filament.fan_min_percent || 0}% - ${filament.fan_max_percent || 100}%`}
                      icon={<Wind className="w-4 h-4" />}
                    />
                  )}
                  {filament.recommended_nozzle_type && (
                    <PropertyRow
                      label="🎯 Recommended Nozzle"
                      value={filament.recommended_nozzle_type}
                      highlight
                    />
                  )}
                  {filament.is_nozzle_abrasive !== null && (
                    <PropertyRow
                      label="Nozzle Requirement"
                      value={filament.is_nozzle_abrasive ? "⚠️ Hardened Steel Required" : "✓ Brass Compatible"}
                      highlight={!filament.is_nozzle_abrasive}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Moisture & Care */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Droplets className="w-5 h-5 text-primary" />
                    Moisture Management & Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    {filament.moisture_sensitivity_level && (
                      <PropertyRow
                        label="Moisture Sensitivity"
                        value={filament.moisture_sensitivity_level}
                        icon={<Droplets className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_temp_c && (
                      <PropertyRow
                        label="Drying Temperature"
                        value={`${filament.drying_temp_c}°C`}
                        icon={<ThermometerSun className="w-4 h-4" />}
                      />
                    )}
                    {filament.drying_time_hours && (
                      <PropertyRow
                        label="Drying Duration"
                        value={`${filament.drying_time_hours} hours`}
                        icon={<Clock className="w-4 h-4" />}
                      />
                    )}
                  </div>
                  {(filament.moisture_care || filament.nozzle_care) && (
                    <div className="md:col-span-2 space-y-4">
                      {filament.moisture_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-primary" />
                            Storage Instructions
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.moisture_care}</p>
                        </div>
                      )}
                      {filament.nozzle_care && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-primary" />
                            Nozzle Care Tips
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{filament.nozzle_care}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Material Properties Tab */}
          <TabsContent value="properties" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mechanical Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-primary" />
                    Mechanical Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.tensile_strength_xy_mpa && (
                    <PropertyRow
                      label="Tensile Strength (XY)"
                      value={`${filament.tensile_strength_xy_mpa} MPa`}
                      highlight
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
                      value={`${filament.shore_hardness_d}D`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Thermal Properties */}
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ThermometerSun className="w-5 h-5 text-primary" />
                    Thermal Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filament.tg_c && (
                    <PropertyRow
                      label="Glass Transition Temp"
                      value={`${filament.tg_c}°C`}
                      highlight
                    />
                  )}
                  {filament.melt_temp_c && (
                    <PropertyRow
                      label="Melt Temperature"
                      value={`${filament.melt_temp_c}°C`}
                    />
                  )}
                  {filament.nozzle_temp_sweetspot_c && (
                    <PropertyRow
                      label="Optimal Print Temp"
                      value={`${filament.nozzle_temp_sweetspot_c}°C`}
                    />
                  )}
                  {filament.bed_temp_min_c && filament.bed_temp_max_c && (
                    <PropertyRow
                      label="Recommended Bed Temp"
                      value={`${Math.round((filament.bed_temp_min_c + filament.bed_temp_max_c) / 2)}°C`}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Application Tags */}
              <Card className="bg-card border-border md:col-span-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-primary" />
                    Applications & Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filament.use_case_tags && filament.use_case_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Recommended Use Cases</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.use_case_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.industry_tags && filament.industry_tags.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-3 font-medium">Industries & Applications</span>
                      <div className="flex flex-wrap gap-2">
                        {filament.industry_tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-sm px-3 py-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {filament.food_contact_rating && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">Food Contact Rating</h4>
                      <p className="text-sm text-muted-foreground capitalize">{filament.food_contact_rating}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility" className="space-y-6 animate-fade-in">
            <Card className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Printer & Equipment Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompatibilityCard
                    label="Brass Nozzle"
                    value={!filament.is_nozzle_abrasive}
                    description={filament.is_nozzle_abrasive ? "Requires hardened steel nozzle" : "Safe with standard brass nozzles"}
                    icon={<Settings className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="AMS/MMU"
                    value={filament.spool_ams_fit}
                    description={filament.spool_ams_fit ? "Compatible with AMS/MMU systems" : "May not fit standard AMS"}
                    icon={<Package className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Food Safe"
                    value={filament.food_contact_rating === "approved"}
                    description={filament.food_contact_rating || "Rating unknown"}
                    icon={<Shield className="w-5 h-5" />}
                  />
                  <CompatibilityCard
                    label="Easy to Print"
                    value={filament.ease_of_printing_score ? filament.ease_of_printing_score >= 7 : null}
                    description={filament.ease_of_printing_score ? `Score: ${filament.ease_of_printing_score}/10` : "Not rated"}
                    icon={<Zap className="w-5 h-5" />}
                  />
                </div>

                <Separator />

                {/* Recommended Setup */}
                <div className="grid md:grid-cols-2 gap-4">
                  {filament.recommended_nozzle_type && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Recommended Nozzle
                      </h4>
                      <p className="text-foreground font-medium">{filament.recommended_nozzle_type}</p>
                    </div>
                  )}
                  {filament.moisture_sensitivity_level && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-primary" />
                        Storage Requirements
                      </h4>
                      <p className="text-foreground font-medium capitalize">{filament.moisture_sensitivity_level} Sensitivity</p>
                      {filament.drying_temp_c && filament.drying_time_hours && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Dry at {filament.drying_temp_c}°C for {filament.drying_time_hours}h if exposed
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {(filament.spool_outer_d_mm || filament.spool_width_mm) && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3">Spool Dimensions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {filament.spool_outer_d_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Outer Diameter</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_outer_d_mm}mm</p>
                        </div>
                      )}
                      {filament.spool_width_mm && (
                        <div>
                          <p className="text-sm text-muted-foreground">Width</p>
                          <p className="text-lg font-semibold text-foreground">{filament.spool_width_mm}mm</p>
                        </div>
                      )}
                    </div>
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



const PropertyRow = ({ 
  label, 
  value, 
  highlight = false,
  icon
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-primary/5 px-3 rounded-lg border border-primary/20' : ''}`}>
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </span>
    <span className={`text-sm font-medium ${highlight ? 'text-primary font-semibold' : 'text-foreground'}`}>{value}</span>
  </div>
);

const CompatibilityCard = ({ 
  label, 
  value, 
  description,
  icon
}: { 
  label: string; 
  value?: boolean | null; 
  description: string;
  icon?: React.ReactNode;
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
    <div className={`p-4 rounded-lg border ${getStatusColor()} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {label}
        </span>
        <span className="text-xl font-bold">
          {getStatusIcon()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FilamentDetail;