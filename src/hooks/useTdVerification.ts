import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type VoteType = 'accurate' | 'too_high' | 'too_low';

export function useUserVote(filamentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['td-verification-vote', filamentId, user?.id],
    queryFn: async () => {
      if (!user || !filamentId) return null;
      const { data } = await supabase
        .from('td_verifications')
        .select('*')
        .eq('filament_id', filamentId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!filamentId,
  });
}

export function useTdVerification(filamentId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async ({ vote, user_measured_td, notes }: { vote: VoteType; user_measured_td?: number; notes?: string }) => {
      if (!user || !filamentId) throw new Error('Must be signed in');

      const { error } = await supabase.from('td_verifications').upsert({
        filament_id: filamentId,
        user_id: user.id,
        vote,
        user_measured_td: user_measured_td ?? null,
        notes: notes ?? null,
      }, { onConflict: 'filament_id,user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Vote recorded!', description: 'Thanks for helping verify TD data.' });
      queryClient.invalidateQueries({ queryKey: ['td-verification-vote', filamentId] });
      queryClient.invalidateQueries({ queryKey: ['td-community-stats', filamentId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Vote failed', description: err.message, variant: 'destructive' });
    },
  });

  return { vote: voteMutation.mutate, isPending: voteMutation.isPending };
}
