import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ProfileData,
  SlicerType,
  SLICERS,
  formatProfileForSlicer,
  generateDefaultProfile,
  getDefaultProfileForMaterial,
} from "@/lib/slicerMapping";
import { ProfileComparisonView } from "./ProfileComparisonView";
import { useSlicerProfiles } from "@/hooks/useSlicerProfiles";
import { useAuth } from "@/hooks/useAuth";
import {
  Download,
  Copy,
  Save,
  RotateCcw,
  Info,
  Thermometer,
  Wind,
  Gauge,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SlicerProfilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filament: {
    id: string;
    product_title: string;
    vendor?: string | null;
    material?: string | null;
    nozzle_temp_min_c?: number | null;
    nozzle_temp_max_c?: number | null;
    nozzle_temp_sweetspot_c?: number | null;
    bed_temp_min_c?: number | null;
    bed_temp_max_c?: number | null;
    fan_min_percent?: number | null;
    fan_max_percent?: number | null;
    diameter_nominal_mm?: number | null;
    density_g_cm3?: number | null;
    print_speed_max_mms?: number | null;
  };
  slicer: SlicerType;
  onSlicerChange: (slicer: SlicerType) => void;
  printerName?: string;
}

interface SettingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  recommended?: number;
  tooltip?: string;
}

function SettingInput({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max = 500,
  step = 1,
  recommended,
  tooltip,
}: SettingInputProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Label className="text-sm whitespace-nowrap">{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-20 h-8 text-center text-sm"
        />
        <span className="text-sm text-muted-foreground w-8">{unit}</span>
        {recommended !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange(recommended)}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    value === recommended
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {recommended}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Recommended: {recommended}{unit}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export function SlicerProfilePreview({
  open,
  onOpenChange,
  filament,
  slicer,
  onSlicerChange,
  printerName,
}: SlicerProfilePreviewProps) {
  const { user } = useAuth();
  const { saveProfile } = useSlicerProfiles();
  
  const defaultProfile = useMemo(
    () => generateDefaultProfile(filament),
    [filament]
  );

  const materialDefaults = useMemo(
    () => getDefaultProfileForMaterial(filament.material || 'PLA'),
    [filament.material]
  );

  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [showComparison, setShowComparison] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset profile when filament changes
  useEffect(() => {
    setProfile(defaultProfile);
  }, [defaultProfile]);

  const updateProfile = (key: keyof ProfileData, value: number) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const resetToDefault = () => {
    setProfile(defaultProfile);
    toast.success("Reset to default values");
  };

  const isModified = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(defaultProfile);
  }, [profile, defaultProfile]);

  const handleDownload = () => {
    const content = formatProfileForSlicer(profile, slicer);
    const extension = SLICERS[slicer].extension;
    const filename = `${(filament.product_title || 'filament').replace(/[^a-z0-9]/gi, '_')}${extension}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${SLICERS[slicer].name} profile`);
  };

  const handleCopy = () => {
    const content = formatProfileForSlicer(profile, slicer);
    navigator.clipboard.writeText(content);
    toast.success("Profile copied to clipboard");
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save profiles");
      return;
    }

    setIsSaving(true);
    await saveProfile(
      filament.id,
      filament.product_title,
      slicer,
      profile,
      isModified
    );
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Profile Preview
          </DialogTitle>
          <DialogDescription>
            {filament.product_title}
            {printerName && ` • Based on ${printerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <Label className="text-sm whitespace-nowrap">Slicer:</Label>
            <Select value={slicer} onValueChange={(v) => onSlicerChange(v as SlicerType)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SLICERS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{info.name}</span>
                      <span className="text-xs text-muted-foreground">{info.extension}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="compare"
              checked={showComparison}
              onCheckedChange={setShowComparison}
            />
            <Label htmlFor="compare" className="text-sm cursor-pointer">
              Compare with default
            </Label>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          {showComparison ? (
            <ProfileComparisonView profile={profile} defaultProfile={materialDefaults} />
          ) : (
            <div className="space-y-6">
              {/* Temperature Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  Temperature Settings
                </div>
                <div className="space-y-2 pl-6">
                  <SettingInput
                    label="Nozzle Temperature"
                    value={profile.nozzle_temp}
                    onChange={(v) => updateProfile('nozzle_temp', v)}
                    unit="°C"
                    min={150}
                    max={350}
                    recommended={defaultProfile.nozzle_temp}
                    tooltip="Target nozzle temperature for printing"
                  />
                  <SettingInput
                    label="First Layer Nozzle"
                    value={profile.nozzle_temp_first_layer}
                    onChange={(v) => updateProfile('nozzle_temp_first_layer', v)}
                    unit="°C"
                    min={150}
                    max={350}
                    tooltip="Higher temp for first layer improves adhesion"
                  />
                  <SettingInput
                    label="Bed Temperature"
                    value={profile.bed_temp}
                    onChange={(v) => updateProfile('bed_temp', v)}
                    unit="°C"
                    min={0}
                    max={150}
                    recommended={defaultProfile.bed_temp}
                  />
                  <SettingInput
                    label="First Layer Bed"
                    value={profile.bed_temp_first_layer}
                    onChange={(v) => updateProfile('bed_temp_first_layer', v)}
                    unit="°C"
                    min={0}
                    max={150}
                  />
                </div>
              </div>

              <Separator />

              {/* Cooling Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  Cooling Settings
                </div>
                <div className="space-y-2 pl-6">
                  <SettingInput
                    label="Min Fan Speed"
                    value={profile.fan_min_speed}
                    onChange={(v) => updateProfile('fan_min_speed', v)}
                    unit="%"
                    min={0}
                    max={100}
                  />
                  <SettingInput
                    label="Max Fan Speed"
                    value={profile.fan_max_speed}
                    onChange={(v) => updateProfile('fan_max_speed', v)}
                    unit="%"
                    min={0}
                    max={100}
                    recommended={defaultProfile.fan_max_speed}
                    tooltip="Maximum part cooling fan speed"
                  />
                  <SettingInput
                    label="Disable Fan First Layers"
                    value={profile.disable_fan_first_layers}
                    onChange={(v) => updateProfile('disable_fan_first_layers', v)}
                    unit=""
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              </div>

              <Separator />

              {/* Retraction Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                  Retraction Settings
                </div>
                <div className="space-y-2 pl-6">
                  <SettingInput
                    label="Retraction Length"
                    value={profile.retraction_length}
                    onChange={(v) => updateProfile('retraction_length', v)}
                    unit="mm"
                    min={0}
                    max={10}
                    step={0.1}
                    tooltip="Distance to retract filament during travel moves"
                  />
                  <SettingInput
                    label="Retraction Speed"
                    value={profile.retraction_speed}
                    onChange={(v) => updateProfile('retraction_speed', v)}
                    unit="mm/s"
                    min={5}
                    max={100}
                  />
                  <SettingInput
                    label="Z-Hop"
                    value={profile.z_hop}
                    onChange={(v) => updateProfile('z_hop', v)}
                    unit="mm"
                    min={0}
                    max={2}
                    step={0.1}
                    tooltip="Lift nozzle during travel to avoid hitting parts"
                  />
                </div>
              </div>

              <Separator />

              {/* Speed Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="w-4 h-4 text-green-500" />
                  Speed Settings
                </div>
                <div className="space-y-2 pl-6">
                  <SettingInput
                    label="Print Speed"
                    value={profile.print_speed}
                    onChange={(v) => updateProfile('print_speed', v)}
                    unit="mm/s"
                    min={10}
                    max={500}
                    recommended={defaultProfile.print_speed}
                  />
                  <SettingInput
                    label="First Layer Speed"
                    value={profile.first_layer_speed}
                    onChange={(v) => updateProfile('first_layer_speed', v)}
                    unit="mm/s"
                    min={5}
                    max={100}
                  />
                  <SettingInput
                    label="Travel Speed"
                    value={profile.travel_speed}
                    onChange={(v) => updateProfile('travel_speed', v)}
                    unit="mm/s"
                    min={50}
                    max={500}
                  />
                  <SettingInput
                    label="Flow Ratio"
                    value={profile.flow_ratio}
                    onChange={(v) => updateProfile('flow_ratio', v)}
                    unit=""
                    min={0.8}
                    max={1.2}
                    step={0.01}
                    tooltip="Extrusion multiplier (1.0 = 100%)"
                  />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            disabled={!isModified}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save to Account'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
