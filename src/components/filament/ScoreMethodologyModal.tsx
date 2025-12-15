import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Printer, Dumbbell, Coins, Calendar, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreCardData, SCORE_COLORS } from '@/lib/scoreCardService';

interface ScoreMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreData: ScoreCardData | null;
}

const ICONS = {
  printer: Printer,
  strength: Dumbbell,
  value: Coins,
};

// Material strength reference data
const MATERIAL_STRENGTH_REFERENCE = [
  { material: 'PEEK', score: 9.5 },
  { material: 'PC', score: 8.5 },
  { material: 'Nylon', score: 7.8 },
  { material: 'PA-CF', score: 8.2 },
  { material: 'ASA', score: 6.5 },
  { material: 'PETG', score: 5.5 },
  { material: 'ABS', score: 5.2 },
  { material: 'PLA+', score: 4.8 },
  { material: 'PLA', score: 4.0 },
];

export function ScoreMethodologyModal({ isOpen, onClose, scoreData }: ScoreMethodologyModalProps) {
  if (!scoreData) return null;
  
  const Icon = ICONS[scoreData.icon];
  const colors = SCORE_COLORS[scoreData.rating];
  const isStrengthScore = scoreData.id === 'strength_index';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', colors.text)} />
            {scoreData.label} Score Breakdown
          </DialogTitle>
          <DialogDescription>
            Understanding how this score is calculated
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
            <div className={cn('text-4xl font-bold', colors.text)}>
              {scoreData.displayScore.toFixed(1)}/10
            </div>
            <span className={cn(
              'inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border',
              colors.badge
            )}>
              {scoreData.ratingLabel}
            </span>
          </div>
          
          {/* Component Breakdown */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Score Components</h4>
            <div className="space-y-3">
              {scoreData.methodology.components.map((component, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{component.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        ({component.weight}% weight)
                      </span>
                      <span className="font-medium tabular-nums">
                        {component.score.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={component.score * 10} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Material Strength Reference (only for strength scores) */}
          {isStrengthScore && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3">Strength by Material Family</h4>
              <p className="text-xs text-muted-foreground mb-3">
                For context, here's how different materials compare on absolute strength:
              </p>
              <div className="space-y-2">
                {MATERIAL_STRENGTH_REFERENCE.map((ref, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-muted-foreground">{ref.material}</span>
                    <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          ref.score >= 8 ? 'bg-green-500' :
                          ref.score >= 6 ? 'bg-primary' :
                          ref.score >= 4 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${ref.score * 10}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-10 text-right">
                      {ref.score}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Data Sources */}
          <div className="flex items-start gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>{scoreData.methodology.basedOn}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated: {scoreData.methodology.lastUpdated}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
