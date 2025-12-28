import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, FileText, Globe, BarChart3, RefreshCw } from 'lucide-react';
import { ColorExtractionPanel } from './ColorExtractionPanel';
import { TdsDiscoveryPanel } from './TdsDiscoveryPanel';
import { RegionalPricingPanel } from './RegionalPricingPanel';
import { useEnrichmentMetrics } from '@/hooks/useEnrichmentMetrics';

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
  const { overall, lowColorBrands, lowTdsBrands, regionalBrands, isLoading, refresh, isFetching } = useEnrichmentMetrics();

  const metrics = overall ? [
    { label: 'Color Hex', current: overall.withColorHex, total: overall.total, percent: overall.total > 0 ? (overall.withColorHex / overall.total) * 100 : 0 },
    { label: 'TDS URLs', current: overall.withTds, total: overall.total, percent: overall.total > 0 ? (overall.withTds / overall.total) * 100 : 0 },
    { label: 'EUR Price', current: overall.withEur, total: overall.total, percent: overall.total > 0 ? (overall.withEur / overall.total) * 100 : 0 },
    { label: 'GBP Price', current: overall.withGbp, total: overall.total, percent: overall.total > 0 ? (overall.withGbp / overall.total) * 100 : 0 },
    { label: 'CAD Price', current: overall.withCad, total: overall.total, percent: overall.total > 0 ? (overall.withCad / overall.total) * 100 : 0 },
    { label: 'AUD Price', current: overall.withAud, total: overall.total, percent: overall.total > 0 ? (overall.withAud / overall.total) * 100 : 0 },
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

      {/* Enrichment Tabs */}
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="tds" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            TDS
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Regional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4">
          <ColorExtractionPanel />
        </TabsContent>

        <TabsContent value="tds" className="mt-4">
          <TdsDiscoveryPanel />
        </TabsContent>

        <TabsContent value="regional" className="mt-4">
          <RegionalPricingPanel />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enrichment Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Extraction ({lowColorBrands.length} brands &lt;90%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowColorBrands.slice(0, 4).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.colorCoverage}% → 90%+</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                TDS Discovery ({lowTdsBrands.length} brands &lt;50%)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  lowTdsBrands.slice(0, 4).map(b => (
                    <li key={b.brandSlug}>• {b.brandName} ({b.totalProducts} products)</li>
                  ))
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Regional Pricing ({regionalBrands.length} brands)
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {isLoading ? (
                  <li><Skeleton className="h-4 w-32" /></li>
                ) : (
                  regionalBrands.slice(0, 4).map(b => (
                    <li key={b.brandSlug}>• {b.brandName}: {b.supportedRegions.join(', ')}</li>
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
