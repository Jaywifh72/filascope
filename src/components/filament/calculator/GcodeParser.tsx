import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GcodeParseResult {
  weightGrams: number | null;
  filamentMeters: number | null;
  slicer: string | null;
  material: string | null;
  printTime: string | null;
  layerHeight: number | null;
}

interface GcodeParserProps {
  onParsed: (result: GcodeParseResult) => void;
}

/**
 * Parse .gcode file headers to extract filament usage info.
 * Supports PrusaSlicer, BambuStudio, OrcaSlicer, Cura, and SuperSlicer.
 */
function parseGcodeHeader(text: string): GcodeParseResult {
  // Only parse first ~500 lines (header area)
  const lines = text.split('\n').slice(0, 500);
  const header = lines.join('\n');

  let weightGrams: number | null = null;
  let filamentMeters: number | null = null;
  let slicer: string | null = null;
  let material: string | null = null;
  let printTime: string | null = null;
  let layerHeight: number | null = null;

  // Detect slicer
  if (/BambuStudio/i.test(header)) slicer = 'Bambu Studio';
  else if (/OrcaSlicer/i.test(header)) slicer = 'OrcaSlicer';
  else if (/PrusaSlicer/i.test(header)) slicer = 'PrusaSlicer';
  else if (/SuperSlicer/i.test(header)) slicer = 'SuperSlicer';
  else if (/Cura/i.test(header) || /Ultimaker/i.test(header)) slicer = 'Cura';
  else if (/Simplify3D/i.test(header)) slicer = 'Simplify3D';
  else if (/ideaMaker/i.test(header)) slicer = 'ideaMaker';

  for (const line of lines) {
    // PrusaSlicer / BambuStudio / OrcaSlicer: "; filament used [g] = 25.48"
    const gMatch = line.match(/;\s*filament used \[g\]\s*=\s*([\d.]+)/i);
    if (gMatch && !weightGrams) {
      weightGrams = parseFloat(gMatch[1]);
    }

    // PrusaSlicer / BambuStudio: "; filament used [mm] = 8543.21" or "; filament used [cm3] = ..."
    const mmMatch = line.match(/;\s*filament used \[mm\]\s*=\s*([\d.]+)/i);
    if (mmMatch && !filamentMeters) {
      filamentMeters = parseFloat(mmMatch[1]) / 1000; // mm to meters
    }

    // Cura: ";Filament used: 5.82192m"
    const curaMatch = line.match(/;\s*Filament used:\s*([\d.]+)\s*m/i);
    if (curaMatch) {
      filamentMeters = parseFloat(curaMatch[1]);
      // Estimate weight from meters (assuming 1.75mm PLA, ~2.98g/m)
      if (!weightGrams) {
        weightGrams = Math.round(filamentMeters * 2.98 * 10) / 10;
      }
    }

    // Cura: ";Filament weight = 25.5"
    const curaWeightMatch = line.match(/;\s*Filament weight\s*=\s*([\d.]+)/i);
    if (curaWeightMatch && !weightGrams) {
      weightGrams = parseFloat(curaWeightMatch[1]);
    }

    // Material type
    const matMatch = line.match(/;\s*filament_type\s*=\s*(\S+)/i);
    if (matMatch && !material) {
      material = matMatch[1];
    }

    // Cura material
    const curaMatMatch = line.match(/;\s*MATERIAL:\d*\s*=?\s*(\S+)/i);
    if (curaMatMatch && !material) {
      material = curaMatMatch[1];
    }

    // Print time - PrusaSlicer: "; estimated printing time (normal mode) = 2h 35m 12s"
    const timeMatch = line.match(/;\s*estimated printing time.*?=\s*(.+)/i);
    if (timeMatch && !printTime) {
      printTime = timeMatch[1].trim();
    }

    // Cura: ";TIME:5432"
    const curaTimeMatch = line.match(/;TIME:([\d.]+)/);
    if (curaTimeMatch && !printTime) {
      const seconds = parseFloat(curaTimeMatch[1]);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      printTime = h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    // Layer height
    const layerMatch = line.match(/;\s*layer_height\s*=\s*([\d.]+)/i);
    if (layerMatch && !layerHeight) {
      layerHeight = parseFloat(layerMatch[1]);
    }
  }

  return { weightGrams, filamentMeters, slicer, material, printTime, layerHeight };
}

export const GcodeParser: React.FC<GcodeParserProps> = ({ onParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<GcodeParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);

    if (!file.name.endsWith('.gcode') && !file.name.endsWith('.gco') && !file.name.endsWith('.g')) {
      setError('Please upload a .gcode file');
      return;
    }

    try {
      // Only read first 50KB (headers are at the top)
      const slice = file.slice(0, 50 * 1024);
      const text = await slice.text();
      const result = parseGcodeHeader(text);

      if (!result.weightGrams && !result.filamentMeters) {
        setError('Could not find filament usage data in this file. Make sure your slicer includes weight estimates in the gcode.');
        return;
      }

      setParseResult(result);
      onParsed(result);
    } catch {
      setError('Failed to read file');
    }
  }, [onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
        )}
      >
        <input
          type="file"
          accept=".gcode,.gco,.g"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className={cn(
          "w-8 h-8 mx-auto mb-3",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
        <p className="text-sm font-medium text-foreground">
          Drop your .gcode file here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse
        </p>
      </div>

      {/* Supported Slicers Info */}
      {!parseResult && !error && (
        <div className="flex items-start gap-2.5 p-3 bg-muted/20 rounded-lg">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Supported slicers:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Bambu Studio — filament weight in gcode header</li>
              <li>PrusaSlicer / SuperSlicer — filament used [g] comment</li>
              <li>OrcaSlicer — filament weight and time estimates</li>
              <li>Cura / Ultimaker — filament used in meters + weight</li>
            </ul>
            <p className="mt-1.5">
              Only the file header is read (~50KB). Your full gcode stays on your device.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{error}</p>
            {fileName && (
              <p className="text-xs text-muted-foreground mt-0.5">File: {fileName}</p>
            )}
          </div>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm font-semibold text-foreground">
              Parsed successfully
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {parseResult.weightGrams && (
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-lg font-bold text-foreground">{parseResult.weightGrams}g</div>
                <div className="text-xs text-muted-foreground">Filament Weight</div>
              </div>
            )}
            {parseResult.filamentMeters && (
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-lg font-bold text-foreground">{parseResult.filamentMeters.toFixed(1)}m</div>
                <div className="text-xs text-muted-foreground">Filament Length</div>
              </div>
            )}
            {parseResult.printTime && (
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-lg font-bold text-foreground">{parseResult.printTime}</div>
                <div className="text-xs text-muted-foreground">Print Time</div>
              </div>
            )}
            {parseResult.slicer && (
              <div className="bg-background/50 rounded-lg p-3">
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  {parseResult.slicer}
                </div>
                <div className="text-xs text-muted-foreground">Slicer</div>
              </div>
            )}
          </div>

          {fileName && (
            <p className="text-xs text-muted-foreground">Source: {fileName}</p>
          )}
        </div>
      )}
    </div>
  );
};
