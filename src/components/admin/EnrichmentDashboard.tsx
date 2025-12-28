import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, FileText, Globe, BarChart3 } from 'lucide-react';
import { ColorExtractionPanel } from './ColorExtractionPanel';
import { TdsDiscoveryPanel } from './TdsDiscoveryPanel';
import { RegionalPricingPanel } from './RegionalPricingPanel';

// Data quality metrics (these would ideally come from a live query)
const DATA_QUALITY_METRICS = [
  { label: 'Color Hex', current: 4240, total: 5282, percent: 80.3 },
  { label: 'TDS URLs', current: 1967, total: 5282, percent: 37.2 },
  { label: 'EUR Price', current: 531, total: 5282, percent: 10.0 },
  { label: 'GBP Price', current: 193, total: 5282, percent: 3.7 },
  { label: 'CAD Price', current: 1040, total: 5282, percent: 19.7 },
  { label: 'AUD Price', current: 488, total: 5282, percent: 9.2 },
];

function MetricCard({ label, current, total, percent }: { label: string; current: number; total: number; percent: number }) {
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
  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Data Quality Overview</CardTitle>
          </div>
          <CardDescription>
            Current enrichment coverage across all filament products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {DATA_QUALITY_METRICS.map(metric => (
              <MetricCard key={metric.label} {...metric} />
            ))}
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
                Color Extraction
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Push Plastic: 0% → 90%+</li>
                <li>• Printed Solid: 10% → 90%+</li>
                <li>• Amolen: 25% → 90%+</li>
                <li>• SainSmart: 36% → 90%+</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                TDS Discovery
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 15 brands at 0% coverage</li>
                <li>• Target: 60%+ overall</li>
                <li>• Priority: Elegoo (1,127 products)</li>
                <li>• Uses Firecrawl for scraping</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Regional Pricing
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• EUR: 10% → 40%+</li>
                <li>• GBP: 3.7% → 25%+</li>
                <li>• 7 brands with regional stores</li>
                <li>• Price validation with FX ratios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
