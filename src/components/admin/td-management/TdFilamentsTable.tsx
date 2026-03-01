import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTdFilaments, useTdFilterOptions, useUpdateTdValue, useTdSuggestions, useBulkUpdateTd, useBulkClearTd, type TdFilamentFilters } from '@/hooks/useTdManagement';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus } from 'lucide-react';

function ConfidenceDot({ confidence }: { confidence: string | null }) {
  const color = confidence === 'high' ? 'bg-emerald-500' : confidence === 'medium' ? 'bg-amber-500' : 'bg-gray-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

function SortHeader({ label, field, current, dir, onSort }: { label: string; field: string; current: string; dir: string; onSort: (f: string) => void }) {
  const active = current === field;
  return (
    <TableHead className="cursor-pointer select-none" onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {active && (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </TableHead>
  );
}

function QuickAssignPopover({ filament, suggestions, onSave }: {
  filament: any;
  suggestions: any[];
  onSave: (val: number, source: string, confidence: string) => void;
}) {
  const [tdVal, setTdVal] = useState(filament.transmission_distance != null ? String(filament.transmission_distance) : '');
  const [source, setSource] = useState(filament.td_source || 'manual_entry');
  const [confidence, setConfidence] = useState(filament.td_confidence || 'high');

  const matching = suggestions.filter(s =>
    s.brand_name?.toLowerCase() === filament.vendor?.toLowerCase() &&
    (!s.material_type || s.material_type.toLowerCase() === filament.material?.toLowerCase())
  );

  const handleSave = () => {
    const num = parseFloat(tdVal);
    if (isNaN(num) || num < 0.1 || num > 100) return;
    onSave(num, source, confidence);
  };

  return (
    <div className="space-y-3 w-64">
      <div>
        <label className="text-xs font-medium text-muted-foreground">TD Value</label>
        <Input type="number" step="0.01" min="0.1" max="100" value={tdVal} onChange={e => setTdVal(e.target.value)} className="h-8 text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Source</label>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual_entry">Manual Entry</SelectItem>
            <SelectItem value="self_measured">Self Measured</SelectItem>
            <SelectItem value="community_report">Community Report</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Confidence</label>
        <Select value={confidence} onValueChange={setConfidence}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {matching.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Similar References</p>
          {matching.slice(0, 3).map((m, i) => (
            <button key={i} onClick={() => setTdVal(String(m.td_value))} className="text-xs text-primary hover:underline block">
              {m.color_name} ({m.material_type}): {m.td_value}
            </button>
          ))}
        </div>
      )}
      <Button size="sm" className="w-full" onClick={handleSave}>Save</Button>
    </div>
  );
}

export function TdFilamentsTable() {
  const [filters, setFilters] = useState<TdFilamentFilters>({
    search: '', material: 'all', brand: 'all', tdStatus: 'all', sortBy: 'vendor', sortDir: 'asc', pageSize: 50,
  });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTd, setBulkTd] = useState('');
  const [bulkSource, setBulkSource] = useState('manual_entry');
  const [bulkConf, setBulkConf] = useState('high');

  const { data, isLoading } = useTdFilaments(filters, page);
  const { data: options } = useTdFilterOptions();
  const updateMut = useUpdateTdValue();
  const bulkUpdateMut = useBulkUpdateTd();
  const bulkClearMut = useBulkClearTd();

  const vendors = useMemo(() => [...new Set((data?.data ?? []).map((f: any) => f.vendor).filter(Boolean))], [data]);
  const { data: suggestions } = useTdSuggestions(vendors as string[]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const rangeStart = page * (data?.pageSize || 50) + 1;
  const rangeEnd = Math.min((page + 1) * (data?.pageSize || 50), data?.total || 0);

  const getSuggestion = (f: any) => {
    if (!suggestions || f.transmission_distance != null) return null;
    return suggestions.find(s =>
      s.brand_name?.toLowerCase() === f.vendor?.toLowerCase() &&
      (!s.material_type || s.material_type.toLowerCase() === f.material?.toLowerCase())
    );
  };

  const handleSort = (field: string) => {
    setFilters(f => ({
      ...f,
      sortBy: field,
      sortDir: f.sortBy === field && f.sortDir === 'asc' ? 'desc' : 'asc',
    }));
    setPage(0);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!data?.data) return;
    const ids = data.data.map((f: any) => f.id);
    const allSelected = ids.every((id: string) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  };

  const getRowBorder = (f: any) => {
    if (f.transmission_distance == null) return '';
    if (f.td_confidence === 'low') return 'border-l-2 border-l-amber-500/40';
    return 'border-l-2 border-l-emerald-500/40';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search vendor, title..."
          value={filters.search}
          onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(0); }}
          className="w-64"
        />
        <Select value={filters.material} onValueChange={v => { setFilters(f => ({ ...f, material: v })); setPage(0); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Material" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {(options?.materials ?? []).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.brand} onValueChange={v => { setFilters(f => ({ ...f, brand: v })); setPage(0); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {(options?.brands ?? []).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.tdStatus} onValueChange={(v: any) => { setFilters(f => ({ ...f, tdStatus: v })); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="has-td">With TD</SelectItem>
            <SelectItem value="missing-td">Missing TD</SelectItem>
            <SelectItem value="high-conf">High Confidence</SelectItem>
            <SelectItem value="medium-conf">Medium Confidence</SelectItem>
            <SelectItem value="low-conf">Low Confidence</SelectItem>
            <SelectItem value="recent-24h">Recently Matched</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(filters.pageSize)} onValueChange={v => { setFilters(f => ({ ...f, pageSize: Number(v) })); setPage(0); }}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={data?.data?.length ? data.data.every((f: any) => selected.has(f.id)) : false} onCheckedChange={toggleAll} />
              </TableHead>
              <SortHeader label="Vendor" field="vendor" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
              <SortHeader label="Product Title" field="product_title" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
              <SortHeader label="Material" field="material" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
              <SortHeader label="Color" field="color_family" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
              <TableHead>Swatch</TableHead>
              <SortHeader label="TD Value" field="transmission_distance" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
              <TableHead>Suggested</TableHead>
              <SortHeader label="Updated" field="updated_at" current={filters.sortBy} dir={filters.sortDir} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No filaments found</TableCell></TableRow>
            ) : (
              (data?.data ?? []).map((f: any, idx: number) => {
                const suggestion = getSuggestion(f);
                return (
                  <TableRow key={f.id} className={`${getRowBorder(f)} ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                    <TableCell>
                      <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} />
                    </TableCell>
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
                      <TooltipProvider>
                        <Popover>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                {f.transmission_distance != null ? (
                                  <button className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline cursor-pointer">
                                    {f.transmission_distance}
                                    <ConfidenceDot confidence={f.td_confidence} />
                                  </button>
                                ) : (
                                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                                    <span>—</span>
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </PopoverTrigger>
                            </TooltipTrigger>
                            {f.transmission_distance != null && (
                              <TooltipContent side="top" className="text-xs">
                                <p>TD: {f.transmission_distance}</p>
                                <p>Source: {f.td_source || 'unknown'}</p>
                                <p>Confidence: {f.td_confidence || 'unknown'}</p>
                                {f.td_matched_at && <p>Matched: {new Date(f.td_matched_at).toLocaleDateString()}</p>}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          <PopoverContent side="bottom" align="start" className="w-auto p-3">
                            <QuickAssignPopover
                              filament={f}
                              suggestions={suggestions ?? []}
                              onSave={(val, src, conf) => {
                                updateMut.mutate({ id: f.id, value: val, previousValue: f.transmission_distance, source: src, confidence: conf });
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {suggestion ? (
                        <span className="flex items-center gap-1">
                          <span className="text-xs italic text-muted-foreground">~{suggestion.td_value}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={() => updateMut.mutate({
                              id: f.id, value: suggestion.td_value, previousValue: f.transmission_distance,
                              source: 'reference_match', confidence: 'medium',
                            })}
                          >
                            Apply
                          </Button>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Popover open={bulkOpen} onOpenChange={setBulkOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">Set TD for Selected</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">TD Value</label>
                <Input type="number" step="0.01" min="0.1" max="100" value={bulkTd} onChange={e => setBulkTd(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Source</label>
                <Select value={bulkSource} onValueChange={setBulkSource}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_entry">Manual Entry</SelectItem>
                    <SelectItem value="self_measured">Self Measured</SelectItem>
                    <SelectItem value="community_report">Community Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Confidence</label>
                <Select value={bulkConf} onValueChange={setBulkConf}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full" onClick={() => {
                const num = parseFloat(bulkTd);
                if (isNaN(num) || num < 0.1 || num > 100) return;
                bulkUpdateMut.mutate({ ids: [...selected], value: num, source: bulkSource, confidence: bulkConf });
                setSelected(new Set());
                setBulkOpen(false);
              }}>
                Apply to {selected.size} filaments
              </Button>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="destructive" onClick={() => {
            if (confirm(`Clear TD values for ${selected.size} filaments?`)) {
              bulkClearMut.mutate([...selected]);
              setSelected(new Set());
            }
          }}>
            Clear TD ({selected.size})
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Deselect All</Button>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data ? `Showing ${rangeStart}–${rangeEnd} of ${data.total.toLocaleString()}` : ''}
        </p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
