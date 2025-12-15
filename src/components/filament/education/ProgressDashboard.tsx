import { useAchievements } from '@/hooks/useAchievements';
import { useUserSkillLevel } from '@/hooks/useUserSkillLevel';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, getAchievementsByCategory } from '@/lib/achievements';
import { SKILL_LEVELS, getProgressToNextLevel, getNextSkillLevel } from '@/lib/skillLevels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AchievementCard } from './AchievementToast';
import { Trophy, Target, BookOpen, Zap, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressDashboardProps {
  className?: string;
}

export function ProgressDashboard({ className }: ProgressDashboardProps) {
  const { unlockedAchievements, stats, getTotalPoints, isUnlocked, allAchievements } = useAchievements();
  const { skillLevel, skillLevelConfig } = useUserSkillLevel();
  
  const totalPoints = getTotalPoints();
  const nextLevel = getNextSkillLevel(skillLevel);
  const progressToNext = getProgressToNextLevel(totalPoints, skillLevel);
  const unlockedCount = unlockedAchievements.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="h-5 w-5 text-amber-400" />}
          label="Total Points"
          value={totalPoints}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-purple-400" />}
          label="Achievements"
          value={`${unlockedCount}/${totalCount}`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-green-400" />}
          label="Materials Explored"
          value={stats.materials_explored}
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-cyan-400" />}
          label="Settings Exported"
          value={stats.settings_exported}
        />
      </div>

      {/* Current Level */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">{skillLevelConfig.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className={cn('text-lg font-bold', skillLevelConfig.color)}>
                  {skillLevelConfig.label}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {totalPoints} points
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {skillLevelConfig.description}
              </p>
              {nextLevel && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Next: {nextLevel.label}
                    </span>
                    <span className="text-muted-foreground">
                      {nextLevel.requiredPoints - totalPoints} pts to go
                    </span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ActivityStat label="Materials Explored" value={stats.materials_explored} />
            <ActivityStat label="Tutorials Watched" value={stats.tutorials_watched} />
            <ActivityStat label="Glossary Lookups" value={stats.glossary_lookups} />
            <ActivityStat label="Settings Exported" value={stats.settings_exported} />
            <ActivityStat label="Comparisons Made" value={stats.comparisons_made} />
            <ActivityStat label="Printers Configured" value={stats.printers_configured} />
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-transparent p-0 mb-4">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All ({totalCount})
              </TabsTrigger>
              {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, config]) => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {config.icon} {getAchievementsByCategory(key as any).length}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <AchievementGrid achievements={Object.values(ACHIEVEMENTS)} />
            </TabsContent>
            
            {Object.keys(ACHIEVEMENT_CATEGORIES).map(category => (
              <TabsContent key={category} value={category}>
                <AchievementGrid achievements={getAchievementsByCategory(category as any)} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function AchievementGrid({ achievements }: { achievements: any[] }) {
  const { isUnlocked, unlockedAchievements } = useAchievements();
  
  // Sort: unlocked first, then by points
  const sorted = [...achievements].sort((a, b) => {
    const aUnlocked = isUnlocked(a.id);
    const bUnlocked = isUnlocked(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return b.points - a.points;
  });

  return (
    <ScrollArea className="h-[300px]">
      <div className="grid gap-2">
        {sorted.map(achievement => {
          const unlocked = isUnlocked(achievement.id);
          const unlockedData = unlockedAchievements.find(a => a.achievement_id === achievement.id);
          
          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={unlocked}
              unlockedAt={unlockedData?.unlocked_at}
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
