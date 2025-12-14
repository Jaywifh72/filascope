import { supabase } from '@/integrations/supabase/client';

interface ModulePerformance {
  module_name: string;
  click_through_rate: number;
  scroll_past_rate: number;
  engagement_score: number;
  conversions: number;
}

interface UserSegment {
  hasPrinter: boolean;
  hasFavorites: boolean;
  isNewUser: boolean;
  primaryMaterial?: string;
}

// Module priority weights by user segment
const SEGMENT_WEIGHTS: Record<string, Record<string, number>> = {
  newUser: {
    trending: 1.5,
    deals: 1.3,
    safety: 1.0,
    tips: 1.4,
    contextual: 0.8,
    watchlist: 0.5,
    recent: 0.5,
  },
  hasFavorites: {
    watchlist: 1.8,
    deals: 1.4,
    trending: 1.0,
    safety: 1.0,
    contextual: 1.2,
    recent: 1.3,
    tips: 0.8,
  },
  hasPrinter: {
    contextual: 1.6,
    deals: 1.3,
    trending: 1.0,
    safety: 1.2,
    watchlist: 1.1,
    recent: 1.0,
    tips: 0.9,
  },
  default: {
    deals: 1.2,
    trending: 1.1,
    safety: 1.0,
    contextual: 1.0,
    watchlist: 1.0,
    recent: 1.0,
    tips: 1.0,
  },
};

// Safety module is always visible - never hide it
const PROTECTED_MODULES = ['safety'];

// Minimum CTR to avoid auto-hiding (1%)
const MIN_CTR_THRESHOLD = 1;

// Maximum scroll-past rate before considering hiding (90%)
const MAX_SCROLL_PAST_THRESHOLD = 90;

// Minimum days of data before making optimization decisions
const MIN_DATA_DAYS = 7;

export async function getOptimalModuleOrder(
  userSegment: UserSegment,
  userPreferences?: Record<string, number>
): Promise<string[]> {
  // Start with default order
  const defaultOrder = ['safety', 'deals', 'trending', 'contextual', 'watchlist', 'recent', 'tips'];
  
  try {
    // Fetch recent performance data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: performance } = await supabase
      .from('module_performance_daily')
      .select('module_name, total_views, total_clicks, scroll_past_count, engagement_score')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);
    
    if (!performance || performance.length === 0) {
      return applySegmentWeights(defaultOrder, userSegment);
    }
    
    // Aggregate performance by module
    const modulePerf = new Map<string, ModulePerformance>();
    performance.forEach(row => {
      const existing = modulePerf.get(row.module_name) || {
        module_name: row.module_name,
        click_through_rate: 0,
        scroll_past_rate: 0,
        engagement_score: 0,
        conversions: 0,
      };
      
      const views = row.total_views || 1;
      existing.click_through_rate += ((row.total_clicks || 0) / views) * 100;
      existing.scroll_past_rate += ((row.scroll_past_count || 0) / views) * 100;
      existing.engagement_score += row.engagement_score || 0;
      
      modulePerf.set(row.module_name, existing);
    });
    
    // Calculate scores for each module
    const scores = defaultOrder.map(moduleName => {
      const perf = modulePerf.get(moduleName);
      let score = 0;
      
      if (perf) {
        score = perf.engagement_score;
      }
      
      // Apply segment weights
      const segmentKey = getSegmentKey(userSegment);
      const weights = SEGMENT_WEIGHTS[segmentKey] || SEGMENT_WEIGHTS.default;
      score *= weights[moduleName] || 1;
      
      // Apply user preferences if available
      if (userPreferences?.[moduleName]) {
        score *= 1 + (userPreferences[moduleName] * 0.1);
      }
      
      // Safety always gets boosted to top
      if (moduleName === 'safety') {
        score += 1000;
      }
      
      return { moduleName, score };
    });
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    return scores.map(s => s.moduleName);
  } catch (error) {
    console.error('Error calculating optimal module order:', error);
    return defaultOrder;
  }
}

export async function shouldHideModule(
  moduleName: string,
  moduleMetrics?: ModulePerformance
): Promise<boolean> {
  // Never hide protected modules
  if (PROTECTED_MODULES.includes(moduleName)) {
    return false;
  }
  
  if (!moduleMetrics) {
    return false;
  }
  
  // Hide if CTR is below threshold for extended period
  if (moduleMetrics.click_through_rate < MIN_CTR_THRESHOLD) {
    return true;
  }
  
  // Hide if most users scroll past without engaging
  if (moduleMetrics.scroll_past_rate > MAX_SCROLL_PAST_THRESHOLD) {
    return true;
  }
  
  return false;
}

export function boostContent(
  items: Array<{ id: string; engagementScore?: number }>,
  maxItems: number = 5
): string[] {
  // Sort by engagement and return top items
  return items
    .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
    .slice(0, maxItems)
    .map(item => item.id);
}

export async function getPersonalizedModuleMix(
  userId: string,
  userSegment: UserSegment
): Promise<{ moduleOrder: string[]; hiddenModules: string[] }> {
  const moduleOrder = await getOptimalModuleOrder(userSegment);
  
  // Fetch user's module interaction history
  const { data: interactions } = await supabase
    .from('module_engagement_metrics')
    .select('module_name, event_type')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  if (!interactions || interactions.length === 0) {
    return { moduleOrder, hiddenModules: [] };
  }
  
  // Calculate per-module engagement for this user
  const userModuleEngagement = new Map<string, { clicks: number; scrollPast: number }>();
  interactions.forEach(i => {
    const existing = userModuleEngagement.get(i.module_name) || { clicks: 0, scrollPast: 0 };
    if (i.event_type === 'click' || i.event_type === 'cta_click') {
      existing.clicks++;
    } else if (i.event_type === 'scroll_past') {
      existing.scrollPast++;
    }
    userModuleEngagement.set(i.module_name, existing);
  });
  
  // Determine which modules to hide for this user
  const hiddenModules: string[] = [];
  userModuleEngagement.forEach((engagement, moduleName) => {
    if (PROTECTED_MODULES.includes(moduleName)) return;
    
    const total = engagement.clicks + engagement.scrollPast;
    if (total >= 10) { // Need minimum interactions
      const scrollPastRate = (engagement.scrollPast / total) * 100;
      if (scrollPastRate > 95) { // User almost always ignores this module
        hiddenModules.push(moduleName);
      }
    }
  });
  
  return {
    moduleOrder: moduleOrder.filter(m => !hiddenModules.includes(m)),
    hiddenModules,
  };
}

function getSegmentKey(segment: UserSegment): string {
  if (segment.isNewUser) return 'newUser';
  if (segment.hasFavorites) return 'hasFavorites';
  if (segment.hasPrinter) return 'hasPrinter';
  return 'default';
}

function applySegmentWeights(order: string[], segment: UserSegment): string[] {
  const segmentKey = getSegmentKey(segment);
  const weights = SEGMENT_WEIGHTS[segmentKey] || SEGMENT_WEIGHTS.default;
  
  return [...order].sort((a, b) => {
    const weightA = weights[a] || 1;
    const weightB = weights[b] || 1;
    return weightB - weightA;
  });
}
