import React, { useState, useMemo } from 'react';
import { Beaker, Check, X, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMaterialDataFromType, getAllMaterialsAsData } from './materialHelpers';
import type { MaterialData } from './types';

interface MaterialComparisonToolProps {
  currentMaterial: string;
  currentMaterialName: string;
  onSelectMaterial?: (materialType: string) => void;
}

const properties = [
  { key: 'strength', label: 'Strength', icon: '💪' },
  { key: 'flexibility', label: 'Flexibility', icon: '🔄' },
  { key: 'heatResistance', label: 'Heat Resistance', icon: '🔥' },
  { key: 'easeOfPrint', label: 'Ease of Print', icon: '✨' },
  { key: 'surfaceFinish', label: 'Surface Finish', icon: '✅' },
  { key: 'durability', label: 'Durability', icon: '🛡️' },
] as const;

export const MaterialComparisonTool: React.FC<MaterialComparisonToolProps> = ({
  currentMaterial,
  currentMaterialName,
  onSelectMaterial
}) => {
  const [compareWith, setCompareWith] = useState<string | null>(null);
  
  const allMaterials = useMemo(() => getAllMaterialsAsData(), []);
  const currentMaterialData = useMemo(() => getMaterialDataFromType(currentMaterial), [currentMaterial]);
  const comparisonMaterial = useMemo(() => 
    compareWith ? getMaterialDataFromType(compareWith) : null, 
    [compareWith]
  );

  if (!currentMaterialData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Material data not available for {currentMaterial}
      </div>
    );
  }

  const getPropertyValue = (material: MaterialData, key: string): number => {
    return material.properties[key as keyof typeof material.properties] as number || 5;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10">
          <Beaker className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Material Comparison</h3>
          <p className="text-sm text-muted-foreground">Compare {currentMaterialName} with other materials</p>
        </div>
      </div>

      {/* Material Selection */}
      <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-xl">
            <div className="text-sm font-bold text-foreground">{currentMaterialName}</div>
            <div className="text-xs font-semibold text-muted-foreground">{currentMaterial}</div>
          </div>
          <span className="text-sm font-bold text-muted-foreground">vs</span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-semibold text-muted-foreground mb-1">Compare with:</div>
          <Select value={compareWith || ''} onValueChange={(val) => setCompareWith(val || null)}>
            <SelectTrigger className="bg-background/50 border-border">
              <SelectValue placeholder="Select a material..." />
            </SelectTrigger>
            <SelectContent>
              {allMaterials
                .filter(m => m.type !== currentMaterial)
                .map(m => (
                  <SelectItem key={m.type} value={m.type}>
                    {m.name} ({m.type})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Properties Comparison */}
      <div className="space-y-1">
        {/* Header Row */}
        <div className="grid grid-cols-[140px_1fr_1fr] gap-4 pb-3 border-b border-border text-xs font-semibold text-muted-foreground">
          <div>Property</div>
          <div>{currentMaterial}</div>
          {comparisonMaterial && <div>{comparisonMaterial.type}</div>}
        </div>

        {/* Property Rows */}
        {properties.map(({ key, label, icon }) => {
          const currentValue = getPropertyValue(currentMaterialData, key);
          const compareValue = comparisonMaterial ? getPropertyValue(comparisonMaterial, key) : 0;
          const diff = comparisonMaterial ? currentValue - compareValue : 0;

          return (
            <div 
              key={key}
              className="grid grid-cols-[140px_1fr_1fr] gap-4 items-center py-3 border-b border-border/50"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span>{icon}</span>
                {label}
              </div>
              
              {/* Current Material Bar */}
              <div className="relative h-6 bg-muted/50 rounded overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-300"
                  style={{ width: `${currentValue * 10}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground">
                  {currentValue}/10
                </span>
              </div>

              {/* Comparison Material Bar */}
              {comparisonMaterial && (
                <div className="relative h-6 bg-muted/50 rounded overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-purple-500/30 transition-all duration-300"
                    style={{ width: `${compareValue * 10}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                    {compareValue}/10
                    {diff !== 0 && (
                      <span className={`text-[10px] font-bold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Food Safe Row */}
        <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-center py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span>🍴</span>
            Food Safe
          </div>
          
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${currentMaterialData.properties.foodSafe ? 'text-green-500' : 'text-red-500'}`}>
            {currentMaterialData.properties.foodSafe ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {currentMaterialData.properties.foodSafe ? 'Yes' : 'No'}
          </div>

          {comparisonMaterial && (
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${comparisonMaterial.properties.foodSafe ? 'text-green-500' : 'text-red-500'}`}>
              {comparisonMaterial.properties.foodSafe ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {comparisonMaterial.properties.foodSafe ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="pt-5 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Current Material */}
          <div className="p-4 bg-muted/30 rounded-xl">
            <h4 className="text-base font-bold text-primary mb-3">{currentMaterial}</h4>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">Best For:</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentMaterialData.bestFor.slice(0, 4).map(use => (
                    <span key={use} className="px-2.5 py-1 bg-green-500/10 rounded-md text-xs font-semibold text-green-500">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">Avoid For:</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentMaterialData.avoidFor.slice(0, 4).map(use => (
                    <span key={use} className="px-2.5 py-1 bg-red-500/10 rounded-md text-xs font-semibold text-red-500">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span>Price: <span className="font-semibold text-foreground">{currentMaterialData.priceRange}</span></span>
                <span>Difficulty: <span className="font-semibold text-foreground capitalize">{currentMaterialData.printDifficulty}</span></span>
              </div>
            </div>
          </div>

          {/* Comparison Material */}
          {comparisonMaterial && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <h4 className="text-base font-bold text-purple-400 mb-3">{comparisonMaterial.type}</h4>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Best For:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {comparisonMaterial.bestFor.slice(0, 4).map(use => (
                      <span key={use} className="px-2.5 py-1 bg-green-500/10 rounded-md text-xs font-semibold text-green-500">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Avoid For:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {comparisonMaterial.avoidFor.slice(0, 4).map(use => (
                      <span key={use} className="px-2.5 py-1 bg-red-500/10 rounded-md text-xs font-semibold text-red-500">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
                  <span>Price: <span className="font-semibold text-foreground">{comparisonMaterial.priceRange}</span></span>
                  <span>Difficulty: <span className="font-semibold text-foreground capitalize">{comparisonMaterial.printDifficulty}</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      {comparisonMaterial && (
        <div className="flex gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            <strong>{currentMaterial}</strong> is better for{' '}
            {currentMaterialData.properties.easeOfPrint > comparisonMaterial.properties.easeOfPrint 
              ? 'beginners and ' 
              : ''}
            {currentMaterialData.properties.strength > comparisonMaterial.properties.strength 
              ? 'structural parts' 
              : 'decorative prints'}.
            Choose <strong>{comparisonMaterial.type}</strong> if you need{' '}
            {comparisonMaterial.properties.heatResistance > currentMaterialData.properties.heatResistance 
              ? 'heat resistance' 
              : comparisonMaterial.properties.flexibility > currentMaterialData.properties.flexibility
                ? 'flexibility'
                : 'higher durability'}.
          </p>
        </div>
      )}
    </div>
  );
};
