import { Badge } from '@/components/ui/badge';
import { SkillLevel, SKILL_LEVELS, SETTING_SKILL_LEVELS } from '@/lib/skillLevels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SkillLevelBadgeProps {
  level: SkillLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function SkillLevelBadge({ 
  level, 
  showLabel = true,
  size = 'sm',
  className 
}: SkillLevelBadgeProps) {
  const config = SKILL_LEVELS[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              'gap-1',
              config.color,
              size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
              className
            )}
          >
            <span>{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SettingSkillBadgeProps {
  settingKey: string;
  className?: string;
}

export function SettingSkillBadge({ settingKey, className }: SettingSkillBadgeProps) {
  const level = SETTING_SKILL_LEVELS[settingKey];
  if (!level || level === 'beginner') return null;
  
  return <SkillLevelBadge level={level} showLabel={false} className={className} />;
}

interface UserLevelDisplayProps {
  level: SkillLevel;
  points?: number;
  className?: string;
}

export function UserLevelDisplay({ level, points, className }: UserLevelDisplayProps) {
  const config = SKILL_LEVELS[level];
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xl">{config.icon}</span>
      <div>
        <p className={cn('font-medium text-sm', config.color)}>{config.label}</p>
        {points !== undefined && (
          <p className="text-xs text-muted-foreground">{points} points</p>
        )}
      </div>
    </div>
  );
}
