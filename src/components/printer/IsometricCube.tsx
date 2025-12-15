import React, { useMemo, useState } from 'react';
import {
  generateCubeVertices,
  generateCubeEdges,
  calculateScale,
  calculateVolume,
  formatVolume,
  getAxisLabelPosition,
  getBenchyPath,
  CubeDimensions,
} from '@/lib/isometricUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IsometricCubeProps {
  buildVolume: CubeDimensions | null;
  machineDimensions: CubeDimensions | null;
  showMachineDimensions?: boolean;
  className?: string;
}

const IsometricCube: React.FC<IsometricCubeProps> = ({
  buildVolume,
  machineDimensions,
  showMachineDimensions = true,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const viewBoxSize = 400;
  const center = { x: viewBoxSize / 2, y: viewBoxSize / 2 + 40 };

  const { buildVertices, buildEdges, machineVertices, machineEdges, scale, benchyData } = useMemo(() => {
    if (!buildVolume) {
      return { buildVertices: [], buildEdges: [], machineVertices: [], machineEdges: [], scale: 1, benchyData: null };
    }

    const s = calculateScale(buildVolume, machineDimensions, viewBoxSize);

    const bv = generateCubeVertices(buildVolume, center, s);
    const be = generateCubeEdges(bv);

    let mv: typeof bv = [];
    let me: typeof be = [];

    if (machineDimensions && showMachineDimensions) {
      mv = generateCubeVertices(machineDimensions, center, s);
      me = generateCubeEdges(mv);
    }

    const benchy = getBenchyPath(bv, buildVolume.height, s);

    return {
      buildVertices: bv,
      buildEdges: be,
      machineVertices: mv,
      machineEdges: me,
      scale: s,
      benchyData: benchy
    };
  }, [buildVolume, machineDimensions, showMachineDimensions]);

  if (!buildVolume) {
    return (
      <div className={`flex items-center justify-center bg-background/50 rounded-lg ${className}`}>
        <p className="text-muted-foreground text-sm">Dimensions not available</p>
      </div>
    );
  }

  const volume = calculateVolume(buildVolume.width, buildVolume.depth, buildVolume.height);
  const xLabel = getAxisLabelPosition(buildVertices, 'x');
  const yLabel = getAxisLabelPosition(buildVertices, 'y');
  const zLabel = getAxisLabelPosition(buildVertices, 'z');

  return (
    <TooltipProvider>
      <div 
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <svg
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              className="w-full h-full transition-transform duration-500 ease-out"
              style={{
                transform: isHovered ? 'rotateX(5deg) rotateY(5deg) scale(1.02)' : 'rotateX(0) rotateY(0) scale(1)',
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
              role="img"
              aria-label={`3D visualization showing build volume of ${buildVolume.width}×${buildVolume.depth}×${buildVolume.height}mm`}
              tabIndex={0}
            >
              <title>Printer Build Volume Visualization</title>
              <desc>
                Isometric view showing build volume of {buildVolume.width}×{buildVolume.depth}×{buildVolume.height}mm
                {machineDimensions && ` inside machine dimensions of ${machineDimensions.width}×${machineDimensions.depth}×${machineDimensions.height}mm`}
              </desc>

              {/* Subtle grid floor */}
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>

              {/* Machine dimensions cube (outer, dashed) */}
              {showMachineDimensions && machineEdges.length > 0 && (
                <g className="machine-cube" opacity={0.4}>
                  {machineEdges.map((edge, i) => (
                    <path
                      key={`machine-edge-${i}`}
                      d={edge.path}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      fill="none"
                      className="transition-opacity duration-300"
                    />
                  ))}
                </g>
              )}

              {/* Build volume cube (inner, solid) */}
              <g 
                className="build-cube"
                style={{
                  opacity: isHovered ? 1 : 0.8,
                  transition: 'opacity 0.3s ease'
                }}
              >
                {/* Cube edges */}
                {buildEdges.map((edge, i) => (
                  <path
                    key={`build-edge-${i}`}
                    d={edge.path}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="none"
                    className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  />
                ))}

                {/* Corner nodes */}
                {buildVertices.map((vertex, i) => (
                  <circle
                    key={`corner-${i}`}
                    cx={vertex.point2D.x}
                    cy={vertex.point2D.y}
                    r="4"
                    fill="hsl(var(--primary))"
                    className="drop-shadow-[0_0_6px_hsl(var(--primary))]"
                  />
                ))}
              </g>

              {/* Benchy silhouette */}
              {benchyData && (
                <g opacity={0.5} className="transition-opacity duration-300">
                  <path
                    d={benchyData.path}
                    transform={benchyData.transform}
                    fill="hsl(var(--foreground))"
                    stroke="none"
                  />
                </g>
              )}

              {/* Axis labels */}
              <g className="axis-labels" fontSize="11" fontWeight="500" fontFamily="monospace">
                {/* X-axis label */}
                <text
                  x={xLabel.position.x}
                  y={xLabel.position.y}
                  textAnchor={xLabel.anchor}
                  fill="hsl(var(--primary))"
                >
                  {buildVolume.width}mm
                </text>
                <text
                  x={xLabel.position.x}
                  y={xLabel.position.y + 12}
                  textAnchor={xLabel.anchor}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                >
                  X
                </text>

                {/* Y-axis label */}
                <text
                  x={yLabel.position.x}
                  y={yLabel.position.y}
                  textAnchor={yLabel.anchor}
                  fill="hsl(var(--primary))"
                >
                  {buildVolume.depth}mm
                </text>
                <text
                  x={yLabel.position.x}
                  y={yLabel.position.y + 12}
                  textAnchor={yLabel.anchor}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                >
                  Y
                </text>

                {/* Z-axis label */}
                <text
                  x={zLabel.position.x}
                  y={zLabel.position.y}
                  textAnchor={zLabel.anchor}
                  fill="hsl(var(--primary))"
                >
                  {buildVolume.height}mm
                </text>
                <text
                  x={zLabel.position.x}
                  y={zLabel.position.y + 12}
                  textAnchor={zLabel.anchor}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                >
                  Z
                </text>
              </g>

              {/* Volume indicator */}
              <text
                x={viewBoxSize / 2}
                y={viewBoxSize - 20}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize="14"
                fontWeight="600"
                opacity={0.8}
              >
                {formatVolume(volume)} build volume
              </text>
            </svg>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-card border-border"
          >
            <p className="font-semibold text-foreground">Build Volume: {formatVolume(volume)}</p>
            <p className="text-xs text-muted-foreground">
              {buildVolume.width} × {buildVolume.depth} × {buildVolume.height} mm
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default IsometricCube;
