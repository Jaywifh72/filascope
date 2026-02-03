import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExchangeRateStatus {
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  rate_to_usd: number;
  updated_at: string;
  status: 'fresh' | 'stale' | 'outdated';
  hours_since_update: number;
}

export function ExchangeRateInfo() {
  const { data: rates } = useQuery({
    queryKey: ['exchange-rate-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rate_status')
        .select('*')
        .order('currency_code');
      
      if (error) throw error;
      return data as ExchangeRateStatus[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (!rates || rates.length === 0) return null;

  const lastUpdate = rates[0]?.updated_at;
  const allFresh = rates.every(r => r.status === 'fresh');
  const hasOutdated = rates.some(r => r.status === 'outdated');

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span>
        Rates updated{' '}
        {lastUpdate
          ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })
          : 'never'}
      </span>
      {hasOutdated && (
        <span className="text-amber-500 font-medium">(outdated)</span>
      )}
      {!hasOutdated && !allFresh && (
        <span className="text-amber-400">(stale)</span>
      )}
    </div>
  );
}
