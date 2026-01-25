import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useBrokenProductUrls, BrokenUrlWithProduct } from '@/hooks/useBrokenProductUrls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  RefreshCw,
  LinkIcon,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  Edit,
  Search,
  Store,
  Link2Off,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBrokenUrls() {
  const {
    brokenUrls,
    stats,
    loading,
    fetchBrokenUrls,
    updateProductUrl,
    markResolved,
    dismissUrl,
    bulkMarkResolved,
  } = useBrokenProductUrls();

  const [showResolved, setShowResolved] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update URL dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<BrokenUrlWithProduct | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBrokenUrls();
  }, [fetchBrokenUrls]);

  // Filtered data
  const filteredUrls = useMemo(() => {
    return brokenUrls.filter(url => {
      // Show/hide resolved
      if (!showResolved && url.resolved_at) return false;

      // Store filter
      if (storeFilter !== 'all' && url.store_domain !== storeFilter) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          url.product_title?.toLowerCase().includes(query) ||
          url.product_url.toLowerCase().includes(query) ||
          url.store_domain.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [brokenUrls, showResolved, storeFilter, searchQuery]);

  // Handle copy URL
  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle update URL dialog
  const openUpdateDialog = (url: BrokenUrlWithProduct) => {
    setSelectedUrl(url);
    setNewUrl(url.product_url);
    setUpdateDialogOpen(true);
  };

  const handleUpdateUrl = async () => {
    if (!selectedUrl || !newUrl) return;
    setUpdating(true);
    const success = await updateProductUrl(selectedUrl.id, selectedUrl.product_url, newUrl);
    setUpdating(false);
    if (success) {
      setUpdateDialogOpen(false);
      setSelectedUrl(null);
      setNewUrl('');
    }
  };

  // Handle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === filteredUrls.filter(u => !u.resolved_at).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUrls.filter(u => !u.resolved_at).map(u => u.id)));
    }
  };

  const handleBulkResolve = async () => {
    if (selectedIds.size === 0) return;
    await bulkMarkResolved(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Truncate URL for display
  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  // Build search URL for store
  const getStoreSearchUrl = (url: BrokenUrlWithProduct) => {
    const productName = url.product_title || 'filament';
    return `https://${url.store_domain}/search?q=${encodeURIComponent(productName)}`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AdminPageHeader
            title="Product 404s"
            description="Manage products with broken URLs detected during price checks"
            icon={Link2Off}
            iconColor="text-destructive"
            actions={
              <Button onClick={fetchBrokenUrls} disabled={loading} variant="outline">
                <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tracked</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unresolved</p>
                    <p className="text-2xl font-bold text-destructive">{stats.unresolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Store className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Most Affected</p>
                    <p className="text-lg font-semibold truncate max-w-[150px]">
                      {stats.topStore?.domain || 'N/A'}
                    </p>
                    {stats.topStore && (
                      <p className="text-xs text-muted-foreground">
                        {stats.topStore.count} broken URLs
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by product or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stats.storeBreakdown.map(store => (
                  <SelectItem key={store.domain} value={store.domain}>
                    {store.domain} ({store.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                id="show-resolved"
                checked={showResolved}
                onCheckedChange={(checked) => setShowResolved(checked === true)}
              />
              <label htmlFor="show-resolved" className="text-sm cursor-pointer">
                Show resolved
              </label>
            </div>

            {selectedIds.size > 0 && (
              <Button onClick={handleBulkResolve} variant="outline" size="sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark {selectedIds.size} as Fixed
              </Button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUrls.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <Link2Off className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No broken URLs found</h3>
              <p className="text-sm text-muted-foreground">
                {brokenUrls.length === 0
                  ? 'No 404 errors have been detected yet.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredUrls.filter(u => !u.resolved_at).length && selectedIds.size > 0}
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead className="hidden md:table-cell">URL</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead className="hidden sm:table-cell">Detected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUrls.map((url) => (
                    <TableRow
                      key={url.id}
                      className={cn(
                        url.resolved_at && 'opacity-50',
                        !url.resolved_at && 'border-l-2 border-l-destructive'
                      )}
                    >
                      <TableCell>
                        {!url.resolved_at && (
                          <Checkbox
                            checked={selectedIds.has(url.id)}
                            onCheckedChange={() => toggleSelection(url.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">
                            {url.product_title || 'Unknown Product'}
                          </p>
                          {url.vendor && (
                            <p className="text-xs text-muted-foreground">{url.vendor}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {url.store_domain}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                            {truncateUrl(url.product_url)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(url.product_url, url.id)}
                          >
                            {copiedId === url.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={url.detection_count > 5 ? 'destructive' : 'secondary'}
                        >
                          {url.detection_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(url.last_detected_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openUpdateDialog(url)}
                            title="Update URL"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markResolved(url.id)}
                            title="Mark as Fixed"
                            disabled={!!url.resolved_at}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(getStoreSearchUrl(url), '_blank')}
                            title="Search on Store"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => dismissUrl(url.id)}
                            title="Dismiss"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Update URL Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Product URL</DialogTitle>
            <DialogDescription>
              Enter a new working URL for this product. This will update the product record and mark the broken URL as resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-1">Product</p>
              <p className="text-sm text-muted-foreground">
                {selectedUrl?.product_title || 'Unknown Product'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Current (Broken) URL</p>
              <p className="text-xs font-mono text-destructive break-all">
                {selectedUrl?.product_url}
              </p>
            </div>

            <div>
              <label htmlFor="new-url" className="text-sm font-medium mb-1 block">
                New URL
              </label>
              <Input
                id="new-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(newUrl, '_blank')}
              disabled={!newUrl}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Test URL in New Tab
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUrl} disabled={updating || !newUrl}>
              {updating ? 'Updating...' : 'Apply Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
