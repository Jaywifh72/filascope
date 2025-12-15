import { useState } from 'react';
import { BookOpen, Target, Wrench, Zap, Factory, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SCORE_INTERPRETATION_GUIDE } from '@/lib/scoreEducation';
import { cn } from '@/lib/utils';

interface ScoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USE_CASE_ICONS = {
  decorative: Target,
  functional: Wrench,
  prototyping: Zap,
  production: Factory,
};

const IMPORTANCE_COLORS = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const SCORE_LABELS = {
  ease_of_printing: 'Ease of Printing',
  strength_index: 'Strength Index',
  value_score: 'Value Score',
};

export function ScoreGuideModal({ isOpen, onClose }: ScoreGuideModalProps) {
  const [activeTab, setActiveTab] = useState('decorative');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            How to Interpret Scores
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Different projects have different priorities. Here's what to focus on for each use case.
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 h-auto p-1 bg-muted/50">
            {Object.entries(SCORE_INTERPRETATION_GUIDE).map(([key, guide]) => {
              const Icon = USE_CASE_ICONS[key as keyof typeof USE_CASE_ICONS];
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="flex flex-col items-center gap-1 py-2 px-3 data-[state=active]:bg-background"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{guide.title.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {Object.entries(SCORE_INTERPRETATION_GUIDE).map(([key, guide]) => (
            <TabsContent key={key} value={key} className="mt-4 space-y-4">
              {/* Header */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold text-foreground">{guide.title}</h3>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
              </div>
              
              {/* Score Priority Matrix */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Score Priority</h4>
                <div className="space-y-2">
                  {guide.priorities.map((priority, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    >
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize", IMPORTANCE_COLORS[priority.importance])}
                      >
                        {priority.importance}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {SCORE_LABELS[priority.score as keyof typeof SCORE_LABELS]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {priority.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tips */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Pro Tips</h4>
                <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                  {guide.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Color Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Score Color Guide</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">8-10: Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-muted-foreground">6-8: Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">4-6: Fair</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">0-4: Context-dependent</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
