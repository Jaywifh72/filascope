import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TdSubmissionButton } from './TdSubmissionButton';

const MAJOR_BRANDS = ['Bambu Lab', 'Polymaker', 'eSUN', 'Overture', 'Hatchbox', 'SUNLU', 'Prusament', 'Inland'];

export function FilamentsNeedingTdSection() {
  const { data: filaments } = useQuery({
    queryKey: ['filaments-needing-td'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, color_hex, color_family, product_handle')
        .is('transmission_distance', null)
        .in('vendor', MAJOR_BRANDS)
        .not('product_title', 'is', null)
        .limit(12);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (!filaments?.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-2">Help Us Grow the Database</h2>
      <p className="text-muted-foreground mb-6">
        These popular filaments don't have TD measurements yet. If you own any of them, submit your measurement!
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filaments.map((f) => (
          <Card key={f.id} className="group hover:border-purple-400/40 transition-colors">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border shrink-0"
                  style={{ backgroundColor: f.color_hex || undefined }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{f.product_title}</p>
                  <p className="text-xs text-muted-foreground">{f.vendor}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{f.material}</Badge>
                <span className="text-xs text-muted-foreground italic">No TD data</span>
              </div>
              <TdSubmissionButton
                filamentId={f.id}
                filamentName={f.product_title || 'Unknown'}
                currentTd={null}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
