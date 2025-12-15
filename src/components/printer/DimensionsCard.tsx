import React from 'react';
import { Box, Ruler, Weight, Maximize2, Package } from 'lucide-react';
import { calculateVolume, formatVolume } from '@/lib/isometricUtils';

interface DimensionsCardProps {
  buildVolume: {
    x: number | null;
    y: number | null;
    z: number | null;
    shape?: string | null;
  };
  machineDimensions: {
    width: number | null;
    depth: number | null;
    height: number | null;
    weight: number | null;
  };
  frameMaterial?: string | null;
  machineStyle?: string | null;
}

interface DimensionRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  highlight?: boolean;
}

const DimensionRow: React.FC<DimensionRowProps> = ({ icon, label, value, unit = '', highlight = false }) => {
  if (value === null || value === undefined) return null;
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={highlight ? 'text-primary' : 'text-muted-foreground'}>
          {icon}
        </span>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="text-sm text-foreground font-bold tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}{unit}
      </span>
    </div>
  );
};

const DimensionsCard: React.FC<DimensionsCardProps> = ({
  buildVolume,
  machineDimensions,
  frameMaterial,
  machineStyle,
}) => {
  const hasBuildVolume = buildVolume.x && buildVolume.y && buildVolume.z;
  const hasMachineDimensions = machineDimensions.width || machineDimensions.depth || machineDimensions.height;

  const totalVolume = hasBuildVolume
    ? calculateVolume(buildVolume.x!, buildVolume.y!, buildVolume.z!)
    : null;

  const footprint = machineDimensions.width && machineDimensions.depth
    ? `${machineDimensions.width} × ${machineDimensions.depth}`
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
      {/* Header */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-5">
        Build Volume & Dimensions
      </h3>

      {/* Build Volume Section */}
      {hasBuildVolume && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Box className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Build Volume</span>
          </div>
          <div className="h-px bg-border mb-2" />
          
          <div className="space-y-0.5">
            <DimensionRow
              icon={<Maximize2 className="h-4 w-4" />}
              label="Width (X)"
              value={buildVolume.x}
              unit=" mm"
              highlight
            />
            <DimensionRow
              icon={<Maximize2 className="h-4 w-4" />}
              label="Depth (Y)"
              value={buildVolume.y}
              unit=" mm"
              highlight
            />
            <DimensionRow
              icon={<Maximize2 className="h-4 w-4" />}
              label="Height (Z)"
              value={buildVolume.z}
              unit=" mm"
              highlight
            />
            {buildVolume.shape && buildVolume.shape !== 'rectangular' && (
              <DimensionRow
                icon={<Box className="h-4 w-4" />}
                label="Shape"
                value={buildVolume.shape}
                highlight
              />
            )}
          </div>
        </div>
      )}

      {/* Machine Dimensions Section */}
      {hasMachineDimensions && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Machine Dimensions</span>
          </div>
          <div className="h-px bg-border mb-2" />
          
          <div className="space-y-0.5">
            <DimensionRow
              icon={<Ruler className="h-4 w-4" />}
              label="Width"
              value={machineDimensions.width}
              unit=" mm"
            />
            <DimensionRow
              icon={<Ruler className="h-4 w-4" />}
              label="Depth"
              value={machineDimensions.depth}
              unit=" mm"
            />
            <DimensionRow
              icon={<Ruler className="h-4 w-4" />}
              label="Height"
              value={machineDimensions.height}
              unit=" mm"
            />
            <DimensionRow
              icon={<Weight className="h-4 w-4" />}
              label="Weight"
              value={machineDimensions.weight}
              unit=" kg"
            />
          </div>
        </div>
      )}

      {/* Additional Info */}
      {(frameMaterial || machineStyle) && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Construction</span>
          </div>
          <div className="h-px bg-border mb-2" />
          
          <div className="space-y-0.5">
            <DimensionRow
              icon={<Box className="h-4 w-4" />}
              label="Frame Material"
              value={frameMaterial}
            />
            <DimensionRow
              icon={<Box className="h-4 w-4" />}
              label="Machine Style"
              value={machineStyle}
            />
          </div>
        </div>
      )}

      {/* Calculated Summary */}
      {(totalVolume || footprint) && (
        <div className="pt-4 border-t border-border space-y-1.5">
          {totalVolume && (
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Total Build Volume:</span>{' '}
              <span className="text-primary font-semibold">{formatVolume(totalVolume)}</span>
            </p>
          )}
          {footprint && (
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Footprint:</span>{' '}
              {footprint} mm
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DimensionsCard;
