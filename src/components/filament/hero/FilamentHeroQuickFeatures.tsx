import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilamentHeroQuickFeaturesProps {
  material: string | null;
  easeOfPrintingScore?: number | null;
  strengthIndex?: number | null;
  highSpeedCapable?: boolean | null;
  isAbrasive?: boolean | null;
}

// Generate quick features based on material and properties
function getQuickFeatures(props: FilamentHeroQuickFeaturesProps): string[] {
  const { material, easeOfPrintingScore, strengthIndex, highSpeedCapable, isAbrasive } = props;
  const features: string[] = [];
  
  // Material-specific features
  const materialLower = material?.toLowerCase() || '';
  
  if (materialLower.includes('pla')) {
    features.push('Great layer adhesion');
    features.push('Low warping');
    features.push('Beginner friendly');
  } else if (materialLower.includes('petg')) {
    features.push('Chemical resistant');
    features.push('Good flexibility');
    features.push('Food safe options');
  } else if (materialLower.includes('abs')) {
    features.push('Heat resistant');
    features.push('Impact resistant');
    features.push('Paintable');
  } else if (materialLower.includes('asa')) {
    features.push('UV resistant');
    features.push('Weather proof');
    features.push('Outdoor ready');
  } else if (materialLower.includes('tpu') || materialLower.includes('tpe')) {
    features.push('Flexible');
    features.push('Shock absorbing');
    features.push('Wear resistant');
  } else if (materialLower.includes('nylon') || materialLower.includes('pa')) {
    features.push('Strong');
    features.push('Wear resistant');
    features.push('Self-lubricating');
  } else if (materialLower.includes('pc') || materialLower.includes('polycarbonate')) {
    features.push('High strength');
    features.push('Heat resistant');
    features.push('Transparent options');
  } else {
    // Generic features based on scores
    if (easeOfPrintingScore && easeOfPrintingScore >= 7) {
      features.push('Easy to print');
    }
    if (strengthIndex && strengthIndex >= 7) {
      features.push('High strength');
    }
  }
  
  // Additional features based on properties
  if (highSpeedCapable) {
    features.push('High-speed ready');
  }
  
  if (isAbrasive) {
    features.push('Hardened nozzle required');
  }
  
  // Ensure we have at least 4 features, max 6
  while (features.length < 4) {
    const genericFeatures = ['Quality tested', 'Consistent diameter', 'Vacuum sealed', 'Dry storage'];
    const remaining = genericFeatures.filter(f => !features.includes(f));
    if (remaining.length > 0) {
      features.push(remaining[0]);
    } else {
      break;
    }
  }
  
  return features.slice(0, 6);
}

export function FilamentHeroQuickFeatures(props: FilamentHeroQuickFeaturesProps) {
  const features = getQuickFeatures(props);
  
  if (features.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-3 lg:gap-4 p-4 lg:p-5 mt-6",
      "bg-white/[0.02] border border-white/[0.06] rounded-xl"
    )}>
      {features.map((feature, idx) => (
        <div 
          key={idx}
          className="flex items-center gap-2 text-sm text-foreground/80"
        >
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{feature}</span>
        </div>
      ))}
    </div>
  );
}
