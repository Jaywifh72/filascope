import { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useTdReferenceValues,
  useAddReferenceValue,
  useDeleteReferenceValue,
  useUpdateReferenceValue,
  useReferenceMatchStats,
  useBulkDeleteReferences,
  useBulkUpdateConfidence,
  useTdFilterOptions,
  type ReferenceMatchStat,
} from '@/hooks/useTdManagement';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Pencil, Check, X, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MATERIALS = ['PLA', 'PLA Basic', 'PLA Matte', 'PLA+', 'Silk PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC'];
const SOURCES = ['hueforge_community', '3dfilamentprofiles_community', 'manufacturer_official', 'brand_published', 'user_measured', 'admin_entered', 'csv_import', 'self_measured'];
const CONFIDENCE_OPTIONS = ['high', 'medium', 'low'];

type SortKey = 'brand_name' | 'color_name' | 'material_type' | 'td_value' | 'source' | 'confidence';

export function TdReferenceTable() {
  const { data: refs, isLoading } = useTdReferenceValues();
  const { data: matchStats } = useReferenceMatchStats();
  const { data: filterOpts } = useTdFilterOptions();
  const addMut = useAddReferenceValue();
  const deleteMut = useDeleteReferenceValue();
  const updateMut = useUpdateReferenceValue();
  const bulkDeleteMut = useBulkDeleteReferences();
  const bulkConfMut = useBulkUpdateConfidence();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ brand_name: '', color_name: '', material_type: 'PLA', td_value: '', source: 'hueforge_community', confidence: 'medium', notes: '', hex_code: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [confFilter, setConfFilter] = useState('all');
  const [matchFilter, setMatchFilter] = useState('all');

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('brand_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  // Gap analysis
  const [gapOpen, setGapOpen] = useState(false);

  const getMatchStatus = useCallback((refId: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; count: number } => {
    if (!matchStats) return { label: 'Loading...', variant: 'outline', count: 0 };
    const s = matchStats.get(refId);
    if (!s || s.matched_count === 0) return { label: 'No Match', variant: 'destructive', count: 0 };
    if (s.brand_with_td < s.brand_total) return { label: `Partial (${s.matched_count})`, variant: 'secondary', count: s.matched_count };
    return { label: `Matched (${s.matched_count})`, variant: 'default', count: s.matched_count };
  }, [matchStats]);

  const getCoverage = useCallback((refId: string): string => {
    if (!matchStats) return '—';
    const s = matchStats.get(refId);
    if (!s) return '0/0';
    return `${s.brand_with_td}/${s.brand_total}`;
  }, [matchStats]);

  // Filtered + sorted data
  const filtered = useMemo(() => {
    if (!refs) return [];
    let data = [...refs];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r: any) =>
        r.brand_name?.toLowerCase().includes(q) ||
        r.color_name?.toLowerCase().includes(q) ||
        r.material_type?.toLowerCase().includes(q)
      );
    }
    if (sourceFilter !== 'all') data = data.filter((r: any) => r.source === sourceFilter);
    if (confFilter !== 'all') data = data.filter((r: any) => r.confidence === confFilter);
    if (matchFilter !== 'all' && matchStats) {
      data = data.filter((r: any) => {
        const s = matchStats.get(r.id);
        if (matchFilter === 'matched') return s && s.matched_count > 0 && s.brand_with_td >= s.brand_total;
        if (matchFilter === 'partial') return s && s.matched_count > 0 && s.brand_with_td < s.brand_total;
        if (matchFilter === 'no-match') return !s || s.matched_count === 0;
        return true;
      });
    }

    data.sort((a: any, b: any) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'td_value') { av = Number(av); bv = Number(bv); }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [refs, search, sourceFilter, confFilter, matchFilter, matchStats, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Gap analysis data
  const gapAnalysis = useMemo(() => {
    if (!refs || !matchStats) return { noMatch: [], duplicates: [], stale: [] };

    const noMatch: string[] = [];
    const brandSet = new Set<string>();
    refs.forEach((r: any) => {
      const s = matchStats.get(r.id);
      if (!s || s.matched_count === 0) brandSet.add(r.brand_name);
    });
    brandSet.forEach(b => noMatch.push(b));

    // Duplicates: same brand+color+material, different TD
    const keyMap = new Map<string, any[]>();
    refs.forEach((r: any) => {
      const k = `${r.brand_name?.toLowerCase()}|${r.color_name?.toLowerCase()}|${r.material_type?.toLowerCase()}`;
      if (!keyMap.has(k)) keyMap.set(k, []);
      keyMap.get(k)!.push(r);
    });
    const duplicates: { key: string; entries: any[] }[] = [];
    keyMap.forEach((entries, key) => {
      const uniqueTds = new Set(entries.map((e: any) => e.td_value));
      if (uniqueTds.size > 1) duplicates.push({ key, entries });
    });

    // Stale: not updated in 30+ days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const stale = refs.filter((r: any) => {
      const d = r.updated_at ? new Date(r.updated_at) : r.created_at ? new Date(r.created_at) : null;
      return d && d < thirtyDaysAgo;
    });

    return { noMatch, duplicates, stale };
  }, [refs, matchStats]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleAdd = () => {
    const val = parseFloat(form.td_value);
    if (!form.brand_name || !form.color_name || isNaN(val) || val < 0.1 || val > 100) return;
    addMut.mutate({ ...form, td_value: val }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ brand_name: '', color_name: '', material_type: 'PLA', td_value: '', source: 'hueforge_community', confidence: 'medium', notes: '', hex_code: '' });
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r: any) => r.id)));
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditValues({ td_value: r.td_value, confidence: r.confidence, source: r.source });
  };

  const saveEdit = (id: string) => {
    updateMut.mutate({ id, updates: editValues });
    setEditingId(null);
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground font-medium">{filtered.length} reference values</p>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search brand, color, material..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
        </div>
        <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={confFilter} onValueChange={v => { setConfFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Confidence" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            {CONFIDENCE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={matchFilter} onValueChange={v => { setMatchFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Match Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="no-match">No Match</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Reference</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Reference TD Value</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Brand Name</Label>
                <Input list="brand-opts" value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} />
                <datalist id="brand-opts">{filterOpts?.brands.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div><Label>Color Name</Label><Input value={form.color_name} onChange={e => setForm(f => ({ ...f, color_name: e.target.value }))} /></div>
              <div>
                <Label>Material</Label>
                <Select value={form.material_type} onValueChange={v => setForm(f => ({ ...f, material_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>TD Value (0.1–100)</Label><Input type="number" step="0.01" min="0.1" max="100" value={form.td_value} onChange={e => setForm(f => ({ ...f, td_value: e.target.value }))} /></div>
              <div className="flex items-end gap-2">
                <div className="flex-1"><Label>Hex Code</Label><Input placeholder="#FF0000" value={form.hex_code} onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))} /></div>
                {form.hex_code && /^#[0-9a-fA-F]{6}$/.test(form.hex_code) && (
                  <div className="w-9 h-9 rounded border" style={{ backgroundColor: form.hex_code }} />
                )}
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confidence</Label>
                <Select value={form.confidence} onValueChange={v => setForm(f => ({ ...f, confidence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONFIDENCE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleAdd} disabled={addMut.isPending}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={paged.length > 0 && selected.size === paged.length} onCheckedChange={toggleAll} />
              </TableHead>
              <SortHeader label="Brand" field="brand_name" />
              <SortHeader label="Color" field="color_name" />
              <SortHeader label="Material" field="material_type" />
              <SortHeader label="TD" field="td_value" />
              <SortHeader label="Source" field="source" />
              <SortHeader label="Confidence" field="confidence" />
              <TableHead>Match Status</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No matching references</TableCell></TableRow>
            ) : paged.map((r: any, i: number) => {
              const isEditing = editingId === r.id;
              const ms = getMatchStatus(r.id);
              return (
                <TableRow key={r.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell><Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} /></TableCell>
                  <TableCell className="text-xs font-medium">{r.brand_name}</TableCell>
                  <TableCell className="text-xs">{r.color_name}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{r.material_type}</Badge></TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input type="number" step="0.01" className="w-20 h-7 text-xs" value={editValues.td_value ?? ''} onChange={e => setEditValues(v => ({ ...v, td_value: parseFloat(e.target.value) }))} onKeyDown={e => e.key === 'Enter' && saveEdit(r.id)} />
                    ) : (
                      <span className="text-xs font-mono">{r.td_value}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={editValues.source ?? ''} onValueChange={v => setEditValues(ev => ({ ...ev, source: v }))}>
                        <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">{r.source}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={editValues.confidence ?? ''} onValueChange={v => setEditValues(ev => ({ ...ev, confidence: v }))}>
                        <SelectTrigger className="h-7 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{CONFIDENCE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">{r.confidence}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ms.variant} className="text-xs">{ms.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{getCoverage(r.id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(r.id)}><Check className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}><X className="w-3 h-3" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(r)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Show</span>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">per page</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {Math.max(totalPages, 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete Selected</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selected.size} references?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { bulkDeleteMut.mutate([...selected]); setSelected(new Set()); }}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {CONFIDENCE_OPTIONS.map(c => (
            <Button key={c} variant="outline" size="sm" onClick={() => { bulkConfMut.mutate({ ids: [...selected], confidence: c }); setSelected(new Set()); }}>
              Set {c}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Gap Analysis */}
      <Collapsible open={gapOpen} onOpenChange={setGapOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Gap Analysis</span>
            {gapOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {/* No matches */}
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Brands with references but no filament matches ({gapAnalysis.noMatch.length})</h4>
            {gapAnalysis.noMatch.length === 0 ? (
              <p className="text-xs text-muted-foreground">All brands have at least one match ✅</p>
            ) : (
              <div className="flex flex-wrap gap-1">{gapAnalysis.noMatch.map(b => <Badge key={b} variant="destructive" className="text-xs">{b}</Badge>)}</div>
            )}
          </div>
          {/* Duplicates */}
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Duplicate references with different TD values ({gapAnalysis.duplicates.length})</h4>
            {gapAnalysis.duplicates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No duplicates found ✅</p>
            ) : (
              <div className="space-y-2">
                {gapAnalysis.duplicates.slice(0, 10).map(d => (
                  <div key={d.key} className="text-xs p-2 bg-muted/50 rounded">
                    <span className="font-medium">{d.key.replace(/\|/g, ' / ')}</span>: TD values = {d.entries.map((e: any) => e.td_value).join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Stale */}
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Stale references (30+ days old) ({gapAnalysis.stale.length})</h4>
            {gapAnalysis.stale.length === 0 ? (
              <p className="text-xs text-muted-foreground">All references recently updated ✅</p>
            ) : (
              <p className="text-xs text-muted-foreground">{gapAnalysis.stale.length} references haven't been updated in over 30 days</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
