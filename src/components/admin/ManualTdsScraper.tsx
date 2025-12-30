import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Link2, Loader2, CheckCircle2, XCircle, Save, Flag, 
  Thermometer, Droplets, Scale, Zap, Sun, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAddToReviewQueue } from '@/hooks/useTdReviewQueue';
import { useQueryClient } from '@tanstack/react-query';

interface ExtractionResult {
  success: boolean;
  tds_url?: string;
  data?: Record<string, any>;
  validationWarnings?: string[];
  fields_extracted?: number;
  error?: string;
}

export function ManualTdsScraper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addToReview = useAddToReviewQueue();
  
  const [url, setUrl] = useState('');
  const [filamentId, setFilamentId] = useState('');
  const [filamentSearch, setFilamentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFilament, setSelectedFilament] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleSearch = async () => {
    if (!filamentSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, tds_url, transmission_distance')
        .or(`product_title.ilike.%${filamentSearch}%,vendor.ilike.%${filamentSearch}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      toast({
        title: 'Search Error',
        description: err instanceof Error ? err.message : 'Failed to search',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFilament = (filament: any) => {
    setSelectedFilament(filament);
    setFilamentId(filament.id);
    setSearchResults([]);
    setFilamentSearch('');
    if (filament.tds_url) {
      setUrl(filament.tds_url);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    setIsScraping(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-filament-tds', {
        body: {
          tds_url: url,
          filament_id: filamentId || undefined,
          dry_run: dryRun,
        },
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: dryRun ? 'Dry Run Complete' : 'Saved to Database',
          description: `Extracted ${data.fields_extracted} fields`,
        });

        if (!dryRun) {
          queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['tds-parsing-stats'] });
        }
      }
    } catch (err) {
      const errorResult: ExtractionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to scrape',
      };
      setResult(errorResult);
      toast({
        title: 'Scrape Failed',
        description: errorResult.error,
        variant: 'destructive',
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveNow = async () => {
    if (!result?.success || !result.data || !filamentId) return;

    try {
      const updateData: Record<string, any> = {};
      const fields = [
        'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
        'bed_temp_min_c', 'bed_temp_max_c', 'print_speed_max_mms',
        'fan_min_percent', 'fan_max_percent', 'drying_temp_c', 'drying_time_hours',
        'density_g_cm3', 'tensile_strength_xy_mpa', 'tensile_modulus_xy_mpa',
        'elongation_break_xy_percent', 'flexural_strength_mpa', 'shore_hardness_d',
        'tg_c', 'melt_temp_c', 'moisture_sensitivity_level', 'is_nozzle_abrasive',
        'transmission_distance'
      ];

      for (const field of fields) {
        if (result.data[field] !== null && result.data[field] !== undefined) {
          updateData[field] = result.data[field];
        }
      }

      if (url) {
        updateData.tds_url = url;
      }

      const { error } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filamentId);

      if (error) throw error;

      toast({ title: 'Saved!', description: 'TDS data saved to database' });
      queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['tds-parsing-stats'] });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save',
        variant: 'destructive',
      });
    }
  };

  const handleFlag = async () => {
    if (!filamentId) {
      toast({ title: 'Error', description: 'Select a filament first', variant: 'destructive' });
      return;
    }

    try {
      await addToReview.mutateAsync({
        filament_id: filamentId,
        tds_url: url || undefined,
        reason: 'manual_flag',
        extraction_attempt: result?.data,
        notes: 'Manually flagged for review',
      });

      toast({ title: 'Flagged', description: 'Added to review queue' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to flag',
        variant: 'destructive',
      });
    }
  };

  const tdValue = result?.data?.transmission_distance;
  const hasTd = tdValue !== null && tdValue !== undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            <CardTitle>Manual TDS Scraper</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="manual-dry-run" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="manual-dry-run" className="text-sm">Dry Run</Label>
          </div>
        </div>
        <CardDescription>
          Paste a TDS URL to extract specifications including Transmission Distance (TD) for HueForge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <Label>TDS / Product URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/filament-tds.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleScrape} disabled={isScraping || !url.trim()}>
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Scrape
            </Button>
          </div>
        </div>

        {/* Filament Selector */}
        <div className="space-y-2">
          <Label>Link to Filament (optional)</Label>
          {selectedFilament ? (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
              <span className="text-sm flex-1">
                <strong>{selectedFilament.vendor}</strong> - {selectedFilament.product_title}
              </span>
              {selectedFilament.transmission_distance && (
                <Badge variant="outline" className="text-xs">
                  <Sun className="w-3 h-3 mr-1" />
                  TD: {selectedFilament.transmission_distance}mm
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setSelectedFilament(null); setFilamentId(''); }}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Search filament by name or brand..."
                value={filamentSearch}
                onChange={(e) => setFilamentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((f) => (
                <button
                  key={f.id}
                  className="w-full text-left p-2 hover:bg-muted text-sm border-b last:border-b-0"
                  onClick={() => handleSelectFilament(f)}
                >
                  <strong>{f.vendor}</strong> - {f.product_title}
                  <span className="text-muted-foreground ml-2">({f.material})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Extraction Results */}
        {result && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  Extraction Results
                </h4>
                {result.success && (
                  <Badge variant={result.data?.extraction_confidence >= 70 ? 'default' : 'secondary'}>
                    {result.fields_extracted} fields • {result.data?.extraction_confidence}% confidence
                  </Badge>
                )}
              </div>

              {result.success && result.data ? (
                <div className="space-y-3">
                  {/* TD Highlight */}
                  <div className={`p-3 rounded-lg ${hasTd ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-center gap-2">
                      <Sun className={`w-5 h-5 ${hasTd ? 'text-green-600' : 'text-amber-600'}`} />
                      <span className="font-medium">Transmission Distance (TD):</span>
                      {hasTd ? (
                        <span className="text-lg font-bold text-green-600">{tdValue} mm</span>
                      ) : (
                        <span className="text-amber-600">Not found in TDS</span>
                      )}
                      {hasTd && <Badge className="bg-green-600">HueForge Ready</Badge>}
                    </div>
                  </div>

                  {/* Other Fields Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {result.data.nozzle_temp_min_c && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                        <span>Nozzle: {result.data.nozzle_temp_min_c}-{result.data.nozzle_temp_max_c}°C</span>
                      </div>
                    )}
                    {result.data.bed_temp_min_c && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Thermometer className="w-3.5 h-3.5 text-red-500" />
                        <span>Bed: {result.data.bed_temp_min_c}-{result.data.bed_temp_max_c}°C</span>
                      </div>
                    )}
                    {result.data.drying_temp_c && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span>Dry: {result.data.drying_temp_c}°C / {result.data.drying_time_hours}h</span>
                      </div>
                    )}
                    {result.data.density_g_cm3 && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Scale className="w-3.5 h-3.5 text-purple-500" />
                        <span>Density: {result.data.density_g_cm3} g/cm³</span>
                      </div>
                    )}
                    {result.data.tensile_strength_xy_mpa && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Tensile: {result.data.tensile_strength_xy_mpa} MPa</span>
                      </div>
                    )}
                    {result.data.print_speed_max_mms && (
                      <div className="flex items-center gap-1.5 p-2 bg-muted rounded">
                        <Zap className="w-3.5 h-3.5 text-green-500" />
                        <span>Speed: ≤{result.data.print_speed_max_mms} mm/s</span>
                      </div>
                    )}
                  </div>

                  {/* Validation Warnings */}
                  {result.validationWarnings && result.validationWarnings.length > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <div>{result.validationWarnings.join(', ')}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {dryRun && filamentId && (
                      <Button onClick={handleSaveNow} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save to Database
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleFlag} disabled={!filamentId}>
                      <Flag className="w-4 h-4 mr-2" />
                      Flag for Review
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  {result.error || 'Extraction failed'}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
