import { cn } from '@/lib/utils';
import { Gauge, TrendingUp, Sparkles, Zap, DollarSign, Crown } from 'lucide-react';
import type { PerformanceProfile as ProfileType } from '@/lib/performanceProfileService';

interface PerformanceProfileProps {
  overallScore: number;
  profile: ProfileType;
  profileLabel: string;
  profileDescription: string;
}

const profileIcons: Record<ProfileType, React.ReactNode> = {
  balanced: <Gauge className="w-5 h-5" />,
  beginner_friendly: <Sparkles className="w-5 h-5" />,
  specialist: <Zap className="w-5 h-5" />,
  performance_oriented: <TrendingUp className="w-5 h-5" />,
  budget: <DollarSign className="w-5 h-5" />,
  premium: <Crown className="w-5 h-5" />
};

const profileColors: Record<ProfileType, string> = {
  balanced: 'text-primary',
  beginner_friendly: 'text-green-500',
  specialist: 'text-purple-500',
  performance_oriented: 'text-amber-500',
  budget: 'text-green-500',
  premium: 'text-amber-400'
};

export function PerformanceProfile({ 
  overallScore, 
  profile, 
  profileLabel, 
  profileDescription 
}: PerformanceProfileProps) {
  // Determine score quality
  const scoreQuality = overallScore >= 7.5 ? 'excellent' : 
                       overallScore >= 5.5 ? 'good' : 
                       overallScore >= 3.5 ? 'fair' : 'standard';

  const qualityColors = {
    excellent: 'text-green-500',
    good: 'text-primary',
    fair: 'text-amber-500',
    standard: 'text-muted-foreground'
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
      {/* Overall Score */}
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          Overall Score
        </div>
        <div className={cn("text-4xl font-bold tabular-nums", qualityColors[scoreQuality])}>
          {overallScore.toFixed(2)}
          <span className="text-lg text-muted-foreground font-normal">/10</span>
        </div>
      </div>

      {/* Profile Badge */}
      <div className="flex items-center justify-center gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
        <span className={cn(profileColors[profile])}>
          {profileIcons[profile]}
        </span>
        <div>
          <div className={cn("font-semibold", profileColors[profile])}>
            {profileLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            {profileDescription}
          </div>
        </div>
      </div>
    </div>
  );
}
