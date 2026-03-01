import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { PreferredBrandsPicker } from "./PreferredBrandsPicker";
import { useTheme } from "next-themes";
import { useRegion } from "@/contexts/RegionContext";
import { useFeatureSwitch } from "@/hooks/useFeatureSwitch";
import { useAuth } from "@/hooks/useAuth";
import { REGIONS } from "@/config/regions";
import { CURRENCIES } from "@/config/currencies";
import type { ProfileData, Preferences } from "@/hooks/useSettings";
import type { RegionCode } from "@/types/regional";
import type { CurrencyCode } from "@/types/regional";

const SPOOL_SIZES = [
  { value: "standard", label: "Standard (1kg)" },
  { value: "large", label: "Large (2kg+)" },
  { value: "sample", label: "Sample (250g)" },
  { value: "all", label: "All Sizes" },
];

const UNIT_SYSTEMS = [
  { value: "metric", label: "Metric (mm / °C)" },
  { value: "imperial", label: "Imperial (in / °F)" },
];

interface Props {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saving: boolean;
  onSave: () => void;
}

export function SettingsPreferencesSection({ profile, setProfile, saving, onSave }: Props) {
  const { theme, setTheme } = useTheme();
  const { region, setRegion, currency, setCurrency } = useRegion();
  const { enabled: lightModePublic } = useFeatureSwitch("light_mode_public");
  const { isAdmin } = useAuth();

  const canUseLightMode = lightModePublic || isAdmin;

  // Auto-switch to dark if light mode becomes unavailable
  if (!canUseLightMode && (theme === "light" || theme === "system")) {
    setTheme("dark");
  }

  const updatePreference = (key: keyof Preferences, value: any) => {
    setProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Preferences</CardTitle>
            <CardDescription>Customize your FilaScope experience</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Region */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Region</Label>
          <Select value={region} onValueChange={(val) => setRegion(val as RegionCode)}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGIONS).map(([code, info]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Determines which store prices and availability you see.</p>
        </div>

        {/* Default Currency */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Currency</Label>
          <Select value={currency} onValueChange={(val) => setCurrency(val as CurrencyCode)}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm">{info.symbol}</span>
                    <span>{info.name}</span>
                    <span className="text-muted-foreground">({code})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border/50" />

        {/* Default Spool Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Spool Size Filter</Label>
          <Select
            value={profile.preferences.default_spool_size || "all"}
            onValueChange={(val) => updatePreference("default_spool_size", val)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPOOL_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border/50" />

        {/* Theme */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Theme</Label>
          <Select value={theme || "system"} onValueChange={setTheme}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              {canUseLightMode && <SelectItem value="light">Light</SelectItem>}
              {canUseLightMode && <SelectItem value="system">System</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Units */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Units</Label>
          <Select
            value={profile.preferences.units || "metric"}
            onValueChange={(val) => updatePreference("units", val)}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_SYSTEMS.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-border/50" />

        {/* Preferred Brands */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preferred Brands</Label>
          <PreferredBrandsPicker
            selectedBrands={profile.preferences.preferred_brands || []}
            onChange={(brands) => updatePreference("preferred_brands", brands)}
          />
        </div>

        <Button onClick={onSave} disabled={saving} className="mt-2">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
