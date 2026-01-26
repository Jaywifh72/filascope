import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Wand2, Globe, ExternalLink, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { autoGenerateRegionalUrls, extractStoreNameFromUrl } from './autoGenerateUrls';
import type { PrinterWizardFormValues } from '../AddPrinterWizard';

interface PrinterWizardStep4RegionalProps {
  form: UseFormReturn<PrinterWizardFormValues>;
}

interface RegionalUrlItem {
  region_code: string;
  store_url: string;
  store_name: string;
  currency_code: string;
  is_primary: boolean;
  is_verified: boolean;
}

const ALL_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU'];
const QUICK_ADD_REGIONS: RegionCode[] = ['CA', 'EU', 'UK', 'AU'];

export function PrinterWizardStep4Regional({ form }: PrinterWizardStep4RegionalProps) {
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  
  const productUrl = form.watch('product_url');
  const detectedRegion = form.watch('detected_region') as RegionCode | undefined;
  const regionalUrls = (form.watch('regional_urls') || []) as RegionalUrlItem[];

  const configuredRegions = new Set(regionalUrls.map((u) => u.region_code));
  const unconfiguredRegions = ALL_REGIONS.filter(
    (r) => !configuredRegions.has(r) && r !== detectedRegion
  );

  const handleAddRegion = (regionCode: RegionCode) => {
    const region = REGIONS[regionCode];
    const newUrl: RegionalUrlItem = {
      region_code: regionCode,
      store_url: '',
      store_name: '',
      currency_code: region?.defaultCurrency || 'USD',
      is_primary: false,
      is_verified: false,
    };
    form.setValue('regional_urls', [...regionalUrls, newUrl], { shouldDirty: true });
  };

  const handleRemoveRegion = (regionCode: RegionCode) => {
    const filtered = regionalUrls.filter((u) => u.region_code !== regionCode);
    form.setValue('regional_urls', filtered, { shouldDirty: true });
  };

  const handleUrlChange = (regionCode: RegionCode, field: keyof RegionalUrlItem, value: any) => {
    const updated = regionalUrls.map((u) =>
      u.region_code === regionCode ? { ...u, [field]: value } : u
    );
    form.setValue('regional_urls', updated, { shouldDirty: true });
  };

  const handleUrlPaste = (regionCode: RegionCode, url: string) => {
    const storeName = extractStoreNameFromUrl(url);
    const updated = regionalUrls.map((u) => {
      if (u.region_code === regionCode) {
        return {
          ...u,
          store_url: url,
          store_name: storeName || u.store_name,
        };
      }
      return u;
    });
    form.setValue('regional_urls', updated, { shouldDirty: true });
  };

  const handleAutoGenerate = () => {
    if (!productUrl || !detectedRegion) return;

    const suggestions = autoGenerateRegionalUrls(productUrl, detectedRegion);
    
    // Only add suggestions for regions not already configured
    const newUrls: RegionalUrlItem[] = suggestions
      .filter((s) => !configuredRegions.has(s.region))
      .map((s) => ({
        region_code: s.region,
        store_url: s.url,
        store_name: extractStoreNameFromUrl(s.url) || '',
        currency_code: REGIONS[s.region]?.defaultCurrency || 'USD',
        is_primary: false,
        is_verified: false,
      }));

    if (newUrls.length > 0) {
      form.setValue('regional_urls', [...regionalUrls, ...newUrls], { shouldDirty: true });
      setShowAutoGenerate(false);
    }
  };

  const handleQuickAdd = (regionCode: RegionCode) => {
    if (configuredRegions.has(regionCode)) return;
    
    // Try to auto-generate URL for this specific region
    if (productUrl && detectedRegion) {
      const suggestions = autoGenerateRegionalUrls(productUrl, detectedRegion);
      const suggestion = suggestions.find((s) => s.region === regionCode);
      
      if (suggestion) {
        const newUrl: RegionalUrlItem = {
          region_code: regionCode,
          store_url: suggestion.url,
          store_name: extractStoreNameFromUrl(suggestion.url) || '',
          currency_code: REGIONS[regionCode]?.defaultCurrency || 'USD',
          is_primary: false,
          is_verified: false,
        };
        form.setValue('regional_urls', [...regionalUrls, newUrl], { shouldDirty: true });
        return;
      }
    }
    
    // Fallback: add empty region
    handleAddRegion(regionCode);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Regional Store URLs</h3>
        <p className="text-sm text-muted-foreground">
          Configure where this printer can be purchased in different regions.
        </p>
      </div>

      {/* Primary URL display */}
      {productUrl && detectedRegion && (
        <div className="p-4 bg-muted/50 border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{REGIONS[detectedRegion]?.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{REGIONS[detectedRegion]?.name}</span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  Primary
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {productUrl}
              </p>
            </div>
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Additional Regional URLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Additional Regional URLs</Label>
          {unconfiguredRegions.length > 0 && (
            <Select
              value=""
              onValueChange={(val) => handleAddRegion(val as RegionCode)}
            >
              <SelectTrigger className="w-[160px]">
                <Plus className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Add Region" />
              </SelectTrigger>
              <SelectContent>
                {unconfiguredRegions.map((regionCode) => {
                  const region = REGIONS[regionCode];
                  return (
                    <SelectItem key={regionCode} value={regionCode}>
                      {region?.flag} {region?.name || regionCode}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {regionalUrls.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No additional regional URLs configured</p>
            <p className="text-xs mt-1">
              Add URLs for other regions or use auto-generate
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {regionalUrls.map((urlData) => {
              const region = REGIONS[urlData.region_code as RegionCode];
              
              return (
                <div
                  key={urlData.region_code}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{region?.flag}</span>
                      <span className="font-medium">{region?.name || urlData.region_code}</span>
                      {urlData.is_verified && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRegion(urlData.region_code as RegionCode)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      value={urlData.store_url}
                      onChange={(e) => handleUrlChange(urlData.region_code as RegionCode, 'store_url', e.target.value)}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text');
                        if (pastedText.startsWith('http')) {
                          e.preventDefault();
                          handleUrlPaste(urlData.region_code as RegionCode, pastedText);
                        }
                      }}
                      placeholder="https://store.example.com/products/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Store Name</Label>
                      <Input
                        value={urlData.store_name}
                        onChange={(e) => handleUrlChange(urlData.region_code as RegionCode, 'store_name', e.target.value)}
                        placeholder="e.g., Creality CA"
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`verified-${urlData.region_code}`}
                          checked={urlData.is_verified}
                          onCheckedChange={(checked) =>
                            handleUrlChange(urlData.region_code as RegionCode, 'is_verified', checked)
                          }
                        />
                        <Label htmlFor={`verified-${urlData.region_code}`} className="text-sm">
                          Verified
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Buttons */}
      {unconfiguredRegions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Quick Add</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_REGIONS.filter(
              (r) => !configuredRegions.has(r) && r !== detectedRegion
            ).map((regionCode) => {
              const region = REGIONS[regionCode];
              return (
                <Button
                  key={regionCode}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(regionCode)}
                >
                  {region?.flag} {regionCode}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Generate Section */}
      {productUrl && detectedRegion && unconfiguredRegions.length > 0 && (
        <Alert className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              Many brands use the same product slug across regions.
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAutoGenerate}
              className="ml-4"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Auto-Generate URLs
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
