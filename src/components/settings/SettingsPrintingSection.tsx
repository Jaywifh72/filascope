import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Printer, Loader2, Plus } from "lucide-react";
import { useMultiplePrinters } from "@/hooks/useMultiplePrinters";
import type { ProfileData, PrintingSetup } from "@/hooks/useSettings";
import { NOZZLE_SIZES, NOZZLE_MATERIALS, NOZZLE_MATERIAL_LABELS, NOZZLE_MATERIAL_DESCRIPTIONS, type NozzleMaterial } from "@/hooks/useNozzleConfig";
import { Link } from "react-router-dom";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just getting started with 3D printing" },
  { value: "intermediate", label: "Intermediate", desc: "Comfortable with basic prints and settings" },
  { value: "advanced", label: "Advanced", desc: "Experienced with tuning and multiple materials" },
  { value: "professional", label: "Professional", desc: "Expert-level knowledge, production use" },
];

interface Props {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saving: boolean;
  onSave: () => void;
}

export function SettingsPrintingSection({ profile, setProfile, saving, onSave }: Props) {
  const { printers, primaryPrinter, isLoading: printersLoading } = useMultiplePrinters();

  const updatePrintingSetup = (key: keyof PrintingSetup, value: any) => {
    setProfile(prev => ({
      ...prev,
      printing_setup: { ...prev.printing_setup, [key]: value },
    }));
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Printing Setup</CardTitle>
            <CardDescription>Your printer configuration and experience level</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Printers */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">My Printers</Label>
          {printersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading printers...
            </div>
          ) : printers.length === 0 ? (
            <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4 text-center">
              <p>No printers added yet</p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link to="/vault?tab=dashboard">
                  <Plus className="w-4 h-4 mr-2" />Add Printer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {printers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{p.printer?.brand?.brand} </span>
                    <span className="text-muted-foreground">{p.printer?.model_name}</span>
                    {p.nickname && <span className="text-muted-foreground"> ({p.nickname})</span>}
                  </div>
                  {p.is_primary && (
                    <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">Primary</span>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" asChild>
                <Link to="/vault?tab=dashboard">
                  <Plus className="w-4 h-4 mr-2" />Add Printer
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Separator className="bg-border/50" />

        {/* Default Nozzle Diameter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Nozzle Diameter</Label>
          <Select
            value={String(profile.printing_setup.default_nozzle_diameter || 0.4)}
            onValueChange={(val) => updatePrintingSetup("default_nozzle_diameter", parseFloat(val))}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOZZLE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>{size}mm</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Nozzle Material */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Nozzle Material</Label>
          <Select
            value={profile.printing_setup.default_nozzle_material || "brass"}
            onValueChange={(val) => updatePrintingSetup("default_nozzle_material", val)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOZZLE_MATERIALS.map((mat) => (
                <SelectItem key={mat} value={mat}>{NOZZLE_MATERIAL_LABELS[mat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {NOZZLE_MATERIAL_DESCRIPTIONS[(profile.printing_setup.default_nozzle_material || "brass") as NozzleMaterial] 
              || NOZZLE_MATERIAL_DESCRIPTIONS["brass"]}
          </p>
        </div>

        <Separator className="bg-border/50" />

        {/* Experience Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Experience Level</Label>
          <Select
            value={profile.skill_level || "beginner"}
            onValueChange={(val) => setProfile(prev => ({ ...prev, skill_level: val }))}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div>
                    <span className="font-medium">{level.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This helps us tailor recommendations and content to your skill level.
          </p>
        </div>

        <Button onClick={onSave} disabled={saving} className="mt-2">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Printing Setup"}
        </Button>
      </CardContent>
    </Card>
  );
}
