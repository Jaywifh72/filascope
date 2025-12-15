import { Achievement } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface AchievementToastProps {
  achievement: Achievement;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <div className="flex items-center gap-3 p-1">
      <div className="text-3xl animate-bounce">{achievement.icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Achievement Unlocked!</p>
        <p className="text-base font-bold text-primary">{achievement.title}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
        {achievement.points > 0 && (
          <p className="text-xs font-medium text-amber-400 mt-1">+{achievement.points} points</p>
        )}
      </div>
    </div>
  );
}

// Simple achievement display card
interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
  className?: string;
}

export function AchievementCard({ 
  achievement, 
  isUnlocked, 
  unlockedAt,
  className 
}: AchievementCardProps) {
  return (
    <div 
      className={cn(
        'p-3 rounded-lg border transition-all',
        isUnlocked 
          ? 'bg-card border-primary/30' 
          : 'bg-muted/30 border-border opacity-60',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'text-2xl',
          !isUnlocked && 'grayscale opacity-50'
        )}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              'font-medium text-sm',
              !isUnlocked && 'text-muted-foreground'
            )}>
              {achievement.title}
            </h4>
            {achievement.points > 0 && (
              <span className={cn(
                'text-xs font-medium',
                isUnlocked ? 'text-amber-400' : 'text-muted-foreground'
              )}>
                {isUnlocked ? `+${achievement.points}` : achievement.points} pts
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {achievement.description}
          </p>
          {isUnlocked && unlockedAt && (
            <p className="text-xs text-primary/70 mt-1">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
