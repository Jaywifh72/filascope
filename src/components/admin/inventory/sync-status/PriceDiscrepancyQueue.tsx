import { useState, useEffect, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, Filter, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Discrepancy {
  id: string;
  filament_id: string;
  old_price: number;
  new_price: number;
  price_change_percent: number;
  currency: string;
  region: string;
  detected_at: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  source_url: string | null;
  filaments?: { product_title: string; vendor: string; featured_image: string | null } | null;
}

interface DiscrepancyStats {
  pending: number;
  autoApprovedToday: number;
  manualReviewedToday: number;
  brokenLinks: number;
}

export function PriceDiscrepancyQueue() {
  const { user } = useContext(AuthContext);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DiscrepancyStats>({ pending: 0, autoApprovedToday: 0, manualReviewedToday: 0, brokenLinks: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('needs_action');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'percent' | 'date'>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDiscrepancies = async () => {
    let query = supabase
      .from('price_discrepancies')
      .select('*, filaments(product_title, vendor, featured_image)')
      .order(sortBy === 'percent' ? 'price_change_percent' : 'detected_at', { ascending: false })
      .limit(100);

    if (statusFilter === 'needs_action') {
      query = query.in('status', ['pending', 'manual_review']);
    } else if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (regionFilter !== 'all') {
      query = query.eq('region', regionFilter);
    }

    const { data } = await query;
    setDiscrepancies((data as unknown as Discrepancy[]) || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [pendingRes, autoRes, manualRes, brokenRes] = await Promise.all([
      supabase.from('price_discrepancies').select('id', { count: 'exact', head: true }).in('status', ['pending', 'manual_review']),
      supabase.from('price_discrepancies').select('id', { count: 'exact', head: true }).eq('status', 'auto_approved').gte('detected_at', todayStr),
      supabase.from('price_discrepancies').select('id', { count: 'exact', head: true }).in('status', ['approved', 'rejected']).gte('reviewed_at', todayStr),
      supabase.from('price_discrepancies').select('id', { count: 'exact', head: true }).eq('status', 'broken_link'),
    ]);

    setStats({
      pending: pendingRes.count || 0,
      autoApprovedToday: autoRes.count || 0,
      manualReviewedToday: manualRes.count || 0,
      brokenLinks: brokenRes.count || 0,
    });
  };

  useEffect(() => {
    fetchDiscrepancies();
    fetchStats();
  }, [statusFilter, regionFilter, sortBy]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      if (action === 'approve') {
        // Get the discrepancy to find the new price
        const disc = discrepancies.find(d => d.id === id);
        if (disc) {
          // Update the filament price
          await supabase.from('filaments').update({
            variant_price: disc.new_price,
            last_scraped_at: new Date().toISOString(),
            price_confidence: 'high',
          }).eq('id', disc.filament_id);
        }
      }

      await supabase.from('price_discrepancies').update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        notes: action === 'reject' ? 'Manually rejected - keeping old price' : 'Manually approved',
      }).eq('id', id);

      toast.success(`Price change ${action}d`);
      fetchDiscrepancies();
      fetchStats();
    } catch {
      toast.error(`Failed to ${action} price change`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk');

    try {
      const ids = Array.from(selectedIds);

      if (action === 'approve') {
        // Update filament prices for all approved items
        for (const id of ids) {
          const disc = discrepancies.find(d => d.id === id);
          if (disc) {
            await supabase.from('filaments').update({
              variant_price: disc.new_price,
              last_scraped_at: new Date().toISOString(),
              price_confidence: 'high',
            }).eq('id', disc.filament_id);
          }
        }
      }

      await supabase.from('price_discrepancies').update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).in('id', ids);

      toast.success(`${ids.length} price changes ${action}d`);
      setSelectedIds(new Set());
      fetchDiscrepancies();
      fetchStats();
    } catch {
      toast.error(`Bulk ${action} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === discrepancies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(discrepancies.map(d => d.id)));
    }
  };

  const changeDirectionIcon = (percent: number) =>
    percent > 0 ? <ArrowUpRight className="h-3 w-3 text-red-400" /> : <ArrowDownRight className="h-3 w-3 text-green-400" />;

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      manual_review: { label: 'Review', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      auto_approved: { label: 'Auto', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      approved: { label: 'Approved', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
      broken_link: { label: '404', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    };
    const config = map[status] || { label: status, className: '' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.autoApprovedToday}</div>
            <div className="text-xs text-muted-foreground">Auto-Approved Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.manualReviewedToday}</div>
            <div className="text-xs text-muted-foreground">Reviewed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.brokenLinks}</div>
            <div className="text-xs text-muted-foreground">Broken Links</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Price Discrepancy Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')} disabled={actionLoading === 'bulk'}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve ({selectedIds.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')} disabled={actionLoading === 'bulk'}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="needs_action">Needs Action</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="auto_approved">Auto-Approved</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="broken_link">Broken Links</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="CA">CA</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="AU">AU</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'percent' | 'date')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest</SelectItem>
                <SelectItem value="percent">% Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : discrepancies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No discrepancies to review
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="p-2 text-left w-8">
                      <Checkbox
                        checked={selectedIds.size === discrepancies.length && discrepancies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Old Price</th>
                    <th className="p-2 text-right">New Price</th>
                    <th className="p-2 text-right">Change</th>
                    <th className="p-2 text-center">Region</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-left">Detected</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map(d => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedIds.has(d.id)}
                          onCheckedChange={() => toggleSelect(d.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium text-xs truncate max-w-[180px]">
                          {(d.filaments as any)?.product_title || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{(d.filaments as any)?.vendor}</div>
                      </td>
                      <td className="p-2 text-right font-mono text-xs">${d.old_price.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-xs">${d.new_price.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium">
                          {changeDirectionIcon(d.price_change_percent)}
                          {Math.abs(d.price_change_percent).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className="text-[10px]">{d.region}</Badge>
                      </td>
                      <td className="p-2 text-center">{statusBadge(d.status)}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(d.detected_at), { addSuffix: true })}
                      </td>
                      <td className="p-2 text-center">
                        {['pending', 'manual_review'].includes(d.status) && (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-green-500 hover:text-green-400"
                              onClick={() => handleAction(d.id, 'approve')}
                              disabled={actionLoading === d.id}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-red-500 hover:text-red-400"
                              onClick={() => handleAction(d.id, 'reject')}
                              disabled={actionLoading === d.id}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
