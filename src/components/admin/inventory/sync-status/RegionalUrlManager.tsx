import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Link2, 
  Globe2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';

interface PopulateResult {
  success: boolean;
  dryRun: boolean;
  stats: {
    productsProcessed: number;
    urlsGenerated: number;
    urlsInserted: number;
    errors: number;
    regionStats: Record<string, { generated: number; validated: number; failed: number }>;
  };
  sampleUrls?: Array<{
    productId: string;
    regionCode: string;
    storeUrl: string;
    isValid?: boolean;
  }>;
  duration_ms: number;
  error?: string;
}

interface ValidateResult {
  success: boolean;
  stats: {
    total: number;
    valid: number;
    redirect: number;
    notFound: number;
    error: number;
    repaired: number;
  };
  brokenUrls?: Array<{
    id: string;
    regionCode: string;
    storeUrl: string;
    status: string;
    suggestedUrl?: string;
  }>;
  duration_ms: number;
  error?: string;
}

// Brands that support regional stores
const REGIONAL_BRANDS = [
  { slug: 'all', name: 'All Regional Brands' },
  { slug: 'bambu-lab', name: 'Bambu Lab' },
  { slug: 'elegoo', name: 'Elegoo' },
  { slug: 'polymaker', name: 'Polymaker' },
  { slug: 'creality', name: 'Creality' },
  { slug: 'anycubic', name: 'Anycubic' },
  { slug: 'qidi', name: 'QIDI' },
  { slug: 'flashforge', name: 'Flashforge' },
  { slug: 'eryone', name: 'Eryone' },
  { slug: 'jayo', name: 'Jayo' },
  { slug: 'kingroon', name: 'Kingroon' },
  { slug: 'sovol', name: 'Sovol' },
  { slug: 'artillery', name: 'Artillery' },
  { slug: 'sunlu', name: 'SUNLU' },
];

// Available regions
const AVAILABLE_REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];

export function RegionalUrlManager() {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(AVAILABLE_REGIONS);
  const [dryRun, setDryRun] = useState(true);
  const [validateUrls, setValidateUrls] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Populate mutation
  const populateMutation = useMutation({
    mutationFn: async (): Promise<PopulateResult> => {
      const { data, error } = await supabase.functions.invoke('populate-regional-urls', {
        body: {
          brandSlug: selectedBrand,
          productType: 'filament',
          regions: selectedRegions,
          validateUrls,
          dryRun,
          limit: 1000,
        },
      });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          dryRun ? 'Dry run completed' : 'URLs populated successfully',
          {
            description: `Generated ${data.stats.urlsGenerated} URLs, inserted ${data.stats.urlsInserted}`,
          }
        );
        setShowResults(true);
        queryClient.invalidateQueries({ queryKey: ['brand-region-coverage'] });
        queryClient.invalidateQueries({ queryKey: ['regional-sync-health'] });
      } else {
        toast.error('Populate failed', { description: data.error });
      }
    },
    onError: (error: Error) => {
      toast.error('Populate failed', { description: error.message });
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: async (): Promise<ValidateResult> => {
      const { data, error } = await supabase.functions.invoke('validate-regional-urls', {
        body: {
          regionCode: selectedRegions.length === 1 ? selectedRegions[0] : undefined,
          brandSlug: selectedBrand !== 'all' ? selectedBrand : undefined,
          limit: 100,
          markBroken: true,
        },
      });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Validation completed', {
          description: `Valid: ${data.stats.valid}, Broken: ${data.stats.notFound}, Repaired: ${data.stats.repaired}`,
        });
        setShowResults(true);
        queryClient.invalidateQueries({ queryKey: ['brand-region-coverage'] });
      } else {
        toast.error('Validation failed', { description: data.error });
      }
    },
    onError: (error: Error) => {
      toast.error('Validation failed', { description: error.message });
    },
  });

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const populateResult = populateMutation.data;
  const validateResult = validateMutation.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Regional URL Manager
            </CardTitle>
            <CardDescription>
              Populate and validate regional store URLs for products
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brand selector */}
        <div className="space-y-2">
          <Label>Brand</Label>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {REGIONAL_BRANDS.map((brand) => (
                <SelectItem key={brand.slug} value={brand.slug}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region selector */}
        <div className="space-y-2">
          <Label>Regions</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_REGIONS.map((region) => {
              const isSelected = selectedRegions.includes(region);
              const regionInfo = REGIONS[region as RegionCode];
              return (
                <Button
                  key={region}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleRegion(region)}
                  className="gap-1"
                >
                  <span>{regionInfo?.flag}</span>
                  <span>{region}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="dry-run" className="cursor-pointer">
              Dry Run (preview only)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="validate" checked={validateUrls} onCheckedChange={setValidateUrls} />
            <Label htmlFor="validate" className="cursor-pointer">
              Validate URLs
            </Label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => populateMutation.mutate()}
            disabled={populateMutation.isPending || selectedRegions.length === 0}
          >
            {populateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            {dryRun ? 'Preview URLs' : 'Populate URLs'}
          </Button>
          <Button
            variant="outline"
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
          >
            {validateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Validate
          </Button>
        </div>

        {/* Results */}
        <Collapsible open={showResults} onOpenChange={setShowResults}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2">
              {showResults ? 'Hide Results' : 'Show Results'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {/* Populate results */}
            {populateResult?.success && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {populateResult.dryRun ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="font-medium">
                    {populateResult.dryRun ? 'Dry Run Results' : 'Populate Results'}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    {populateResult.duration_ms}ms
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="font-bold">{populateResult.stats.productsProcessed}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded">
                    <p className="font-bold text-blue-500">{populateResult.stats.urlsGenerated}</p>
                    <p className="text-xs text-muted-foreground">Generated</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded">
                    <p className="font-bold text-green-500">{populateResult.stats.urlsInserted}</p>
                    <p className="text-xs text-muted-foreground">Inserted</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="font-bold text-destructive">{populateResult.stats.errors}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>

                {/* Region breakdown */}
                {populateResult.stats.regionStats && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {Object.entries(populateResult.stats.regionStats).map(([region, stats]) => (
                      <Badge key={region} variant="outline" className="gap-1">
                        <span>{REGIONS[region as RegionCode]?.flag}</span>
                        <span>{region}: {stats.generated}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Validate results */}
            {validateResult?.success && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">Validation Results</span>
                  <Badge variant="secondary" className="ml-auto">
                    {validateResult.duration_ms}ms
                  </Badge>
                </div>
                
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="font-bold">{validateResult.stats.total}</p>
                    <p className="text-xs text-muted-foreground">Checked</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded">
                    <p className="font-bold text-green-500">{validateResult.stats.valid}</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded">
                    <p className="font-bold text-amber-500">{validateResult.stats.redirect}</p>
                    <p className="text-xs text-muted-foreground">Redirect</p>
                  </div>
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="font-bold text-destructive">{validateResult.stats.notFound}</p>
                    <p className="text-xs text-muted-foreground">404</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded">
                    <p className="font-bold text-blue-500">{validateResult.stats.repaired}</p>
                    <p className="text-xs text-muted-foreground">Repaired</p>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
