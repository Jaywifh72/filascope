import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PrioritizationSettings {
  enabled: boolean;
  default_boost: number;
  max_boost: number;
  boost_deals_active: boolean;
}

const DEFAULT_SETTINGS: PrioritizationSettings = {
  enabled: false,
  default_boost: 25,
  max_boost: 100,
  boost_deals_active: false,
};

export const PrioritySettingsCard = () => {
  const [settings, setSettings] = useState<PrioritizationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_prioritization")
        .maybeSingle();
      if (!error && data?.value) {
        const v = data.value as Record<string, unknown>;
        setSettings({
          enabled: !!v.enabled,
          default_boost: Number(v.default_boost ?? 25),
          max_boost: Number(v.max_boost ?? 100),
          boost_deals_active: !!v.boost_deals_active,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: settings as any })
      .eq("key", "affiliate_prioritization");
    setSaving(false);
    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prioritization settings saved" });
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Affiliate Prioritization Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!settings.enabled && (
          <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Prioritization is OFF — all products use default sort order.
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="prio-toggle">Enable Affiliate Prioritization</Label>
          <Switch
            id="prio-toggle"
            checked={settings.enabled}
            onCheckedChange={(c) => setSettings((s) => ({ ...s, enabled: c }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Boost Value (0-100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.default_boost}
              onChange={(e) => setSettings((s) => ({ ...s, default_boost: Math.min(100, Math.max(0, Number(e.target.value))) }))}
              className="w-28"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Boost Cap (0-100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.max_boost}
              onChange={(e) => setSettings((s) => ({ ...s, max_boost: Math.min(100, Math.max(0, Number(e.target.value))) }))}
              className="w-28"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="boost-deals"
            checked={settings.boost_deals_active}
            onCheckedChange={(c) => setSettings((s) => ({ ...s, boost_deals_active: !!c }))}
          />
          <Label htmlFor="boost-deals">Also boost brands with active deals</Label>
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
