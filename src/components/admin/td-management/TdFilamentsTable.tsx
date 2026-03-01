import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTdFilaments, useTdFilterOptions, useUpdateTdValue, type TdFilamentFilters } from '@/hooks/useTdManagement';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function TdFilamentsTable() {
  const [filters, setFilters] = useState<TdFilamentFilters>({
    search: '', material: 'all', brand: 'all', tdStatus: 'all', sortBy: 'vendor', sortDir: 'asc',
  });
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useTdFilaments(filters, page);
  const { data: options } = useTdFilterOptions();
  const updateMut = useUpdateTdValue();

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const startEdit = (id: string, current: number | null) => {
    setEditingId(id);
    setEditValue(current != null ? String(current) : '');
  };

  const commitEdit = (id: string, previousValue: number | null) => {
    setEditingId(null);
    const trimmed = editValue.trim();
    if (trimmed === '') {
      updateMut.mutate({ id, value: null, previousValue });
      return;
    }
    const num = parseFloat(trimmed);
    if (isNaN(num) || num < 0.1 || num > 15) return;
    updateMut.mutate({ id, value: num, previousValue });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search vendor, title..."
          value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(0); }}
          className="w-64"
        />
        <Select value={filters.material} onValueChange={(v) => { setFilters((f) => ({ ...f, material: v })); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Material" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {(options?.materials ?? []).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.brand} onValueChange={(v) => { setFilters((f) => ({ ...f, brand: v })); setPage(0); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {(options?.brands ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.tdStatus} onValueChange={(v: any) => { setFilters((f) => ({ ...f, tdStatus: v })); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="has-td">Has TD</SelectItem>
            <SelectItem value="missing-td">Missing TD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Product Title</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Swatch</TableHead>
              <TableHead>TD Value</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No filaments found</TableCell></TableRow>
            ) : (
              (data?.data ?? []).map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium text-xs">{f.vendor}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{f.display_name || f.product_title}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{f.material || '—'}</Badge></TableCell>
                  <TableCell className="text-xs">{f.color_family || '—'}</TableCell>
                  <TableCell>
                    {f.color_hex ? (
                      <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: f.color_hex }} />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {editingId === f.id ? (
                      <Input
                        autoFocus
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="15"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(f.id, f.transmission_distance)}
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit(f.id, f.transmission_distance)}
                        className="w-20 h-7 text-xs"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(f.id, f.transmission_distance)}
                        className="text-xs hover:underline cursor-pointer min-w-[40px] text-left"
                      >
                        {f.transmission_distance != null ? f.transmission_distance : <span className="text-muted-foreground">—</span>}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data ? `${data.total.toLocaleString()} total · Page ${page + 1} of ${totalPages}` : ''}
        </p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
