import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Settings2 } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

type BrandConfig = {
  id: string;
  brand_id: string | null;
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  regional_url_pattern: Json | null;
  variant_mapping: Json;
  spec_extraction: Json | null;
  default_material_type: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormData = {
  brand_id: string;
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  regional_url_pattern: string;
  variant_mapping: string;
  spec_extraction: string;
  default_material_type: string;
  notes: string;
  is_active: boolean;
};

const emptyForm: FormData = {
  brand_id: '',
  brand_name: '',
  platform: 'shopify',
  base_url: '',
  scrape_method: 'json_endpoint',
  adapter_key: '',
  regional_url_pattern: '{}',
  variant_mapping: '{}',
  spec_extraction: '{}',
  default_material_type: '',
  notes: '',
  is_active: true,
};

const PLATFORMS = ['shopify', 'woocommerce', 'custom', 'magento', 'bigcommerce'];
const SCRAPE_METHODS = ['json_endpoint', 'html_scrape', 'api', 'json_ld'];

export function BrandConfigsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ['brand-scraping-configs-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brand_scraping_configs')
        .select('*')
        .order('brand_name');
      return (data ?? []) as BrandConfig[];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ['admin-brands-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automated_brands')
        .select('id, brand_name, display_name')
        .order('display_name');
      return data ?? [];
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (config: BrandConfig) => {
    setEditingId(config.id);
    setForm({
      brand_id: config.brand_id ?? '',
      brand_name: config.brand_name,
      platform: config.platform,
      base_url: config.base_url,
      scrape_method: config.scrape_method,
      adapter_key: config.adapter_key,
      regional_url_pattern: JSON.stringify(config.regional_url_pattern ?? {}, null, 2),
      variant_mapping: JSON.stringify(config.variant_mapping ?? {}, null, 2),
      spec_extraction: JSON.stringify(config.spec_extraction ?? {}, null, 2),
      default_material_type: config.default_material_type ?? '',
      notes: config.notes ?? '',
      is_active: config.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate JSON fields
      let regional_url_pattern: Json, variant_mapping: Json, spec_extraction: Json;
      try {
        regional_url_pattern = JSON.parse(form.regional_url_pattern || '{}');
        variant_mapping = JSON.parse(form.variant_mapping || '{}');
        spec_extraction = JSON.parse(form.spec_extraction || '{}');
      } catch {
        toast({ title: 'Invalid JSON', description: 'Check your JSON fields', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const row = {
        brand_id: form.brand_id || null,
        brand_name: form.brand_name,
        platform: form.platform,
        base_url: form.base_url,
        scrape_method: form.scrape_method,
        adapter_key: form.adapter_key,
        regional_url_pattern,
        variant_mapping,
        spec_extraction,
        default_material_type: form.default_material_type || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from('brand_scraping_configs')
          .update(row)
          .eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Config updated' });
      } else {
        const { error } = await supabase
          .from('brand_scraping_configs')
          .insert(row);
        if (error) throw error;
        toast({ title: 'Config created' });
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['brand-scraping-configs-all'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Brand Scraping Configs</CardTitle>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> Add Config
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Adapter Key</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!configs || configs.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No scraping configs found
                </TableCell>
              </TableRow>
            )}
            {configs?.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.brand_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.platform}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.scrape_method}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.adapter_key}</code>
                </TableCell>
                <TableCell className="text-sm">{c.default_material_type ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Scraping Config</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Brand selector */}
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={form.brand_id} onValueChange={(v) => {
                updateField('brand_id', v);
                const brand = brands?.find(b => b.id === v);
                if (brand) updateField('brand_name', brand.brand_name);
              }}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands?.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Brand Name (override)</Label>
              <Input value={form.brand_name} onChange={e => updateField('brand_name', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={v => updateField('platform', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Scrape Method</Label>
              <Select value={form.scrape_method} onValueChange={v => updateField('scrape_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCRAPE_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Base URL</Label>
              <Input value={form.base_url} onChange={e => updateField('base_url', e.target.value)} placeholder="https://store.example.com" />
            </div>

            <div className="space-y-1.5">
              <Label>Adapter Key</Label>
              <Input value={form.adapter_key} onChange={e => updateField('adapter_key', e.target.value)} placeholder="e.g. sunlu, generic" />
            </div>

            <div className="space-y-1.5">
              <Label>Default Material</Label>
              <Input value={form.default_material_type} onChange={e => updateField('default_material_type', e.target.value)} placeholder="PLA" />
            </div>

            <div className="space-y-1.5 flex items-end gap-2">
              <Label className="mb-2">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => updateField('is_active', v)} />
            </div>

            {/* JSON fields – full width */}
            <div className="col-span-2 space-y-1.5">
              <Label>Regional URL Pattern (JSON)</Label>
              <Textarea
                className="font-mono text-xs min-h-[80px]"
                value={form.regional_url_pattern}
                onChange={e => updateField('regional_url_pattern', e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Variant Mapping (JSON)</Label>
              <Textarea
                className="font-mono text-xs min-h-[120px]"
                value={form.variant_mapping}
                onChange={e => updateField('variant_mapping', e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Spec Extraction (JSON)</Label>
              <Textarea
                className="font-mono text-xs min-h-[120px]"
                value={form.spec_extraction}
                onChange={e => updateField('spec_extraction', e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                className="min-h-[60px]"
                value={form.notes}
                onChange={e => updateField('notes', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.brand_name || !form.adapter_key}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
