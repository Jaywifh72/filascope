import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, MousePointerClick, Eye, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useModulePerformance } from '@/hooks/useModulePerformance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MODULE_ICONS: Record<string, string> = {
  deals: '🔥',
  trending: '📈',
  safety: '⚠️',
  recent: '👁️',
  watchlist: '❤️',
  contextual: '🎯',
  tips: '💡',
};

export default function AdminModuleAnalytics() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('7days');
  
  const { moduleMetrics, dailyTrends, topContent, summary, isLoading } = useModulePerformance(dateRange);
  
  // Transform daily trends for chart
  const chartData = dailyTrends.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing[item.module_name] = item.total_clicks;
    } else {
      acc.push({
        date: item.date,
        [item.module_name]: item.total_clicks,
      });
    }
    return acc;
  }, [] as Record<string, unknown>[]);
  
  const moduleColors: Record<string, string> = {
    deals: '#f97316',
    trending: '#22c55e',
    safety: '#ef4444',
    recent: '#3b82f6',
    watchlist: '#ec4899',
    contextual: '#8b5cf6',
    tips: '#eab308',
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Module Analytics</h1>
            <p className="text-muted-foreground">Track engagement and performance across sidebar modules</p>
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <MousePointerClick className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">{summary.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg CTR</p>
                  <p className="text-2xl font-bold">{summary.avgCTR.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">{summary.totalConversions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Engagement Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {Object.keys(moduleColors).map(module => (
                    <Line
                      key={module}
                      type="monotone"
                      dataKey={module}
                      stroke={moduleColors[module]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Module Performance Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Module Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Avg Time</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading metrics...
                      </TableCell>
                    </TableRow>
                  ) : moduleMetrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No data available for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    moduleMetrics.map((module, index) => (
                      <TableRow key={module.module_name}>
                        <TableCell className="font-medium">
                          <span className="mr-2">{MODULE_ICONS[module.module_name] || '📦'}</span>
                          {module.module_name}
                          {index === 0 && (
                            <Badge className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
                              Top
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{module.total_views.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{module.total_clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={module.click_through_rate >= 5 ? 'text-green-500' : module.click_through_rate >= 2 ? 'text-amber-500' : 'text-red-500'}>
                            {module.click_through_rate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {(module.avg_time_spent_ms / 1000).toFixed(1)}s
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {module.engagement_score.toFixed(0)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Top Performing Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topContent.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No content data available
                  </p>
                ) : (
                  topContent.map((item, index) => (
                    <div key={`${item.entity_id}-${index}`} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.entity_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {MODULE_ICONS[item.module_name]} {item.module_name} • {item.entity_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.clicks} clicks</p>
                        {item.conversions > 0 && (
                          <p className="text-xs text-green-500">{item.conversions} conv</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Revenue Attribution */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {moduleMetrics.slice(0, 4).map(module => (
                <div key={module.module_name} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{MODULE_ICONS[module.module_name]}</span>
                    <span className="font-medium capitalize">{module.module_name}</span>
                  </div>
                  <p className="text-2xl font-bold">${module.conversion_value.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {module.conversions} conversions • {module.total_clicks} clicks
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${Math.min((module.engagement_score / (moduleMetrics[0]?.engagement_score || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground">Total Estimated Revenue</p>
              <p className="text-3xl font-bold text-primary">${summary.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Based on affiliate click estimates</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
