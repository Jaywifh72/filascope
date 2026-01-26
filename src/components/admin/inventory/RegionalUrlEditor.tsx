import { useState } from 'react';
import { Plus, Trash2, Check, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';

export interface RegionalUrlData {
  id?: string;
  region_code: RegionCode;
  store_url: string;
  store_name: string;
  currency_code: CurrencyCode;
  is_primary: boolean;
  is_verified: boolean;
}

interface RegionalUrlEditorProps {
  productId: string;
  productType: 'filament' | 'printer';
  urls: RegionalUrlData[];
  onChange: (urls: RegionalUrlData[]) => void;
  disabled?: boolean;
}

const ALL_REGIONS: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'];

// URL patterns to auto-detect region
const REGION_URL_PATTERNS: Array<{ pattern: RegExp; region: RegionCode }> = [
  { pattern: /\/us\//i, region: 'US' },
  { pattern: /\.com\/(?!ca|uk|eu|au)/i, region: 'US' },
  { pattern: /\/ca\//i, region: 'CA' },
  { pattern: /\.ca\//i, region: 'CA' },
  { pattern: /\/uk\//i, region: 'UK' },
  { pattern: /\.co\.uk/i, region: 'UK' },
  { pattern: /\/eu\//i, region: 'EU' },
  { pattern: /\.de\//i, region: 'EU' },
  { pattern: /\.fr\//i, region: 'EU' },
  { pattern: /\/au\//i, region: 'AU' },
  { pattern: /\.com\.au/i, region: 'AU' },
  { pattern: /\/jp\//i, region: 'JP' },
  { pattern: /\.co\.jp/i, region: 'JP' },
  { pattern: /\/cn\//i, region: 'CN' },
  { pattern: /\.cn\//i, region: 'CN' },
];

function detectRegionFromUrl(url: string): RegionCode | null {
  for (const { pattern, region } of REGION_URL_PATTERNS) {
    if (pattern.test(url)) {
      return region;
    }
  }
  return null;
}

function extractStoreNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove common prefixes and suffixes
    let name = hostname
      .replace(/^www\./i, '')
      .replace(/^store\./i, '')
      .replace(/\.com$|\.ca$|\.co\.uk$|\.de$|\.fr$|\.com\.au$|\.co\.jp$|\.cn$/i, '');
    
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}

export function RegionalUrlEditor({
  productId,
  productType,
  urls,
  onChange,
  disabled = false,
}: RegionalUrlEditorProps) {
  const [addingRegion, setAddingRegion] = useState<RegionCode | null>(null);

  const configuredRegions = new Set(urls.map((u) => u.region_code));
  const unconfiguredRegions = ALL_REGIONS.filter((r) => !configuredRegions.has(r));

  const handleUrlChange = (regionCode: RegionCode, field: keyof RegionalUrlData, value: any) => {
    const updated = urls.map((u) =>
      u.region_code === regionCode ? { ...u, [field]: value } : u
    );
    onChange(updated);
  };

  const handleUrlPaste = (regionCode: RegionCode, url: string) => {
    const detectedRegion = detectRegionFromUrl(url);
    const storeName = extractStoreNameFromUrl(url);
    
    const updated = urls.map((u) => {
      if (u.region_code === regionCode) {
        return {
          ...u,
          store_url: url,
          store_name: storeName || u.store_name,
        };
      }
      return u;
    });
    onChange(updated);

    // If detected region differs, could show a suggestion
    if (detectedRegion && detectedRegion !== regionCode) {
      console.log(`URL appears to be for ${detectedRegion}, but assigned to ${regionCode}`);
    }
  };

  const handleAddRegion = (regionCode: RegionCode) => {
    const region = REGIONS[regionCode];
    const newUrl: RegionalUrlData = {
      region_code: regionCode,
      store_url: '',
      store_name: '',
      currency_code: region?.defaultCurrency || 'USD',
      is_primary: urls.length === 0, // First one is primary
      is_verified: false,
    };
    onChange([...urls, newUrl]);
    setAddingRegion(null);
  };

  const handleRemoveRegion = (regionCode: RegionCode) => {
    const filtered = urls.filter((u) => u.region_code !== regionCode);
    // If we removed the primary, make the first remaining one primary
    if (filtered.length > 0 && !filtered.some((u) => u.is_primary)) {
      filtered[0].is_primary = true;
    }
    onChange(filtered);
  };

  const handleSetPrimary = (regionCode: RegionCode) => {
    const updated = urls.map((u) => ({
      ...u,
      is_primary: u.region_code === regionCode,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Regional URLs</Label>
        {unconfiguredRegions.length > 0 && (
          <Select
            value={addingRegion || ''}
            onValueChange={(val) => handleAddRegion(val as RegionCode)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[180px]">
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

      {urls.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No regional URLs configured</p>
          <p className="text-xs mt-1">Add a region to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urls.map((urlData) => {
            const region = REGIONS[urlData.region_code];
            
            return (
              <Collapsible key={urlData.region_code} defaultOpen>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{region?.flag}</span>
                        <span className="font-medium">{region?.name || urlData.region_code}</span>
                        {urlData.is_primary && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                        {urlData.is_verified && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {urlData.store_url && (
                          <a
                            href={urlData.store_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor={`url-${urlData.region_code}`}>Store URL</Label>
                        <Input
                          id={`url-${urlData.region_code}`}
                          value={urlData.store_url}
                          onChange={(e) => handleUrlChange(urlData.region_code, 'store_url', e.target.value)}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData.getData('text');
                            if (pastedText.startsWith('http')) {
                              e.preventDefault();
                              handleUrlPaste(urlData.region_code, pastedText);
                            }
                          }}
                          placeholder="https://store.example.com/products/..."
                          disabled={disabled}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`store-${urlData.region_code}`}>Store Name</Label>
                          <Input
                            id={`store-${urlData.region_code}`}
                            value={urlData.store_name}
                            onChange={(e) => handleUrlChange(urlData.region_code, 'store_name', e.target.value)}
                            placeholder="e.g., Creality US"
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select
                            value={urlData.currency_code}
                            onValueChange={(val) => handleUrlChange(urlData.region_code, 'currency_code', val)}
                            disabled={disabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="CAD">CAD (C$)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="AUD">AUD (A$)</SelectItem>
                              <SelectItem value="JPY">JPY (¥)</SelectItem>
                              <SelectItem value="CNY">CNY (¥)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`primary-${urlData.region_code}`}
                              checked={urlData.is_primary}
                              onCheckedChange={() => handleSetPrimary(urlData.region_code)}
                              disabled={disabled || urlData.is_primary}
                            />
                            <Label htmlFor={`primary-${urlData.region_code}`} className="text-sm">
                              Primary URL
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`verified-${urlData.region_code}`}
                              checked={urlData.is_verified}
                              onCheckedChange={(checked) => 
                                handleUrlChange(urlData.region_code, 'is_verified', checked)
                              }
                              disabled={disabled}
                            />
                            <Label htmlFor={`verified-${urlData.region_code}`} className="text-sm">
                              Verified
                            </Label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveRegion(urlData.region_code)}
                          disabled={disabled}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Unconfigured regions summary */}
      {unconfiguredRegions.length > 0 && urls.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            Not configured: {unconfiguredRegions.map((r) => REGIONS[r]?.flag).join(' ')}
          </p>
        </div>
      )}
    </div>
  );
}
