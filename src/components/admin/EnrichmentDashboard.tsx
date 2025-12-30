import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, FileText, Globe, BarChart3, RefreshCw, History, CheckCircle2, Clock, Zap, Image, FileSearch, Link2, Sun } from 'lucide-react';
import { ColorExtractionPanel } from './ColorExtractionPanel';
import { TdsDiscoveryPanel } from './TdsDiscoveryPanel';
import { TdsParsingPanel } from './TdsParsingPanel';
import { RegionalPricingPanel } from './RegionalPricingPanel';
import { ImageEnrichmentPanel } from './ImageEnrichmentPanel';
import { EnrichmentHistory } from './EnrichmentHistory';
import { ManualTdsScraper } from './ManualTdsScraper';
import { TdReviewPanel } from './TdReviewPanel';
import { TdCoverageWidget } from './TdCoverageWidget';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';
import { useEnrichmentHistory } from '@/hooks/useEnrichmentHistory';
import { formatDistanceToNow } from 'date-fns';

function MetricCard({ 
  label, 
  current, 
  total, 
  percent,
  isLoading 
}: { 
  label: string; 
  current: number; 
  total: number; 
  percent: number;
  isLoading?: boolean;
}) {
  const getColor = (p: number) => {
    if (p >= 80) return 'text-green-600';
    if (p >= 50) return 'text-yellow-600';
    if (p >= 20) return 'text-orange-500';
    return 'text-destructive';
  };

  const getBgColor = (p: number) => {
    if (p >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (p >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (p >= 20) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (isLoading) {
    return (
      <div className="p-3 rounded-lg bg-muted">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-6 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg ${getBgColor(percent)}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${getColor(percent)}`}>{percent.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">
        {current.toLocaleString()} / {total.toLocaleString()}
      </p>
    </div>
  );
}

export function EnrichmentDashboard() {
  const { overall, lowColorBrands, lowTdsBrands, lowImageBrands, lowParsingBrands, regionalBrands, isLoading, refresh, isFetching } = useEnrichmentMetrics();
  const { summary: historySummary, isLoading: historyLoading } = useEnrichmentHistory();

  const metrics = overall ? [
    { label: 'Images', current: overall.withImage, total: overall.total, percent: overall.total > 0 ? (overall.withImage / overall.total) * 100 : 0 },
    { label: 'Color Hex', current: overall.withColorHex, total: overall.total, percent: overall.total > 0 ? (overall.withColorHex / overall.total) * 100 : 0 },
    { label: 'TDS URLs', current: overall.withTds, total: overall.total, percent: overall.total > 0 ? (overall.withTds / overall.total) * 100 : 0 },
    { label: 'TDS Parsed', current: overall.withFullParsing, total: overall.withTds, percent: overall.withTds > 0 ? (overall.withFullParsing / overall.withTds) * 100 : 0 },
    { label: 'EUR Price', current: overall.withEur, total: overall.total, percent: overall.total > 0 ? (overall.withEur / overall.total) * 100 : 0 },
    { label: 'GBP Price', current: overall.withGbp, total: overall.total, percent: overall.total > 0 ? (overall.withGbp / overall.total) * 100 : 0 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>Data Quality Overview</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Current enrichment coverage across {overall?.total.toLocaleString() || '...'} filament products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <MetricCard key={i} label="" current={0} total={0} percent={0} isLoading />
              ))
            ) : (
              metrics.map(metric => (
                <MetricCard key={metric.label} {...metric} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{historyLoading ? '...' : historySummary.operationsToday}</p>
              <p className="text-xs text-muted-foreground">Operations Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{historyLoading ? '...' : `${historySummary.successRate.toFixed(0)}%`}</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{historyLoading ? '...' : historySummary.productsEnrichedToday.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Products Enriched Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {historyLoading ? '...' : historySummary.lastColorRun 
                  ? formatDistanceToNow(new Date(historySummary.lastColorRun), { addSuffix: true })
                  : 'Never'}
              </p>
              <p className="text-xs text-muted-foreground">Last Color Sync</p>
            </div>
          </div>
        </Card>
        <TdCoverageWidget />
      </div>

      {/* Enrichment Tabs */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-8 max-w-4xl">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="tds" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            TDS
          </TabsTrigger>
          <TabsTrigger value="tds-parsing" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Parse
          </TabsTrigger>
          <TabsTrigger value="manual-scraper" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Scraper
          </TabsTrigger>
          <TabsTrigger value="td-review" className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            TD Review
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4">
          <ImageEnrichmentPanel />
        </TabsContent>

        <TabsContent value="colors" className="mt-4">
          <ColorExtractionPanel />
        </TabsContent>

        <TabsContent value="tds" className="mt-4">
          <TdsDiscoveryPanel />
        </TabsContent>

        <TabsContent value="tds-parsing" className="mt-4">
          <TdsParsingPanel />
        </TabsContent>

        <TabsContent value="manual-scraper" className="mt-4">
          <ManualTdsScraper />
        </TabsContent>

        <TabsContent value="td-review" className="mt-4">
          <TdReviewPanel />
        </TabsContent>

        <TabsContent value="regional" className="mt-4">
          <RegionalPricingPanel />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <EnrichmentHistory />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enrichment Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                Images ({lowImageBrands.length} brands &lt;90%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowImageBrands.slice(0, 3).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.imageCoverage}%</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors ({lowColorBrands.length} brands &lt;90%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowColorBrands.slice(0, 3).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.colorCoverage}%</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                TDS ({lowTdsBrands.length} brands &lt;50%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowTdsBrands.slice(0, 3).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.tdsCoverage}%</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                Parsing ({lowParsingBrands.length} brands &lt;80%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowParsingBrands.slice(0, 3).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.parsingCoverage}%</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Regional ({regionalBrands.length} brands)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  regionalBrands.slice(0, 3).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}</li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
