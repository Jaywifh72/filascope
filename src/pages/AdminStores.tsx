import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreTable } from '@/components/admin/stores/StoreTable';
import { StoreFormModal, StoreFormData } from '@/components/admin/stores/StoreFormModal';
import { DeleteStoreDialog } from '@/components/admin/stores/DeleteStoreDialog';
import { useStores, useCreateStore, useUpdateStore, useDeleteStore } from '@/hooks/useStores';
import { REGION_DISPLAY } from '@/config/countries';
import type { Store as StoreType, StoreType as StoreTypeEnum } from '@/types/regional';

const STORE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'brand_direct', label: 'Brand Direct' },
  { value: 'retailer', label: 'Retailer' },
];

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  ...Object.entries(REGION_DISPLAY).map(([code, display]) => ({
    value: code,
    label: `${display.flag} ${display.name}`,
  })),
];

export default function AdminStores() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStore, setDeletingStore] = useState<StoreType | null>(null);

  // Fetch all stores (including inactive)
  const { data: stores = [], isLoading } = useStores({ isActive: undefined });
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();

  // Filter stores
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !store.name.toLowerCase().includes(query) &&
          !store.slug.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Region filter
      if (regionFilter !== 'all' && store.region !== regionFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && store.store_type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [stores, searchQuery, regionFilter, typeFilter]);

  const handleAddStore = () => {
    setEditingStore(null);
    setFormModalOpen(true);
  };

  const handleEditStore = (store: StoreType) => {
    setEditingStore(store);
    setFormModalOpen(true);
  };

  const handleDeleteStore = (store: StoreType) => {
    setDeletingStore(store);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = (store: StoreType) => {
    updateStore.mutate({
      id: store.id,
      is_active: !store.is_active,
    });
  };

  const handleFormSubmit = (data: StoreFormData) => {
    if (editingStore) {
      updateStore.mutate(
        {
          id: editingStore.id,
          ...data,
        },
        {
          onSuccess: () => setFormModalOpen(false),
        }
      );
    } else {
      createStore.mutate(data, {
        onSuccess: () => setFormModalOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingStore) {
      deleteStore.mutate(deletingStore.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletingStore(null);
        },
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <AdminPageHeader
          title="Store Registry"
          description="Manage stores and retailers for regional pricing"
          icon={Store}
          actions={
            <Button onClick={handleAddStore}>
              <Plus className="w-4 h-4 mr-2" />
              Add Store
            </Button>
          }
        />

        <Card>
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground self-center whitespace-nowrap">
                {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <StoreTable
                stores={filteredStores}
                onEdit={handleEditStore}
                onDelete={handleDeleteStore}
                onToggleActive={handleToggleActive}
                isUpdating={updateStore.isPending}
              />
            )}
          </CardContent>
        </Card>

        {/* Form Modal */}
        <StoreFormModal
          open={formModalOpen}
          onOpenChange={setFormModalOpen}
          store={editingStore}
          onSubmit={handleFormSubmit}
          isSubmitting={createStore.isPending || updateStore.isPending}
        />

        {/* Delete Dialog */}
        <DeleteStoreDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          storeName={deletingStore?.name || ''}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteStore.isPending}
        />
      </div>
    </AdminLayout>
  );
}
