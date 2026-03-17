import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, CheckCircle2, Trash2, Plus, Edit2, ExternalLink, Filter } from 'lucide-react';
import {
  useAmazonMappings,
  useCreateAmazonMapping,
  useUpdateAmazonMapping,
  useDeleteAmazonMapping,
  useBulkVerifyMappings,
  AmazonMapping,
} from '@/hooks/useAmazonMappings';
import { useToast } from '@/hooks/use-toast';

const CONFIDENCE_COLORS: Record<string, string> = {
  verified: 'bg-green-500/20 text-green-400 border-green-500/30',
  auto_high: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  auto_medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  auto_low: 'bg-red-500/20 text-red-400 border-red-500/30',
  manual: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const MARKETPLACE_DOMAINS: Record<string, string> = {
  US: 'amazon.com',
  UK: 'amazon.co.uk',
  DE: 'amazon.de',
  CA: 'amazon.ca',
  FR: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  AU: 'amazon.com.au',
  JP: 'amazon.co.jp',
};

export function AmazonMappingManager() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    marketplace: '',
    confidence: '',
    search: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ filament_id: '', asin: '', marketplace: 'US', amazon_title: '' });

  const { data: mappings, isLoading } = useAmazonMappings({
    marketplace: filters.marketplace || undefined,
    confidence: filters.confidence || undefined,
    isActive: true,
    limit: 100,
  });

  const createMapping = useCreateAmazonMapping();
  const updateMapping = useUpdateAmazonMapping();
  const deleteMapping = useDeleteAmazonMapping();
  const bulkVerify = useBulkVerifyMappings();

  const filteredMappings = mappings?.filter(m => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      m.filament_name?.toLowerCase().includes(q) ||
      m.filament_brand?.toLowerCase().includes(q) ||
      m.asin.toLowerCase().includes(q) ||
      m.amazon_title?.toLowerCase().includes(q)
    );
  }) || [];

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMappings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMappings.map(m => m.id)));
    }
  };

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;
    await bulkVerify.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast({ title: `${selectedIds.size} mappings verified` });
  };

  const handleDelete = async (id: string) => {
    await deleteMapping.mutateAsync(id);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
  };

  const handleAddMapping = async () => {
    if (!newMapping.filament_id || !newMapping.asin) return;
    await createMapping.mutateAsync(newMapping);
    setAddDialogOpen(false);
    setNewMapping({ filament_id: '', asin: '', marketplace: 'US', amazon_title: '' });
  };

  const getAmazonUrl = (asin: string, marketplace: string) => {
    const domain = MARKETPLACE_DOMAINS[marketplace] || 'amazon.com';
    return `https://${domain}/dp/${asin}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by filament, brand, or ASIN..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select value={filters.marketplace} onValueChange={v => setFilters(f => ({ ...f, marketplace: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(MARKETPLACE_DOMAINS).map(([code]) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.confidence} onValueChange={v => setFilters(f => ({ ...f, confidence: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="auto_high">Auto High</SelectItem>
                <SelectItem value="auto_medium">Auto Medium</SelectItem>
                <SelectItem value="auto_low">Auto Low</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <Button onClick={handleBulkVerify} disabled={bulkVerify.isPending} size="sm" className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Verify {selectedIds.size}
              </Button>
            )}

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Mapping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Amazon Mapping</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Filament ID</Label>
                    <Input
                      value={newMapping.filament_id}
                      onChange={e => setNewMapping(m => ({ ...m, filament_id: e.target.value }))}
                      placeholder="UUID of the filament"
                    />
                  </div>
                  <div>
                    <Label>ASIN</Label>
                    <Input
                      value={newMapping.asin}
                      onChange={e => setNewMapping(m => ({ ...m, asin: e.target.value.toUpperCase() }))}
                      placeholder="e.g., B07PGYHYV8"
                    />
                  </div>
                  <div>
                    <Label>Marketplace</Label>
                    <Select value={newMapping.marketplace} onValueChange={v => setNewMapping(m => ({ ...m, marketplace: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(MARKETPLACE_DOMAINS).map(code => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amazon Title (optional)</Label>
                    <Input
                      value={newMapping.amazon_title}
                      onChange={e => setNewMapping(m => ({ ...m, amazon_title: e.target.value }))}
                      placeholder="Product title on Amazon"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleAddMapping} disabled={createMapping.isPending}>
                    {createMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Mapping
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMappings.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No mappings found. Use the Discovery tab or Add Mapping button to create some.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2 pr-2 w-8">
                      <Checkbox
                        checked={selectedIds.size === filteredMappings.length && filteredMappings.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-2 pr-4">Filament</th>
                    <th className="pb-2 px-2">ASIN</th>
                    <th className="pb-2 px-2 text-center">MP</th>
                    <th className="pb-2 px-2">Confidence</th>
                    <th className="pb-2 px-2">Amazon Title</th>
                    <th className="pb-2 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.map(m => (
                    <tr key={m.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 pr-2">
                        <Checkbox
                          checked={selectedIds.has(m.id)}
                          onCheckedChange={() => toggleSelect(m.id)}
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="font-medium text-xs">{m.filament_brand}</div>
                        <div className="text-muted-foreground text-xs truncate max-w-[200px]">{m.filament_name}</div>
                      </td>
                      <td className="py-2 px-2">
                        <a
                          href={getAmazonUrl(m.asin, m.marketplace)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {m.asin}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant="outline" className="text-[10px]">{m.marketplace}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Badge className={`text-[10px] ${CONFIDENCE_COLORS[m.match_confidence] || ''}`}>
                          {m.match_confidence}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <span className="text-xs text-muted-foreground truncate block max-w-[250px]">
                          {m.amazon_title || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {m.match_confidence !== 'verified' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => updateMapping.mutate({ id: m.id, match_confidence: 'verified', verified_at: new Date().toISOString() } as any)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
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
