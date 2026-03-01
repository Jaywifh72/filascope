import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Check, X, Flag, Loader2 } from 'lucide-react';

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  flagged: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

export function TdSubmissionsReviewPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['admin-td-submissions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('td_submissions')
        .select('*, filaments!inner(product_title, vendor, transmission_distance)')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('td_submissions')
        .update({ status, admin_notes, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-td-submissions'] });
      toast({ title: 'Submission updated' });
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('td_submissions')
        .update({ status, reviewed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-td-submissions'] });
      toast({ title: 'Bulk update complete' });
    },
  });

  const detailSub = submissions?.find(s => s.id === detailId);
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ ids: [...selectedIds], status: 'approved' })}>
              <Check className="w-3 h-3 mr-1" /> Approve ({selectedIds.size})
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ ids: [...selectedIds], status: 'rejected' })}>
              <X className="w-3 h-3 mr-1" /> Reject ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Filament</TableHead>
                <TableHead>TD Value</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions?.map((s: any) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetailId(s.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{s.filaments?.product_title}</p>
                      <p className="text-xs text-muted-foreground">{s.filaments?.vendor}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-bold">{s.submitted_td_value}</TableCell>
                  <TableCell className="text-xs">{s.measurement_method.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus.mutate({ id: s.id, status: 'approved' })}>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setRejectDialogId(s.id); setRejectNotes(''); }}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus.mutate({ id: s.id, status: 'flagged' })}>
                        <Flag className="w-3.5 h-3.5 text-orange-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!submissions?.length && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No submissions found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Detail</DialogTitle>
            <DialogDescription>{detailSub?.filaments?.product_title} — {detailSub?.filaments?.vendor}</DialogDescription>
          </DialogHeader>
          {detailSub && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Submitted TD:</span> <strong>{detailSub.submitted_td_value}</strong></div>
                <div><span className="text-muted-foreground">Current TD:</span> <strong>{detailSub.filaments?.transmission_distance ?? 'None'}</strong></div>
                <div><span className="text-muted-foreground">Method:</span> {detailSub.measurement_method.replace(/_/g, ' ')}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={STATUS_COLORS[detailSub.status]}>{detailSub.status}</Badge></div>
                {detailSub.layer_height_mm && <div><span className="text-muted-foreground">Layer Height:</span> {detailSub.layer_height_mm}mm</div>}
                {detailSub.nozzle_temp_c && <div><span className="text-muted-foreground">Nozzle Temp:</span> {detailSub.nozzle_temp_c}°C</div>}
                {detailSub.printer_model && <div className="col-span-2"><span className="text-muted-foreground">Printer:</span> {detailSub.printer_model}</div>}
              </div>
              {detailSub.notes && <div><span className="text-muted-foreground">Notes:</span> <p className="mt-1">{detailSub.notes}</p></div>}
              {detailSub.photo_url && (
                <div>
                  <span className="text-muted-foreground">Calibration Photo:</span>
                  <img src={detailSub.photo_url} alt="Calibration print" className="mt-1 rounded-lg max-h-48 object-contain" />
                </div>
              )}
              {detailSub.admin_notes && <div><span className="text-muted-foreground">Admin Notes:</span> <p className="mt-1 text-amber-400">{detailSub.admin_notes}</p></div>}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { updateStatus.mutate({ id: detailSub!.id, status: 'approved' }); setDetailId(null); }}>
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setRejectDialogId(detailSub!.id); setRejectNotes(''); setDetailId(null); }}>
              <X className="w-3.5 h-3.5 mr-1" /> Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject with notes dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={(o) => !o && setRejectDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>Please provide a reason for rejection.</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} placeholder="Reason for rejection..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectNotes.trim()} onClick={() => {
              updateStatus.mutate({ id: rejectDialogId!, status: 'rejected', admin_notes: rejectNotes });
              setRejectDialogId(null);
            }}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
