import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Link2, Search, AlertTriangle, CheckCircle2, 
  XCircle, Loader2, ExternalLink, RefreshCw,
  Play, RotateCcw, Globe, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { REGIONS } from '@/config/regions';
import { validateStoreUrl, validateStoreUrls } from '@/services/urlValidationService';
import type { RegionCode } from '@/types/regional';

interface StoreWithValidation {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  store_name: string;
  region_code: string;
  currency_code: string;
  base_url: string;
  product_url_pattern: string | null;
  shopify_domain: string | null;
  is_active: boolean;
  is_primary: boolean;
  updated_at: string;
  validation_status?: 'valid' | 'invalid' | 'redirect' | 'geo_restricted' | 'unknown' | 'pending' | 'checking';
  validation_code?: number | null;
  validation_redirect?: string | null;
  validation_checked?: Date;
}

/** Check if a store URL is a Bambu Lab custom (non-Shopify) store */
function isBambuLabCustomStore(url: string): boolean {
  const l = url.toLowerCase();
  if (!l.includes('store.bambulab.com') && !l.includes('bambulab.com/products')) return false;
  if (l.includes('jp.store.bambulab.com')) return false;
  return true;
}

interface ValidationCache {
  url: string;
  status: string;
  status_code: number | null;
  redirect_url: string | null;
  last_checked: string;
}

export default function AdminStoreUrls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bulkValidating, setBulkValidating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingStore, setTestingStore] = useState<StoreWithValidation | null>(null);
  const [testSlug, setTestSlug] = useState('');
  const [testResult, setTestResult] = useState<{ url: string; status: string; code: number | null } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [editingShopifyId, setEditingShopifyId] = useState<string | null>(null);
  const [editingShopifyValue, setEditingShopifyValue] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all regional stores with brand info
  const { data: stores, isLoading: storesLoading, refetch: refetchStores } = useQuery({
    queryKey: ['admin-store-urls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select(`
          id,
          brand_id,
          store_name,
          region_code,
          currency_code,
          base_url,
          product_url_pattern,
          shopify_domain,
          is_active,
          is_primary,
          updated_at,
          automated_brands!inner (
            brand_name,
            brand_slug
          )
        `)
        .order('store_name');
      
      if (error) throw error;
      
      return (data || []).map((store: any) => ({
        ...store,
        brand_name: store.automated_brands?.brand_name || 'Unknown',
        brand_slug: store.automated_brands?.brand_slug || '',
      })) as StoreWithValidation[];
    },
  });

  // Fetch validation cache
  const { data: validationCache, refetch: refetchCache } = useQuery({
    queryKey: ['admin-url-validation-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_validation_cache')
        .select('*');
      
      if (error) throw error;
      return data as ValidationCache[];
    },
  });

  // Merge stores with validation status
  const storesWithValidation = useMemo(() => {
    if (!stores) return [];
    
    const cacheMap = new Map(
      (validationCache || []).map(v => [v.url, v])
    );
    
    return stores.map(store => {
      const cached = cacheMap.get(store.base_url);
      return {
        ...store,
        validation_status: cached?.status as StoreWithValidation['validation_status'] || 'unknown',
        validation_code: cached?.status_code,
        validation_redirect: cached?.redirect_url,
        validation_checked: cached?.last_checked ? new Date(cached.last_checked) : undefined,
      };
    });
  }, [stores, validationCache]);

  // Filter stores
  const filteredStores = useMemo(() => {
    return storesWithValidation.filter(store => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          store.brand_name.toLowerCase().includes(query) ||
          store.store_name.toLowerCase().includes(query) ||
          store.base_url.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      // Region filter
      if (regionFilter !== 'all' && store.region_code !== regionFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && store.validation_status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [storesWithValidation, searchQuery, regionFilter, statusFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = storesWithValidation.length;
    const valid = storesWithValidation.filter(s => {
      if (s.validation_status === 'valid') return true;
      // Count Bambu Lab custom stores with geo_restricted or same-brand redirect as valid
      if (isBambuLabCustomStore(s.base_url)) {
        if (s.validation_status === 'geo_restricted') return true;
        if (s.validation_status === 'redirect' && s.validation_redirect?.includes('bambulab.com')) return true;
      }
      return false;
    }).length;
    const invalid = storesWithValidation.filter(s => s.validation_status === 'invalid').length;
    const redirects = storesWithValidation.filter(s => {
      if (s.validation_status !== 'redirect' && s.validation_status !== 'geo_restricted') return false;
      // Don't count Bambu Lab custom store geo-redirects as problematic
      if (isBambuLabCustomStore(s.base_url)) {
        if (s.validation_status === 'geo_restricted') return false;
        if (s.validation_redirect?.includes('bambulab.com')) return false;
      }
      return true;
    }).length;
    const unchecked = storesWithValidation.filter(s => s.validation_status === 'unknown').length;
    
    return { total, valid, invalid, redirects, unchecked };
  }, [storesWithValidation]);

  // Validate single URL
  const validateSingleUrl = async (store: StoreWithValidation) => {
    const storeIndex = storesWithValidation.findIndex(s => s.id === store.id);
    if (storeIndex === -1) return;
    
    // Update to checking state
    queryClient.setQueryData(['admin-store-urls'], (old: StoreWithValidation[] | undefined) => {
      if (!old) return old;
      return old.map(s => s.id === store.id ? { ...s, validation_status: 'checking' as const } : s);
    });
    
    try {
      const result = await validateStoreUrl(store.base_url, true);
      await refetchCache();
      toast({
        title: 'URL validated',
        description: `${store.store_name}: ${result.status} (${result.statusCode || 'N/A'})`,
      });
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Bulk validate all URLs
  const runBulkValidation = async () => {
    if (!stores || stores.length === 0) return;
    
    setBulkValidating(true);
    setBulkProgress({ current: 0, total: stores.length });
    
    try {
      // Validate in batches of 5
      const batchSize = 5;
      for (let i = 0; i < stores.length; i += batchSize) {
        const batch = stores.slice(i, i + batchSize);
        const urls = batch.map(s => s.base_url);
        
        await validateStoreUrls(urls);
        setBulkProgress({ current: Math.min(i + batchSize, stores.length), total: stores.length });
      }
      
      await refetchCache();
      toast({
        title: 'Bulk validation complete',
        description: `Validated ${stores.length} URLs`,
      });
    } catch (error) {
      toast({
        title: 'Bulk validation failed',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setBulkValidating(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  // Test product URL with specific slug
  const testProductUrl = async () => {
    if (!testingStore || !testSlug) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      // Build the full product URL
      let testUrl = testingStore.base_url;
      if (testingStore.product_url_pattern) {
        testUrl = testingStore.product_url_pattern.replace('{slug}', testSlug);
      } else {
        testUrl = `${testingStore.base_url.replace(/\/$/, '')}/${testSlug}`;
      }
      
      const result = await validateStoreUrl(testUrl, true);
      setTestResult({
        url: testUrl,
        status: result.status,
        code: result.statusCode,
      });
    } catch (error) {
      setTestResult({
        url: '',
        status: 'error',
        code: null,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Update URL pattern mutation
  const updatePatternMutation = useMutation({
    mutationFn: async ({ storeId, pattern }: { storeId: string; pattern: string }) => {
      const { error } = await supabase
        .from('brand_regional_stores')
        .update({ 
          product_url_pattern: pattern || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchStores();
      toast({ title: 'URL pattern updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update pattern',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  // Update shopify_domain mutation
  const updateShopifyDomainMutation = useMutation({
    mutationFn: async ({ storeId, shopifyDomain }: { storeId: string; shopifyDomain: string | null }) => {
      const { error } = await supabase
        .from('brand_regional_stores')
        .update({ 
          shopify_domain: shopifyDomain || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchStores();
      toast({ title: 'Shopify domain updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update Shopify domain',
        description: String(error),
        variant: 'destructive',
      });
    },
  });



  const startEditShopify = (store: StoreWithValidation) => {
    setEditingShopifyId(store.id);
    setEditingShopifyValue(store.shopify_domain || '');
  };

  const saveShopifyDomain = (storeId: string) => {
    updateShopifyDomainMutation.mutate({ 
      storeId, 
      shopifyDomain: editingShopifyValue.trim() || null 
    });
    setEditingShopifyId(null);
  };

  const getStatusBadge = (status: string | undefined, store?: StoreWithValidation) => {
    const isCustomBambu = store ? isBambuLabCustomStore(store.base_url) : false;
    
    switch (status) {
      case 'valid':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {isCustomBambu ? 'Valid (custom)' : 'Valid'}
          </Badge>
        );
      case 'geo_restricted':
        // For Bambu Lab custom stores, geo-redirect within the brand is expected
        if (isCustomBambu) {
          return (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid (geo-redirected)
            </Badge>
          );
        }
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <Globe className="w-3 h-3 mr-1" />
            Geo-restricted
          </Badge>
        );
      case 'invalid':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            404
          </Badge>
        );
      case 'redirect':
        // For Bambu Lab custom stores, redirects within bambulab.com are OK
        if (isCustomBambu && store?.validation_redirect?.includes('bambulab.com')) {
          return (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid (geo-redirected)
            </Badge>
          );
        }
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <RefreshCw className="w-3 h-3 mr-1" />
            Redirect
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Checking
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Unchecked
          </Badge>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <AdminPageHeader
            title="Store URL Validation"
            description="Manage and verify regional store URLs for product links"
            icon={Link2}
            iconColor="text-cyan-500"
            actions={
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { refetchStores(); refetchCache(); }}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button 
                  onClick={runBulkValidation}
                  disabled={bulkValidating || !stores?.length}
                  className="gap-2"
                >
                  {bulkValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Validate All
                    </>
                  )}
                </Button>
              </>
            }
          />

          {/* Bulk Progress */}
          {bulkValidating && (
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Validating URLs... {bulkProgress.current} / {bulkProgress.total}
                  </p>
                  <Progress 
                    value={(bulkProgress.current / bulkProgress.total) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-card">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Stores</p>
            </Card>
            <Card className="p-4 bg-card">
              <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
              <p className="text-sm text-muted-foreground">Valid URLs</p>
            </Card>
            <Card className="p-4 bg-card">
              <p className="text-2xl font-bold text-destructive">{stats.invalid}</p>
              <p className="text-sm text-muted-foreground">Broken (404)</p>
            </Card>
            <Card className="p-4 bg-card">
              <p className="text-2xl font-bold text-amber-500">{stats.redirects}</p>
              <p className="text-sm text-muted-foreground">Redirects</p>
            </Card>
            <Card className="p-4 bg-card">
              <p className="text-2xl font-bold text-muted-foreground">{stats.unchecked}</p>
              <p className="text-sm text-muted-foreground">Unchecked</p>
            </Card>
          </div>

          {/* Broken URLs Alert */}
          {stats.invalid > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">
                    {stats.invalid} broken URL{stats.invalid > 1 ? 's' : ''} detected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    These store URLs are returning 404 errors and need to be updated.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search brands, stores, or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {Object.entries(REGIONS).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    {config.flag} {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Broken (404)</SelectItem>
                <SelectItem value="redirect">Redirect</SelectItem>
                <SelectItem value="unknown">Unchecked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Table */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>URL / Pattern</TableHead>
                  <TableHead>Shopify Domain</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No stores found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store) => (
                    <TableRow 
                      key={store.id}
                      className={store.validation_status === 'invalid' ? 'bg-destructive/5' : ''}
                    >
                      <TableCell>
                        <div className="font-medium">{store.brand_name}</div>
                        <div className="text-xs text-muted-foreground">{store.store_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {REGIONS[store.region_code as RegionCode]?.flag}
                          </span>
                          <span className="text-sm">{store.region_code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a 
                                href={store.base_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline truncate block"
                              >
                                {store.base_url}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md">
                              {store.base_url}
                            </TooltipContent>
                          </Tooltip>
                          {store.product_url_pattern && (
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              Pattern: {store.product_url_pattern}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        {editingShopifyId === store.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingShopifyValue}
                              onChange={(e) => setEditingShopifyValue(e.target.value)}
                              placeholder="store.myshopify.com"
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveShopifyDomain(store.id);
                                if (e.key === 'Escape') setEditingShopifyId(null);
                              }}
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => saveShopifyDomain(store.id)}>
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer group/shopify flex items-center gap-1"
                            onClick={() => startEditShopify(store)}
                          >
                            {store.shopify_domain ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs font-mono text-primary truncate">{store.shopify_domain}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Shopify JSON API domain — click to edit</p>
                                  <p className="text-xs text-muted-foreground mt-1">Enables direct API pricing instead of scraping</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : isBambuLabCustomStore(store.base_url) ? (
                              <span className="text-xs text-muted-foreground italic">N/A (custom)</span>
                            ) : (
                              <span className="text-xs text-muted-foreground opacity-0 group-hover/shopify:opacity-100 transition-opacity">
                                + Add domain
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{store.currency_code}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(store.validation_status, store)}
                        {store.validation_status === 'redirect' && store.validation_redirect && !isBambuLabCustomStore(store.base_url) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block text-xs text-muted-foreground mt-1 truncate max-w-[100px]">
                                → {store.validation_redirect}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{store.validation_redirect}</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {store.validation_checked ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(store.validation_checked, { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => validateSingleUrl(store)}
                                disabled={store.validation_status === 'checking'}
                              >
                                <RefreshCw className={`w-4 h-4 ${store.validation_status === 'checking' ? 'animate-spin' : ''}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Validate URL</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setTestingStore(store);
                                  setTestSlug('');
                                  setTestResult(null);
                                  setTestDialogOpen(true);
                                }}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Test Product URL</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={store.base_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>Open in New Tab</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Test Product URL Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Product URL</DialogTitle>
            <DialogDescription>
              Enter a product slug to test the URL pattern for {testingStore?.brand_name} ({testingStore?.region_code})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Slug</label>
              <Input
                placeholder="e.g., pla-basic-black"
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
              />
            </div>
            
            {testingStore?.product_url_pattern && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Pattern: </span>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {testingStore.product_url_pattern}
                </code>
              </div>
            )}
            
            {testResult && (
              <div className={`p-3 rounded-lg border ${
                testResult.status === 'valid' 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : testResult.status === 'invalid'
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.status === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {testResult.status === 'invalid' && <XCircle className="w-4 h-4 text-destructive" />}
                  {testResult.status === 'redirect' && <RefreshCw className="w-4 h-4 text-amber-500" />}
                  <span className="font-medium capitalize">{testResult.status}</span>
                  {testResult.code && (
                    <Badge variant="outline" className="text-xs">
                      HTTP {testResult.code}
                    </Badge>
                  )}
                </div>
                <a 
                  href={testResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline break-all"
                >
                  {testResult.url}
                </a>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={testProductUrl}
              disabled={!testSlug || testLoading}
            >
              {testLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test URL
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
