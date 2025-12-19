import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

export interface DailyStats {
  date: string;
  dateLabel: string;
  totalJobs: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  avgDurationSeconds: number;
}

export interface ScrapeAnalyticsSummary {
  totalJobs: number;
  successRate: number;
  avgDurationSeconds: number;
  failedJobs: number;
  completedJobs: number;
  runningJobs: number;
}

export interface ScrapeAnalytics {
  dailyStats: DailyStats[];
  summary: ScrapeAnalyticsSummary;
}

async function fetchScrapeAnalytics(): Promise<ScrapeAnalytics> {
  const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
  
  const { data: jobs, error } = await supabase
    .from("scrape_jobs")
    .select("id, status, started_at, completed_at, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch scrape jobs: ${error.message}`);
  }

  // Group jobs by day
  const dailyMap = new Map<string, {
    date: string;
    jobs: typeof jobs;
  }>();

  // Initialize all 7 days
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateKey = format(date, "yyyy-MM-dd");
    dailyMap.set(dateKey, { date: dateKey, jobs: [] });
  }

  // Populate with actual jobs
  jobs?.forEach((job) => {
    const dateKey = format(new Date(job.created_at), "yyyy-MM-dd");
    const dayData = dailyMap.get(dateKey);
    if (dayData) {
      dayData.jobs.push(job);
    }
  });

  // Calculate daily stats
  const dailyStats: DailyStats[] = Array.from(dailyMap.values()).map(({ date, jobs: dayJobs }) => {
    const completed = dayJobs.filter((j) => j.status === "completed").length;
    const failed = dayJobs.filter((j) => j.status === "failed").length;
    const running = dayJobs.filter((j) => j.status === "running").length;
    const totalJobs = dayJobs.length;
    
    // Calculate success rate (completed / (completed + failed), ignoring running)
    const finishedJobs = completed + failed;
    const successRate = finishedJobs > 0 ? (completed / finishedJobs) * 100 : 0;

    // Calculate average duration for completed jobs
    const completedWithDuration = dayJobs.filter(
      (j) => j.status === "completed" && j.started_at && j.completed_at
    );
    
    let avgDurationSeconds = 0;
    if (completedWithDuration.length > 0) {
      const totalDuration = completedWithDuration.reduce((sum, j) => {
        const start = new Date(j.started_at!).getTime();
        const end = new Date(j.completed_at!).getTime();
        return sum + (end - start) / 1000;
      }, 0);
      avgDurationSeconds = totalDuration / completedWithDuration.length;
    }

    return {
      date,
      dateLabel: format(new Date(date), "MMM d"),
      totalJobs,
      completed,
      failed,
      running,
      successRate,
      avgDurationSeconds,
    };
  });

  // Calculate summary
  const allJobs = jobs || [];
  const totalCompleted = allJobs.filter((j) => j.status === "completed").length;
  const totalFailed = allJobs.filter((j) => j.status === "failed").length;
  const totalRunning = allJobs.filter((j) => j.status === "running").length;
  const totalFinished = totalCompleted + totalFailed;

  const completedWithDuration = allJobs.filter(
    (j) => j.status === "completed" && j.started_at && j.completed_at
  );
  
  let overallAvgDuration = 0;
  if (completedWithDuration.length > 0) {
    const totalDuration = completedWithDuration.reduce((sum, j) => {
      const start = new Date(j.started_at!).getTime();
      const end = new Date(j.completed_at!).getTime();
      return sum + (end - start) / 1000;
    }, 0);
    overallAvgDuration = totalDuration / completedWithDuration.length;
  }

  const summary: ScrapeAnalyticsSummary = {
    totalJobs: allJobs.length,
    successRate: totalFinished > 0 ? (totalCompleted / totalFinished) * 100 : 0,
    avgDurationSeconds: overallAvgDuration,
    failedJobs: totalFailed,
    completedJobs: totalCompleted,
    runningJobs: totalRunning,
  };

  return { dailyStats, summary };
}

export function useScrapeAnalytics() {
  return useQuery({
    queryKey: ["scrape-analytics", "7-days"],
    queryFn: fetchScrapeAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });
}
