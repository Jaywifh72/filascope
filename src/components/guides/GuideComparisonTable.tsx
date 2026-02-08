import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { type GuideFilament } from '@/hooks/useGuideFilaments';
import { useResolvedPrice } from '@/hooks/useResolvedPrice';
import { cleanFilamentDisplayName } from '@/lib/productNameUtils';
import { getScoreNumberColor } from '@/lib/unifiedFilamentScore';
import { generateFilamentSlug } from '@/lib/seoSlugUtils';

interface GuideComparisonTableProps {
  filaments: GuideFilament[];
}

function PricePerKgCell({ filament }: { filament: GuideFilament }) {
  const resolved = useResolvedPrice(filament as any);
  if (resolved.isLoading) return <span className="text-muted-foreground">—</span>;
  return <span>{resolved.formattedPricePerKg || '—'}</span>;
}

export function GuideComparisonTable({ filaments }: GuideComparisonTableProps) {
  if (filaments.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden mb-8">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Quick Comparison
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-right">Price/kg</TableHead>
            <TableHead className="hidden sm:table-cell text-center">Temp Range</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filaments.map((f, i) => {
            const rank = i + 1;
            const title = cleanFilamentDisplayName(
              f.product_title.replace(new RegExp(`^${f.vendor}\\s*`, 'i'), '').trim()
            );
            const slug = generateFilamentSlug(f.vendor, f.material, f.product_title, f.color_family);
            const scoreColor = getScoreNumberColor(f.score.score);
            const tempRange = f.nozzle_temp_min_c && f.nozzle_temp_max_c
              ? `${f.nozzle_temp_min_c}–${f.nozzle_temp_max_c}°C`
              : '—';

            return (
              <TableRow 
                key={f.id}
                className={rank === 1 ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : 'cursor-pointer hover:bg-muted/50'}
                onClick={() => {
                  document.getElementById(`guide-product-${rank}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <TableCell className="font-bold text-center">
                  {rank === 1 ? (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">#1</Badge>
                  ) : (
                    <span className="text-muted-foreground">#{rank}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link to={`/filament/${slug}`} className="hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                    <p className="font-medium text-sm line-clamp-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{f.vendor}</p>
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {f.score.score != null ? (
                    <span className={`font-bold tabular-nums ${scoreColor}`}>{f.score.score.toFixed(1)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <PricePerKgCell filament={f} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center text-sm text-muted-foreground">
                  {tempRange}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
