import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronDown, ChevronRight, Edit, Trash2,
  ExternalLink, MapPin, DollarSign, Truck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { REGIONS } from '@/config/regions';
import { CURRENCIES } from '@/config/currencies';
import { BrandRegionalStore, RegionCode, CurrencyCode } from '@/types/regional';
import { EditRegionalStoreDialog } from './EditRegionalStoreDialog';

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

interface Props {
  brands: BrandWithCoverage[];
  isLoading: boolean;
  onEditBrand: (brandId: string) => void;
  onRefresh: () => void;
  emptyMessage?: string;
}

export function BrandRegionalStoresTable({ 
  brands, 
  isLoading, 
  onEditBrand, 
  onRefresh,
  emptyMessage = "No brands found"
}: Props) {
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [editingStore, setEditingStore] = useState<BrandRegionalStore | null>(null);
  const [deletingStore, setDeletingStore] = useState<BrandRegionalStore | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleExpanded = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  // Toggle store active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ storeId, isActive }: { storeId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('brand_regional_stores')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brand-stores'] });
      onRefresh();
      toast({ title: 'Store status updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update store', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete store
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('brand_regional_stores')
        .delete()
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brand-stores'] });
      onRefresh();
      toast({ title: 'Store deleted' });
      setDeletingStore(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete store', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Regional Coverage</TableHead>
              <TableHead>Stores</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                isExpanded={expandedBrands.has(brand.id)}
                onToggleExpand={() => toggleExpanded(brand.id)}
                onAddStore={() => onEditBrand(brand.id)}
                onEditStore={setEditingStore}
                onDeleteStore={setDeletingStore}
                onToggleActive={(storeId, isActive) => 
                  toggleActiveMutation.mutate({ storeId, isActive })
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Store Dialog */}
      <EditRegionalStoreDialog
        store={editingStore}
        open={!!editingStore}
        onOpenChange={(open) => !open && setEditingStore(null)}
        onSuccess={() => {
          setEditingStore(null);
          onRefresh();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingStore} onOpenChange={(open) => !open && setDeletingStore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Regional Store?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deletingStore?.store_name} store configuration.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingStore && deleteStoreMutation.mutate(deletingStore.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Individual brand row with expandable store details
function BrandRow({ 
  brand, 
  isExpanded, 
  onToggleExpand, 
  onAddStore,
  onEditStore,
  onDeleteStore,
  onToggleActive,
}: {
  brand: BrandWithCoverage;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddStore: () => void;
  onEditStore: (store: BrandRegionalStore) => void;
  onDeleteStore: (store: BrandRegionalStore) => void;
  onToggleActive: (storeId: string, isActive: boolean) => void;
}) {
  // Fetch stores for this brand when expanded
  const { data: stores } = useQuery({
    queryKey: ['admin-brand-stores', brand.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('*')
        .eq('brand_id', brand.id)
        .order('region_code');
      if (error) throw error;
      return data as BrandRegionalStore[];
    },
    enabled: isExpanded,
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand} asChild>
      <>
        <TableRow 
          className="cursor-pointer hover:bg-muted/50"
          onClick={onToggleExpand}
        >
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <img 
                  src={brand.logo_url} 
                  alt={brand.brand_name}
                  className="w-8 h-8 rounded object-contain bg-muted"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium">
                  {brand.brand_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium">{brand.brand_name}</p>
                <p className="text-xs text-muted-foreground">{brand.brand_slug}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              {(['US', 'CA', 'EU', 'UK', 'AU'] as RegionCode[]).map(region => {
                const hasRegion = brand.regions.includes(region);
                const regionConfig = REGIONS[region];
                return (
                  <span
                    key={region}
                    className={`text-sm ${hasRegion ? '' : 'opacity-25 grayscale'}`}
                    title={regionConfig?.name}
                  >
                    {regionConfig?.flag}
                  </span>
                );
              })}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={brand.storeCount > 0 ? 'default' : 'secondary'}>
              {brand.activeStoreCount}/{brand.storeCount}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(brand.coverageScore, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8">
                {brand.coverageScore}%
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAddStore();
              }}
            >
              Add Store
            </Button>
          </TableCell>
        </TableRow>

        {/* Expanded store details */}
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={6} className="p-0">
              {stores && stores.length > 0 ? (
                <div className="p-4 space-y-2">
                  {stores.map(store => (
                    <div 
                      key={store.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {REGIONS[store.region_code as RegionCode]?.flag}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{store.store_name}</span>
                            {store.is_primary && (
                              <Badge variant="outline" className="text-xs">Primary</Badge>
                            )}
                            {!store.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {store.currency_code}
                            </span>
                            {store.ships_from_country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Ships from {store.ships_from_country}
                              </span>
                            )}
                            {store.free_shipping_threshold && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Free over {CURRENCIES[store.currency_code as CurrencyCode]?.symbol}{store.free_shipping_threshold}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={store.base_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Switch
                          checked={store.is_active}
                          onCheckedChange={(checked) => onToggleActive(store.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditStore(store);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStore(store);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No regional stores configured for this brand.{' '}
                  <button 
                    className="text-primary hover:underline"
                    onClick={onAddStore}
                  >
                    Add one now
                  </button>
                </div>
              )}
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
}
