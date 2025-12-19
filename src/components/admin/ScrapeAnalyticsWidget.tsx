import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrapeAnalytics } from "@/hooks/useScrapeAnalytics";
import { RefreshCw, TrendingUp, Clock, CheckCircle, XCircle, Activity, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return "text-green-500";
  if (rate >= 60) return "text-yellow-500";
  return "text-red-500";
}

function getSuccessRateBg(rate: number): string {
  if (rate >= 80) return "bg-green-500/10";
  if (rate >= 60) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

export function ScrapeAnalyticsWidget() {
  const { data, isLoading, error, refetch, isFetching } = useScrapeAnalytics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Scrape Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Scrape Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Failed to load analytics</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { dailyStats, summary } = data;
  const hasData = summary.totalJobs > 0;

  const chartConfig = {
    successRate: {
      label: "Success Rate",
      color: "hsl(var(--chart-1))",
    },
    avgDuration: {
      label: "Avg Duration",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <CardTitle>Scrape Analytics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Performance metrics for the past 7 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Total Jobs
            </div>
            <span className="text-2xl font-bold">{summary.totalJobs}</span>
          </div>
          
          <div className={`flex flex-col items-center p-4 rounded-lg ${getSuccessRateBg(summary.successRate)}`}>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Success Rate
            </div>
            <span className={`text-2xl font-bold ${getSuccessRateColor(summary.successRate)}`}>
              {summary.successRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4" />
              Avg Time
            </div>
            <span className="text-2xl font-bold">
              {formatDuration(summary.avgDurationSeconds)}
            </span>
          </div>
          
          <div className={`flex flex-col items-center p-4 rounded-lg ${summary.failedJobs > 0 ? "bg-red-500/10" : "bg-muted/50"}`}>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
              <XCircle className="w-4 h-4" />
              Failed
            </div>
            <span className={`text-2xl font-bold ${summary.failedJobs > 0 ? "text-red-500" : ""}`}>
              {summary.failedJobs}
            </span>
          </div>
        </div>

        {hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Rate Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Success Rate Trend</h4>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Success Rate"]}
                        />
                      }
                    />
                    <ReferenceLine
                      y={80}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label={{ value: "Target 80%", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Completion Time Chart */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Avg Completion Time</h4>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatDuration(value)}
                      className="text-muted-foreground"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [formatDuration(Number(value)), "Avg Duration"]}
                        />
                      }
                    />
                    <Bar
                      dataKey="avgDurationSeconds"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Daily Breakdown Table */}
        {hasData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Daily Breakdown</h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-center p-2 font-medium">Jobs</th>
                    <th className="text-center p-2 font-medium">Success</th>
                    <th className="text-center p-2 font-medium">Failed</th>
                    <th className="text-center p-2 font-medium">Avg Time</th>
                    <th className="text-right p-2 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.slice().reverse().map((day) => (
                    <tr key={day.date} className="border-t">
                      <td className="p-2">{day.dateLabel}</td>
                      <td className="text-center p-2">{day.totalJobs}</td>
                      <td className="text-center p-2 text-green-600">{day.completed}</td>
                      <td className="text-center p-2 text-red-600">{day.failed}</td>
                      <td className="text-center p-2">
                        {day.avgDurationSeconds > 0 ? formatDuration(day.avgDurationSeconds) : "-"}
                      </td>
                      <td className={`text-right p-2 font-medium ${getSuccessRateColor(day.successRate)}`}>
                        {day.totalJobs > 0 ? `${day.successRate.toFixed(0)}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="text-center py-8 text-muted-foreground">
            No scrape jobs in the past 7 days
          </div>
        )}
      </CardContent>
    </Card>
  );
}
