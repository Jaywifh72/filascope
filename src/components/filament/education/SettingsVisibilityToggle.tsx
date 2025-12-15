import { useUserSkillLevel } from '@/hooks/useUserSkillLevel';
import { SkillLevel, SKILL_LEVELS } from '@/lib/skillLevels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SettingsVisibilityToggleProps {
  className?: string;
}

export function SettingsVisibilityToggle({ className }: SettingsVisibilityToggleProps) {
  const { settingsVisibility, updateSettingsVisibility } = useUserSkillLevel();
  const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">Show settings for:</span>
      <Select 
        value={settingsVisibility} 
        onValueChange={(value) => updateSettingsVisibility(value as SkillLevel)}
      >
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {levels.map(level => {
            const config = SKILL_LEVELS[level];
            return (
              <SelectItem key={level} value={level}>
                <span className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

interface AdvancedSettingsToggleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AdvancedSettingsToggle({ 
  children, 
  defaultOpen = false,
  className 
}: AdvancedSettingsToggleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between gap-2 text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            {isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isOpen ? 'Hide advanced settings' : 'Show advanced settings'}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SkillFilteredSettingsProps {
  settingLevel: SkillLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SkillFilteredSettings({ 
  settingLevel, 
  children, 
  fallback 
}: SkillFilteredSettingsProps) {
  const { shouldShowSetting } = useUserSkillLevel();

  if (!shouldShowSetting(settingLevel)) {
    return fallback || null;
  }

  return <>{children}</>;
}
