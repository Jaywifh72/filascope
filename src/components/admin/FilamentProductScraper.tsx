import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Loader2, Search, Save, AlertTriangle, CheckCircle, 
  Link2, Palette, Thermometer, Package, DollarSign,
  ExternalLink, FileText, Copy, RefreshCw
} from "lucide-react";

interface ScrapedFilament {
  product_title: string;
  vendor: string;
  material: string | null;
  color: string | null;
  color_hex: string | null;
  color_family: string | null;
  finish_type: string | null;
  variant_price: number | null;
  currency: string;
  variant_compare_at_price: number | null;
  diameter_nominal_mm: number;
  net_weight_g: number | null;
  transmission_distance: number | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  product_url: string;
  featured_image: string | null;
  tds_url: string | null;
  extraction_confidence: number;
}

interface AffiliateInfo {
  originalUrl: string;
  affiliateUrl: string;
  suggestion: {
    vendor_name: string;
    affiliate_url_pattern: string | null;
  } | null;
}

interface ExistingFilament {
  id: string;
  product_title: string;
  vendor: string;
  product_url: string | null;
}

export function FilamentProductScraper() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extracted, setExtracted] = useState<ScrapedFilament | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [existingFilament, setExistingFilament] = useState<ExistingFilament | null>(null);
  const [useAffiliate, setUseAffiliate] = useState(true);
  const [customAffiliateSuffix, setCustomAffiliateSuffix] = useState("");

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setExtracted(null);
    setAffiliate(null);
    setExistingFilament(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-filament-product', {
        body: { url: url.trim() }
      });

      if (error) throw error;

      if (data.success) {
        setExtracted(data.data);
        setAffiliate(data.affiliate);
        setExistingFilament(data.existingFilament);
        toast.success("Data extracted successfully");
      } else {
        toast.error(data.error || "Extraction failed");
      }
    } catch (err) {
      console.error('Scrape error:', err);
      toast.error("Failed to scrape URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extracted) return;

    setIsSaving(true);
    try {
      // Build the final URL with affiliate if enabled
      let finalUrl = extracted.product_url;
      if (useAffiliate && affiliate?.affiliateUrl) {
        finalUrl = affiliate.affiliateUrl;
      } else if (customAffiliateSuffix) {
        finalUrl = `${extracted.product_url}${extracted.product_url.includes('?') ? '&' : '?'}${customAffiliateSuffix}`;
      }

      const filamentData = {
        product_title: extracted.product_title,
        vendor: extracted.vendor,
        material: extracted.material,
        color_family: extracted.color_family,
        color_hex: extracted.color_hex,
        finish_type: extracted.finish_type,
        variant_price: extracted.variant_price,
        variant_compare_at_price: extracted.variant_compare_at_price,
        diameter_nominal_mm: extracted.diameter_nominal_mm || 1.75,
        net_weight_g: extracted.net_weight_g,
        transmission_distance: extracted.transmission_distance,
        nozzle_temp_min_c: extracted.nozzle_temp_min_c,
        nozzle_temp_max_c: extracted.nozzle_temp_max_c,
        bed_temp_min_c: extracted.bed_temp_min_c,
        bed_temp_max_c: extracted.bed_temp_max_c,
        product_url: finalUrl,
        featured_image: extracted.featured_image,
        tds_url: extracted.tds_url,
        auto_created: true,
        last_scraped_at: new Date().toISOString(),
      };

      if (existingFilament) {
        // Update existing
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existingFilament.id);

        if (error) throw error;
        toast.success("Filament updated successfully");
      } else {
        // Insert new
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);

        if (error) throw error;
        toast.success("Filament created successfully");
      }

      // Reset form
      setUrl("");
      setExtracted(null);
      setAffiliate(null);
      setExistingFilament(null);
    } catch (err) {
      console.error('Save error:', err);
      toast.error("Failed to save filament");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof ScrapedFilament>(field: K, value: ScrapedFilament[K]) => {
    if (extracted) {
      setExtracted({ ...extracted, [field]: value });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-500";
    if (confidence >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Scrape Product URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://bambulab.com/en/filament/pla-basic-jade-white"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
            <Button onClick={handleScrape} disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Scrape</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Filament Warning */}
      {existingFilament && (
        <Card className="border-yellow-500 bg-yellow-500/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Existing Filament Found</p>
                <p className="text-sm text-muted-foreground">
                  "{existingFilament.product_title}" by {existingFilament.vendor} already exists.
                  Saving will update the existing record.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Form */}
      {extracted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Input
                    value={extracted.vendor || ''}
                    onChange={(e) => updateField('vendor', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Material</Label>
                  <Input
                    value={extracted.material || ''}
                    onChange={(e) => updateField('material', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Product Title</Label>
                <Input
                  value={extracted.product_title || ''}
                  onChange={(e) => updateField('product_title', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Color</Label>
                  <Input
                    value={extracted.color || ''}
                    onChange={(e) => updateField('color', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color Hex</Label>
                  <div className="flex gap-2">
                    <Input
                      value={extracted.color_hex || ''}
                      onChange={(e) => updateField('color_hex', e.target.value)}
                      className="flex-1"
                    />
                    {extracted.color_hex && (
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: extracted.color_hex }}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label>Color Family</Label>
                  <Input
                    value={extracted.color_family || ''}
                    onChange={(e) => updateField('color_family', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Finish Type</Label>
                <Input
                  value={extracted.finish_type || ''}
                  onChange={(e) => updateField('finish_type', e.target.value)}
                  placeholder="Matte, Silk, Glossy..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-4 h-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extracted.variant_price || ''}
                    onChange={(e) => updateField('variant_price', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={extracted.currency || 'USD'}
                    onChange={(e) => updateField('currency', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Compare At</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extracted.variant_compare_at_price || ''}
                    onChange={(e) => updateField('variant_compare_at_price', parseFloat(e.target.value) || null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Diameter (mm)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extracted.diameter_nominal_mm || 1.75}
                    onChange={(e) => updateField('diameter_nominal_mm', parseFloat(e.target.value) || 1.75)}
                  />
                </div>
                <div>
                  <Label>Weight (g)</Label>
                  <Input
                    type="number"
                    value={extracted.net_weight_g || ''}
                    onChange={(e) => updateField('net_weight_g', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HueForge TD - Critical */}
          <Card className={extracted.transmission_distance ? "border-green-500" : "border-yellow-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4" />
                HueForge Data (Critical)
                {extracted.transmission_distance ? (
                  <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" /> TD Found
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto text-yellow-500 border-yellow-500">
                    <AlertTriangle className="w-3 h-3 mr-1" /> TD Missing
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Transmission Distance (TD) in mm</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={extracted.transmission_distance || ''}
                  onChange={(e) => updateField('transmission_distance', parseFloat(e.target.value) || null)}
                  placeholder="e.g., 4.2"
                  className={!extracted.transmission_distance ? "border-yellow-500" : ""}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Typical TD values range from 0.5 to 8.0 mm
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="w-4 h-4" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nozzle Min (°C)</Label>
                  <Input
                    type="number"
                    value={extracted.nozzle_temp_min_c || ''}
                    onChange={(e) => updateField('nozzle_temp_min_c', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label>Nozzle Max (°C)</Label>
                  <Input
                    type="number"
                    value={extracted.nozzle_temp_max_c || ''}
                    onChange={(e) => updateField('nozzle_temp_max_c', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bed Min (°C)</Label>
                  <Input
                    type="number"
                    value={extracted.bed_temp_min_c || ''}
                    onChange={(e) => updateField('bed_temp_min_c', parseInt(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label>Bed Max (°C)</Label>
                  <Input
                    type="number"
                    value={extracted.bed_temp_max_c || ''}
                    onChange={(e) => updateField('bed_temp_max_c', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URLs & Affiliate */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-4 h-4" />
                URLs & Affiliate Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={extracted.product_url || ''}
                      onChange={(e) => updateField('product_url', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" asChild>
                      <a href={extracted.product_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Featured Image URL</Label>
                  <Input
                    value={extracted.featured_image || ''}
                    onChange={(e) => updateField('featured_image', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>TDS (Technical Data Sheet) URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={extracted.tds_url || ''}
                    onChange={(e) => updateField('tds_url', e.target.value)}
                    className="flex-1"
                    placeholder="https://example.com/filament-tds.pdf"
                  />
                  {extracted.tds_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={extracted.tds_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Affiliate Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  Affiliate Tracking
                  {affiliate?.suggestion && (
                    <Badge variant="secondary">
                      {affiliate.suggestion.vendor_name} config found
                    </Badge>
                  )}
                </h4>
                <div className="space-y-3">
                  {affiliate?.affiliateUrl && affiliate.affiliateUrl !== affiliate.originalUrl && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="use-affiliate"
                        checked={useAffiliate}
                        onCheckedChange={(checked) => setUseAffiliate(checked as boolean)}
                      />
                      <Label htmlFor="use-affiliate" className="text-sm">
                        Use suggested affiliate URL
                      </Label>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-muted-foreground">Custom Affiliate Suffix</Label>
                    <Input
                      value={customAffiliateSuffix}
                      onChange={(e) => setCustomAffiliateSuffix(e.target.value)}
                      placeholder="ref=filascope"
                      disabled={useAffiliate && !!affiliate?.affiliateUrl}
                    />
                  </div>
                  {affiliate?.affiliateUrl && useAffiliate && (
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {affiliate.affiliateUrl}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extraction Confidence & Actions */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Extraction Confidence:</span>
                    <span className={`ml-2 font-bold ${getConfidenceColor(extracted.extraction_confidence)}`}>
                      {extracted.extraction_confidence}%
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                    setExtracted(null);
                    setAffiliate(null);
                    setExistingFilament(null);
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> {existingFilament ? 'Update' : 'Create'} Filament</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
