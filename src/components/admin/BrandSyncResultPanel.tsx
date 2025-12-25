import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  SkipForward, 
  Image, 
  DollarSign, 
  FileText, 
  Palette, 
  Barcode,
  Settings2,
  Clock,
  Package
} from "lucide-react";
import { BrandSyncResult, SyncProductResult, RegionSyncResult } from "@/types/brand-sync";
import { formatDistanceToNow } from "date-fns";

interface BrandSyncResultPanelProps {
  result: BrandSyncResult;
}

const ACTION_CONFIG = {
  created: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  updated: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  skipped: { icon: SkipForward, color: 'text-muted-foreground', bg: 'bg-muted' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

function FieldIndicator({ hasField, icon: Icon, label }: { hasField: boolean; icon: React.ElementType; label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`p-1 rounded ${hasField ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/30'}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {hasField ? 'Found' : 'Missing'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ProductRow({ product }: { product: SyncProductResult }) {
  const config = ACTION_CONFIG[product.action];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className={`p-1 rounded ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.title}</p>
        <p className="text-xs text-muted-foreground">
          ID: {product.productId}
          {product.region && <span className="ml-2">• {product.region}</span>}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <FieldIndicator hasField={product.fields.image} icon={Image} label="Image" />
        <FieldIndicator hasField={product.fields.price} icon={DollarSign} label="Price" />
        <FieldIndicator hasField={product.fields.tds} icon={FileText} label="TDS" />
        <FieldIndicator hasField={product.fields.colorHex} icon={Palette} label="Color" />
        <FieldIndicator hasField={product.fields.mpn} icon={Barcode} label="MPN" />
        <FieldIndicator hasField={product.fields.specifications} icon={Settings2} label="Specs" />
      </div>

      {product.price !== undefined && (
        <div className="text-sm font-medium tabular-nums">
          ${product.price.toFixed(2)}
        </div>
      )}

      <Badge variant="outline" className={`${config.bg} ${config.color} border-0 text-xs`}>
        {product.action}
      </Badge>
    </div>
  );
}

function RegionTab({ region }: { region: RegionSyncResult }) {
  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      <div className="text-center">
        <p className="text-2xl font-bold">{region.productsFound}</p>
        <p className="text-xs text-muted-foreground">Found</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">{region.created}</p>
        <p className="text-xs text-muted-foreground">Created</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">{region.updated}</p>
        <p className="text-xs text-muted-foreground">Updated</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-muted-foreground">{region.skipped}</p>
        <p className="text-xs text-muted-foreground">Skipped</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-destructive">{region.errors}</p>
        <p className="text-xs text-muted-foreground">Errors</p>
      </div>
    </div>
  );
}

function FieldCoverageBar({ label, count, percent, icon: Icon }: { 
  label: string; 
  count: number; 
  percent: number;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="font-medium">{count} ({percent}%)</span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}

export function BrandSyncResultPanel({ result }: BrandSyncResultPanelProps) {
  const hasRegions = result.regionBreakdown && result.regionBreakdown.length > 0;
  const total = result.summary.totalDiscovered;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Sync Results
            {result.dryRun && (
              <Badge variant="outline" className="ml-2">Dry Run</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {Math.round(result.duration_ms / 1000)}s
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">Discovered</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{result.summary.created}</p>
            <p className="text-sm text-muted-foreground">Created</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{result.summary.updated}</p>
            <p className="text-sm text-muted-foreground">Updated</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{result.summary.skipped}</p>
            <p className="text-sm text-muted-foreground">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-destructive">{result.summary.errors}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
        </div>

        {/* Field Coverage */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Field Coverage</h4>
          <div className="grid grid-cols-2 gap-4">
            <FieldCoverageBar 
              label="Images" 
              count={result.fieldCoverage.images.count} 
              percent={result.fieldCoverage.images.percent}
              icon={Image}
            />
            <FieldCoverageBar 
              label="Prices" 
              count={result.fieldCoverage.prices.count} 
              percent={result.fieldCoverage.prices.percent}
              icon={DollarSign}
            />
            <FieldCoverageBar 
              label="TDS" 
              count={result.fieldCoverage.tds.count} 
              percent={result.fieldCoverage.tds.percent}
              icon={FileText}
            />
            <FieldCoverageBar 
              label="Colors" 
              count={result.fieldCoverage.colors.count} 
              percent={result.fieldCoverage.colors.percent}
              icon={Palette}
            />
            <FieldCoverageBar 
              label="MPN" 
              count={result.fieldCoverage.mpn.count} 
              percent={result.fieldCoverage.mpn.percent}
              icon={Barcode}
            />
            <FieldCoverageBar 
              label="Specs" 
              count={result.fieldCoverage.specifications.count} 
              percent={result.fieldCoverage.specifications.percent}
              icon={Settings2}
            />
          </div>
        </div>

        {/* Region Breakdown (if applicable) */}
        {hasRegions && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Regional Breakdown</h4>
            <Tabs defaultValue={result.regionBreakdown![0].region}>
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                {result.regionBreakdown!.map(region => (
                  <TabsTrigger key={region.region} value={region.region} className="text-xs">
                    {region.region} ({region.currency})
                  </TabsTrigger>
                ))}
              </TabsList>
              {result.regionBreakdown!.map(region => (
                <TabsContent key={region.region} value={region.region}>
                  <RegionTab region={region} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Products ({result.products.length})</h4>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-600 border-0">
                Created: {result.products.filter(p => p.action === 'created').length}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-0">
                Updated: {result.products.filter(p => p.action === 'updated').length}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="h-[300px] rounded-lg border">
            <div className="divide-y">
              {result.products.map((product, idx) => (
                <ProductRow key={`${product.productId}-${idx}`} product={product} />
              ))}
              {result.products.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No products processed
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
