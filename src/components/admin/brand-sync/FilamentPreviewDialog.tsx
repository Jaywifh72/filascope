import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { HexColorPicker } from 'react-colorful';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { computeQualityScore } from './NewFilamentsTable';
import type { SyncItem } from '@/hooks/useCatalogSync';

interface Props {
  item: SyncItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const FINISH_OPTIONS = [
  'Standard', 'Matte', 'Silk/Shimmer', 'Sparkle', 'Glow-in-the-Dark',
  'Transparent', 'Neon', 'Wood Fill', 'Carbon Fiber', 'Marble',
];
const REGION_OPTIONS = ['US', 'EU', 'UK', 'CA', 'AU'];

export function FilamentPreviewDialog({ item, open, onOpenChange, onSave }: Props) {
  const data = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;

  const [displayName, setDisplayName] = useState(data.display_name ?? item.display_name ?? '');
  const [colorFamily, setColorFamily] = useState(data.color_family ?? item.color_family ?? '');
  const [colorHex, setColorHex] = useState(data.color_hex ?? item.color_hex ?? '#000000');
  const [material, setMaterial] = useState(data.material ?? item.material_type ?? '');
  const [nozzleTempMin, setNozzleTempMin] = useState(data.nozzle_temp_min_c?.toString() ?? '');
  const [nozzleTempMax, setNozzleTempMax] = useState(data.nozzle_temp_max_c?.toString() ?? '');
  const [bedTempMin, setBedTempMin] = useState(data.bed_temp_min_c?.toString() ?? '');
  const [bedTempMax, setBedTempMax] = useState(data.bed_temp_max_c?.toString() ?? '');
  const [priceUsd, setPriceUsd] = useState(data.price_usd?.toString() ?? item.price_usd?.toString() ?? '');
  const [priceEur, setPriceEur] = useState(data.price_eur?.toString() ?? item.price_eur?.toString() ?? '');
  const [priceCad, setPriceCad] = useState(data.price_cad?.toString() ?? item.price_cad?.toString() ?? '');
  const [priceGbp, setPriceGbp] = useState(data.price_gbp?.toString() ?? item.price_gbp?.toString() ?? '');
  const [priceAud, setPriceAud] = useState(data.price_aud?.toString() ?? item.price_aud?.toString() ?? '');
  const [finishType, setFinishType] = useState<string>(data.finish_type ?? item.finish_type ?? '');
  const [highSpeedCapable, setHighSpeedCapable] = useState<boolean>(data.high_speed_capable ?? false);
  const [availableRegions, setAvailableRegions] = useState<string[]>(data.available_regions ?? item.available_regions ?? []);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const qualityScore = useMemo(() => computeQualityScore({
    display_name: displayName, color_hex: colorHex, color_family: colorFamily, material,
    price_usd: priceUsd ? parseFloat(priceUsd) : null,
    price_eur: priceEur ? parseFloat(priceEur) : null,
    price_cad: priceCad ? parseFloat(priceCad) : null,
    price_gbp: priceGbp ? parseFloat(priceGbp) : null,
    price_aud: priceAud ? parseFloat(priceAud) : null,
    featured_image: data.featured_image ?? item.image_url,
    nozzle_temp_min_c: nozzleTempMin ? parseInt(nozzleTempMin) : null,
    nozzle_temp_max_c: nozzleTempMax ? parseInt(nozzleTempMax) : null,
    variant_sku: data.variant_sku ?? item.variant_sku,
    product_url: data.product_url, product_url_us: data.product_url_us,
    product_url_eu: data.product_url_eu, product_url_uk: data.product_url_uk,
    product_url_ca: data.product_url_ca, product_url_au: data.product_url_au,
    net_weight_g: data.net_weight_g,
  }), [displayName, colorHex, colorFamily, material, priceUsd, priceEur, priceCad, priceGbp, priceAud,
    nozzleTempMin, nozzleTempMax, data, item]);

  const qualityColor = qualityScore >= 80 ? 'text-green-500' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500';
  const qualityBg = qualityScore >= 80 ? 'border-green-500/30' : qualityScore >= 50 ? 'border-amber-500/30' : 'border-red-500/30';

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (colorHex === '#808080') w.push('Color hex was auto-guessed as gray — likely needs manual correction');
    const hasUrls = data.product_url || data.product_url_us || data.product_url_eu || data.product_url_uk || data.product_url_ca || data.product_url_au;
    if (!hasUrls) w.push('No regional product URLs — buy links won\'t work');
    const hasPrice = [priceUsd, priceEur, priceCad, priceGbp, priceAud].some(p => p && parseFloat(p) > 0);
    if (!hasPrice) w.push('No prices extracted — will show as $0');
    return w;
  }, [colorHex, priceUsd, priceEur, priceCad, priceGbp, priceAud, data]);

  const toggleRegion = (region: string) => {
    setAvailableRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  const handleSave = async () => {
    setSaving(true);
    const overrides: Record<string, unknown> = {
      display_name: displayName, color_family: colorFamily, color_hex: colorHex, material,
      nozzle_temp_min_c: nozzleTempMin ? parseInt(nozzleTempMin) : null,
      nozzle_temp_max_c: nozzleTempMax ? parseInt(nozzleTempMax) : null,
      bed_temp_min_c: bedTempMin ? parseInt(bedTempMin) : null,
      bed_temp_max_c: bedTempMax ? parseInt(bedTempMax) : null,
      price_usd: priceUsd ? parseFloat(priceUsd) : null,
      price_eur: priceEur ? parseFloat(priceEur) : null,
      price_gbp: priceGbp ? parseFloat(priceGbp) : null,
      price_cad: priceCad ? parseFloat(priceCad) : null,
      price_aud: priceAud ? parseFloat(priceAud) : null,
      finish_type: finishType || null,
      high_speed_capable: highSpeedCapable,
      available_regions: availableRegions.length > 0 ? availableRegions : null,
    };

    const { error } = await supabase
      .from('brand_sync_items')
      .update({ admin_override_data: overrides as any })
      .eq('id', item.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Changes saved' });
      onSave();
    }
  };

  const handleSkip = async () => {
    await supabase.from('brand_sync_items').update({ status: 'skipped' }).eq('id', item.id);
    toast({ title: 'Item marked as skipped' });
    onSave();
  };

  const featuredImage = data.featured_image ?? item.image_url;
  const variantImage = data.variant_image ?? item.variant_image_url;
  const showBothImages = featuredImage && variantImage && featuredImage !== variantImage;

  // Regional URLs for display
  const urls = [
    { label: 'US', url: data.product_url_us || data.product_url },
    { label: 'EU', url: data.product_url_eu },
    { label: 'UK', url: data.product_url_uk },
    { label: 'CA', url: data.product_url_ca },
    { label: 'AU', url: data.product_url_au },
  ].filter(u => u.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview & Edit Filament</DialogTitle>
        </DialogHeader>

        {/* Images */}
        <div className="flex justify-center gap-4">
          {showBothImages ? (
            <>
              <div className="text-center space-y-1">
                <img src={featuredImage} className="h-[200px] w-[200px] rounded-lg object-contain border border-border" alt="Featured" />
                <span className="text-xs text-muted-foreground">Featured</span>
              </div>
              <div className="text-center space-y-1">
                <img src={variantImage} className="h-[200px] w-[200px] rounded-lg object-contain border border-border" alt="Variant" />
                <span className="text-xs text-muted-foreground">Variant</span>
              </div>
            </>
          ) : featuredImage ? (
            <img src={featuredImage} className="h-[200px] w-[200px] rounded-lg object-contain border border-border" alt="" />
          ) : null}
        </div>

        {/* Quality + Material */}
        <div className="flex items-center gap-2 justify-center">
          {material && <Badge variant="secondary" className="text-xs">{material}</Badge>}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${qualityBg}`}>
            <span className={`text-sm font-bold ${qualityColor}`}>{qualityScore}%</span>
            <span className="text-xs text-muted-foreground">quality</span>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Input value={material} onChange={e => setMaterial(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Color Family</Label>
            <Input value={colorFamily} onChange={e => setColorFamily(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Color Hex</Label>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded border border-border shrink-0" style={{ backgroundColor: colorHex }} onClick={() => setShowPicker(!showPicker)} />
              <Input value={colorHex} onChange={e => setColorHex(e.target.value)} />
            </div>
            {showPicker && <div className="mt-2"><HexColorPicker color={colorHex} onChange={setColorHex} /></div>}
          </div>
          <div className="space-y-1.5">
            <Label>Finish Type</Label>
            <Select value={finishType} onValueChange={setFinishType}>
              <SelectTrigger><SelectValue placeholder="Select finish..." /></SelectTrigger>
              <SelectContent>
                {FINISH_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Variant SKU</Label>
            <Input value={data.variant_sku ?? item.variant_sku ?? ''} readOnly className="bg-muted text-muted-foreground" />
          </div>
          <div className="space-y-1.5"><Label>Nozzle Temp Min (°C)</Label><Input type="number" value={nozzleTempMin} onChange={e => setNozzleTempMin(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Nozzle Temp Max (°C)</Label><Input type="number" value={nozzleTempMax} onChange={e => setNozzleTempMax(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Bed Temp Min (°C)</Label><Input type="number" value={bedTempMin} onChange={e => setBedTempMin(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Bed Temp Max (°C)</Label><Input type="number" value={bedTempMax} onChange={e => setBedTempMax(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>US Price ($)</Label><Input type="number" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>EU Price (€)</Label><Input type="number" step="0.01" value={priceEur} onChange={e => setPriceEur(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>UK Price (£)</Label><Input type="number" step="0.01" value={priceGbp} onChange={e => setPriceGbp(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>CA Price ($)</Label><Input type="number" step="0.01" value={priceCad} onChange={e => setPriceCad(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>AU Price ($)</Label><Input type="number" step="0.01" value={priceAud} onChange={e => setPriceAud(e.target.value)} /></div>
        </div>

        {/* High Speed */}
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label htmlFor="high-speed" className="cursor-pointer">High Speed Capable</Label>
          <Switch id="high-speed" checked={highSpeedCapable} onCheckedChange={setHighSpeedCapable} />
        </div>

        {/* Regions */}
        <div className="space-y-2">
          <Label>Available Regions</Label>
          <div className="flex flex-wrap gap-3">
            {REGION_OPTIONS.map(region => (
              <label key={region} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox checked={availableRegions.includes(region)} onCheckedChange={() => toggleRegion(region)} />
                <span className="text-sm">{region}</span>
              </label>
            ))}
          </div>
        </div>

        {/* URLs */}
        {urls.length > 0 && (
          <div className="space-y-1.5">
            <Label>Product URLs</Label>
            <div className="flex flex-wrap gap-2">
              {urls.map(u => (
                <a key={u.label} href={u.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {u.label} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-amber-600 dark:text-amber-400">{w}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>Mark as Skip</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
