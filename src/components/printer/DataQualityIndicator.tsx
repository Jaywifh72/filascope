import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Clock,
  Database,
  Info,
  HelpCircle,
  ExternalLink
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

function calculateCategoryScore(printer: Record<string, any>, fields: string[]): { filled: number; total: number; missingFields: string[] } {
  let filled = 0;
  const total = fields.length;
  const missingFields: string[] = [];
  
  for (const field of fields) {
    const value = printer[field];
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      filled++;
    } else {
      missingFields.push(field);
    }
  }
  
  return { filled, total, missingFields };
}

interface CategoryScore {
  filled: number;
  total: number;
  percentage: number;
  missingFields: string[];
}

function getOverallScore(printer: Record<string, any>): { 
  percentage: number; 
  categoryScores: Record<string, CategoryScore>;
  totalFilled: number;
  totalFields: number;
  totalMissing: number;
} {
  let totalWeightedFilled = 0;
  let totalWeightedPossible = 0;
  let totalFilled = 0;
  let totalFields = 0;
  const categoryScores: Record<string, CategoryScore> = {};
  
  for (const [key, category] of Object.entries(FIELD_CATEGORIES)) {
    const score = calculateCategoryScore(printer, category.fields);
    const percentage = score.total > 0 ? Math.round((score.filled / score.total) * 100) : 0;
    categoryScores[key] = { ...score, percentage };
    
    totalWeightedFilled += score.filled * category.weight;
    totalWeightedPossible += score.total * category.weight;
    totalFilled += score.filled;
    totalFields += score.total;
  }
  
  const percentage = totalWeightedPossible > 0 
    ? Math.round((totalWeightedFilled / totalWeightedPossible) * 100) 
    : 0;
  
  return { percentage, categoryScores, totalFilled, totalFields, totalMissing: totalFields - totalFilled };
}

function getQualityLevel(percentage: number): { label: string; color: string; ringColor: string; icon: typeof CheckCircle2 } {
  if (percentage >= 80) {
    return { label: 'Excellent', color: 'text-success', ringColor: 'stroke-success', icon: CheckCircle2 };
  } else if (percentage >= 60) {
    return { label: 'Good', color: 'text-amber-500', ringColor: 'stroke-amber-500', icon: AlertTriangle };
  } else if (percentage >= 40) {
    return { label: 'Partial', color: 'text-amber-500', ringColor: 'stroke-amber-500', icon: AlertTriangle };
  } else {
    return { label: 'Incomplete', color: 'text-error', ringColor: 'stroke-error', icon: XCircle };
  }
}

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Mm$/, ' (mm)')
    .replace(/Mms$/, ' (mm/s)')
    .replace(/Um$/, ' (μm)')
    .replace(/Mmss$/, ' (mm/s²)')
    .replace(/Mm3s$/, ' (mm³/s)')
    .replace(/Usd$/, ' (USD)')
    .replace(/Kg$/, ' (kg)');
}

// Circular Progress Ring Component
function CircularProgress({ 
  percentage, 
  size = 48, 
  strokeWidth = 4,
  className = ''
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const qualityLevel = getQualityLevel(percentage);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-500 ease-out ${qualityLevel.ringColor}`}
        />
      </svg>
      {/* Percentage text in center */}
      <span className={`absolute text-sm font-bold ${qualityLevel.color}`}>
        {percentage}%
      </span>
    </div>
  );
}

export function DataQualityIndicator({ printer, className = '' }: DataQualityIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { percentage, categoryScores, totalFilled, totalFields, totalMissing } = useMemo(
    () => getOverallScore(printer), 
    [printer]
  );
  const qualityLevel = getQualityLevel(percentage);
  
  const lastVerified = printer.last_verified_utc;
  const verificationStatus = lastVerified 
    ? formatDistanceToNow(new Date(lastVerified), { addSuffix: true })
    : 'Never verified';
  
  const isRecentlyVerified = lastVerified && 
    (Date.now() - new Date(lastVerified).getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 days

  // Count verified vs unverified fields
  const verifiedFields = isRecentlyVerified ? totalFilled : 0;
  const unverifiedFields = isRecentlyVerified ? 0 : totalFilled;

  // Get top missing categories for tooltip
  const topMissingCategories = useMemo(() => {
    return Object.entries(categoryScores)
      .filter(([_, score]) => score.missingFields.length > 0)
      .sort((a, b) => {
        // Sort by weight * missing count
        const aWeight = FIELD_CATEGORIES[a[0] as keyof typeof FIELD_CATEGORIES].weight;
        const bWeight = FIELD_CATEGORIES[b[0] as keyof typeof FIELD_CATEGORIES].weight;
        return (b[1].missingFields.length * bWeight) - (a[1].missingFields.length * aWeight);
      })
      .slice(0, 3);
  }, [categoryScores]);

  return (
    <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Circular Progress Ring */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <CircularProgress percentage={percentage} size={40} strokeWidth={4} className="ring-2 ring-cyan-500/30 rounded-full" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 shadow-lg max-w-[240px]">
                    <p>{percentage}% of specification fields have data. Help improve this listing by submitting corrections.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">Data Quality</span>
                <span className={`text-xs ${qualityLevel.color}`}>{qualityLevel.label}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Info button for details modal */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialogOpen(true);
                    }}
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Data Quality Details
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
                        <div className="text-2xl font-bold text-success">{verifiedFields}</div>
                        <div className="text-xs text-muted-foreground">Verified</div>
                      </div>
                      <div className="text-center p-3 bg-error/10 border border-error/20 rounded-lg">
                        <div className="text-2xl font-bold text-error">{totalMissing}</div>
                        <div className="text-xs text-muted-foreground">Missing</div>
                      </div>
                      <div className="text-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-amber-500">{unverifiedFields}</div>
                        <div className="text-xs text-muted-foreground">Unverified</div>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Category Breakdown</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        {Object.entries(FIELD_CATEGORIES).map(([key, category]) => {
                          const score = categoryScores[key];
                          const catLevel = getQualityLevel(score.percentage);
                          
                          return (
                            <div 
                              key={key}
                              className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className={`w-2 h-2 rounded-full ${
                                    score.percentage >= 80 ? 'bg-success' :
                                    score.percentage >= 50 ? 'bg-amber-500' :
                                    'bg-error'
                                  }`} 
                                />
                                <span className="text-foreground">{category.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${catLevel.color}`}>
                                  {score.percentage}%
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    score.percentage >= 80 ? 'border-success/50 text-success' :
                                    score.percentage >= 50 ? 'border-amber-500/50 text-amber-500' :
                                    'border-error/50 text-error'
                                  }`}
                                >
                                  {score.filled}/{score.total}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Missing Fields Preview */}
                    {totalMissing > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Missing Fields Preview</h4>
                        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                          {Object.entries(categoryScores)
                            .flatMap(([_, score]) => score.missingFields)
                            .slice(0, 12)
                            .map((field) => (
                              <Badge 
                                key={field} 
                                variant="outline" 
                                className="text-xs border-border text-muted-foreground"
                              >
                                {formatFieldName(field)}
                              </Badge>
                            ))}
                          {totalMissing > 12 && (
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              +{totalMissing - 12} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Help Link */}
                    <div className="pt-2 border-t border-border">
                      <a 
                        href="/contact?subject=data-improvement" 
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Help improve this data
                      </a>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Verification Status */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30">
                      <Clock className={`h-3.5 w-3.5 ${isRecentlyVerified ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className={`text-xs ${isRecentlyVerified ? 'text-success' : 'text-muted-foreground'}`}>
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
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-4 space-y-3">
            {/* Category breakdown */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FIELD_CATEGORIES).map(([key, category]) => {
                const score = categoryScores[key];
                
                return (
                  <div 
                    key={key}
                    className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                  >
                    <span className="text-muted-foreground">{category.label}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        score.percentage >= 80 ? 'border-success/50 text-success' :
                        score.percentage >= 50 ? 'border-amber-500/50 text-amber-500' :
                        'border-error/50 text-error'
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
                <span className={isRecentlyVerified ? 'text-success' : 'text-muted-foreground'}>
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
