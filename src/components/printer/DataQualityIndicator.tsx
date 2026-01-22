import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Clock,
  Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Define field categories with their importance weights
const FIELD_CATEGORIES = {
  core: {
    label: 'Core Info',
    weight: 3,
    fields: ['model', 'brand_id', 'printer_type', 'msrp_usd', 'release_date', 'product_image_url']
  },
  buildVolume: {
    label: 'Build Volume',
    weight: 2,
    fields: ['build_volume_x_mm', 'build_volume_y_mm', 'build_volume_z_mm', 'build_volume_shape']
  },
  performance: {
    label: 'Performance',
    weight: 2,
    fields: ['max_print_speed_mms', 'max_acceleration_xy_mmss', 'max_flow_rate_mm3s', 'layer_height_min_um', 'layer_height_max_um']
  },
  temperature: {
    label: 'Temperature',
    weight: 2,
    fields: ['max_nozzle_temp_c', 'bed_max_temp_c', 'bed_min_temp_c', 'chamber_max_temp_c']
  },
  accuracy: {
    label: 'Accuracy',
    weight: 2,
    fields: ['xy_positioning_accuracy_um', 'z_positioning_accuracy_um', 'repeatability_um']
  },
  extruder: {
    label: 'Extruder',
    weight: 1,
    fields: ['extruder_type', 'extruder_drive_type', 'extruder_count', 'hotend_brand_model', 'nozzle_material', 'stock_nozzle_diameter_mm']
  },
  machine: {
    label: 'Machine',
    weight: 1,
    fields: ['machine_width_mm', 'machine_depth_mm', 'machine_height_mm', 'machine_weight_kg', 'frame_material']
  },
  features: {
    label: 'Features',
    weight: 1,
    fields: ['auto_bed_leveling', 'has_enclosure', 'has_wifi', 'filament_runout_detection', 'power_loss_recovery', 'input_shaping_supported']
  },
  connectivity: {
    label: 'Connectivity',
    weight: 1,
    fields: ['screen_type', 'screen_size_inch', 'camera_type', 'camera_count', 'remote_monitoring_supported']
  },
  materials: {
    label: 'Materials',
    weight: 1,
    fields: ['official_supported_materials', 'recommended_materials', 'materials_notes']
  }
};

interface DataQualityIndicatorProps {
  printer: Record<string, any>;
  className?: string;
}

function calculateCategoryScore(printer: Record<string, any>, fields: string[]): { filled: number; total: number } {
  let filled = 0;
  const total = fields.length;
  
  for (const field of fields) {
    const value = printer[field];
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      filled++;
    }
  }
  
  return { filled, total };
}

function getOverallScore(printer: Record<string, any>): { percentage: number; categoryScores: Record<string, { filled: number; total: number; percentage: number }> } {
  let totalWeightedFilled = 0;
  let totalWeightedPossible = 0;
  const categoryScores: Record<string, { filled: number; total: number; percentage: number }> = {};
  
  for (const [key, category] of Object.entries(FIELD_CATEGORIES)) {
    const score = calculateCategoryScore(printer, category.fields);
    const percentage = score.total > 0 ? Math.round((score.filled / score.total) * 100) : 0;
    categoryScores[key] = { ...score, percentage };
    
    totalWeightedFilled += score.filled * category.weight;
    totalWeightedPossible += score.total * category.weight;
  }
  
  const percentage = totalWeightedPossible > 0 
    ? Math.round((totalWeightedFilled / totalWeightedPossible) * 100) 
    : 0;
  
  return { percentage, categoryScores };
}

function getQualityLevel(percentage: number): { label: string; color: string; icon: typeof CheckCircle2 } {
  if (percentage >= 80) {
    return { label: 'Excellent', color: 'text-green-500', icon: CheckCircle2 };
  } else if (percentage >= 60) {
    return { label: 'Good', color: 'text-yellow-500', icon: AlertTriangle };
  } else if (percentage >= 40) {
    return { label: 'Partial', color: 'text-orange-500', icon: AlertTriangle };
  } else {
    return { label: 'Incomplete', color: 'text-red-500', icon: XCircle };
  }
}

export function DataQualityIndicator({ printer, className = '' }: DataQualityIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const { percentage, categoryScores } = getOverallScore(printer);
  const qualityLevel = getQualityLevel(percentage);
  const QualityIcon = qualityLevel.icon;
  
  const lastVerified = printer.last_verified_utc;
  const verificationStatus = lastVerified 
    ? formatDistanceToNow(new Date(lastVerified), { addSuffix: true })
    : 'Never verified';
  
  const isRecentlyVerified = lastVerified && 
    (Date.now() - new Date(lastVerified).getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 days

  return (
    <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Data Quality</span>
            </div>
            
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <QualityIcon className={`h-4 w-4 ${qualityLevel.color}`} />
                      <span className={`text-sm font-bold ${qualityLevel.color}`}>
                        {percentage}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{qualityLevel.label} data completeness</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${isRecentlyVerified ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-xs ${isRecentlyVerified ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {lastVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{verificationStatus}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className="mt-2">
            <Progress value={percentage} className="h-1.5" />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-4 space-y-3">
            {/* Category breakdown */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FIELD_CATEGORIES).map(([key, category]) => {
                const score = categoryScores[key];
                const catLevel = getQualityLevel(score.percentage);
                
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                  >
                    <span className="text-muted-foreground">{category.label}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        score.percentage >= 80 ? 'border-green-500/50 text-green-500' :
                        score.percentage >= 50 ? 'border-yellow-500/50 text-yellow-500' :
                        'border-red-500/50 text-red-500'
                      }`}
                    >
                      {score.filled}/{score.total}
                    </Badge>
                  </div>
                );
              })}
            </div>
            
            {/* Verification details */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last Verified</span>
                <span className={isRecentlyVerified ? 'text-green-500' : 'text-muted-foreground'}>
                  {verificationStatus}
                </span>
              </div>
              {printer.updated_at && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(printer.updated_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
