import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { ChevronDown } from 'lucide-react';
import { REGION_DISPLAY, getDefaultCurrency, getCountriesForRegion } from '@/config/countries';
import type { Store, StoreType } from '@/types/regional';

interface StoreFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store | null;
  onSubmit: (data: StoreFormData) => void;
  isSubmitting?: boolean;
}

export interface StoreFormData {
  name: string;
  slug: string;
  store_type: StoreType;
  region: string;
  country_code: string | null;
  currency_code: string;
  base_url: string;
  affiliate_tag: string | null;
  affiliate_network: string | null;
  ships_from: string[];
  ships_to: string[];
  logo_url: string | null;
  notes: string | null;
  is_active: boolean;
}

const STORE_TYPES: { value: StoreType; label: string }[] = [
  { value: 'marketplace', label: 'Marketplace (e.g., Amazon)' },
  { value: 'brand_direct', label: 'Brand Direct' },
  { value: 'retailer', label: 'Retailer' },
];

const REGIONS = Object.entries(REGION_DISPLAY).map(([code, display]) => ({
  code,
  ...display,
}));

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function StoreFormModal({
  open,
  onOpenChange,
  store,
  onSubmit,
  isSubmitting = false,
}: StoreFormModalProps) {
  const isEditing = !!store;
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    slug: '',
    store_type: 'retailer',
    region: 'US',
    country_code: 'US',
    currency_code: 'USD',
    base_url: '',
    affiliate_tag: null,
    affiliate_network: null,
    ships_from: [],
    ships_to: [],
    logo_url: null,
    notes: null,
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StoreFormData, string>>>({});

  // Reset form when store changes
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        slug: store.slug,
        store_type: store.store_type,
        region: store.region,
        country_code: store.country_code,
        currency_code: store.currency_code || 'USD',
        base_url: store.base_url,
        affiliate_tag: store.affiliate_tag,
        affiliate_network: store.affiliate_network,
        ships_from: store.ships_from || [],
        ships_to: store.ships_to || [],
        logo_url: store.logo_url,
        notes: store.notes,
        is_active: store.is_active,
      });
      setAffiliateOpen(!!store.affiliate_tag || !!store.affiliate_network);
    } else {
      setFormData({
        name: '',
        slug: '',
        store_type: 'retailer',
        region: 'US',
        country_code: 'US',
        currency_code: 'USD',
        base_url: '',
        affiliate_tag: null,
        affiliate_network: null,
        ships_from: [],
        ships_to: [],
        logo_url: null,
        notes: null,
        is_active: true,
      });
      setAffiliateOpen(false);
    }
    setErrors({});
  }, [store, open]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  // Auto-set currency when region changes
  const handleRegionChange = (region: string) => {
    const countries = getCountriesForRegion(region);
    setFormData((prev) => ({
      ...prev,
      region,
      currency_code: getDefaultCurrency(region),
      country_code: countries.length === 1 ? countries[0].code : null,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StoreFormData, string>> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.slug || formData.slug.length < 2) {
      newErrors.slug = 'Slug is required';
    }

    if (!formData.base_url) {
      newErrors.base_url = 'Base URL is required';
    } else if (!isValidUrl(formData.base_url)) {
      newErrors.base_url = 'Must be a valid URL';
    }

    if (!formData.region) {
      newErrors.region = 'Region is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const regionCountries = getCountriesForRegion(formData.region);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Store' : 'Add Store'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update store details and configuration.'
              : 'Add a new store to the registry.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Store Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Amazon US"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="e.g., amazon-us"
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
          </div>

          {/* Store Type */}
          <div className="space-y-2">
            <Label>Store Type *</Label>
            <Select
              value={formData.store_type}
              onValueChange={(value: StoreType) =>
                setFormData((prev) => ({ ...prev, store_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {STORE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label>Region *</Label>
            <Select value={formData.region} onValueChange={handleRegionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.flag} {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Code */}
          {regionCountries.length > 1 && (
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={formData.country_code || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, country_code: value || null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {regionCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Input
              id="currency"
              value={formData.currency_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, currency_code: e.target.value.toUpperCase() }))
              }
              placeholder="USD"
              maxLength={3}
            />
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="base_url">Base URL *</Label>
            <Input
              id="base_url"
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, base_url: e.target.value }))}
              placeholder="https://www.amazon.com"
            />
            {errors.base_url && <p className="text-sm text-destructive">{errors.base_url}</p>}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          {/* Affiliate Settings (Collapsible) */}
          <Collapsible open={affiliateOpen} onOpenChange={setAffiliateOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium">Affiliate Settings</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${affiliateOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="affiliate_tag">Affiliate Tag</Label>
                <Input
                  id="affiliate_tag"
                  value={formData.affiliate_tag || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      affiliate_tag: e.target.value || null,
                    }))
                  }
                  placeholder="e.g., mysite-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate_network">Affiliate Network</Label>
                <Input
                  id="affiliate_network"
                  value={formData.affiliate_network || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      affiliate_network: e.target.value || null,
                    }))
                  }
                  placeholder="e.g., Amazon Associates"
                />
              </div>
              {formData.affiliate_tag && formData.base_url && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Preview URL:</p>
                  <code className="text-xs break-all">
                    {formData.base_url}?tag={formData.affiliate_tag}
                  </code>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Store' : 'Add Store'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
