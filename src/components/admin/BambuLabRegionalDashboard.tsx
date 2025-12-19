import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useBambuRegionalStats, 
  useBambuMaterialBreakdown, 
  useBambuMissingData,
  useBambuSyncHistory,
  type RegionalCoverage 
} from "@/hooks/useBambuRegionalStats";
import { BambuDataQualitySection } from "./BambuDataQualitySection";
import { 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Globe, 
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Minus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const REGION_TABS = [
  { id: 'overview', label: 'Overview', flag: '🌍' },
  { id: 'US', label: 'US', flag: '🇺🇸' },
  { id: 'CA', label: 'CA', flag: '🇨🇦' },
  { id: 'UK', label: 'UK', flag: '🇬🇧' },
  { id: 'EU', label: 'EU', flag: '🇪🇺' },
  { id: 'AU', label: 'AU', flag: '🇦🇺' },
  { id: 'JP', label: 'JP', flag: '🇯🇵' },
];

function getCurrencySymbol(region: string): string {
  switch (region) {
    case 'US': return '$';
    case 'CA': return 'C$';
    case 'UK': return '£';
    case 'EU': return '€';
    case 'AU': return 'A$';
    case 'JP': return '¥';
    default: return '$';
  }
}

function getFreshnessBadge(lastUpdated: string | null) {
  if (!lastUpdated) {
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Never</Badge>;
  }
  
  const date = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Fresh</Badge>;
  } else if (hoursDiff < 168) { // 7 days
    return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Stale</Badge>;
  } else {
    return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Outdated</Badge>;
  }
}

function RegionOverviewCard({ region }: { region: RegionalCoverage }) {
  const coverageColor = region.coverage >= 80 ? 'text-green-600' : region.coverage >= 50 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{region.flag}</span>
        <Badge variant="outline">{region.region}</Badge>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${coverageColor}`}>{region.coverage}%</span>
          <span className="text-xs text-muted-foreground">{region.withPrice}/{region.total}</span>
        </div>
        <Progress value={region.coverage} className="h-2" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {region.coverage >= 80 ? (
          <CheckCircle className="w-3 h-3 text-green-500" />
        ) : region.coverage >= 50 ? (
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
        ) : (
          <XCircle className="w-3 h-3 text-red-500" />
        )}
        {region.lastUpdated ? formatDistanceToNow(new Date(region.lastUpdated), { addSuffix: true }) : 'Never synced'}
      </div>
    </div>
  );
}

function RegionDetailPanel({ regionId }: { regionId: string }) {
  const { data: materialBreakdown, isLoading: loadingMaterials } = useBambuMaterialBreakdown(regionId);
  const currencySymbol = getCurrencySymbol(regionId);
  
  if (loadingMaterials) {
    return <div className="text-center py-8 text-muted-foreground">Loading material breakdown...</div>;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Package className="w-4 h-4" />
        Material Breakdown
      </h4>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Material</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Has Price</TableHead>
              <TableHead className="text-center">In Stock</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
              <TableHead className="text-right">Freshness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialBreakdown?.map(mat => (
              <TableRow key={mat.material}>
                <TableCell className="font-medium">{mat.material}</TableCell>
                <TableCell className="text-center">{mat.total}</TableCell>
                <TableCell className="text-center">
                  <span className={mat.hasPrice === mat.total ? 'text-green-600' : mat.hasPrice > 0 ? 'text-yellow-600' : 'text-red-600'}>
                    {mat.hasPrice}
                  </span>
                  {mat.hasPrice === mat.total && <CheckCircle className="w-3 h-3 inline ml-1 text-green-500" />}
                </TableCell>
                <TableCell className="text-center">
                  {mat.inStock > 0 ? (
                    <span className="text-green-600">{mat.inStock}/{mat.total}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {mat.avgPrice ? `${currencySymbol}${mat.avgPrice.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {getFreshnessBadge(mat.lastUpdated)}
                </TableCell>
              </TableRow>
            ))}
            {(!materialBreakdown || materialBreakdown.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No material data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MissingDataSection({ regionId }: { regionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: missingData, isLoading } = useBambuMissingData(regionId);
  
  const itemCount = missingData?.length || 0;
  
  if (isLoading) return null;
  if (itemCount === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">Missing Regional Data</span>
            <Badge variant="secondary">{itemCount} items</Badge>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Product</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Missing Regions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missingData?.slice(0, 50).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">
                    {item.productTitle}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.material}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {item.missingRegions.map(r => {
                        const region = REGION_TABS.find(rt => rt.id === r);
                        return (
                          <span key={r} className="text-lg" title={r}>
                            {region?.flag || r}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {itemCount > 50 && (
            <div className="text-center py-2 text-xs text-muted-foreground border-t">
              Showing 50 of {itemCount} items
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SyncHistorySection() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: syncHistory, isLoading } = useBambuSyncHistory();

  if (isLoading || !syncHistory?.length) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Recent Sync History</span>
            <Badge variant="secondary">{syncHistory.length} entries</Badge>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg max-h-48 overflow-y-auto divide-y">
          {syncHistory.map(sync => (
            <div key={sync.id} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {sync.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : sync.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                <div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(new Date(sync.startedAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sync.durationSeconds ? `${sync.durationSeconds.toFixed(1)}s` : 'In progress'}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-600">+{sync.productsCreated}</span>
                <span className="text-blue-600">↻{sync.productsUpdated}</span>
                {sync.productsFailed > 0 && (
                  <span className="text-red-600">✗{sync.productsFailed}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function BambuLabRegionalDashboard() {
  const [selectedRegion, setSelectedRegion] = useState('overview');
  const { data: stats, isLoading, refetch, isRefetching } = useBambuRegionalStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Bambu Lab Regional Data Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading regional statistics...
        </CardContent>
      </Card>
    );
  }

  const selectedRegionData = stats?.regions.find(r => r.region === selectedRegion);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Bambu Lab Regional Data Dashboard
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Total Filaments</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats?.freshCount || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Fresh (&lt;24h)</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{stats?.staleCount || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Stale (1-7d)</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{stats?.outdatedCount || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Outdated (&gt;7d)</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Minus className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats?.neverSyncedCount || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Never Synced</div>
          </div>
        </div>

        {/* Region Tabs */}
        <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
          <TabsList className="grid grid-cols-7 w-full">
            {REGION_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                <span className="mr-1">{tab.flag}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">Regional Coverage Overview</span>
              <Badge variant="outline">{stats?.overallCoverage || 0}% avg</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stats?.regions.map(region => (
                <RegionOverviewCard key={region.region} region={region} />
              ))}
            </div>

            {/* Data Quality Diagnostics */}
            <BambuDataQualitySection />

            <MissingDataSection regionId="overview" />
            <SyncHistorySection />
          </TabsContent>

          {/* Individual Region Tabs */}
          {REGION_TABS.filter(t => t.id !== 'overview').map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4 mt-4">
              {selectedRegionData && (
                <>
                  {/* Region Header Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Price Coverage</span>
                        <Badge variant={selectedRegionData.coverage >= 80 ? "default" : "secondary"}>
                          {selectedRegionData.coverage}%
                        </Badge>
                      </div>
                      <Progress value={selectedRegionData.coverage} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedRegionData.withPrice} of {selectedRegionData.total} products
                      </div>
                    </div>
                    
                    <div className="bg-green-500/10 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">In Stock</div>
                      <div className="text-2xl font-bold text-green-600">{selectedRegionData.inStock}</div>
                    </div>
                    
                    <div className="bg-red-500/10 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Out of Stock</div>
                      <div className="text-2xl font-bold text-red-600">{selectedRegionData.outOfStock}</div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">Last Updated</div>
                      <div className="text-sm font-medium">
                        {selectedRegionData.lastUpdated 
                          ? formatDistanceToNow(new Date(selectedRegionData.lastUpdated), { addSuffix: true })
                          : 'Never'
                        }
                      </div>
                      {getFreshnessBadge(selectedRegionData.lastUpdated)}
                    </div>
                  </div>

                  <RegionDetailPanel regionId={tab.id} />
                  <MissingDataSection regionId={tab.id} />
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Last Update Footer */}
        {stats?.lastRegionalUpdate && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last regional data update: {formatDistanceToNow(new Date(stats.lastRegionalUpdate), { addSuffix: true })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
