import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Link2, Loader2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { detectBrandFromUrl } from '@/lib/brandAutoDetection';
import { detectRegionFromUrl } from './autoGenerateUrls';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import type { WizardFormValues } from '../AddFilamentWizard';

interface FilamentWizardStep1Props {
  form: UseFormReturn<WizardFormValues>;
}

export function FilamentWizardStep1({ form }: FilamentWizardStep1Props) {
  const productUrl = form.watch('product_url');
  const detectedRegion = form.watch('detected_region') as RegionCode | undefined;

  // Fetch brands for dropdown
  const { data: brands = [] } = useQuery({
    queryKey: ['automated-brands-wizard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('brand_name, brand_slug')
        .eq('scraping_enabled', true)
        .order('brand_name');
      return data || [];
    },
  });

  // Auto-detect brand and region when URL changes
  useEffect(() => {
    if (productUrl) {
      // Detect brand
      const detection = detectBrandFromUrl(productUrl);
      if (detection.slug) {
        form.setValue('vendor', detection.slug);
      }
      if (detection.sourceType) {
        form.setValue('source_type', detection.sourceType);
      }
      
      // Detect region
      const region = detectRegionFromUrl(productUrl);
      if (region) {
        form.setValue('detected_region', region);
      }
    } else {
      form.setValue('detected_region', undefined);
    }
  }, [productUrl, form]);

  const handleImportFromUrl = async () => {
    // Placeholder for URL import functionality
    // In a real implementation, this would call an edge function to scrape the URL
    const url = form.getValues('product_url');
    if (!url) return;

    // For now, just auto-detect the brand and region
    const detection = detectBrandFromUrl(url);
    if (detection.slug) {
      form.setValue('vendor', detection.slug);
    }
    if (detection.sourceType) {
      form.setValue('source_type', detection.sourceType);
    }
    
    const region = detectRegionFromUrl(url);
    if (region) {
      form.setValue('detected_region', region);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Source Information</h3>
        <p className="text-sm text-muted-foreground">
          Enter the product URL and we'll try to auto-detect the brand and region.
        </p>
      </div>

      <FormField
        control={form.control}
        name="product_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product URL *</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="https://store.example.com/filament..."
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={handleImportFromUrl}
                disabled={!productUrl}
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin hidden" />
                Import
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Detected Region Badge */}
      {productUrl && detectedRegion && (
        <Alert className="bg-muted/50 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <span className="text-xl">{REGIONS[detectedRegion]?.flag}</span>
            <span>
              <strong>Detected:</strong> {REGIONS[detectedRegion]?.name} store URL
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              This will be set as the primary regional URL
            </span>
          </AlertDescription>
        </Alert>
      )}

      <FormField
        control={form.control}
        name="vendor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand / Vendor *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.brand_slug} value={brand.brand_slug}>
                    {brand.brand_name}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other / Unknown</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="source_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Source Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manufacturer" id="manufacturer" />
                  <Label htmlFor="manufacturer" className="cursor-pointer">
                    Manufacturer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="retailer" id="retailer" />
                  <Label htmlFor="retailer" className="cursor-pointer">
                    Retailer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="amazon" id="amazon" />
                  <Label htmlFor="amazon" className="cursor-pointer">
                    Amazon
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
