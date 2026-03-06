import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database, Package, PlusCircle, TrendingUp } from 'lucide-react';

interface Props {
  brandId: string;
  activeJobId: string | null;
}

export function BrandSyncDashboard({ brandId, activeJobId }: Props) {
  const { data } = useQuery({
    queryKey: ['brand-sync-dashboard', brandId, activeJobId],
    queryFn: async () => {
      // DB coverage
      const { count: dbCount } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brandId);

      // Latest job stats
      let storeProducts = 0;
      let newAvailable = 0;
      let priceChanges = 0;

      if (activeJobId) {
        const { data: job } = await supabase
          .from('brand_sync_jobs')
          .select('filament_products_found, new_count, changed_count')
          .eq('id', activeJobId)
          .maybeSingle();
        if (job) {
          storeProducts = job.filament_products_found ?? 0;
          newAvailable = job.new_count ?? 0;
          priceChanges = job.changed_count ?? 0;
        }
      } else {
        // Use latest completed job
        const { data: job } = await supabase
          .from('brand_sync_jobs')
          .select('filament_products_found, new_count, changed_count')
          .eq('brand_id', brandId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (job) {
          storeProducts = job.filament_products_found ?? 0;
          newAvailable = job.new_count ?? 0;
          priceChanges = job.changed_count ?? 0;
        }
      }

      return { dbCount: dbCount ?? 0, storeProducts, newAvailable, priceChanges };
    },
  });

  const cards = [
    { label: 'In Database', value: data?.dbCount ?? 0, icon: Database, color: 'text-blue-500' },
    { label: 'Store Products', value: data?.storeProducts ?? 0, icon: Package, color: 'text-muted-foreground' },
    { label: 'New Available', value: data?.newAvailable ?? 0, icon: PlusCircle, color: 'text-green-500' },
    { label: 'Price Changes', value: data?.priceChanges ?? 0, icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <c.icon className={`h-8 w-8 ${c.color} shrink-0`} />
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
