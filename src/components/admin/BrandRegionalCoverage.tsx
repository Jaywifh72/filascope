import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, DollarSign, Link, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useBrandRegionalCoverage, type RegionalCoverageStats } from "@/hooks/useBrandRegionalCoverage";
import { REGION_FLAGS, REGION_CURRENCIES, REGION_NAMES, type RegionCode } from "@/lib/brandRegionalAvailability";
import { formatDistanceToNow } from "date-fns";

interface BrandRegionalCoverageProps {
  brandSlug: string;
}

function CoverageCell({ percent, count, total }: { percent: number; count: number; total: number }) {
  const colorClass = percent >= 80 
    ? 'text-green-600 dark:text-green-400' 
    : percent >= 50 
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${colorClass}`}>{percent}%</span>
        <span className="text-xs text-muted-foreground">({count}/{total})</span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

function RegionRow({ stat }: { stat: RegionalCoverageStats }) {
  const flag = REGION_FLAGS[stat.region];
  const currency = REGION_CURRENCIES[stat.region];
  const name = REGION_NAMES[stat.region];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <div>
            <p className="font-medium">{stat.region}</p>
            <p className="text-xs text-muted-foreground">{name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{currency}</Badge>
      </TableCell>
      <TableCell>
        <CoverageCell percent={stat.pricePercent} count={stat.withPrice} total={stat.productCount} />
      </TableCell>
      <TableCell>
        <CoverageCell percent={stat.urlPercent} count={stat.withUrl} total={stat.productCount} />
      </TableCell>
      <TableCell>
        {stat.lastSyncedAt ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(stat.lastSyncedAt), { addSuffix: true })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function BrandRegionalCoverage({ brandSlug }: BrandRegionalCoverageProps) {
  const { data: coverage, isLoading } = useBrandRegionalCoverage(brandSlug);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!coverage) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No coverage data available</p>
        </CardContent>
      </Card>
    );
  }

  const hasGoodCoverage = coverage.overallCoverage.avgPricePercent >= 80;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{coverage.displayName} Regional Coverage</CardTitle>
              <CardDescription>
                {coverage.totalProducts} products across {coverage.supportedRegions.length} regions
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGoodCoverage ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Good Coverage
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coverage.overallCoverage.avgPricePercent}%</p>
              <p className="text-xs text-muted-foreground">Avg Price Coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coverage.overallCoverage.avgUrlPercent}%</p>
              <p className="text-xs text-muted-foreground">Avg URL Coverage</p>
            </div>
          </div>
        </div>

        {/* Regional Breakdown Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Price Coverage</TableHead>
                <TableHead>URL Coverage</TableHead>
                <TableHead>Last Synced</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverage.regionalStats.map(stat => (
                <RegionRow key={stat.region} stat={stat} />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Supported Regions Quick View */}
        <div className="flex flex-wrap gap-2">
          {coverage.supportedRegions.map(region => (
            <Badge key={region} variant="secondary" className="text-xs">
              {REGION_FLAGS[region]} {region}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
