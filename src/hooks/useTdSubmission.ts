import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TdSubmissionInput {
  filament_id: string;
  submitted_td_value: number;
  measurement_method: string;
  layer_height_mm?: number | null;
  nozzle_temp_c?: number | null;
  printer_model?: string | null;
  notes?: string | null;
  photo_file?: File | null;
}

const DAILY_LIMIT = 10;
const DAILY_LIMIT_KEY = 'td-submissions-today';

function checkDailyLimit(): boolean {
  const stored = localStorage.getItem(DAILY_LIMIT_KEY);
  if (!stored) return true;
  const { date, count } = JSON.parse(stored);
  if (date !== new Date().toISOString().split('T')[0]) return true;
  return count < DAILY_LIMIT;
}

function incrementDailyCount() {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_LIMIT_KEY);
  let count = 1;
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) count = parsed.count + 1;
  }
  localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify({ date: today, count }));
}

export function useExistingSubmission(filamentId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['td-submission', filamentId, user?.id],
    queryFn: async () => {
      if (!user || !filamentId) return null;
      const { data } = await supabase
        .from('td_submissions')
        .select('*')
        .eq('filament_id', filamentId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!filamentId,
  });
}

export function useTdSubmission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (input: TdSubmissionInput) => {
      if (!user) throw new Error('Must be signed in');
      if (!checkDailyLimit()) throw new Error('Daily submission limit reached (10/day)');

      let photo_url: string | null = null;

      // Upload photo if provided
      if (input.photo_file) {
        if (input.photo_file.size > 5 * 1024 * 1024) {
          throw new Error('Photo must be under 5MB');
        }
        setUploading(true);
        const ext = input.photo_file.name.split('.').pop();
        const path = `${input.filament_id}/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('td-calibration-photos')
          .upload(path, input.photo_file);
        setUploading(false);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('td-calibration-photos')
          .getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }

      const { error } = await supabase.from('td_submissions').upsert({
        filament_id: input.filament_id,
        user_id: user.id,
        submitted_td_value: input.submitted_td_value,
        measurement_method: input.measurement_method,
        layer_height_mm: input.layer_height_mm ?? null,
        nozzle_temp_c: input.nozzle_temp_c ?? null,
        printer_model: input.printer_model ?? null,
        notes: input.notes ?? null,
        photo_url,
        status: 'pending',
      }, { onConflict: 'filament_id,user_id' });

      if (error) throw error;
      incrementDailyCount();
    },
    onSuccess: () => {
      toast({ title: 'Measurement submitted!', description: 'Your submission is under review.' });
      queryClient.invalidateQueries({ queryKey: ['td-submission'] });
      queryClient.invalidateQueries({ queryKey: ['td-community-stats'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  return { submit: submitMutation.mutate, isPending: submitMutation.isPending, uploading };
}
