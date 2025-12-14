import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FeaturedContentItem {
  id: string;
  module_name: string;
  content_type: 'deal' | 'tip' | 'announcement' | 'product' | 'material';
  title: string;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  entity_id: string | null;
  priority: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  created_by: string | null;
}

export function useFeaturedContent(moduleName?: string) {
  const now = new Date().toISOString();
  
  return useQuery({
    queryKey: ['featured-content', moduleName],
    queryFn: async () => {
      let query = supabase
        .from('featured_content')
        .select('*')
        .eq('is_active', true)
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order('priority', { ascending: true });
      
      if (moduleName) {
        query = query.eq('module_name', moduleName);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data as FeaturedContentItem[];
    },
    staleTime: 60 * 1000,
  });
}

export function useAllFeaturedContent() {
  return useQuery({
    queryKey: ['featured-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FeaturedContentItem[];
    },
    staleTime: 30 * 1000,
  });
}

export function useFeaturedContentMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const createContent = useMutation({
    mutationFn: async (content: Omit<FeaturedContentItem, 'id' | 'created_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('featured_content')
        .insert({
          ...content,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] });
    },
  });
  
  const updateContent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeaturedContentItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('featured_content')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] });
    },
  });
  
  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] });
    },
  });
  
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('featured_content')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-content'] });
    },
  });
  
  return {
    createContent,
    updateContent,
    deleteContent,
    toggleActive,
  };
}
