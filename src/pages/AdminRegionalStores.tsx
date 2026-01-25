import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Globe, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrandRegionalStoresTable } from '@/components/admin/regional-stores/BrandRegionalStoresTable';
import { AddRegionalStoreDialog } from '@/components/admin/regional-stores/AddRegionalStoreDialog';
import { BrandCoverageOverview } from '@/components/admin/regional-stores/BrandCoverageOverview';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { REGIONS, REGION_LIST } from '@/config/regions';
import { RegionCode } from '@/types/regional';
import { useToast } from '@/hooks/use-toast';

interface BrandWithCoverage {
  id: string;
  brand_name: string;
  brand_slug: string;
  logo_url: string | null;
  storeCount: number;
  activeStoreCount: number;
  regions: string[];
  coverageScore: number;
}

export default function AdminRegionalStores() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionCode | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const { toast } = useToast();

  // Quick region filters
  const quickRegions: RegionCode[] = ['US', 'CA', 'EU', 'UK', 'AU', 'JP', 'CN'];

  // Export to CSV function
  const handleExportCSV = async () => {
    try {
      const { data: stores, error } = await supabase
        .from('brand_regional_stores')
        .select(`
          *,
          automated_brands!inner(brand_name, brand_slug)
        `)
        .order('brand_id');
      
      if (error) throw error;
      if (!stores || stores.length === 0) {
        toast({ title: 'No data to export', variant: 'destructive' });
        return;
      }

      // Flatten for CSV
      const rows = stores.map((store: any) => ({
        brand_name: store.automated_brands?.brand_name || '',
        brand_slug: store.automated_brands?.brand_slug || '',
        store_name: store.store_name,
        region_code: store.region_code,
        currency_code: store.currency_code,
        base_url: store.base_url,
        is_active: store.is_active ? 'Yes' : 'No',
        is_primary: store.is_primary ? 'Yes' : 'No',
        ships_from_country: store.ships_from_country || '',
        free_shipping_threshold: store.free_shipping_threshold || '',
        estimated_shipping_days: store.estimated_shipping_days || '',
      }));

      // Convert to CSV
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(h => {
            const val = String(row[h as keyof typeof row] || '');
            return val.includes(',') ? `"${val}"` : val;
          }).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `regional-stores-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({ title: `Exported ${rows.length} regional stores` });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    }
  };
  // Fetch all brands with their regional store counts
  const { data: brandsWithCoverage, isLoading, refetch } = useQuery({
    queryKey: ['admin-brands-regional-coverage'],
    queryFn: async () => {
      // Get all brands
      const { data: brands, error: brandsError } = await supabase
        .from('automated_brands')
        .select('id, brand_name, brand_slug, logo_url')
        .order('brand_name');
      
      if (brandsError) throw brandsError;

      // Get regional store counts per brand
      const { data: stores, error: storesError } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code, is_active');
      
      if (storesError) throw storesError;

      // Merge data
      return brands?.map(brand => {
        const brandStores = stores?.filter(s => s.brand_id === brand.id) || [];
        const activeStores = brandStores.filter(s => s.is_active);
        const regions = brandStores.map(s => s.region_code);
        
        return {
          ...brand,
          storeCount: brandStores.length,
          activeStoreCount: activeStores.length,
          regions: regions,
          coverageScore: Math.round((activeStores.length / 5) * 100), // 5 main regions
        };
      }) || [];
    },
  });

  // Filter brands
  const filteredBrands = brandsWithCoverage?.filter(brand => {
    const matchesSearch = brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          brand.brand_slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || brand.regions.includes(regionFilter);
    return matchesSearch && matchesRegion;
  }) || [];

  // Stats
  const stats = {
    totalBrands: brandsWithCoverage?.length || 0,
    brandsWithStores: brandsWithCoverage?.filter(b => b.storeCount > 0).length || 0,
    brandsWithoutStores: brandsWithCoverage?.filter(b => b.storeCount === 0).length || 0,
    totalStores: brandsWithCoverage?.reduce((acc, b) => acc + b.storeCount, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back navigation */}
        <AdminPageHeader
          title="Regional Store Management"
          description="Manage brand storefronts across different regions"
          icon={Globe}
          iconColor="text-teal-500"
          actions={
            <>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Regional Store
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-card">
            <p className="text-2xl font-bold text-foreground">{stats.totalBrands}</p>
            <p className="text-sm text-muted-foreground">Total Brands</p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-2xl font-bold text-foreground">{stats.brandsWithStores}</p>
            <p className="text-sm text-muted-foreground">Brands with Stores</p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-2xl font-bold text-amber-500">{stats.brandsWithoutStores}</p>
            <p className="text-sm text-muted-foreground">Missing Store Data</p>
          </Card>
          <Card className="p-4 bg-card">
            <p className="text-2xl font-bold text-foreground">{stats.totalStores}</p>
            <p className="text-sm text-muted-foreground">Total Regional Stores</p>
          </Card>
        </div>

        {/* Quick Region Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={regionFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/90"
            onClick={() => setRegionFilter('all')}
          >
            All Regions
          </Badge>
          {quickRegions.map(region => {
            const regionConfig = REGIONS[region];
            const count = brandsWithCoverage?.filter(b => b.regions.includes(region)).length || 0;
            return (
              <Badge
                key={region}
                variant={regionFilter === region ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setRegionFilter(region)}
              >
                {regionConfig?.flag} {region} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Search and advanced filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v as RegionCode | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {REGION_LIST.map(region => (
                <SelectItem key={region.code} value={region.code}>
                  {region.flag} {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Brands</TabsTrigger>
            <TabsTrigger value="missing" className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Missing Stores ({stats.brandsWithoutStores})
            </TabsTrigger>
            <TabsTrigger value="overview">Coverage Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BrandRegionalStoresTable
              brands={filteredBrands as BrandWithCoverage[]}
              isLoading={isLoading}
              onEditBrand={(brandId) => {
                setSelectedBrandId(brandId);
                setShowAddDialog(true);
              }}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="missing">
            <BrandRegionalStoresTable
              brands={filteredBrands.filter(b => b.storeCount === 0) as BrandWithCoverage[]}
              isLoading={isLoading}
              onEditBrand={(brandId) => {
                setSelectedBrandId(brandId);
                setShowAddDialog(true);
              }}
              onRefresh={refetch}
              emptyMessage="All brands have at least one regional store configured! 🎉"
            />
          </TabsContent>

          <TabsContent value="overview">
            <BrandCoverageOverview 
              brands={brandsWithCoverage as BrandWithCoverage[]} 
              onFilterRegion={(region) => setRegionFilter(region)}
            />
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <AddRegionalStoreDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          brandId={selectedBrandId}
          onSuccess={() => {
            refetch();
            setSelectedBrandId(null);
          }}
        />
      </div>
    </div>
  );
}
