import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TdMatchResult } from '@/hooks/useTdMatching';
import { Check, AlertTriangle, Filter } from 'lucide-react';

interface Props {
  matches: TdMatchResult[];
  unmatchedRefs: { brand_name: string; material_type: string; color_name: string; td_value: number }[];
  isApplying: boolean;
  progress: { current: number; total: number; phase: string };
  stats: { applied: number; errors: number; highCount?: number; mediumCount?: number; lowCount?: number };
  totalMissing?: number;
  onApply: (matches: TdMatchResult[]) => void;
}

type SortKey = 'vendor' | 'tdValue' | 'confidence' | 'matchRule';
type ConfidenceFilter = 'all' | 'high' | 'medium-low';

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-red-100 text-red-800 border-red-200',
};

export function TdMatchResultsPanel({ matches, unmatchedRefs, isApplying, progress, stats, totalMissing, onApply }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(matches.map(m => m.filamentId)));
  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [sortAsc, setSortAsc] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');

  // Update selection when matches change
  const matchIds = useMemo(() => new Set(matches.map(m => m.filamentId)), [matches]);

  const filtered = useMemo(() => {
    if (confidenceFilter === 'all') return matches;
    if (confidenceFilter === 'high') return matches.filter(m => m.confidence === 'high');
    return matches.filter(m => m.confidence === 'medium' || m.confidence === 'low');
  }, [matches, confidenceFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const confOrder = { high: 0, medium: 1, low: 2 };
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'vendor') cmp = a.vendor.localeCompare(b.vendor);
      else if (sortKey === 'tdValue') cmp = a.tdValue - b.tdValue;
      else if (sortKey === 'matchRule') cmp = (a.matchRule ?? 0) - (b.matchRule ?? 0);
      else cmp = confOrder[a.confidence] - confOrder[b.confidence];
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

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
    const filteredIds = filtered.map(m => m.filamentId);
    const allSelected = filteredIds.every(id => selected.has(id));
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => new Set([...prev, ...filteredIds]));
    }
  };

  const selectAllHigh = () => {
    const highIds = matches.filter(m => m.confidence === 'high').map(m => m.filamentId);
    setSelected(new Set(highIds));
  };

  const highCount = stats.highCount ?? matches.filter(m => m.confidence === 'high').length;
  const mediumCount = stats.mediumCount ?? matches.filter(m => m.confidence === 'medium').length;
  const lowCount = stats.lowCount ?? matches.filter(m => m.confidence === 'low').length;

  const brands = useMemo(() => new Set(matches.map(m => m.vendor)).size, [matches]);
  const selectedMatches = matches.filter(m => selected.has(m.filamentId));

  if (matches.length === 0 && unmatchedRefs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Summary stats bar */}
      <div className="rounded-md border bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">{matches.length} total matches</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
            {highCount} high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
            {mediumCount} medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
            {lowCount} low
          </span>
          <span className="text-muted-foreground">across {brands} brands</span>
          {totalMissing != null && (
            <span className="text-muted-foreground">
              — {totalMissing.toLocaleString()} filaments missing TD
            </span>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Confidence filter buttons */}
        <div className="flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(['all', 'high', 'medium-low'] as ConfidenceFilter[]).map(f => (
            <Button key={f} size="sm" variant={confidenceFilter === f ? 'default' : 'outline'}
              className="h-7 text-xs" onClick={() => setConfidenceFilter(f)}>
              {f === 'all' ? 'All' : f === 'high' ? 'High Only' : 'Medium+Low'}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={selectAllHigh}>
          Select All High ({highCount})
        </Button>

        <Button size="sm" variant="outline" disabled={isApplying || selectedMatches.length === 0}
          onClick={() => onApply(selectedMatches)}>
          <Check className="w-4 h-4 mr-1" /> Apply Selected ({selectedMatches.length})
        </Button>
        <Button size="sm" disabled={isApplying || matches.length === 0}
          onClick={() => onApply(matches)}>
          <Check className="w-4 h-4 mr-1" /> Apply All ({matches.length})
        </Button>
      </div>

      {/* Progress during apply */}
      {isApplying && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{progress.phase}</p>
          <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Results table */}
      {filtered.length > 0 && (
        <div className="max-h-96 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every(m => selected.has(m.filamentId))}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('vendor')}>Vendor</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Ref Material</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('tdValue')}>TD</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('confidence')}>Confidence</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('matchRule')}>Rule</TableHead>
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
                  <TableCell className="text-xs font-mono">R{m.matchRule ?? '?'}</TableCell>
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
