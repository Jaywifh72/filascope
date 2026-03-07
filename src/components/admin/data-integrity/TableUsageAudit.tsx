import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, Database, ShieldOff, Ghost } from 'lucide-react';

type Filter = 'all' | 'empty' | 'no-rls';
type SortKey = 'table_name' | 'row_count' | 'has_rls';
type SortDir = 'asc' | 'desc';

interface TableRow_ {
  table_name: string;
  row_count: number;
  has_rls: boolean;
}

export function TableUsageAudit() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('row_count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: tables, isLoading } = useQuery({
    queryKey: ['table-usage-audit'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_table_row_counts');
      if (error) throw error;
      return (data ?? []) as TableRow_[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const stats = useMemo(() => {
    if (!tables) return { active: 0, empty: 0, noRls: 0 };
    return {
      active: tables.filter(t => t.row_count > 0 && t.has_rls).length,
      empty: tables.filter(t => t.row_count === 0).length,
      noRls: tables.filter(t => t.row_count > 0 && !t.has_rls).length,
    };
  }, [tables]);

  const filtered = useMemo(() => {
    if (!tables) return [];
    let list = tables;
    if (filter === 'empty') list = list.filter(t => t.row_count === 0);
    if (filter === 'no-rls') list = list.filter(t => t.row_count > 0 && !t.has_rls);
    return [...list].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string')
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean')
        return sortDir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      return sortDir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [tables, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading table stats…</p>;
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-green-500" />
            <span className="text-sm"><strong>{stats.active}</strong> active tables</span>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 flex items-center gap-2">
            <Ghost className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm"><strong>{stats.empty}</strong> empty tables</span>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-destructive" />
            <span className="text-sm"><strong>{stats.noRls}</strong> without RLS</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {([['all', 'All'], ['empty', 'Empty only'], ['no-rls', 'No RLS only']] as const).map(([val, label]) => (
          <Button
            key={val}
            size="sm"
            variant={filter === val ? 'default' : 'outline'}
            onClick={() => setFilter(val)}
            className="text-xs h-7 px-2.5"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortBtn k="table_name">Table Name</SortBtn></TableHead>
                  <TableHead className="text-right"><SortBtn k="row_count">Row Count</SortBtn></TableHead>
                  <TableHead><SortBtn k="has_rls">Has RLS</SortBtn></TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.table_name}>
                    <TableCell className="font-mono text-xs">{t.table_name}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{t.row_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={t.has_rls ? 'secondary' : 'destructive'} className="text-xs">
                        {t.has_rls ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.row_count === 0 ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Empty</Badge>
                      ) : !t.has_rls ? (
                        <Badge variant="destructive" className="text-xs">No RLS!</Badge>
                      ) : (
                        <Badge className="text-xs bg-green-600 hover:bg-green-600/80 text-white border-transparent">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      No tables match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
