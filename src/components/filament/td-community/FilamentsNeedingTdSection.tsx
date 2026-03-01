import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
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
        .limit(6);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

  const { data: counts } = useQuery({
    queryKey: ['td-coverage-counts'],
    queryFn: async () => {
      const { count: withTd } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .not('transmission_distance', 'is', null);
      const { count: total } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true });
      return { withTd: withTd ?? 0, total: total ?? 0 };
    },
    staleTime: 10 * 60_000,
  });

  if (!filaments?.length) return null;

  const pct = counts ? Math.round((counts.withTd / Math.max(counts.total, 1)) * 100) : 0;

  return (
    <section className="my-12">
      <div className="bg-gradient-to-br from-cyan-950/40 via-background to-purple-950/30 border border-cyan-500/20 rounded-2xl p-6 md:p-8">
        {/* Header */}
        <h2 className="text-2xl font-bold text-foreground mb-1">🧪 Help Complete the Database</h2>
        <p className="text-muted-foreground text-base max-w-2xl mb-5">
          These popular filaments are missing TD measurements. If you own any, contribute your measurement and help the community!
        </p>

        {/* Progress bar */}
        {counts && (
          <div className="mb-6 max-w-md">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Community Progress</span>
              <span className="font-mono">{counts.withTd} / {counts.total} filaments</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pct}% complete — your measurement could help!
            </p>
          </div>
        )}

        {/* Compact horizontal card row */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none">
          {filaments.map((f) => {
            const isDark = f.color_hex && (() => {
              const c = f.color_hex!.replace('#', '');
              const r = parseInt(c.substring(0, 2), 16);
              const g = parseInt(c.substring(2, 4), 16);
              const b = parseInt(c.substring(4, 6), 16);
              return (r * 299 + g * 587 + b * 114) / 1000 < 80;
            })();
            return (
              <div
                key={f.id}
                className="min-w-[180px] bg-muted/30 border border-border rounded-lg p-3 snap-start shrink-0 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  {f.color_hex ? (
                    <div
                      className={`w-6 h-6 rounded shrink-0 ring-1 ${isDark ? 'ring-white/40' : 'ring-white/20'}`}
                      style={{ backgroundColor: f.color_hex }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted ring-1 ring-white/20 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{f.product_title}</p>
                    <p className="text-xs text-muted-foreground">{f.vendor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {f.material && (
                    <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">{f.material}</span>
                  )}
                </div>
                <TdSubmissionButton
                  filamentId={f.id}
                  filamentName={f.product_title || 'Unknown'}
                  currentTd={null}
                />
              </div>
            );
          })}
        </div>

        {/* Guide link */}
        <Link
          to="/guides/how-to-measure-filament-td"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mt-4"
        >
          📏 Not sure how to measure? Read our quick guide
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
