import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Flame,
  Clock,
  TrendingUp,
  Flag,
  Loader2,
} from 'lucide-react';
import { InlineQuickPriceUpdate } from './InlineQuickPriceUpdate';

interface PriorityProduct {
  id: string;
  product_title: string;
  vendor: string;
  variant_price: number | null;
  last_scraped_at: string | null;
  price_confidence: string | null;
  product_url: string | null;
  // Priority scoring factors
  staleness_days: number;
  priority_score: number;
  priority_reason: string;
}

export function PriorityVerificationQueue() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch priority queue
  const { data: queueItems, isLoading } = useQuery<PriorityProduct[]>({
    queryKey: ['admin-priority-queue'],
    queryFn: async () => {
      // Get stale products ordered by staleness
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_price, last_scraped_at, price_confidence, product_url')
        .or('price_confidence.in.(low,stale,unknown),last_scraped_at.is.null')
        .order('last_scraped_at', { ascending: true, nullsFirst: true })
        .limit(50);

      if (error) throw error;

      // Calculate priority scores
      return (data || []).map((product) => {
        const staleDays = product.last_scraped_at
          ? differenceInDays(new Date(), new Date(product.last_scraped_at))
          : 999;

        // Priority scoring (higher = more urgent)
        let priorityScore = 0;
        let priorityReason = '';

        // Staleness factor (max 50 points)
        priorityScore += Math.min(staleDays * 2, 50);

        // Never verified (30 points)
        if (!product.last_scraped_at) {
          priorityScore += 30;
          priorityReason = 'Never verified';
        }
        // Very stale (20 points)
        else if (staleDays > 30) {
          priorityScore += 20;
          priorityReason = `${staleDays} days old`;
        }
        // Moderately stale
        else if (staleDays > 7) {
          priorityReason = `${staleDays} days old`;
        }

        // Popular brands get priority (example heuristic)
        const popularBrands = ['bambu', 'creality', 'polymaker', 'hatchbox', 'overture'];
        if (popularBrands.some(b => product.vendor?.toLowerCase().includes(b))) {
          priorityScore += 15;
          priorityReason = priorityReason ? `${priorityReason} • Popular brand` : 'Popular brand';
        }

        return {
          ...product,
          staleness_days: staleDays,
          priority_score: priorityScore,
          priority_reason: priorityReason || 'Standard priority',
        };
      }).sort((a, b) => b.priority_score - a.priority_score);
    },
  });

  // Bulk verify mutation
  const bulkVerifyMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('filaments')
        .update({
          last_scraped_at: new Date().toISOString(),
          price_source: 'bulk_verification',
        })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Verified ${selectedIds.size} products`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-priority-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-verification-stats'] });
    },
    onError: (error) => {
      toast.error('Bulk verify failed: ' + (error as Error).message);
    },
  });

  // Flag for review mutation
  const flagMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('filaments')
        .update({
          price_source: 'flagged_for_review',
        })
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Flagged for review');
      queryClient.invalidateQueries({ queryKey: ['admin-priority-queue'] });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && queueItems) {
      setSelectedIds(new Set(queueItems.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const verifiedCount = queueItems?.filter(p => p.price_confidence === 'high').length || 0;
  const totalCount = queueItems?.length || 0;
  const progress = totalCount > 0 ? (verifiedCount / totalCount) * 100 : 0;

  const getPriorityBadge = (score: number) => {
    if (score >= 60) {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><Flame className="w-3 h-3 mr-1" /> Critical</Badge>;
    }
    if (score >= 40) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1" /> High</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" /> Normal</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Priority Verification Queue
              </CardTitle>
              <CardDescription>
                Products sorted by verification priority
              </CardDescription>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkVerifyMutation.mutate(Array.from(selectedIds))}
                  disabled={bulkVerifyMutation.isPending}
                >
                  {bulkVerifyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Verify Selected ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session progress</span>
              <span className="font-medium">{verifiedCount} / {totalCount} verified</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === queueItems?.length && queueItems?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead>Last Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : queueItems?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No products need verification</p>
                </TableCell>
              </TableRow>
            ) : (
              queueItems?.map((product) => (
                <TableRow key={product.id} className={selectedIds.has(product.id) ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(c) => handleSelectOne(product.id, c === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getPriorityBadge(product.priority_score)}
                      <p className="text-xs text-muted-foreground">{product.priority_reason}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium truncate max-w-[250px]">{product.product_title}</p>
                      <p className="text-xs text-muted-foreground">{product.vendor}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === product.id ? (
                      <InlineQuickPriceUpdate
                        productId={product.id}
                        currentPrice={product.variant_price}
                        onComplete={() => setEditingId(null)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <span className="font-mono">
                        {product.variant_price ? `$${product.variant_price.toFixed(2)}` : '—'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.last_scraped_at
                      ? formatDistanceToNow(new Date(product.last_scraped_at), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {product.product_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(product.product_url!, '_blank')}
                          title="Open store"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(product.id)}
                        title="Quick update"
                        disabled={editingId === product.id}
                      >
                        $
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => flagMutation.mutate(product.id)}
                        title="Flag for review"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
