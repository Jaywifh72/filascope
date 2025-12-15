import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentData {
  name: string;
  score: number;
  weight: number;
}

interface InteractiveSimulatorProps {
  components: ComponentData[];
  originalScore: number;
}

export function InteractiveSimulator({ components, originalScore }: InteractiveSimulatorProps) {
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>(() =>
    components.reduce((acc, c) => ({ ...acc, [c.name]: c.score }), {})
  );

  const simulatedScore = useMemo(() => {
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = components.reduce(
      (sum, c) => sum + (simulatedValues[c.name] * c.weight),
      0
    );
    return weightedSum / totalWeight;
  }, [components, simulatedValues]);

  const scoreDiff = simulatedScore - originalScore;
  const hasChanges = Math.abs(scoreDiff) > 0.01;

  const handleSliderChange = (name: string, value: number[]) => {
    setSimulatedValues(prev => ({ ...prev, [name]: value[0] }));
  };

  const handleReset = () => {
    setSimulatedValues(
      components.reduce((acc, c) => ({ ...acc, [c.name]: c.score }), {})
    );
  };

  const getMostImpactfulChange = () => {
    let maxImpact = { name: '', impact: 0, direction: '' };
    
    components.forEach(c => {
      const diff = simulatedValues[c.name] - c.score;
      if (Math.abs(diff) > Math.abs(maxImpact.impact)) {
        maxImpact = {
          name: c.name,
          impact: diff,
          direction: diff < 0 ? 'worse' : 'better'
        };
      }
    });
    
    return maxImpact;
  };

  const impactfulChange = getMostImpactfulChange();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">🧪</span>
          What-If Simulator
        </h4>
        {hasChanges && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {components.map((component) => {
          const simValue = simulatedValues[component.name];
          const isChanged = Math.abs(simValue - component.score) > 0.01;
          
          return (
            <div key={component.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {component.name} ({component.weight}%)
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  {isChanged ? (
                    <>
                      <span className="text-muted-foreground line-through">
                        {component.score.toFixed(1)}
                      </span>
                      <span className="text-primary font-medium">
                        → {simValue.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground">{simValue.toFixed(1)}</span>
                  )}
                </div>
              </div>
              <Slider
                value={[simValue]}
                onValueChange={(v) => handleSliderChange(component.name, v)}
                min={0}
                max={10}
                step={0.1}
                className={cn(
                  "cursor-pointer",
                  isChanged && "[&_[role=slider]]:bg-primary [&_.bg-primary]:bg-primary"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Simulated Result */}
      <div className={cn(
        "p-3 rounded-lg border transition-colors",
        hasChanges 
          ? "bg-primary/10 border-primary/30" 
          : "bg-muted/30 border-border"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Simulated Score:</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold tabular-nums",
              hasChanges ? "text-primary" : "text-foreground"
            )}>
              {simulatedScore.toFixed(1)}/10
            </span>
            {hasChanges && (
              <span className={cn(
                "text-sm font-medium",
                scoreDiff > 0 ? "text-green-500" : "text-amber-500"
              )}>
                ({scoreDiff > 0 ? '+' : ''}{scoreDiff.toFixed(1)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Educational Insight */}
      {hasChanges && impactfulChange.name && (
        <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p>
            If <strong>{impactfulChange.name.toLowerCase()}</strong> was {impactfulChange.direction}, 
            the score would {scoreDiff > 0 ? 'increase' : 'drop'} by{' '}
            <strong>{Math.abs(scoreDiff).toFixed(1)} points</strong> due to its weight 
            in the calculation.
          </p>
        </div>
      )}
    </div>
  );
}
