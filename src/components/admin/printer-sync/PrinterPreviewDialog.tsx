import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ExternalLink, Box, Zap, Shield, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { computePrinterQualityScore } from '@/lib/printer-sync-core';
import type { PrinterSyncItem } from '@/types/printer-sync';

interface Props {
  item: PrinterSyncItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (itemId: string, overrides: Record<string, unknown>) => void;
  onSkip?: (itemId: string) => void;
}

export function PrinterPreviewDialog({ item, open, onOpenChange, onSave, onSkip }: Props) {
  const data = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dimensions');

  // Editable fields
  const [displayName, setDisplayName] = useState(data.display_name ?? item.display_name ?? '');
  const [technology, setTechnology] = useState(data.printer_technology ?? item.printer_technology ?? 'FDM');
  const [buildX, setBuildX] = useState(data.build_volume_x_mm?.toString() ?? '');
  const [buildY, setBuildY] = useState(data.build_volume_y_mm?.toString() ?? '');
  const [buildZ, setBuildZ] = useState(data.build_volume_z_mm?.toString() ?? '');
  const [maxSpeed, setMaxSpeed] = useState(data.max_print_speed_mms?.toString() ?? '');
  const [nozzleTemp, setNozzleTemp] = useState(data.max_nozzle_temp_c?.toString() ?? '');
  const [bedTemp, setBedTemp] = useState(data.bed_max_temp_c?.toString() ?? '');
  const [hasEnclosure, setHasEnclosure] = useState<boolean>(data.has_enclosure ?? false);
  const [hasWifi, setHasWifi] = useState<boolean>(data.has_wifi ?? false);
  const [multiMaterial, setMultiMaterial] = useState<boolean>(data.multi_material_supported ?? false);
  const [multiSpools, setMultiSpools] = useState(data.multi_material_max_spools?.toString() ?? '');
  const [autoLeveling, setAutoLeveling] = useState<boolean>(data.auto_bed_leveling ?? false);
  const [extruderType, setExtruderType] = useState(data.extruder_type ?? '');
  const [priceUsd, setPriceUsd] = useState(data.price_usd?.toString() ?? item.price_usd?.toString() ?? '');
  const [priceCad, setPriceCad] = useState(data.price_cad?.toString() ?? item.price_cad?.toString() ?? '');
  const [priceEur, setPriceEur] = useState(data.price_eur?.toString() ?? item.price_eur?.toString() ?? '');
  const [priceGbp, setPriceGbp] = useState(data.price_gbp?.toString() ?? item.price_gbp?.toString() ?? '');
  const [priceAud, setPriceAud] = useState(data.price_aud?.toString() ?? item.price_aud?.toString() ?? '');

  const qualityScore = useMemo(() => computePrinterQualityScore({
    display_name: displayName, model_name: displayName, printer_technology: technology,
    build_volume_x_mm: buildX ? parseInt(buildX) : null,
    build_volume_y_mm: buildY ? parseInt(buildY) : null,
    build_volume_z_mm: buildZ ? parseInt(buildZ) : null,
    max_print_speed_mms: maxSpeed ? parseInt(maxSpeed) : null,
    max_nozzle_temp_c: nozzleTemp ? parseInt(nozzleTemp) : null,
    price_usd: priceUsd ? parseFloat(priceUsd) : null,
    price_cad: priceCad ? parseFloat(priceCad) : null,
    price_eur: priceEur ? parseFloat(priceEur) : null,
    price_gbp: priceGbp ? parseFloat(priceGbp) : null,
    price_aud: priceAud ? parseFloat(priceAud) : null,
    featured_image: data.featured_image ?? item.image_url,
    extruder_type: extruderType,
    has_enclosure: hasEnclosure, has_wifi: hasWifi, auto_bed_leveling: autoLeveling,
    variant_sku: data.variant_sku,
  }), [displayName, technology, buildX, buildY, buildZ, maxSpeed, nozzleTemp,
    priceUsd, priceCad, priceEur, priceGbp, priceAud,
    data, item, extruderType, hasEnclosure, hasWifi, autoLeveling]);

  const qualityColor = qualityScore >= 80 ? 'text-green-500' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500';
  const qualityBg = qualityScore >= 80 ? 'border-green-500/30' : qualityScore >= 50 ? 'border-amber-500/30' : 'border-red-500/30';

  const handleSave = () => {
    setSaving(true);
    const overrides: Record<string, unknown> = {
      display_name: displayName, printer_technology: technology,
      build_volume_x_mm: buildX ? parseInt(buildX) : null,
      build_volume_y_mm: buildY ? parseInt(buildY) : null,
      build_volume_z_mm: buildZ ? parseInt(buildZ) : null,
      max_print_speed_mms: maxSpeed ? parseInt(maxSpeed) : null,
      max_nozzle_temp_c: nozzleTemp ? parseInt(nozzleTemp) : null,
      bed_max_temp_c: bedTemp ? parseInt(bedTemp) : null,
      has_enclosure: hasEnclosure, has_wifi: hasWifi,
      multi_material_supported: multiMaterial,
      multi_material_max_spools: multiSpools ? parseInt(multiSpools) : null,
      auto_bed_leveling: autoLeveling, extruder_type: extruderType || null,
      price_usd: priceUsd ? parseFloat(priceUsd) : null,
      price_cad: priceCad ? parseFloat(priceCad) : null,
      price_eur: priceEur ? parseFloat(priceEur) : null,
      price_gbp: priceGbp ? parseFloat(priceGbp) : null,
      price_aud: priceAud ? parseFloat(priceAud) : null,
    };

    // Printer sync runs in-memory — update the item via callback instead of DB write
    onSave(item.id, overrides);
    setSaving(false);
    toast({ title: 'Changes saved' });
  };

  const handleSkip = () => {
    onSkip?.(item.id);
    toast({ title: 'Item marked as skipped' });
  };

  const image = data.featured_image ?? item.image_url;

  // Read-only spec fields
  const readOnlySpecs = {
    machine_footprint: data.machine_footprint_x_mm && data.machine_footprint_y_mm && data.machine_footprint_z_mm
      ? `${data.machine_footprint_x_mm}×${data.machine_footprint_y_mm}×${data.machine_footprint_z_mm} mm`
      : null,
    weight: data.machine_weight_kg ? `${data.machine_weight_kg} kg` : null,
    layer_height: data.layer_height_min_um && data.layer_height_max_um
      ? `${data.layer_height_min_um}–${data.layer_height_max_um} µm`
      : null,
    nozzle_diameter: data.stock_nozzle_diameter_mm ? `${data.stock_nozzle_diameter_mm} mm` : null,
    filament_diameter: data.filament_diameter_mm ? `${data.filament_diameter_mm} mm` : null,
    frame_material: data.frame_material,
    firmware: data.firmware_family,
    input_shaping: data.input_shaping_supported,
    filament_runout: data.filament_runout_detection,
  };

  // URLs
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
          <DialogTitle>Preview & Edit Printer</DialogTitle>
        </DialogHeader>

        {/* Image + Quality */}
        <div className="flex items-start gap-4">
          {image && (
            <img src={image} className="h-[160px] w-[160px] rounded-lg object-contain border border-border shrink-0" alt="" />
          )}
          <div className="flex-1 space-y-2">
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              {technology && <Badge variant="secondary" className="text-xs">{technology}</Badge>}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${qualityBg}`}>
                <span className={`text-sm font-bold ${qualityColor}`}>{qualityScore}%</span>
                <span className="text-xs text-muted-foreground">quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spec Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="dimensions" className="text-xs gap-1"><Box className="w-3 h-3" /> Dims</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs gap-1"><Zap className="w-3 h-3" /> Perf</TabsTrigger>
            <TabsTrigger value="features" className="text-xs gap-1"><Shield className="w-3 h-3" /> Features</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs gap-1"><Info className="w-3 h-3" /> Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="dimensions" className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Build X (mm)</Label><Input type="number" value={buildX} onChange={e => setBuildX(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Build Y (mm)</Label><Input type="number" value={buildY} onChange={e => setBuildY(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Build Z (mm)</Label><Input type="number" value={buildZ} onChange={e => setBuildZ(e.target.value)} /></div>
            </div>
            {readOnlySpecs.machine_footprint && <SpecRow label="Machine Footprint" value={readOnlySpecs.machine_footprint} />}
            {readOnlySpecs.weight && <SpecRow label="Weight" value={readOnlySpecs.weight} />}
            {readOnlySpecs.layer_height && <SpecRow label="Layer Height Range" value={readOnlySpecs.layer_height} />}
          </TabsContent>

          <TabsContent value="performance" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Max Speed (mm/s)</Label><Input type="number" value={maxSpeed} onChange={e => setMaxSpeed(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Technology</Label><Input value={technology} onChange={e => setTechnology(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Max Nozzle Temp (°C)</Label><Input type="number" value={nozzleTemp} onChange={e => setNozzleTemp(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Max Bed Temp (°C)</Label><Input type="number" value={bedTemp} onChange={e => setBedTemp(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Extruder Type</Label><Input value={extruderType} onChange={e => setExtruderType(e.target.value)} placeholder="direct-drive / bowden" /></div>
            </div>
            {readOnlySpecs.nozzle_diameter && <SpecRow label="Stock Nozzle" value={readOnlySpecs.nozzle_diameter} />}
            {readOnlySpecs.filament_diameter && <SpecRow label="Filament Diameter" value={readOnlySpecs.filament_diameter} />}
            {readOnlySpecs.input_shaping != null && <SpecRow label="Input Shaping" value={readOnlySpecs.input_shaping ? 'Yes' : 'No'} />}
          </TabsContent>

          <TabsContent value="features" className="mt-3 space-y-3">
            <SwitchRow label="Enclosure" checked={hasEnclosure} onChange={setHasEnclosure} />
            <SwitchRow label="WiFi" checked={hasWifi} onChange={setHasWifi} />
            <SwitchRow label="Auto Bed Leveling" checked={autoLeveling} onChange={setAutoLeveling} />
            <SwitchRow label="Multi-Material" checked={multiMaterial} onChange={setMultiMaterial} />
            {multiMaterial && (
              <div className="space-y-1 pl-8">
                <Label className="text-xs">Max Spools</Label>
                <Input type="number" value={multiSpools} onChange={e => setMultiSpools(e.target.value)} className="w-24" />
              </div>
            )}
            {readOnlySpecs.filament_runout != null && <SpecRow label="Filament Runout Detection" value={readOnlySpecs.filament_runout ? 'Yes' : 'No'} />}
            {readOnlySpecs.frame_material && <SpecRow label="Frame Material" value={readOnlySpecs.frame_material} />}
            {readOnlySpecs.firmware && <SpecRow label="Firmware" value={readOnlySpecs.firmware} />}
          </TabsContent>

          <TabsContent value="pricing" className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">USD ($)</Label><Input type="number" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">CAD (C$)</Label><Input type="number" step="0.01" value={priceCad} onChange={e => setPriceCad(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">EUR (€)</Label><Input type="number" step="0.01" value={priceEur} onChange={e => setPriceEur(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">GBP (£)</Label><Input type="number" step="0.01" value={priceGbp} onChange={e => setPriceGbp(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">AUD (A$)</Label><Input type="number" step="0.01" value={priceAud} onChange={e => setPriceAud(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={data.variant_sku ?? item.variant_sku ?? ''} readOnly className="bg-muted text-muted-foreground" /></div>
            </div>
            {urls.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Product URLs</Label>
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
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>Mark as Skip</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <Label className="cursor-pointer text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
