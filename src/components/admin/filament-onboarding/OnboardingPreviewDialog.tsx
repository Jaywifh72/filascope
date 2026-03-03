import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OnboardingItem {
  id: string;
  extracted_data: Record<string, unknown>;
  display_name: string | null;
  color_name: string | null;
  material_type: string | null;
  image_url: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;
  admin_override_data: Record<string, unknown> | null;
}

interface Props {
  item: OnboardingItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function OnboardingPreviewDialog({ item, open, onOpenChange, onSave }: Props) {
  const data = { ...item.extracted_data, ...item.admin_override_data } as Record<string, any>;

  const [displayName, setDisplayName] = useState(data.display_name ?? item.display_name ?? '');
  const [colorFamily, setColorFamily] = useState(data.color_family ?? '');
  const [colorHex, setColorHex] = useState(data.color_hex ?? '#000000');
  const [material, setMaterial] = useState(data.material ?? item.material_type ?? '');
  const [nozzleTempMin, setNozzleTempMin] = useState(data.nozzle_temp_min_c?.toString() ?? '');
  const [nozzleTempMax, setNozzleTempMax] = useState(data.nozzle_temp_max_c?.toString() ?? '');
  const [bedTempMin, setBedTempMin] = useState(data.bed_temp_min_c?.toString() ?? '');
  const [bedTempMax, setBedTempMax] = useState(data.bed_temp_max_c?.toString() ?? '');
  const [priceUsd, setPriceUsd] = useState(data.price_usd?.toString() ?? item.price_usd?.toString() ?? '');
  const [priceEur, setPriceEur] = useState(data.price_eur?.toString() ?? item.price_eur?.toString() ?? '');
  const [priceCad, setPriceCad] = useState(data.price_cad?.toString() ?? item.price_cad?.toString() ?? '');
  const [priceAud, setPriceAud] = useState(data.price_aud?.toString() ?? item.price_aud?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const overrides: Record<string, unknown> = {
      display_name: displayName,
      color_family: colorFamily,
      color_hex: colorHex,
      material,
      nozzle_temp_min_c: nozzleTempMin ? parseInt(nozzleTempMin) : null,
      nozzle_temp_max_c: nozzleTempMax ? parseInt(nozzleTempMax) : null,
      bed_temp_min_c: bedTempMin ? parseInt(bedTempMin) : null,
      bed_temp_max_c: bedTempMax ? parseInt(bedTempMax) : null,
      price_usd: priceUsd ? parseFloat(priceUsd) : null,
      price_eur: priceEur ? parseFloat(priceEur) : null,
      price_cad: priceCad ? parseFloat(priceCad) : null,
      price_aud: priceAud ? parseFloat(priceAud) : null,
    };

    const { error } = await supabase
      .from('filament_onboarding_items')
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
    await supabase
      .from('filament_onboarding_items')
      .update({ status: 'skipped' })
      .eq('id', item.id);
    toast({ title: 'Item marked as skipped' });
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview & Edit Filament</DialogTitle>
        </DialogHeader>

        {/* Image */}
        {item.image_url && (
          <div className="flex justify-center">
            <img src={item.image_url} className="max-h-48 rounded-lg object-contain" alt="" />
          </div>
        )}

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
              <button
                className="w-8 h-8 rounded border border-border shrink-0"
                style={{ backgroundColor: colorHex }}
                onClick={() => setShowPicker(!showPicker)}
              />
              <Input value={colorHex} onChange={e => setColorHex(e.target.value)} />
            </div>
            {showPicker && (
              <div className="mt-2">
                <HexColorPicker color={colorHex} onChange={setColorHex} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Nozzle Temp Min (°C)</Label>
            <Input type="number" value={nozzleTempMin} onChange={e => setNozzleTempMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nozzle Temp Max (°C)</Label>
            <Input type="number" value={nozzleTempMax} onChange={e => setNozzleTempMax(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bed Temp Min (°C)</Label>
            <Input type="number" value={bedTempMin} onChange={e => setBedTempMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bed Temp Max (°C)</Label>
            <Input type="number" value={bedTempMax} onChange={e => setBedTempMax(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>US Price ($)</Label>
            <Input type="number" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>EU Price (€)</Label>
            <Input type="number" step="0.01" value={priceEur} onChange={e => setPriceEur(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CA Price ($)</Label>
            <Input type="number" step="0.01" value={priceCad} onChange={e => setPriceCad(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>AU Price ($)</Label>
            <Input type="number" step="0.01" value={priceAud} onChange={e => setPriceAud(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>Mark as Skip</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
