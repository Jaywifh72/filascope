import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, ShoppingCart, Globe, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useAmazonMappingStats, useAmazonBrandCoverage } from '@/hooks/useAmazonMappings';
import { useAmazonSync } from '@/hooks/useAmazonSync';

const MARKETPLACES = [
  { value: 'all', label: 'All Marketplaces' },
  { value: 'US', label: '🇺🇸 US' },
  { value: 'UK', label: '🇬🇧 UK' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'BE', label: '🇧🇪 Belgium' },
];

export function AmazonSyncDashboard() {
  const { data: stats, isLoading: statsLoading } = useAmazonMappingStats();
  const { data: coverage, isLoading: coverageLoading } = useAmazonBrandCoverage();
  const { refreshPrices, isRefreshing, refreshProgress } = useAmazonSync();
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');

  const handleRefreshAll = () => {
    refreshPrices({
      marketplace: selectedMarketplace === 'all' ? undefined : selectedMarketplace,
      staleOnly: false,
    });
  };

  const handleRefreshStale = () => {
    refreshPrices({
      marketplace: selectedMarketplace === 'all' ? undefined : selectedMarketplace,
      staleOnly: true,
      staleDays: 7,
    });
  };

  const handleRefreshBrand = (brandSlug: string) => {
    refreshPrices({
      brandSlug,
      marketplace: selectedMarketplace === 'all' ? undefined : selectedMarketplace,
      staleOnly: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ASIN Mappings</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active product links</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marketplaces</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : Object.keys(stats?.byMarketplace || {}).length}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(stats?.byMarketplace || {}).map(([mp, count]) => (
                <Badge key={mp} variant="outline" className="text-[10px] px-1 py-0">
                  {mp}: {count as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {statsLoading ? '...' : stats?.byConfidence?.verified || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Human-verified mappings</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {statsLoading ? '...' : (stats?.byConfidence?.auto_low || 0) + (stats?.byConfidence?.auto_medium || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Auto-matched, unverified</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map(mp => (
                  <SelectItem key={mp.value} value={mp.value}>{mp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleRefreshStale} disabled={isRefreshing} variant="default">
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Import Amazon Links
            </Button>

            <Button onClick={handleRefreshAll} disabled={isRefreshing} variant="outline">
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Import All Marketplaces
            </Button>
          </div>

          {isRefreshing && refreshProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{refreshProgress.currentBatch}</span>
                <span>{refreshProgress.processed} / {refreshProgress.total}</span>
              </div>
              <Progress value={refreshProgress.total > 0 ? (refreshProgress.processed / refreshProgress.total) * 100 : 0} />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Prices updated: {refreshProgress.pricesUpdated}</span>
                <span>Errors: {refreshProgress.errors}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Coverage Table */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Brand Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          {coverageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !coverage?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No Amazon mappings yet. Use the Discovery tab to find products.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Brand</th>
                    <th className="pb-2 px-2 text-center">Filaments</th>
                    <th className="pb-2 px-2 text-center">Mapped</th>
                    <th className="pb-2 px-2 text-center">🇬🇧</th>
                    <th className="pb-2 px-2 text-center">🇩🇪</th>
                    <th className="pb-2 px-2 text-center">🇨🇦</th>
                    <th className="pb-2 px-2 text-center">🇦🇺</th>
                    <th className="pb-2 px-2 text-center">🇯🇵</th>
                    <th className="pb-2 px-2 text-center">Coverage</th>
                    <th className="pb-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.map((row: any) => (
                    <tr key={row.brand_id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="py-2 pr-4 font-medium">{row.brand_name}</td>
                      <td className="py-2 px-2 text-center text-muted-foreground">{row.total_filaments}</td>
                      <td className="py-2 px-2 text-center">{row.mapped_filaments || '-'}</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td className="py-2 px-2 text-center">
                        <Badge
                          variant={row.coverage_pct > 80 ? 'default' : row.coverage_pct > 30 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {row.coverage_pct || 0}%
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRefreshBrand(row.brand_name)}
                          disabled={isRefreshing || !row.mapped_filaments}
                          className="h-7 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Sync
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
