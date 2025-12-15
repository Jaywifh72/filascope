import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProfileData, SlicerType, SLICERS } from "@/lib/slicerMapping";
import { Smartphone, Camera, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface SlicerQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  slicer: SlicerType;
  filamentId: string;
}

export function SlicerQRCode({
  open,
  onOpenChange,
  profile,
  slicer,
  filamentId,
}: SlicerQRCodeProps) {
  // Create a compressed data URL for the QR code
  const qrData = useMemo(() => {
    // Create a minimal payload for QR code
    const payload = {
      t: profile.nozzle_temp,
      b: profile.bed_temp,
      f: profile.fan_max_speed,
      r: profile.retraction_length,
      s: profile.print_speed,
      m: profile.material_type,
      n: profile.material_name.substring(0, 30),
    };
    
    // Use base64 encoding for compactness (encodeURIComponent handles Unicode)
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    
    // Generate a web URL that can be opened on mobile
    const baseUrl = window.location.origin;
    return `${baseUrl}/filament/${filamentId}?profile=${encoded}&slicer=${slicer}`;
  }, [profile, slicer, filamentId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrData);
    toast.success("Link copied to clipboard");
  };

  const supportedApps = useMemo(() => {
    const apps: string[] = [];
    if (slicer === 'bambu') apps.push('Bambu Handy');
    if (slicer === 'prusaslicer') apps.push('Prusa Connect');
    if (slicer === 'orcaslicer') apps.push('OrcaSlicer Mobile');
    if (apps.length === 0) apps.push('Any mobile browser');
    return apps;
  }, [slicer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to Import Settings</DialogTitle>
          <DialogDescription>
            Quick access to {SLICERS[slicer].name} profile on mobile
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Instructions */}
          <div className="w-full space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-muted-foreground">
                Open your slicer's mobile app or camera
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-muted-foreground">
                Scan this QR code
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-muted-foreground">
                Settings import automatically
              </span>
            </div>
          </div>

          {/* Supported Apps */}
          <div className="w-full text-center">
            <p className="text-xs text-muted-foreground mb-2">Compatible with:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {supportedApps.map((app) => (
                <span
                  key={app}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
