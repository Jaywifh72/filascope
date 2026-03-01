import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TdMatchResult } from '@/hooks/useTdMatching';
import { Check, AlertTriangle } from 'lucide-react';

interface Props {
  matches: TdMatchResult[];
  unmatchedRefs: { brand_name: string; material_type: string; color_name: string; td_value: number }[];
  isApplying: boolean;
  progress: { current: number; total: number; phase: string };
  stats: { applied: number; errors: number };
  onApply: (matches: TdMatchResult[]) => void;
}

type SortKey = 'vendor' | 'tdValue' | 'confidence';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

export function TdMatchResultsPanel({ matches, unmatchedRefs, isApplying, progress, stats, onApply }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(matches.map(m => m.filamentId)));
  const [sortKey, setSortKey] = useState<SortKey>('vendor');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const arr = [...matches];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'vendor') cmp = a.vendor.localeCompare(b.vendor);
      else if (sortKey === 'tdValue') cmp = a.tdValue - b.tdValue;
      else cmp = a.confidence.localeCompare(b.confidence);
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [matches, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === matches.length) setSelected(new Set());
    else setSelected(new Set(matches.map(m => m.filamentId)));
  };

  const brands = useMemo(() => new Set(matches.map(m => m.vendor)).size, [matches]);
  const selectedMatches = matches.filter(m => selected.has(m.filamentId));

  if (matches.length === 0 && unmatchedRefs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{matches.length}</span> matches across{' '}
          <span className="font-semibold text-foreground">{brands}</span> brands
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={isApplying || selectedMatches.length === 0}
            onClick={() => onApply(selectedMatches)}>
            <Check className="w-4 h-4 mr-1" /> Apply Selected ({selectedMatches.length})
          </Button>
          <Button size="sm" disabled={isApplying || matches.length === 0}
            onClick={() => onApply(matches)}>
            <Check className="w-4 h-4 mr-1" /> Apply All ({matches.length})
          </Button>
        </div>
      </div>

      {/* Progress during apply */}
      {isApplying && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{progress.phase}</p>
          <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Results table */}
      {matches.length > 0 && (
        <div className="max-h-96 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={selected.size === matches.length} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('vendor')}>Vendor</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Ref Material</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('tdValue')}>TD</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('confidence')}>Confidence</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(m => (
                <TableRow key={m.filamentId}>
                  <TableCell><Checkbox checked={selected.has(m.filamentId)} onCheckedChange={() => toggle(m.filamentId)} /></TableCell>
                  <TableCell className="text-xs font-medium">{m.vendor}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{m.productTitle}</TableCell>
                  <TableCell className="text-xs">{m.colorFamily}</TableCell>
                  <TableCell className="text-xs">{m.refMaterial}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold">{m.tdValue}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={CONFIDENCE_COLORS[m.confidence]}>{m.confidence}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{m.matchReason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Unmatched refs */}
      {unmatchedRefs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-medium">{unmatchedRefs.length} unmatched reference values</p>
          </div>
          <div className="max-h-40 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead><TableHead>Material</TableHead><TableHead>Color</TableHead><TableHead>TD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatchedRefs.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.brand_name}</TableCell>
                    <TableCell className="text-xs">{r.material_type}</TableCell>
                    <TableCell className="text-xs">{r.color_name}</TableCell>
                    <TableCell className="text-xs font-mono">{r.td_value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
