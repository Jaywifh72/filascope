import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BrokenUrlWithProduct {
  id: string;
  product_url: string;
  store_domain: string;
  error_type: string;
  detection_count: number;
  detected_at: string;
  last_detected_at: string;
  resolved_at: string | null;
  new_url: string | null;
  notes: string | null;
  created_at: string | null;
  // Joined from filaments
  filament_id: string | null;
  product_title: string | null;
  vendor: string | null;
}

export interface BrokenUrlStats {
  total: number;
  unresolved: number;
  resolved: number;
  topStore: { domain: string; count: number } | null;
  storeBreakdown: { domain: string; count: number }[];
}

export function useBrokenProductUrls() {
  const [brokenUrls, setBrokenUrls] = useState<BrokenUrlWithProduct[]>([]);
  const [stats, setStats] = useState<BrokenUrlStats>({
    total: 0,
    unresolved: 0,
    resolved: 0,
    topStore: null,
    storeBreakdown: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBrokenUrls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all broken URLs
      const { data: brokenData, error: brokenError } = await supabase
        .from('broken_product_urls')
        .select('*')
        .order('last_detected_at', { ascending: false });

      if (brokenError) throw brokenError;

      if (!brokenData || brokenData.length === 0) {
        setBrokenUrls([]);
        setStats({
          total: 0,
          unresolved: 0,
          resolved: 0,
          topStore: null,
          storeBreakdown: [],
        });
        return;
      }

      // Get unique product URLs for matching
      const productUrls = brokenData.map(b => b.product_url);

      // Fetch matching filaments
      const { data: filaments, error: filamentsError } = await supabase
        .from('filaments')
        .select('id, product_url, product_title, vendor')
        .in('product_url', productUrls);

      if (filamentsError) throw filamentsError;

      // Create a map for quick lookup
      const filamentMap = new Map(
        (filaments || []).map(f => [f.product_url, f])
      );

      // Join data in memory
      const joinedData: BrokenUrlWithProduct[] = brokenData.map(broken => {
        const filament = filamentMap.get(broken.product_url);
        return {
          ...broken,
          filament_id: filament?.id || null,
          product_title: filament?.product_title || null,
          vendor: filament?.vendor || null,
        };
      });

      setBrokenUrls(joinedData);

      // Calculate stats
      const unresolved = joinedData.filter(u => !u.resolved_at).length;
      const resolved = joinedData.filter(u => u.resolved_at).length;

      // Store breakdown (only unresolved)
      const storeCount = new Map<string, number>();
      joinedData
        .filter(u => !u.resolved_at)
        .forEach(u => {
          storeCount.set(u.store_domain, (storeCount.get(u.store_domain) || 0) + 1);
        });

      const storeBreakdown = Array.from(storeCount.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        total: joinedData.length,
        unresolved,
        resolved,
        topStore: storeBreakdown[0] || null,
        storeBreakdown,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch broken URLs';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProductUrl = useCallback(async (
    brokenUrlId: string,
    oldUrl: string,
    newUrl: string
  ) => {
    try {
      // Update filament's product_url
      const { error: filamentError } = await supabase
        .from('filaments')
        .update({ product_url: newUrl })
        .eq('product_url', oldUrl);

      if (filamentError) throw filamentError;

      // Mark as resolved
      const { error: resolveError } = await supabase
        .from('broken_product_urls')
        .update({
          resolved_at: new Date().toISOString(),
          new_url: newUrl,
        })
        .eq('id', brokenUrlId);

      if (resolveError) throw resolveError;

      toast({
        title: 'URL Updated',
        description: 'Product URL has been updated and marked as resolved.',
      });

      await fetchBrokenUrls();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update URL';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchBrokenUrls, toast]);

  const markResolved = useCallback(async (
    brokenUrlId: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('broken_product_urls')
        .update({
          resolved_at: new Date().toISOString(),
          notes: notes || 'Manually marked as fixed',
        })
        .eq('id', brokenUrlId);

      if (error) throw error;

      toast({
        title: 'Marked as Fixed',
        description: 'The broken URL has been marked as resolved.',
      });

      await fetchBrokenUrls();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as resolved';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchBrokenUrls, toast]);

  const dismissUrl = useCallback(async (brokenUrlId: string) => {
    try {
      const { error } = await supabase
        .from('broken_product_urls')
        .delete()
        .eq('id', brokenUrlId);

      if (error) throw error;

      toast({
        title: 'Dismissed',
        description: 'The broken URL record has been removed.',
      });

      await fetchBrokenUrls();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss URL';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchBrokenUrls, toast]);

  const bulkMarkResolved = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('broken_product_urls')
        .update({
          resolved_at: new Date().toISOString(),
          notes: 'Bulk marked as fixed',
        })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Bulk Update Complete',
        description: `${ids.length} URLs marked as resolved.`,
      });

      await fetchBrokenUrls();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk update';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchBrokenUrls, toast]);

  return {
    brokenUrls,
    stats,
    loading,
    error,
    fetchBrokenUrls,
    updateProductUrl,
    markResolved,
    dismissUrl,
    bulkMarkResolved,
  };
}
