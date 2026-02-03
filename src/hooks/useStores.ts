import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Store, StoreType } from '@/types/regional';

// =============================================
// Query Options
// =============================================

export interface UseStoresOptions {
  region?: string;
  storeType?: StoreType;
  isActive?: boolean;
}

// =============================================
// Query Hooks
// =============================================

/**
 * Get all stores with optional filtering
 */
export function useStores(options: UseStoresOptions = {}) {
  const { region, storeType, isActive = true } = options;

  return useQuery({
    queryKey: ['stores', { region, storeType, isActive }],
    queryFn: async () => {
      let query = supabase
        .from('stores')
        .select('*')
        .order('name');

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }
      if (region) {
        query = query.eq('region', region);
      }
      if (storeType) {
        query = query.eq('store_type', storeType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Store[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Get a single store by ID
 */
export function useStore(storeId: string | undefined) {
  return useQuery({
    queryKey: ['stores', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data as Store;
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Get a store by slug
 */
export function useStoreBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['stores', 'slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Store;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Get stores by region
 */
export function useStoresByRegion(region: string | undefined) {
  return useQuery({
    queryKey: ['stores', 'region', region],
    queryFn: async () => {
      if (!region) return [];
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('region', region)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Store[];
    },
    enabled: !!region,
    staleTime: 1000 * 60 * 30,
  });
}

// =============================================
// Mutation Hooks
// =============================================

type CreateStoreInput = Omit<Store, 'id' | 'created_at' | 'updated_at'>;
type UpdateStoreInput = Partial<CreateStoreInput> & { id: string };

/**
 * Create a new store
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStoreInput) => {
      const { data, error } = await supabase
        .from('stores')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create store', {
        description: error.message,
      });
    },
  });
}

/**
 * Update an existing store
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateStoreInput) => {
      const { data, error } = await supabase
        .from('stores')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.setQueryData(['stores', data.id], data);
      toast.success('Store updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update store', {
        description: error.message,
      });
    },
  });
}

/**
 * Delete a store
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
      return storeId;
    },
    onSuccess: (storeId) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.removeQueries({ queryKey: ['stores', storeId] });
      toast.success('Store deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete store', {
        description: error.message,
      });
    },
  });
}
