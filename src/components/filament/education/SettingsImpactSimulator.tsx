import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Gauge, Clock, Target, Thermometer, Wind, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsImpactSimulatorProps {
  material?: string;
  baseSpeed?: number;
  baseTemp?: number;
  className?: string;
}

interface ImpactMetric {
  label: string;
  value: number;
  maxValue: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function SettingsImpactSimulator({ 
  material = 'PLA',
  baseSpeed = 60,
  baseTemp = 210,
  className 
}: SettingsImpactSimulatorProps) {
  const [speed, setSpeed] = useState(baseSpeed);
  const [temperature, setTemperature] = useState(baseTemp);

  const speedImpact = useMemo(() => {
    // Calculate impacts based on speed
    const detailQuality = Math.max(10, 100 - (speed - 30) * 1.5);
    const printTime = Math.max(20, 100 - (speed / 120) * 80);
    const successRate = speed <= 80 ? 95 : Math.max(60, 95 - (speed - 80) * 0.8);
    const vibrationRisk = Math.min(100, (speed / 150) * 100);

    return {
      detailQuality: Math.round(detailQuality),
      printTime: Math.round(printTime),
      successRate: Math.round(successRate),
      vibrationRisk: Math.round(vibrationRisk),
    };
  }, [speed]);

  const tempImpact = useMemo(() => {
    // Calculate impacts based on temperature (assuming PLA range 180-230)
    const optimalTemp = 210;
    const tempDiff = Math.abs(temperature - optimalTemp);
    
    const layerAdhesion = temperature < 190 
      ? Math.max(30, 100 - (190 - temperature) * 5)
      : Math.min(100, 70 + (temperature - 180) * 1.5);
    
    const stringingRisk = temperature > 215 
      ? Math.min(100, (temperature - 215) * 6)
      : Math.max(10, 30 - (215 - temperature) * 1);
    
    const flowQuality = 100 - tempDiff * 2;

    return {
      layerAdhesion: Math.round(Math.min(100, Math.max(0, layerAdhesion))),
      stringingRisk: Math.round(Math.min(100, Math.max(0, stringingRisk))),
      flowQuality: Math.round(Math.min(100, Math.max(0, flowQuality))),
    };
  }, [temperature]);

  const getSpeedTip = () => {
    if (speed <= 40) return "Great for detailed prints but significantly increases print time.";
    if (speed <= 60) return "Balanced speed for reliable prints with good detail.";
    if (speed <= 80) return "Fast printing while maintaining acceptable quality.";
    if (speed <= 100) return "High speed may cause quality issues on complex models.";
    return "Very high speed - watch for ringing and layer adhesion issues.";
  };

  const getTempTip = () => {
    if (temperature < 195) return "Low temperature may cause weak layer adhesion.";
    if (temperature <= 215) return "Optimal range for most PLA filaments.";
    if (temperature <= 225) return "Higher temp improves flow but may increase stringing.";
    return "Very high - risk of degradation and heat creep.";
  };

  const getEstimatedTime = () => {
    // Rough estimate based on speed (assuming 2h baseline at 60mm/s)
    const baseline = 2;
    const timeMultiplier = 60 / speed;
    const hours = baseline * timeMultiplier;
    
    if (hours < 1) return `~${Math.round(hours * 60)} min`;
    if (hours < 2) return `~${hours.toFixed(1)}h`;
    return `~${Math.round(hours)}h`;
  };

  const presets = [
    { label: 'Quality', speed: 30, temp: 205, icon: Target },
    { label: 'Balanced', speed: 60, temp: 210, icon: Gauge },
    { label: 'Speed', speed: 100, temp: 220, icon: Zap },
  ];

  return (
    <Card className={cn('bg-card/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          See How Settings Affect Your Print
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speed Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              Print Speed
            </label>
            <span className="text-sm font-mono text-primary">{speed} mm/s</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            min={20}
            max={150}
            step={5}
            className="py-2"
          />
          
          {/* Speed Impact */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <ImpactBar 
              label="Detail Quality" 
              value={speedImpact.detailQuality}
              icon={<Target className="h-3 w-3" />}
              color={speedImpact.detailQuality > 70 ? 'bg-green-500' : speedImpact.detailQuality > 40 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <ImpactBar 
              label="Print Time" 
              value={speedImpact.printTime}
              suffix={getEstimatedTime()}
              icon={<Clock className="h-3 w-3" />}
              color="bg-blue-500"
              inverted
            />
            <ImpactBar 
              label="Success Rate" 
              value={speedImpact.successRate}
              suffix={`${speedImpact.successRate}%`}
              icon={<Zap className="h-3 w-3" />}
              color={speedImpact.successRate > 85 ? 'bg-green-500' : speedImpact.successRate > 70 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <p className="text-xs text-muted-foreground pt-1 flex items-start gap-1.5">
              <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
              {getSpeedTip()}
            </p>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              Nozzle Temperature
            </label>
            <span className="text-sm font-mono text-primary">{temperature}°C</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={([v]) => setTemperature(v)}
            min={180}
            max={240}
            step={5}
            className="py-2"
          />
          
          {/* Temp Impact */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <ImpactBar 
              label="Layer Adhesion" 
              value={tempImpact.layerAdhesion}
              icon={<Target className="h-3 w-3" />}
              color={tempImpact.layerAdhesion > 70 ? 'bg-green-500' : tempImpact.layerAdhesion > 40 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <ImpactBar 
              label="Stringing Risk" 
              value={tempImpact.stringingRisk}
              icon={<Wind className="h-3 w-3" />}
              color={tempImpact.stringingRisk < 30 ? 'bg-green-500' : tempImpact.stringingRisk < 60 ? 'bg-amber-500' : 'bg-red-500'}
              inverted
            />
            <ImpactBar 
              label="Flow Quality" 
              value={tempImpact.flowQuality}
              icon={<Gauge className="h-3 w-3" />}
              color={tempImpact.flowQuality > 70 ? 'bg-green-500' : tempImpact.flowQuality > 40 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <p className="text-xs text-muted-foreground pt-1 flex items-start gap-1.5">
              <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
              {getTempTip()}
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Try these presets:</p>
          <div className="flex gap-2">
            {presets.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className={cn(
                  'flex-1 gap-1.5',
                  speed === preset.speed && temperature === preset.temp && 'border-primary bg-primary/10'
                )}
                onClick={() => {
                  setSpeed(preset.speed);
                  setTemperature(preset.temp);
                }}
              >
                <preset.icon className="h-3 w-3" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImpactBar({ 
  label, 
  value, 
  suffix, 
  icon, 
  color,
  inverted = false 
}: { 
  label: string; 
  value: number; 
  suffix?: string; 
  icon: React.ReactNode;
  color: string;
  inverted?: boolean;
}) {
  const displayValue = inverted ? 100 - value : value;
  const labelText = suffix || (displayValue > 75 ? 'High' : displayValue > 40 ? 'Medium' : 'Low');
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium">{labelText}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
