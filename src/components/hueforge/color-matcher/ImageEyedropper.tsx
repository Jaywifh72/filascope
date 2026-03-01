import { useRef, useState, useCallback } from 'react';
import { Upload, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onColorPick: (hex: string) => void;
}

export function ImageEyedropper({ onColorPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const pickColor = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    onColorPick(hex);
    setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 5));
  }, [onColorPick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    setHoveredColor(`#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase());
  }, []);

  return (
    <div className="space-y-4">
      {!imageLoaded && (
        <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Upload an image to pick colors from it</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WebP • Max 10MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={pickColor}
          onMouseMove={imageLoaded ? handleMouseMove : undefined}
          className={`max-w-full rounded-lg border border-border/30 ${imageLoaded ? 'cursor-crosshair' : 'hidden'}`}
        />
        {imageLoaded && hoveredColor && (
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 border border-border/50">
            <div className="w-4 h-4 rounded border border-border/30" style={{ backgroundColor: hoveredColor }} />
            <span className="text-xs font-mono">{hoveredColor}</span>
          </div>
        )}
      </div>

      {imageLoaded && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">
            <span>Change image</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {recentColors.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Recent picks:</span>
          <div className="flex gap-2">
            {recentColors.map((c) => (
              <button
                key={c}
                onClick={() => onColorPick(c)}
                className="group flex flex-col items-center gap-1"
              >
                <div
                  className="w-8 h-8 rounded-md border border-border/30 group-hover:ring-2 ring-primary transition-all"
                  style={{ backgroundColor: c }}
                />
                <span className="text-[9px] font-mono text-muted-foreground">{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
