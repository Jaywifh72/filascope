import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Printer, Dumbbell, Coins, Calendar, Database, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScoreCardData, SCORE_COLORS } from '@/lib/scoreCardService';
import { InteractiveSimulator } from './methodology/InteractiveSimulator';
import { WeightPieChart } from './methodology/WeightPieChart';
import { ComponentBarChart } from './methodology/ComponentBarChart';
import { DataTransparency } from './methodology/DataTransparency';
import { UserRatingSection } from './methodology/UserRatingSection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScoreMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreData: ScoreCardData | null;
  filamentId?: string;
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

// Component descriptions for education
const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  'Temperature Sensitivity': 'Measures how forgiving the material is across temperature variations. Higher scores mean wider successful temperature ranges.',
  'Warping Tendency': 'Evaluates corner lift and warping during printing. Higher scores indicate minimal warping issues.',
  'Bed Adhesion': 'Rates how well the first layer adheres to common build surfaces without excessive force.',
  'Print Success Rate': 'Based on community-reported successful prints versus failures.',
  'Tensile Strength': 'Maximum stress the material can withstand while being stretched before breaking.',
  'Impact Resistance': 'Ability to absorb energy from sudden impacts without fracturing.',
  'Layer Adhesion': 'Bond strength between printed layers, crucial for mechanical parts.',
  'Price per Gram': 'Cost efficiency compared to similar materials in the same category.',
  'Durability Score': 'Long-term performance under stress, UV exposure, and environmental factors.',
  'Feature Value': 'Special properties like flexibility, heat resistance, or chemical resistance relative to price.',
};

export function ScoreMethodologyModal({ isOpen, onClose, scoreData, filamentId }: ScoreMethodologyModalProps) {
  const [activeTab, setActiveTab] = useState('breakdown');
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  
  if (!scoreData) return null;
  
  const Icon = ICONS[scoreData.icon];
  const colors = SCORE_COLORS[scoreData.rating];
  const isStrengthScore = scoreData.id === 'strength_index';
  
  const handleComponentClick = (name: string) => {
    setExpandedComponent(expandedComponent === name ? null : name);
  };

  const handleUserRatingSubmit = async (rating: number, issues: string[]) => {
    // For now, just log - would connect to database in full implementation
    console.log('User rating submitted:', { filamentId, scoreType: scoreData.id, rating, issues });
    // In production: save to filament_user_ratings table
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', colors.text)} />
            {scoreData.label} Score
          </DialogTitle>
          <DialogDescription>
            Explore how this score is calculated
          </DialogDescription>
        </DialogHeader>
        
        {/* Overall Score Badge */}
        <div className="text-center py-3 bg-muted/30 rounded-lg shrink-0">
          <div className={cn('text-3xl font-bold', colors.text)}>
            {scoreData.displayScore.toFixed(1)}/10
          </div>
          <span className={cn(
            'inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium border',
            colors.badge
          )}>
            {scoreData.ratingLabel}
          </span>
        </div>
        
        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
            <TabsTrigger value="explore" className="text-xs">Explore</TabsTrigger>
            <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto mt-4">
            {/* Breakdown Tab - Original component breakdown */}
            <TabsContent value="breakdown" className="m-0 space-y-4">
              <div className="space-y-3">
                {scoreData.methodology.components.map((component, index) => (
                  <Collapsible 
                    key={index}
                    open={expandedComponent === component.name}
                    onOpenChange={() => handleComponentClick(component.name)}
                  >
                    <div className="space-y-1.5">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between text-sm hover:bg-muted/30 rounded px-1 py-0.5 transition-colors">
                          <div className="flex items-center gap-2">
                            <ChevronDown className={cn(
                              "w-3.5 h-3.5 text-muted-foreground transition-transform",
                              expandedComponent === component.name && "rotate-180"
                            )} />
                            <span className="text-foreground">{component.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">
                              ({component.weight}%)
                            </span>
                            <span className="font-medium tabular-nums">
                              {component.score.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <Progress 
                        value={component.score * 10} 
                        className="h-2"
                      />
                      <CollapsibleContent>
                        <p className="text-xs text-muted-foreground mt-2 pl-5 leading-relaxed">
                          {COMPONENT_DESCRIPTIONS[component.name] || 
                           `This component contributes ${component.weight}% to the overall score.`}
                        </p>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
              
              {/* Material Strength Reference (only for strength scores) */}
              {isStrengthScore && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-3">Strength by Material Family</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    For context, here's how different materials compare:
                  </p>
                  <div className="space-y-2">
                    {MATERIAL_STRENGTH_REFERENCE.map((ref, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-xs w-14 text-muted-foreground">{ref.material}</span>
                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all',
                              ref.score >= 8 ? 'bg-green-500' :
                              ref.score >= 6 ? 'bg-primary' :
                              ref.score >= 4 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${ref.score * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums w-8 text-right">
                          {ref.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Explore Tab - Interactive Simulator */}
            <TabsContent value="explore" className="m-0">
              <InteractiveSimulator 
                components={scoreData.methodology.components}
                originalScore={scoreData.displayScore}
              />
            </TabsContent>
            
            {/* Charts Tab - Visual Components */}
            <TabsContent value="charts" className="m-0 space-y-6">
              <WeightPieChart 
                components={scoreData.methodology.components}
                onComponentClick={handleComponentClick}
              />
              <div className="border-t border-border pt-4">
                <ComponentBarChart 
                  components={scoreData.methodology.components}
                  onComponentClick={handleComponentClick}
                />
              </div>
            </TabsContent>
            
            {/* Data Tab - Transparency + User Input */}
            <TabsContent value="data" className="m-0 space-y-6">
              <DataTransparency />
              
              {filamentId && (
                <div className="border-t border-border pt-4">
                  <UserRatingSection
                    filamentId={filamentId}
                    scoreType={scoreData.id}
                    onSubmit={handleUserRatingSubmit}
                  />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer - Data Sources */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-3 border-t border-border shrink-0">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>{scoreData.methodology.basedOn}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Updated: {scoreData.methodology.lastUpdated}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
