import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScoreHistoryPoint {
  id: string;
  score: number;
  scoreType: string;
  changeReason: string | null;
  recordedAt: Date;
}

export interface ScoreHistoryData {
  easeOfPrinting: ScoreHistoryPoint[];
  strengthIndex: ScoreHistoryPoint[];
  valueScore: ScoreHistoryPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useScoreHistory(filamentId: string | undefined): ScoreHistoryData {
  const [data, setData] = useState<ScoreHistoryData>({
    easeOfPrinting: [],
    strengthIndex: [],
    valueScore: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!filamentId) {
      setData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data: history, error } = await supabase
          .from('filament_score_history')
          .select('*')
          .eq('filament_id', filamentId)
          .order('recorded_at', { ascending: true });

        if (error) throw error;

        const easeOfPrinting: ScoreHistoryPoint[] = [];
        const strengthIndex: ScoreHistoryPoint[] = [];
        const valueScore: ScoreHistoryPoint[] = [];

        (history || []).forEach((item) => {
          const point: ScoreHistoryPoint = {
            id: item.id,
            score: Number(item.score),
            scoreType: item.score_type,
            changeReason: item.change_reason,
            recordedAt: new Date(item.recorded_at),
          };

          switch (item.score_type) {
            case 'ease_of_printing':
              easeOfPrinting.push(point);
              break;
            case 'strength_index':
              strengthIndex.push(point);
              break;
            case 'value_score':
              valueScore.push(point);
              break;
          }
        });

        setData({
          easeOfPrinting,
          strengthIndex,
          valueScore,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load history',
        }));
      }
    };

    fetchHistory();
  }, [filamentId]);

  return data;
}
