import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateVolume, formatVolume } from '@/lib/isometricUtils';

interface BuildVolumeCardProps {
  width: number | null | undefined;
  depth: number | null | undefined;
  height: number | null | undefined;
  className?: string;
  compact?: boolean;
}

// Reference volumes for comparison (in liters)
const REFERENCE_PRINTERS = [
  { name: 'Bambu Lab A1 mini', volume: 2.88 }, // 180x180x180 / 2.88L
  { name: 'Bambu Lab P1S', volume: 16.2 },    // 256x256x256 approx
  { name: 'Bambu Lab X1C', volume: 16.8 },    // 256x256x256
  { name: 'Prusa MK4', volume: 8.75 },        // 250x210x220 / 8.75L
  { name: 'Creality K1', volume: 13.82 },     // 220x220x250
  { name: 'QIDI X-Max 3', volume: 34.3 },     // 325x325x325
];

function getComparisonText(volumeLiters: number): { text: string; icon: 'up' | 'down' | 'equal' } | null {
  if (!volumeLiters || volumeLiters <= 0) return null;

  // Find the closest reference
  const sortedRefs = [...REFERENCE_PRINTERS].sort((a, b) => 
    Math.abs(a.volume - volumeLiters) - Math.abs(b.volume - volumeLiters)
  );

  const closest = sortedRefs[0];
  const diff = volumeLiters - closest.volume;
  const percentDiff = Math.abs((diff / closest.volume) * 100);

  // If within 5%, consider equal
  if (percentDiff < 5) {
    return { text: `Similar to ${closest.name}`, icon: 'equal' };
  }

  if (diff > 0) {
    // Find a smaller reference to compare against
    const smallerRef = REFERENCE_PRINTERS
      .filter(r => r.volume < volumeLiters)
      .sort((a, b) => b.volume - a.volume)[0];
    
    if (smallerRef) {
      const pctLarger = Math.round(((volumeLiters - smallerRef.volume) / smallerRef.volume) * 100);
      if (pctLarger >= 10) {
        return { text: `${pctLarger}% larger than ${smallerRef.name}`, icon: 'up' };
      }
    }
    return { text: `Larger than ${closest.name}`, icon: 'up' };
  } else {
    // Find a larger reference to compare against
    const largerRef = REFERENCE_PRINTERS
      .filter(r => r.volume > volumeLiters)
      .sort((a, b) => a.volume - b.volume)[0];
    
    if (largerRef) {
      const pctSmaller = Math.round(((largerRef.volume - volumeLiters) / largerRef.volume) * 100);
      if (pctSmaller >= 10) {
        return { text: `${pctSmaller}% smaller than ${largerRef.name}`, icon: 'down' };
      }
    }
    return { text: `Smaller than ${closest.name}`, icon: 'down' };
  }
}

export function BuildVolumeCard({ 
  width, 
  depth, 
  height, 
  className,
  compact = false 
}: BuildVolumeCardProps) {
  const hasVolume = width && depth && height;
  
  const { volumeLiters, comparison } = useMemo(() => {
    if (!hasVolume) return { volumeLiters: 0, comparison: null };
    const vol = calculateVolume(width, depth, height);
    return {
      volumeLiters: vol,
      comparison: getComparisonText(vol)
    };
  }, [width, depth, height, hasVolume]);

  if (!hasVolume) {
    return (
      <div className={cn(
        "flex items-center justify-center p-6 rounded-xl border border-dashed border-border/50 bg-muted/10",
        className
      )}>
        <p className="text-sm text-muted-foreground italic">Build volume not specified</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border border-border/40 bg-card/50 overflow-hidden",
      className
    )}>
      <div className={cn(
        "flex gap-4",
        compact ? "flex-col p-4" : "flex-col sm:flex-row p-4 sm:p-6"
      )}>
        {/* Isometric Cube Visualization */}
        <div className={cn(
          "flex items-center justify-center",
          compact ? "w-full h-32" : "w-full sm:w-48 h-40 sm:h-48"
        )}>
          <IsometricCubeSimple 
            width={width} 
            depth={depth} 
            height={height}
            compact={compact}
          />
        </div>

        {/* Volume Info */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Volume in Liters */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className={cn(
              "font-bold text-primary tracking-tight",
              compact ? "text-2xl" : "text-3xl sm:text-4xl"
            )}>
              {formatVolume(volumeLiters)}
            </span>
            <span className="text-sm text-muted-foreground">build volume</span>
          </div>

          {/* Dimensions */}
          <div className={cn(
            "text-muted-foreground mb-3",
            compact ? "text-xs" : "text-sm"
          )}>
            {width} × {depth} × {height} mm
          </div>

          {/* Comparison Text */}
          {comparison && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit",
              comparison.icon === 'up' 
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : comparison.icon === 'down'
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-muted/50 text-muted-foreground border border-border/30"
            )}>
              {comparison.icon === 'up' && <ArrowUp className="w-3.5 h-3.5" />}
              {comparison.icon === 'down' && <ArrowDown className="w-3.5 h-3.5" />}
              {comparison.icon === 'equal' && <Minus className="w-3.5 h-3.5" />}
              <span className={cn(compact ? "text-xs" : "text-xs sm:text-sm")}>
                {comparison.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple CSS-based isometric cube (no SVG complexity)
function IsometricCubeSimple({ 
  width, 
  depth, 
  height,
  compact = false
}: { 
  width: number; 
  depth: number; 
  height: number;
  compact?: boolean;
}) {
  // Normalize dimensions for display (max dimension = 100%)
  const maxDim = Math.max(width, depth, height);
  const normalizedW = (width / maxDim) * 100;
  const normalizedD = (depth / maxDim) * 100;
  const normalizedH = (height / maxDim) * 100;

  // Scale factor for the container
  const baseSize = compact ? 80 : 120;
  const cubeW = (normalizedW / 100) * baseSize * 0.6;
  const cubeD = (normalizedD / 100) * baseSize * 0.6;
  const cubeH = (normalizedH / 100) * baseSize * 0.8;

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        width: baseSize + 40, 
        height: baseSize + 40,
        perspective: '500px'
      }}
    >
      {/* 3D Cube Container */}
      <div 
        className="relative"
        style={{
          width: cubeW,
          height: cubeH,
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-20deg) rotateY(-45deg)',
        }}
      >
        {/* Front Face */}
        <div 
          className="absolute border-2 border-primary bg-primary/5"
          style={{
            width: cubeW,
            height: cubeH,
            transform: `translateZ(${cubeD / 2}px)`,
            boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
          }}
        />
        
        {/* Back Face */}
        <div 
          className="absolute border-2 border-primary/50 bg-primary/5"
          style={{
            width: cubeW,
            height: cubeH,
            transform: `translateZ(${-cubeD / 2}px)`,
          }}
        />
        
        {/* Left Face */}
        <div 
          className="absolute border-2 border-primary/70 bg-primary/10"
          style={{
            width: cubeD,
            height: cubeH,
            left: -cubeD / 2 + cubeW / 2,
            transform: `rotateY(-90deg) translateZ(${cubeW / 2}px)`,
          }}
        />
        
        {/* Right Face */}
        <div 
          className="absolute border-2 border-primary bg-primary/5"
          style={{
            width: cubeD,
            height: cubeH,
            left: -cubeD / 2 + cubeW / 2,
            transform: `rotateY(90deg) translateZ(${cubeW / 2}px)`,
            boxShadow: '0 0 15px hsl(var(--primary) / 0.2)',
          }}
        />
        
        {/* Top Face */}
        <div 
          className="absolute border-2 border-primary bg-primary/15"
          style={{
            width: cubeW,
            height: cubeD,
            top: -cubeD / 2 + cubeH / 2,
            transform: `rotateX(90deg) translateZ(${cubeH / 2}px)`,
            boxShadow: '0 0 25px hsl(var(--primary) / 0.4)',
          }}
        />
        
        {/* Bottom Face */}
        <div 
          className="absolute border-2 border-primary/30 bg-transparent"
          style={{
            width: cubeW,
            height: cubeD,
            top: -cubeD / 2 + cubeH / 2,
            transform: `rotateX(-90deg) translateZ(${cubeH / 2}px)`,
          }}
        />
      </div>

      {/* Dimension Labels */}
      <div 
        className="absolute text-[10px] font-mono text-cyan-400 bg-gray-900/80 px-1 py-0.5 rounded"
        style={{ bottom: compact ? 0 : 2, left: '50%', transform: 'translateX(-50%)' }}
      >
        {width}mm
      </div>
      <div 
        className="absolute text-[10px] font-mono text-cyan-400 bg-gray-900/80 px-1 py-0.5 rounded"
        style={{ right: compact ? -2 : 0, top: '50%', transform: 'translateY(-50%)' }}
      >
        {depth}mm
      </div>
      <div 
        className="absolute text-[10px] font-mono text-cyan-400 bg-gray-900/80 px-1 py-0.5 rounded"
        style={{ left: compact ? -2 : 0, top: '50%', transform: 'translateY(-50%)' }}
      >
        {height}mm
      </div>
    </div>
  );
}

export default BuildVolumeCard;
