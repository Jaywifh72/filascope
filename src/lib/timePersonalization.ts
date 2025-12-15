// Time-Based Personalization Service
// Handles time-based recommendation adjustments based on user lifecycle

const FIRST_VISIT_KEY = "filascope_first_visit";
const LAST_VISIT_KEY = "filascope_last_visit";
const VISIT_COUNT_KEY = "filascope_visit_count";

export interface TimeContext {
  firstVisitDate: Date | null;
  lastVisitDate: Date | null;
  sessionAge: number; // days since first visit
  totalVisits: number;
  daysSinceLastVisit: number;
}

export interface TimeRecommendations {
  strategy: "popular" | "new_arrivals" | "trending" | "advanced" | "personalized";
  badge: string | null;
  explanation: string | null;
  showNewBadge: boolean;
}

// ============= Time Context Management =============

export function getTimeContext(): TimeContext {
  const now = new Date();
  
  // Get or set first visit
  let firstVisitDate: Date | null = null;
  const storedFirst = localStorage.getItem(FIRST_VISIT_KEY);
  if (storedFirst) {
    firstVisitDate = new Date(storedFirst);
  } else {
    firstVisitDate = now;
    localStorage.setItem(FIRST_VISIT_KEY, now.toISOString());
  }
  
  // Get last visit and update
  let lastVisitDate: Date | null = null;
  const storedLast = localStorage.getItem(LAST_VISIT_KEY);
  if (storedLast) {
    lastVisitDate = new Date(storedLast);
  }
  
  // Update last visit to now
  localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  
  // Get and increment visit count
  const storedCount = localStorage.getItem(VISIT_COUNT_KEY);
  const totalVisits = storedCount ? parseInt(storedCount, 10) + 1 : 1;
  localStorage.setItem(VISIT_COUNT_KEY, totalVisits.toString());
  
  // Calculate session age
  const sessionAge = firstVisitDate
    ? Math.floor((now.getTime() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate days since last visit
  const daysSinceLastVisit = lastVisitDate
    ? Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return {
    firstVisitDate,
    lastVisitDate,
    sessionAge,
    totalVisits,
    daysSinceLastVisit,
  };
}

// ============= Time-Based Recommendations =============

export function getTimeBasedRecommendations(
  timeContext: TimeContext,
  purchasedMaterials: string[],
  isAuthenticated: boolean
): TimeRecommendations {
  const { sessionAge, totalVisits, daysSinceLastVisit } = timeContext;
  
  // First-time visitor
  if (totalVisits === 1) {
    return {
      strategy: "popular",
      badge: null,
      explanation: "Most popular with first-time users",
      showNewBadge: false,
    };
  }
  
  // Returning after absence (3+ days)
  if (daysSinceLastVisit >= 3) {
    return {
      strategy: "new_arrivals",
      badge: "New since your last visit",
      explanation: "Products added since you were last here",
      showNewBadge: true,
    };
  }
  
  // Regular returning visitor
  if (sessionAge >= 7 && totalVisits >= 5) {
    // Power user with purchases
    if (purchasedMaterials.length >= 3) {
      return {
        strategy: "advanced",
        badge: "For experienced users",
        explanation: "Advanced materials you haven't tried yet",
        showNewBadge: false,
      };
    }
    
    // Regular user without many purchases
    return {
      strategy: "trending",
      badge: "Trending in your category",
      explanation: "Popular choices this week",
      showNewBadge: false,
    };
  }
  
  // New-ish visitor (few visits)
  if (sessionAge < 7 && totalVisits < 5) {
    return {
      strategy: "popular",
      badge: "Popular choice",
      explanation: "Highly rated by the community",
      showNewBadge: false,
    };
  }
  
  // Default to personalized
  return {
    strategy: "personalized",
    badge: null,
    explanation: "Personalized for you",
    showNewBadge: false,
  };
}

// ============= New Since Last Visit Detection =============

export function isNewSinceLastVisit(
  itemCreatedAt: string | Date | null,
  lastVisitDate: Date | null
): boolean {
  if (!itemCreatedAt || !lastVisitDate) return false;
  
  const itemDate = typeof itemCreatedAt === "string" 
    ? new Date(itemCreatedAt) 
    : itemCreatedAt;
  
  return itemDate > lastVisitDate;
}

// ============= Visit Streak Tracking =============

export function getVisitStreak(): number {
  const streakKey = "filascope_visit_streak";
  const lastStreakDateKey = "filascope_last_streak_date";
  
  const today = new Date().toDateString();
  const lastStreakDate = localStorage.getItem(lastStreakDateKey);
  const currentStreak = parseInt(localStorage.getItem(streakKey) || "0", 10);
  
  if (lastStreakDate === today) {
    // Already visited today
    return currentStreak;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastStreakDate === yesterday.toDateString()) {
    // Continuing streak
    const newStreak = currentStreak + 1;
    localStorage.setItem(streakKey, newStreak.toString());
    localStorage.setItem(lastStreakDateKey, today);
    return newStreak;
  }
  
  // Streak broken, start new
  localStorage.setItem(streakKey, "1");
  localStorage.setItem(lastStreakDateKey, today);
  return 1;
}
