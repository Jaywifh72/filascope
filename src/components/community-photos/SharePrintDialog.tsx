import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Camera, Upload, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadPhotoInput } from "@/hooks/useCommunityPhotos";

interface SharePrintDialogProps {
  productId: string;
  productType: string;
  onUpload: (input: UploadPhotoInput) => Promise<any>;
  isUploading: boolean;
}

export function SharePrintDialog({
  productId,
  productType,
  onUpload,
  isUploading,
}: SharePrintDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [printerId, setPrinterId] = useState<string>("");
  const [nozzleTemp, setNozzleTemp] = useState("");
  const [bedTemp, setBedTemp] = useState("");
  const [layerHeight, setLayerHeight] = useState("");
  const [infillPct, setInfillPct] = useState("");
  const [modelSource, setModelSource] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch printers for dropdown (reuse the same query key)
  const { data: printers } = useQuery({
    queryKey: ["printers-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select("id, model_name, display_name")
        .eq("status", "active")
        .order("model_name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleFiles = useCallback((newFiles: File[]) => {
    const remaining = 5 - files.length;
    const toAdd = newFiles
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, [files.length]);

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [handleFiles]
  );

  const resetForm = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setPrinterId("");
    setNozzleTemp("");
    setBedTemp("");
    setLayerHeight("");
    setInfillPct("");
    setModelSource("");
    setSettingsOpen(false);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    await onUpload({
      product_id: productId,
      product_type: productType,
      caption: caption.trim() || undefined,
      printer_id: printerId || null,
      nozzle_temp: nozzleTemp ? parseInt(nozzleTemp) : null,
      bed_temp: bedTemp ? parseInt(bedTemp) : null,
      layer_height: layerHeight ? parseFloat(layerHeight) : null,
      infill_pct: infillPct ? parseInt(infillPct) : null,
      model_source: modelSource.trim() || undefined,
      files,
    });

    resetForm();
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Camera className="w-4 h-4" />
          Share a Print
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Print</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Photo Upload Area */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Photos ({files.length}/5)
            </Label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => files.length < 5 && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20",
                files.length >= 5 && "opacity-50 cursor-not-allowed"
              )}
            >
              {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">Add more</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Up to 5 photos (JPG, PNG, WebP)
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files || []))}
            />
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="caption" className="text-sm font-medium">
              Caption <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="caption"
              placeholder="Describe your print..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 280))}
              rows={2}
              className="mt-1.5 resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">
              {caption.length}/280
            </p>
          </div>

          {/* Printer */}
          <div>
            <Label className="text-sm font-medium">
              Printer used <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={printerId} onValueChange={setPrinterId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select your printer" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                <SelectItem value="none">None</SelectItem>
                {printers?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name || p.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print Settings - Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  className={cn("w-4 h-4 transition-transform", settingsOpen && "rotate-180")}
                />
                Print settings (optional)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nozzle-temp" className="text-xs">Nozzle Temp (°C)</Label>
                  <Input
                    id="nozzle-temp"
                    type="number"
                    placeholder="210"
                    value={nozzleTemp}
                    onChange={(e) => setNozzleTemp(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bed-temp" className="text-xs">Bed Temp (°C)</Label>
                  <Input
                    id="bed-temp"
                    type="number"
                    placeholder="60"
                    value={bedTemp}
                    onChange={(e) => setBedTemp(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="layer-height" className="text-xs">Layer Height (mm)</Label>
                  <Input
                    id="layer-height"
                    type="number"
                    step="0.01"
                    placeholder="0.2"
                    value={layerHeight}
                    onChange={(e) => setLayerHeight(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="infill" className="text-xs">Infill (%)</Label>
                  <Input
                    id="infill"
                    type="number"
                    placeholder="20"
                    value={infillPct}
                    onChange={(e) => setInfillPct(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Model Source */}
          <div>
            <Label htmlFor="model-source" className="text-sm font-medium">
              Model source <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="model-source"
              placeholder="e.g. Thingiverse, Printables, own design..."
              value={modelSource}
              onChange={(e) => setModelSource(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
