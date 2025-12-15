import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getScoreRecommendations, ScoreRecommendation } from '@/lib/scoreEducation';
import { cn } from '@/lib/utils';

interface ScoreRecommendationsProps {
  easeScore: number | null;
  strengthScore: number | null;
  valueScore: number | null;
  material: string | null;
}

const TYPE_STYLES: Record<ScoreRecommendation['type'], string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  suggestion: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

export function ScoreRecommendations({ 
  easeScore, 
  strengthScore, 
  valueScore, 
  material 
}: ScoreRecommendationsProps) {
  const recommendations = getScoreRecommendations(easeScore, strengthScore, valueScore, material);
  
  if (recommendations.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3" data-coach="recommendations">
      <h3 className="text-sm font-medium text-foreground">Quick Insights</h3>
      
      <div className="grid gap-2">
        {recommendations.slice(0, 3).map((rec, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              TYPE_STYLES[rec.type]
            )}
          >
            <span className="text-lg flex-shrink-0">{rec.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{rec.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {rec.description}
              </p>
              {rec.linkUrl && (
                <Link
                  to={rec.linkUrl}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1.5 font-medium"
                >
                  {rec.linkMaterial ? `Explore ${rec.linkMaterial}` : 'See alternatives'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
