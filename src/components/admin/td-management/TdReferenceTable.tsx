import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTdReferenceValues, useAddReferenceValue, useDeleteReferenceValue } from '@/hooks/useTdManagement';
import { Plus, Trash2 } from 'lucide-react';

const MATERIALS = ['PLA', 'PLA Basic', 'PLA Matte', 'PLA+', 'Silk PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC'];
const SOURCES = ['hueforge_community', 'brand_published', 'user_measured', 'admin_entered'];

export function TdReferenceTable() {
  const { data: refs, isLoading } = useTdReferenceValues();
  const addMut = useAddReferenceValue();
  const deleteMut = useDeleteReferenceValue();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ brand_name: '', color_name: '', material_type: 'PLA', td_value: '', source: 'hueforge_community', confidence: 'medium', notes: '' });

  const handleAdd = () => {
    const val = parseFloat(form.td_value);
    if (!form.brand_name || !form.color_name || isNaN(val) || val < 0.1 || val > 15) return;
    addMut.mutate({ ...form, td_value: val }, { onSuccess: () => { setOpen(false); setForm({ brand_name: '', color_name: '', material_type: 'PLA', td_value: '', source: 'hueforge_community', confidence: 'medium', notes: '' }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{refs?.length ?? 0} reference values</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Reference</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Reference TD Value</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Brand Name</Label><Input value={form.brand_name} onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))} /></div>
              <div><Label>Color Name</Label><Input value={form.color_name} onChange={(e) => setForm((f) => ({ ...f, color_name: e.target.value }))} /></div>
              <div>
                <Label>Material</Label>
                <Select value={form.material_type} onValueChange={(v) => setForm((f) => ({ ...f, material_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>TD Value (0.1–15.0)</Label><Input type="number" step="0.01" min="0.1" max="15" value={form.td_value} onChange={(e) => setForm((f) => ({ ...f, td_value: e.target.value }))} /></div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confidence</Label>
                <Select value={form.confidence} onValueChange={(v) => setForm((f) => ({ ...f, confidence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleAdd} disabled={addMut.isPending}>Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>TD</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (refs ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.brand_name}</TableCell>
                <TableCell className="text-xs">{r.color_name}</TableCell>
                <TableCell><Badge variant="secondary" className="text-xs">{r.material_type}</Badge></TableCell>
                <TableCell className="text-xs font-mono">{r.td_value}</TableCell>
                <TableCell className="text-xs">{r.source}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.confidence}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
