import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

interface SettingsEntry {
  nozzleTemp: number;
  bedTemp: number;
  printSpeed?: number;
  cooling?: number;
  retraction?: number;
  chamberTemp?: number;
}

interface SettingsHistoryItem {
  id: string;
  filament_id: string;
  printer_id: string | null;
  settings: SettingsEntry;
  notes: string | null;
  created_at: string;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem('filascope_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('filascope_session_id', sessionId);
  }
  return sessionId;
}

export function useSettingsHistory(filamentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const { data: history, isLoading } = useQuery({
    queryKey: ['settings-history', filamentId, user?.id],
    queryFn: async () => {
      // Only authenticated users can view settings history
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_settings_history')
        .select('*')
        .eq('filament_id', filamentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        settings: item.settings as unknown as SettingsEntry,
      })) as SettingsHistoryItem[];
    },
  });

  const saveSettings = useMutation({
    mutationFn: async ({
      settings,
      printerId,
      notes,
    }: {
      settings: SettingsEntry;
      printerId?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('user_settings_history')
        .insert({
          user_id: user?.id || null,
          session_id: user?.id ? null : sessionId,
          filament_id: filamentId,
          printer_id: printerId || null,
          settings: settings as unknown as Json,
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-history', filamentId] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('user_settings_history')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-history', filamentId] });
    },
  });

  return {
    history: history || [],
    isLoading,
    saveSettings,
    deleteEntry,
  };
}
