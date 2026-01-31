import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, ArrowUpDown, Check, X, Globe, TrendingUp, AlertCircle } from 'lucide-react';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { CURRENCY_LIST } from '@/config/currencies';
import { RegionCode, CurrencyCode } from '@/types/regional';

interface BrandExpansionData {
  id: string;
  brand_name: string;
  brand_slug: string;
  product_count: number;
  regions: string[];
  priority_score: number;
}

interface AddStoreFormData {
  region_code: RegionCode;
  store_name: string;
  base_url: string;
  currency_code: CurrencyCode;
  product_url_pattern: string;
  ships_from_country: string;
}

const AdminRegionalExpansion = () => {
  const { toast } = useToast();
  const [brands, setBrands] = useState<BrandExpansionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'products'>('priority');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<BrandExpansionData | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<AddStoreFormData>({
    region_code: 'CA',
    store_name: '',
    base_url: '',
    currency_code: 'CAD',
    product_url_pattern: '',
    ships_from_country: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBrandsWithExpansionNeeds();
  }, []);

  const fetchBrandsWithExpansionNeeds = async () => {
    setLoading(true);
    try {
      // Get all brands with their product counts
      const { data: brandsData, error: brandsError } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, product_count')
        .eq('is_visible', true)
        .order('product_count', { ascending: false });

      if (brandsError) throw brandsError;

      // Get existing regional stores
      const { data: storesData, error: storesError } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code')
        .eq('is_active', true);

      if (storesError) throw storesError;

      // Build map of brand_id -> regions
      const brandRegions = new Map<string, string[]>();
      storesData?.forEach((store) => {
        const existing = brandRegions.get(store.brand_id) || [];
        existing.push(store.region_code);
        brandRegions.set(store.brand_id, existing);
      });

      // Calculate priority scores and filter for expansion candidates
      const expansionData: BrandExpansionData[] = (brandsData || [])
        .map((brand) => {
          const regions = brandRegions.get(brand.id) || [];
          // Priority = product_count * (7 - regions.length) / 7
          // Higher product count + fewer regions = higher priority
          const regionGap = 7 - regions.length;
          const priority_score = Math.round((brand.product_count || 0) * (regionGap / 7));
          
          return {
            id: brand.id,
            brand_name: brand.brand_name,
            brand_slug: brand.brand_slug,
            product_count: brand.product_count || 0,
            regions,
            priority_score,
          };
        })
        .filter((b) => b.regions.length < 7); // Only show brands that need expansion

      setBrands(expansionData);
    } catch (error) {
      console.error('Error fetching expansion data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getSortedBrands = () => {
    let filtered = [...brands];
    
    if (filterRegion !== 'all') {
      filtered = filtered.filter((b) => !b.regions.includes(filterRegion));
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority_score - a.priority_score;
        case 'products':
          return b.product_count - a.product_count;
        case 'name':
          return a.brand_name.localeCompare(b.brand_name);
        default:
          return 0;
      }
    });
  };

  const handleAddStore = (brand: BrandExpansionData) => {
    setSelectedBrand(brand);
    // Find the first missing region for default
    const missingRegions = REGION_LIST.filter((r) => !brand.regions.includes(r.code));
    const defaultRegion = missingRegions[0]?.code || 'CA';
    const regionCurrency = REGIONS[defaultRegion as RegionCode]?.defaultCurrency || 'USD';
    
    setFormData({
      region_code: defaultRegion as RegionCode,
      store_name: `${brand.brand_name} ${REGIONS[defaultRegion as RegionCode]?.name || ''}`,
      base_url: '',
      currency_code: regionCurrency as CurrencyCode,
      product_url_pattern: '',
      ships_from_country: defaultRegion === 'EU' ? '' : defaultRegion,
    });
    setShowAddDialog(true);
  };

  const handleSubmitStore = async () => {
    if (!selectedBrand || !formData.base_url || !formData.store_name) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('brand_regional_stores').insert({
        brand_id: selectedBrand.id,
        region_code: formData.region_code,
        store_name: formData.store_name,
        base_url: formData.base_url,
        currency_code: formData.currency_code,
        product_url_pattern: formData.product_url_pattern || null,
        ships_from_country: formData.ships_from_country || null,
        is_active: true,
        is_primary: false,
      });

      if (error) throw error;

      toast({ title: 'Regional store added successfully!' });
      setShowAddDialog(false);
      fetchBrandsWithExpansionNeeds();
    } catch (error: any) {
      console.error('Error adding store:', error);
      toast({ title: 'Failed to add store', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getMissingRegions = (brand: BrandExpansionData | null) => {
    if (!brand) return [];
    return REGION_LIST.filter((r) => !brand.regions.includes(r.code));
  };

  const getPriorityBadge = (score: number) => {
    if (score > 500) return <Badge className="bg-red-500/20 text-red-400">Critical</Badge>;
    if (score > 200) return <Badge className="bg-amber-500/20 text-amber-400">High</Badge>;
    if (score > 50) return <Badge className="bg-blue-500/20 text-blue-400">Medium</Badge>;
    return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
  };

  const sortedBrands = getSortedBrands();
  const usOnlyCount = brands.filter((b) => b.regions.length === 1 && b.regions.includes('US')).length;
  const noStoresCount = brands.filter((b) => b.regions.length === 0).length;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <AdminPageHeader
            title="Regional Expansion"
            description="Add regional store URLs to US-only brands"
            icon={MapPin}
            iconColor="text-teal-500"
            actions={
              <Button onClick={fetchBrandsWithExpansionNeeds} variant="outline">
                Refresh
              </Button>
            }
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{noStoresCount}</p>
                  <p className="text-sm text-muted-foreground">No Regional Stores</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{usOnlyCount}</p>
                  <p className="text-sm text-muted-foreground">US-Only Brands</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{brands.filter((b) => b.priority_score > 200).length}</p>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Check className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{brands.filter((b) => b.regions.length >= 4).length}</p>
                  <p className="text-sm text-muted-foreground">Well Covered (4+)</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority Score</SelectItem>
                <SelectItem value="products">Product Count</SelectItem>
                <SelectItem value="name">Brand Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-48">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by missing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {REGION_LIST.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.flag} Missing {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brands Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Current Regions</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : sortedBrands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No brands need expansion with current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedBrands.slice(0, 50).map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.brand_name}</TableCell>
                      <TableCell>{brand.product_count}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {brand.regions.length === 0 ? (
                            <Badge variant="outline" className="text-red-400">None</Badge>
                          ) : (
                            brand.regions.map((r) => (
                              <span key={r} title={REGIONS[r as RegionCode]?.name}>
                                {REGIONS[r as RegionCode]?.flag}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {getMissingRegions(brand).map((r) => (
                            <span key={r.code} className="opacity-40" title={`Missing ${r.name}`}>
                              {r.flag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(brand.priority_score)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleAddStore(brand)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Region
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Add Store Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Regional Store for {selectedBrand?.brand_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Region *</Label>
                    <Select
                      value={formData.region_code}
                      onValueChange={(v) => {
                        const region = v as RegionCode;
                        setFormData({
                          ...formData,
                          region_code: region,
                          currency_code: REGIONS[region]?.defaultCurrency as CurrencyCode || 'USD',
                          store_name: `${selectedBrand?.brand_name} ${REGIONS[region]?.name}`,
                          ships_from_country: region === 'EU' ? '' : region,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMissingRegions(selectedBrand).map((r) => (
                          <SelectItem key={r.code} value={r.code}>
                            {r.flag} {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency *</Label>
                    <Select
                      value={formData.currency_code}
                      onValueChange={(v) => setFormData({ ...formData, currency_code: v as CurrencyCode })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_LIST.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Store Name *</Label>
                  <Input
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="e.g., Polymaker Canada"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Store URL *</Label>
                  <Input
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                    placeholder="https://ca.brand.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Product URL Pattern</Label>
                  <Input
                    value={formData.product_url_pattern}
                    onChange={(e) => setFormData({ ...formData, product_url_pattern: e.target.value })}
                    placeholder="https://ca.brand.com/products/{sku}"
                  />
                  <p className="text-xs text-muted-foreground">Use {'{sku}'} as placeholder</p>
                </div>

                <div className="space-y-2">
                  <Label>Ships From Country</Label>
                  <Input
                    value={formData.ships_from_country}
                    onChange={(e) => setFormData({ ...formData, ships_from_country: e.target.value.toUpperCase() })}
                    placeholder="e.g., CA"
                    maxLength={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmitStore} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Store'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRegionalExpansion;
