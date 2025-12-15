import React from 'react';
import IsometricCube from './IsometricCube';
import DimensionsCard from './DimensionsCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface BuildVolumeVisualizationProps {
  printer: {
    build_volume_x_mm?: number | null;
    build_volume_y_mm?: number | null;
    build_volume_z_mm?: number | null;
    build_volume_shape?: string | null;
    machine_width_mm?: number | null;
    machine_depth_mm?: number | null;
    machine_height_mm?: number | null;
    machine_weight_kg?: number | null;
    frame_material?: string | null;
    machine_style?: string | null;
  };
}

const BuildVolumeVisualization: React.FC<BuildVolumeVisualizationProps> = ({ printer }) => {
  const isMobile = useIsMobile();

  const hasBuildVolume = printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm;
  const hasMachineDimensions = printer.machine_width_mm || printer.machine_depth_mm || printer.machine_height_mm;

  // If no dimensions at all, show empty state
  if (!hasBuildVolume && !hasMachineDimensions) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Dimension data not available for this printer.</p>
      </div>
    );
  }

  const buildVolume = hasBuildVolume
    ? {
        width: printer.build_volume_x_mm!,
        depth: printer.build_volume_y_mm!,
        height: printer.build_volume_z_mm!,
      }
    : null;

  const machineDimensions = hasMachineDimensions
    ? {
        width: printer.machine_width_mm || 0,
        depth: printer.machine_depth_mm || 0,
        height: printer.machine_height_mm || 0,
      }
    : null;

  return (
    <div className="animate-fade-in">
      {/* Cylindrical build volume note */}
      {printer.build_volume_shape === 'cylindrical' && (
        <div className="mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
          ⓘ Cylindrical build volume (shown as approximate cube visualization)
        </div>
      )}

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-[1.5fr_1fr]'}`}>
        {/* Left: 3D Isometric Visualization */}
        <div className="bg-card/50 border border-border rounded-xl p-4 md:p-6 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
          {buildVolume ? (
            <IsometricCube
              buildVolume={buildVolume}
              machineDimensions={machineDimensions}
              showMachineDimensions={!isMobile && !!machineDimensions}
              className="w-full h-full max-w-[400px] max-h-[400px]"
            />
          ) : (
            <p className="text-muted-foreground text-sm">Build volume not specified</p>
          )}
        </div>

        {/* Right: Dimensions Card */}
        <DimensionsCard
          buildVolume={{
            x: printer.build_volume_x_mm,
            y: printer.build_volume_y_mm,
            z: printer.build_volume_z_mm,
            shape: printer.build_volume_shape,
          }}
          machineDimensions={{
            width: printer.machine_width_mm,
            depth: printer.machine_depth_mm,
            height: printer.machine_height_mm,
            weight: printer.machine_weight_kg,
          }}
          frameMaterial={printer.frame_material}
          machineStyle={printer.machine_style}
        />
      </div>
    </div>
  );
};

export default BuildVolumeVisualization;
