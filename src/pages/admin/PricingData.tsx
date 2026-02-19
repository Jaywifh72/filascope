import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageLoadingSkeleton } from '@/components/skeletons/PageLoadingSkeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, Search, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Loader2, Play, Zap, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Download, ChevronRight, ChevronDown, ChevronsUpDown, Palette, Link2, Bot, Copy, RotateCcw, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { downloadCSV } from '@/lib/csvExport';
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';

// =============================================
// Diagnosis types
// =============================================

interface DiagnosisItem {
  pattern: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  diagnosis: string;
  suggestedFix: string;
  suggestedPrompt: string;
  affectedProducts: string[];
  isTransient: boolean;
  contextualPromptParts?: {
    errorPattern: string;
    edgeFunctionName: string;
    failureDetails: Array<{
      product: string;
      region: string;
      url: string;
      error: string;
      statusCode?: number;
      latencyMs?: number;
      brand: string;
    }>;
  };
}

function generateLovablePrompt(d: DiagnosisItem): string {
  if (!d.contextualPromptParts) return d.suggestedPrompt;

  const details = d.contextualPromptParts.failureDetails;
  const affectedList = details
    .map(f => `- **${f.product}** (${f.region}): URL=\`${f.url}\`, Error="${f.error}", HTTP=${f.statusCode || 'N/A'}, Latency=${f.latencyMs || 'N/A'}ms`)
    .join('\n');

  const edgeFunction = d.contextualPromptParts.edgeFunctionName || 'get-current-price';

  return `## Fix: ${d.pattern} (${d.count} affected)

### Problem
The \`${edgeFunction}\` edge function is producing "${d.pattern}" errors for ${d.count} product(s).
**Severity:** ${d.severity}
**Error classification:** ${d.diagnosis}

### Affected Products
${affectedList}

### Current Behavior
${d.diagnosis}

### Expected Behavior
All affected products should sync successfully with valid price extraction.

### Suggested Fix Direction
${d.suggestedFix}

### Files Likely Involved
- \`supabase/functions/${edgeFunction}/index.ts\` — the edge function performing price sync
- \`supabase/functions/diagnose-sync-failures/index.ts\` — the diagnosis engine (may need new pattern)
- \`src/pages/admin/PricingData.tsx\` — the admin UI displaying results

Please investigate the root cause in the edge function and implement a fix. If this is a data issue (wrong URLs, discontinued products), suggest the appropriate data cleanup instead.`;
}

interface DiagnosisResult {
  summary: string;
  diagnoses: DiagnosisItem[];
  overallHealth: 'good' | 'fair' | 'poor';
}

// =============================================
// Types
// =============================================

type LinkStatus = 'active' | 'stale' | 'broken' | 'failed' | 'alert' | 'unknown';

interface TestResult {
  status: 'testing' | 'ok' | 'broken' | 'redirect' | 'timeout' | 'geo_restricted';
  statusCode?: number;
  latencyMs?: number;
  redirectUrl?: string | null;
  error?: string;
  fetchMethod?: 'direct' | 'spoofed' | 'redirected';
  isGeoRedirected?: boolean;
  isKnownGeoRedirect?: boolean;
}

interface SyncResult {
  status: 'syncing' | 'success' | 'failed' | 'unchanged' | 'unavailable';
  oldPrice?: number;
  newPrice?: number;
  percentChange?: number;
  error?: string;
  source?: string;
  location?: string;
  currencyMismatch?: boolean;
  detectedCurrency?: string;
  requestedCurrency?: string;
}

/** One store entry (region) for a product group */
interface StoreRow {
  /** Unique key: `${productLineId}::${region}` */
  storeKey: string;
  productLineId: string;
  /** Representative filament ID for this group (used for price sync RPC) */
  representativeId: string;
  /** All filament IDs in this product group */
  allFilamentIds: string[];
  region: string;
  regionFlag: string;
  storeName: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  currencySymbol: string;
  productUrl: string | null;
  isDerived?: boolean;
  lastScrapedAt: string | null;
  linkStatus: LinkStatus;
  priceChange: { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number } | null;
  netWeightG: number | null;
}

/** Parent product group (grouped by product_line_id) */
interface ProductGroup {
  productLineId: string;
  /** Representative filament ID */
  representativeId: string;
  productTitle: string;
  /** Clean product name (without color suffix) */
  cleanName: string;
  vendor: string;
  material: string | null;
  variantCount: number;
  colorCount: number;
  colorHexes: string[];
  /** All filament IDs in the group */
  allFilamentIds: string[];
  stores: StoreRow[];
  /** Price range */
  minPrice: number | null;
  maxPrice: number | null;
  hasPriceRange: boolean;
  /** Summary counts */
  activeCount: number;
  staleCount: number;
  brokenCount: number;
  alertCount: number;
}

// =============================================
// Region config
// =============================================

const REGION_CONFIG: Record<string, { flag: string; currency: string; symbol: string; label: string }> = {
  US: { flag: '🇺🇸', currency: 'USD', symbol: '$', label: 'US' },
  CA: { flag: '🇨🇦', currency: 'CAD', symbol: 'C$', label: 'CA' },
  UK: { flag: '🇬🇧', currency: 'GBP', symbol: '£', label: 'UK' },
  EU: { flag: '🇪🇺', currency: 'EUR', symbol: '€', label: 'EU' },
  AU: { flag: '🇦🇺', currency: 'AUD', symbol: 'A$', label: 'AU' },
  JP: { flag: '🇯🇵', currency: 'JPY', symbol: '¥', label: 'JP' },
};

const REGION_FIELD_MAP: { region: string; priceField: string; urlField: string }[] = [
  { region: 'US', priceField: 'variant_price', urlField: 'product_url' },
  { region: 'CA', priceField: 'price_cad', urlField: 'product_url_ca' },
  { region: 'UK', priceField: 'price_gbp', urlField: 'product_url_uk' },
  { region: 'EU', priceField: 'price_eur', urlField: 'product_url_eu' },
  { region: 'AU', priceField: 'price_aud', urlField: 'product_url_au' },
  { region: 'JP', priceField: 'price_jpy', urlField: 'product_url_jp' },
];

// =============================================
// Brand regional URL derivation configs
// =============================================

type SubdomainConfig = { pattern: 'subdomain'; baseDomain: string; regions: Record<string, { subdomain?: string; domain?: string }> };
type PathConfig = { pattern: 'path'; baseUrl: string; regions: Record<string, string> };
type BrandRegionalConfig = SubdomainConfig | PathConfig;

const BRAND_REGIONAL_CONFIGS: Record<string, BrandRegionalConfig> = {
  'Bambu Lab':    { pattern: 'subdomain', baseDomain: 'store.bambulab.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' }, JP: { subdomain: 'jp' } } },
  'Polymaker':    { pattern: 'subdomain', baseDomain: 'polymaker.com', regions: { CA: { subdomain: 'ca' } } }, // EU store shut down Feb 2026
  'Elegoo':       { pattern: 'subdomain', baseDomain: 'elegoo.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { subdomain: 'au' } } },
  'Anycubic':     { pattern: 'subdomain', baseDomain: 'anycubic.com', regions: { CA: { subdomain: 'ca' }, UK: { subdomain: 'uk' }, EU: { subdomain: 'eu' }, AU: { domain: 'www.anycubic.au' } } },
  // Creality uses PATH-based regional URLs, not subdomains:
  // store.creality.com/products/slug → store.creality.com/ca/products/slug
  'Creality':     { pattern: 'path', baseUrl: 'https://store.creality.com', regions: { CA: 'ca', UK: 'uk', EU: 'eu', AU: 'au', JP: 'jp' } },
};

function deriveRegionalUrl(usUrl: string, vendor: string, region: string): string | null {
  const config = BRAND_REGIONAL_CONFIGS[vendor];
  if (!config) return null;

  try {
    if (config.pattern === 'path') {
      // Path-based: insert region prefix into the path
      // e.g. https://store.creality.com/products/slug → https://store.creality.com/ca/products/slug
      const regionPath = config.regions[region];
      if (!regionPath) return null;
      const urlObj = new URL(usUrl);
      // Ensure we're on the correct base domain
      if (!urlObj.hostname.includes('creality.com')) return null;
      // Strip any existing region prefix to avoid double-prefixing
      const cleanPath = urlObj.pathname.replace(/^\/(ca|uk|eu|au|jp|us)\//, '/');
      return `${config.baseUrl}/${regionPath}${cleanPath}`.replace(/[?#].*$/, '');
    } else {
      // Subdomain-based
      if (!config.regions[region]) return null;
      const urlObj = new URL(usUrl);
      const regionConfig = config.regions[region];
      if (regionConfig.domain) {
        urlObj.hostname = regionConfig.domain;
      } else if (regionConfig.subdomain) {
        const parts = urlObj.hostname.split('.');
        if (parts.length >= 3) parts[0] = regionConfig.subdomain;
        else parts.unshift(regionConfig.subdomain);
        urlObj.hostname = parts.join('.');
      }
      return urlObj.toString().replace(/[?#].*$/, '');
    }
  } catch { return null; }
}

// =============================================
// Helper: strip color suffix from product names
// =============================================

const COLOR_SUFFIXES_RE = /\s*-\s*(Black|White|Red|Blue|Green|Yellow|Orange|Gray|Grey|Silver|Gold|Purple|Pink|Brown|Clear|Natural|Transparent|Matte|Silk|Rainbow|Multicolor|Jade White|Bambu Green|Arctic Blue|Charcoal|Ivory|Scarlet|Crimson|Navy|Olive|Beige|Burgundy|Teal|Coral|Lavender|Mint|Slate|Maroon|Indigo|Cyan|Magenta|Lime|Peach|Aqua|Tan|Khaki|Mauve|Fuchsia|Turquoise|Violet|Amber|Copper|Bronze|Champagne|Rose|Sand|Forest|Ocean|Sky|Midnight|Sunrise|Sunset|Neon|Pastel|Military|Camo|Chrome|Platinum|Titanium|Mercury|Pewter).*$/i;

function cleanProductName(title: string): string {
  const cleaned = title.replace(COLOR_SUFFIXES_RE, '').trim();
  return cleaned || title;
}

// =============================================
// Helper components
// =============================================

function getLinkStatusBadge(status: LinkStatus) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge>;
    case 'stale':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">🟡 Stale</Badge>;
    case 'broken':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Broken</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Failed</Badge>;
    case 'alert':
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">🟣 Alert</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">—</Badge>;
  }
}

function getSyncMethodBadge(source: string | undefined) {
  if (!source) return null;
  switch (source) {
    case 'shopify_json':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">🟦 API</Badge>;
    case 'firecrawl':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">🟧 Scraped</Badge>;
    case 'json_ld':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟩 JSON-LD</Badge>;
    case 'html':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">🟢 Direct</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{source}</Badge>;
  }
}

function getBypassMethodLabel(result: TestResult): string | null {
  if (!result.fetchMethod || result.fetchMethod === 'direct') return null;
  if (result.fetchMethod === 'spoofed') return 'Spoofed';
  if (result.fetchMethod === 'redirected') return 'Redirected';
  return null;
}

function getTestResultBadge(result: TestResult | undefined) {
  if (!result) return null;
  const bypassLabel = result ? getBypassMethodLabel(result) : null;
  
  switch (result.status) {
    case 'testing':
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Testing…
        </Badge>
      );
    case 'ok':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 cursor-default">
              <CheckCircle2 className="w-3 h-3" /> {result.statusCode} · {result.latencyMs}ms
              {result.isKnownGeoRedirect && <span className="ml-0.5">🌐</span>}
              {bypassLabel && !result.isKnownGeoRedirect && <span className="ml-0.5 opacity-70">({bypassLabel})</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {result.isKnownGeoRedirect ? (
              <>
                <p>URL is valid. Geo-redirect detected (expected for this brand's regional stores).</p>
                <p className="text-[10px] mt-0.5">Price sync uses Firecrawl to access the correct region.</p>
              </>
            ) : (
              <>
                HTTP {result.statusCode} — {result.latencyMs}ms response
                {bypassLabel && <p className="text-[10px] mt-0.5">Accessed via {result.fetchMethod} headers to bypass geo-restrictions</p>}
              </>
            )}
          </TooltipContent>
        </Tooltip>
      );
    case 'geo_restricted':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] gap-1 cursor-default">
              <AlertTriangle className="w-3 h-3" /> Geo-Restricted
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Store responded but geo-redirected to different region</p>
            <p className="text-[10px] mt-0.5">Price may be from wrong region — manual entry recommended</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'redirect':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] gap-1 cursor-default">
              <AlertTriangle className="w-3 h-3" /> {result.statusCode} → Redirect
              {result.isGeoRedirected && <span className="ml-0.5 opacity-70">(Geo)</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>HTTP {result.statusCode} · {result.latencyMs}ms</p>
            {result.isGeoRedirected && <p className="text-[10px] mt-0.5 text-yellow-300">⚠️ Geo-redirect detected — price may be from wrong region</p>}
            {result.redirectUrl && <p className="text-[10px] mt-1 break-all">→ {result.redirectUrl}</p>}
          </TooltipContent>
        </Tooltip>
      );
    case 'broken':
    case 'timeout':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] gap-1 cursor-default">
              <XCircle className="w-3 h-3" /> {result.status === 'timeout' ? 'Timeout' : `${result.statusCode || 'Error'}`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{result.error || `HTTP ${result.statusCode}`} · {result.latencyMs}ms</TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
}

function PriceChangeIndicator({ change }: { change: StoreRow['priceChange'] }) {
  if (!change) return <span className="text-muted-foreground">—</span>;
  if (change.direction === 'unchanged') return <span className="text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>;

  const diff = change.newPrice != null && change.oldPrice != null
    ? (change.newPrice - change.oldPrice) : null;
  const tooltipText = change.oldPrice != null && change.newPrice != null
    ? `Was $${change.oldPrice.toFixed(2)}, now $${change.newPrice.toFixed(2)} (${diff != null && diff > 0 ? '+' : ''}$${diff?.toFixed(2)})`
    : `${change.direction === 'up' ? '+' : '-'}${Math.abs(change.percent).toFixed(1)}%`;

  if (change.direction === 'up') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-red-400 flex items-center gap-0.5 font-mono text-xs cursor-default">
            <ArrowUpRight className="w-3 h-3" />↑{Math.abs(change.percent).toFixed(1)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-emerald-400 flex items-center gap-0.5 font-mono text-xs cursor-default">
          <ArrowDownRight className="w-3 h-3" />↓{Math.abs(change.percent).toFixed(1)}%
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

function formatCurrency(val: number | null, symbol: string, currency?: string) {
  if (val == null) return '—';
  const decimals = currency === 'JPY' ? 0 : 2;
  return `${symbol}${val.toFixed(decimals)}`;
}

function SyncChangeIndicator({ syncResult, currencySymbol, currency }: { syncResult: SyncResult; currencySymbol: string; currency?: string }) {
  const fmt = (v?: number) => v != null ? `${currencySymbol}${v.toFixed(currency === 'JPY' ? 0 : 2)}` : '—';

  if (syncResult.status === 'syncing') {
    return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  }

  if (syncResult.status === 'unavailable') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground cursor-default text-xs">⊘</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{syncResult.error || 'Not available in this region'}</TooltipContent>
      </Tooltip>
    );
  }

  if (syncResult.status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-destructive cursor-default text-xs font-medium">✗</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{syncResult.error || 'Price extraction failed'}</TooltipContent>
      </Tooltip>
    );
  }

  if (syncResult.status === 'unchanged') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground flex items-center gap-1 text-xs cursor-default">
            <Minus className="w-3 h-3" /> Same
          </span>
        </TooltipTrigger>
        <TooltipContent>Price unchanged at {fmt(syncResult.newPrice)}</TooltipContent>
      </Tooltip>
    );
  }

  if (syncResult.status === 'success' && syncResult.percentChange != null) {
    const isUp = syncResult.percentChange > 0;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`flex items-center gap-0.5 font-mono text-xs font-medium cursor-default ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isUp ? '+' : ''}{syncResult.percentChange.toFixed(1)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {fmt(syncResult.oldPrice)} → {fmt(syncResult.newPrice)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span className="text-muted-foreground text-xs">—</span>;
}

function StatusSummary({ group }: { group: ProductGroup }) {
  const parts: React.ReactNode[] = [];
  if (group.activeCount > 0) parts.push(<span key="a" className="text-emerald-400">{group.activeCount} Active</span>);
  if (group.staleCount > 0) parts.push(<span key="s" className="text-yellow-400">{group.staleCount} Stale</span>);
  if (group.brokenCount > 0) parts.push(<span key="b" className="text-red-400">{group.brokenCount} Broken</span>);
  if (group.alertCount > 0) parts.push(<span key="al" className="text-purple-400">{group.alertCount} Alert</span>);
  if (parts.length === 0) return <span className="text-muted-foreground text-[10px]">No URLs</span>;
  return (
    <span className="text-[10px] flex items-center gap-1.5 flex-wrap">
      {parts.reduce((prev, curr, i) => i === 0 ? [curr] : [...(prev as React.ReactNode[]), <span key={`sep-${i}`} className="text-muted-foreground">·</span>, curr], [] as React.ReactNode[])}
    </span>
  );
}

/** Small color swatch circles */
function ColorSwatches({ hexes, max = 10 }: { hexes: string[]; max?: number }) {
  const displayed = hexes.slice(0, max);
  const remaining = hexes.length - max;
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {displayed.map((hex, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <div
              className="w-3.5 h-3.5 rounded-full border border-border/50 cursor-default"
              style={{ backgroundColor: hex }}
            />
          </TooltipTrigger>
          <TooltipContent>{hex}</TooltipContent>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <span className="text-[9px] text-muted-foreground ml-0.5">+{remaining}</span>
      )}
    </div>
  );
}

// =============================================
// Main Component
// =============================================

export default function PricingData() {
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStoreKeys, setSelectedStoreKeys] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [syncResults, setSyncResults] = useState<Map<string, SyncResult>>(new Map());
  const [bulkTesting, setBulkTesting] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; variants?: number } | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<{ done: number; total: number; variants?: number } | null>(null);
  const [isPopulatingUrls, setIsPopulatingUrls] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, { loading: boolean; url?: string; confidence?: number; method?: string; query?: string; error?: boolean }>>({});
  const [bulkSearchProgress, setBulkSearchProgress] = useState<{ running: boolean; done: number; total: number; found: number } | null>(null);
  const [isClearingInactiveCache, setIsClearingInactiveCache] = useState(false);
  const abortRef = useRef(false);
  const abortSyncRef = useRef(false);
  const diagnoseRef = useRef<() => void>(() => {});
  const queryClient = useQueryClient();

  const REGION_URL_COLUMN_MAP: Record<string, string> = {
    US: 'product_url', CA: 'product_url_ca', UK: 'product_url_uk',
    EU: 'product_url_eu', AU: 'product_url_au', JP: 'product_url_jp',
  };

  const handleSearchStore = useCallback(async (url: string, region: string) => {
    setSearchResults(prev => ({ ...prev, [url]: { loading: true } }));
    try {
      const { data, error } = await supabase.functions.invoke('smart-url-validator', {
        body: { action: 'diagnose', url, region },
      });
      if (error) throw error;
      const diag = data?.diagnosis;
      if (diag?.suggested_url) {
        setSearchResults(prev => ({
          ...prev,
          [url]: {
            loading: false,
            url: diag.suggested_url,
            confidence: diag.suggestion_confidence,
            method: diag.suggestion_source || 'unknown',
            query: diag.search_query,
          },
        }));
      } else {
        setSearchResults(prev => ({ ...prev, [url]: { loading: false, error: true } }));
      }
    } catch {
      setSearchResults(prev => ({ ...prev, [url]: { loading: false, error: true } }));
      toast.error('Search failed for ' + url.slice(0, 40));
    }
  }, []);

  const handleSearchAllBroken = useCallback(async (failureDetails: Array<{ product: string; region: string; url: string; error: string; statusCode?: number; latencyMs?: number; brand: string }>) => {
    if (!failureDetails?.length) return;
    setBulkSearchProgress({ running: true, done: 0, total: failureDetails.length, found: 0 });
    let found = 0;
    for (let i = 0; i < failureDetails.length; i++) {
      const f = failureDetails[i];
      setBulkSearchProgress(prev => prev ? { ...prev, done: i + 1 } : null);
      try {
        const { data, error } = await supabase.functions.invoke('smart-url-validator', {
          body: { action: 'diagnose', url: f.url, region: f.region },
        });
        if (!error && data?.diagnosis?.suggested_url) {
          found++;
          setSearchResults(prev => ({
            ...prev,
            [f.url]: {
              loading: false,
              url: data.diagnosis.suggested_url,
              confidence: data.diagnosis.suggestion_confidence,
              method: data.diagnosis.suggestion_source || 'unknown',
              query: data.diagnosis.search_query,
            },
          }));
        } else {
          setSearchResults(prev => ({ ...prev, [f.url]: { loading: false, error: true } }));
        }
      } catch {
        setSearchResults(prev => ({ ...prev, [f.url]: { loading: false, error: true } }));
      }
      if (i < failureDetails.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
    setBulkSearchProgress({ running: false, done: failureDetails.length, total: failureDetails.length, found });
    toast.success(`Search complete: found fixes for ${found}/${failureDetails.length} products`);
  }, []);

  const handleApplyAllFixes = useCallback(async (failureDetails: Array<{ product: string; region: string; url: string; error: string; brand: string }>) => {
    if (!failureDetails) return;
    const fixes = failureDetails.filter(f => searchResults[f.url]?.url);
    if (!fixes.length) { toast.info('No fixes to apply'); return; }
    let applied = 0;
    for (const f of fixes) {
      const sr = searchResults[f.url];
      if (!sr?.url) continue;
      const col = REGION_URL_COLUMN_MAP[f.region?.toUpperCase()] || 'product_url';
      const { data: filament } = await (supabase
        .from('filaments')
        .select('id') as any)
        .eq(col, f.url)
        .limit(1)
        .maybeSingle();
      if (filament) {
        await supabase.from('filaments').update({ [col]: sr.url } as any).eq('id', filament.id);
        applied++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data-grouped'] });
    toast.success(`Applied ${applied}/${fixes.length} URL fixes`);
  }, [searchResults, queryClient]);

  // Load persisted diagnosis from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('filascope_last_diagnosis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.result) setDiagnosisResult(parsed.result);
      }
    } catch { /* ignore */ }
  }, []);

  // =============================================
  // Data fetching — grouped by product_line_id
  // =============================================

  // Fetch active regions per brand — used to hide rows for deactivated stores
  const { data: activeStoreRegions } = useQuery({
    queryKey: ['admin-active-store-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code, automated_brands!brand_regional_stores_brand_id_fkey(brand_name)')
        .eq('is_active', true);
      if (error) throw error;
      // Build a Map<brandName_lowercase, Set<regionCode>>
      const map = new Map<string, Set<string>>();
      for (const row of data || []) {
        const brand = (row.automated_brands as any)?.brand_name?.toLowerCase();
        if (!brand) continue;
        if (!map.has(brand)) map.set(brand, new Set());
        map.get(brand)!.add(row.region_code);
      }
      return map;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: rawFilaments, isLoading: filamentsLoading } = useQuery({
    queryKey: ['admin-pricing-data-grouped'],
    queryFn: async () => {
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('filaments')
          .select('id, product_line_id, product_title, vendor, material, variant_price, variant_compare_at_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp, last_scraped_at, price_confidence, net_weight_g, color_hex')
          .not('product_line_id', 'is', null)
          .order('vendor', { ascending: true })
          .order('product_title', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        hasMore = (data?.length || 0) === pageSize;
        from += pageSize;
      }
      return allData;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: urlCache } = useQuery({
    queryKey: ['admin-url-validation-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_validation_cache')
        .select('url, status, status_code, last_checked, consecutive_failures');
      if (error) throw error;
      const map = new Map<string, { status: string; status_code: number | null; last_checked: string | null; consecutive_failures: number | null }>();
      (data || []).forEach(r => map.set(r.url, r));
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: priceChanges } = useQuery({
    queryKey: ['admin-recent-price-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('filament_id, price, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      const grouped = new Map<string, number[]>();
      (data || []).forEach(r => {
        const existing = grouped.get(r.filament_id) || [];
        if (existing.length < 2) {
          existing.push(r.price);
          grouped.set(r.filament_id, existing);
        }
      });
      const changes = new Map<string, { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number }>();
      grouped.forEach((prices, id) => {
        if (prices.length < 2 || prices[1] === 0) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
          return;
        }
        const [current, previous] = prices;
        const pct = ((current - previous) / previous) * 100;
        if (Math.abs(pct) < 0.1) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
        } else {
          changes.set(id, { percent: pct, direction: pct > 0 ? 'up' : 'down', oldPrice: previous, newPrice: current });
        }
      });
      return changes;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: allVendors } = useQuery({
    queryKey: ['admin-pricing-all-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('vendor')
        .not('variant_price', 'is', null)
        .not('vendor', 'is', null);
      if (error) throw error;
      const set = new Set((data || []).map(r => r.vendor).filter(Boolean));
      return Array.from(set).sort() as string[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const vendors = allVendors || [];

  // =============================================
  // Compute link status
  // =============================================

  function computeLinkStatus(url: string | null, priceChangePercent: number | null): LinkStatus {
    if (priceChangePercent != null && Math.abs(priceChangePercent) > 10) return 'alert';
    if (!url || !urlCache) return 'unknown';
    const cached = urlCache.get(url);
    if (!cached) return 'unknown';
    if (cached.status === 'invalid' || (cached.status_code && cached.status_code >= 400)) return 'broken';
    // If the URL was previously checked and sync failed (consecutive_failures > 0), show as failed
    if (cached.consecutive_failures && cached.consecutive_failures > 0 && cached.status === 'sync_failed') return 'failed';
    if (cached.last_checked) {
      const checkedAt = new Date(cached.last_checked);
      const hoursSince = (Date.now() - checkedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 168) return 'stale'; // >7 days since last successful check
      return 'active';
    }
    return 'unknown';
  }

  // =============================================
  // Group raw filaments by product_line_id
  // =============================================

  const totalVariantCount = rawFilaments?.length || 0;

  const productGroups: ProductGroup[] = useMemo(() => {
    if (!rawFilaments) return [];

    // Group by product_line_id
    const grouped = new Map<string, any[]>();
    for (const f of rawFilaments) {
      const key = f.product_line_id;
      if (!key) continue;
      const arr = grouped.get(key) || [];
      arr.push(f);
      grouped.set(key, arr);
    }

    const groups: ProductGroup[] = [];
    for (const [productLineId, variants] of grouped) {
      const rep = variants[0]; // representative variant
      const allIds = variants.map((v: any) => v.id);
      const colorHexes = [...new Set(variants.map((v: any) => v.color_hex).filter(Boolean))] as string[];
      
      // Clean product name
      const cleanName = cleanProductName(rep.product_title || '');
      
      // Price range across variants
      const prices = variants.map((v: any) => v.variant_price).filter((p: any) => p != null) as number[];
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      const hasPriceRange = minPrice != null && maxPrice != null && Math.abs(maxPrice - minPrice) > 0.01;

      // Get representative price change (use first variant with a change)
      let repChange: ProductGroup['stores'][0]['priceChange'] = null;
      for (const v of variants) {
        const c = priceChanges?.get(v.id);
        if (c && c.direction !== 'unchanged') { repChange = c; break; }
      }

      // Build store rows - use representative variant for each region
      // For URLs, pick the first non-null URL across variants (they should all be the same base URL)
      const stores: StoreRow[] = [];
      let usUrl: string | null = null; // Track US URL for derivation

      // Determine which regions are active for this vendor via brand_regional_stores
      const vendorKey = rep.vendor?.toLowerCase();
      const activeRegionsForBrand = activeStoreRegions?.get(vendorKey);

      for (const { region, priceField, urlField } of REGION_FIELD_MAP) {
        // Skip regions whose brand_regional_stores entry is inactive
        // (only applies to brands that have at least one entry — global/unmanaged brands pass through)
        if (activeRegionsForBrand && !activeRegionsForBrand.has(region)) continue;
        // Aggregate across variants: take first non-null URL, representative price
        let url: string | null = null;
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        let lastScrapedAt: string | null = null;
        let netWeightG: number | null = null;

        for (const v of variants) {
          if (!url && v[urlField]) url = v[urlField];
          if (price == null && v[priceField] != null) {
            price = v[priceField];
            compareAtPrice = region === 'US' ? v.variant_compare_at_price : null;
            netWeightG = v.net_weight_g;
          }
          if (!lastScrapedAt && v.last_scraped_at) lastScrapedAt = v.last_scraped_at;
        }

        // Track US URL for regional derivation
        if (region === 'US' && url) usUrl = url;

        // Derive regional URL if database URL is null but US URL exists
        let isDerived = false;
        if (!url && region !== 'US' && usUrl) {
          const derived = deriveRegionalUrl(usUrl, rep.vendor, region);
          if (derived) {
            url = derived;
            isDerived = true;
          }
        }

        // Skip only if there's no URL (database or derived) AND no price
        if (!url && price == null) continue;

        // Preserve product-identity query params (e.g. ?sku= for TreeD, ?id=), strip only fragments and tracking
        const baseUrl = url
          ? (url.includes('?sku=') || url.includes('?id='))
            ? url.replace(/#.*$/, '')
            : url.replace(/[?#].*$/, '')
          : null;

        const rc = REGION_CONFIG[region];
        const storeKey = `${productLineId}::${region}`;
        const storeChange = region === 'US' ? repChange : null;
        const changePct = storeChange?.percent ?? null;

        stores.push({
          storeKey,
          productLineId,
          representativeId: rep.id,
          allFilamentIds: allIds,
          region,
          regionFlag: rc.flag,
          storeName: `${rep.vendor} ${rc.label}`,
          price,
          compareAtPrice,
          currency: rc.currency,
          currencySymbol: rc.symbol,
          productUrl: baseUrl,
          isDerived,
          lastScrapedAt,
          linkStatus: computeLinkStatus(baseUrl, changePct),
          priceChange: storeChange,
          netWeightG,
        });
      }

      if (stores.length === 0 && prices.length === 0) continue;

      const activeCount = stores.filter(s => s.linkStatus === 'active').length;
      const staleCount = stores.filter(s => s.linkStatus === 'stale').length;
      const brokenCount = stores.filter(s => s.linkStatus === 'broken' || s.linkStatus === 'failed').length;
      const alertCount = stores.filter(s => s.linkStatus === 'alert').length;

      groups.push({
        productLineId,
        representativeId: rep.id,
        productTitle: rep.product_title,
        cleanName,
        vendor: rep.vendor,
        material: rep.material,
        variantCount: variants.length,
        colorCount: colorHexes.length,
        colorHexes,
        allFilamentIds: allIds,
        stores,
        minPrice,
        maxPrice,
        hasPriceRange,
        activeCount,
        staleCount,
        brokenCount,
        alertCount,
      });
    }

    groups.sort((a, b) => {
      const vc = a.vendor.localeCompare(b.vendor);
      if (vc !== 0) return vc;
      return a.cleanName.localeCompare(b.cleanName);
    });

    return groups;
  }, [rawFilaments, urlCache, priceChanges, activeStoreRegions]);

  // =============================================
  // Filtering
  // =============================================

  const filtered = useMemo(() => {
    return productGroups.filter(g => {
      if (vendorFilter !== 'all' && g.vendor !== vendorFilter) return false;
      if (statusFilter !== 'all') {
        const hasMatch = g.stores.some(s => {
          if (statusFilter === 'stale') return s.linkStatus === 'stale' || s.linkStatus === 'unknown';
          return s.linkStatus === statusFilter;
        });
        if (!hasMatch) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!g.cleanName?.toLowerCase().includes(q) && !g.vendor?.toLowerCase().includes(q) && !g.material?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [productGroups, vendorFilter, statusFilter, search]);

  // =============================================
  // Stats
  // =============================================

  const stats = useMemo(() => {
    let totalStores = 0;
    let active = 0;
    let stale = 0;
    let broken = 0;
    let alerts = 0;
    let multiRegion = 0;

    for (const g of productGroups) {
      totalStores += g.stores.length;
      active += g.activeCount;
      stale += g.staleCount;
      broken += g.brokenCount;
      alerts += g.alertCount;
      if (g.stores.length > 1) multiRegion++;
    }

    const stalePrices = productGroups.reduce((acc, g) => {
      return acc + g.stores.filter(s => {
        if (!s.lastScrapedAt) return true;
        return (Date.now() - new Date(s.lastScrapedAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
      }).length;
    }, 0);

    return { totalProducts: productGroups.length, totalStores, active, stale, broken, alerts, multiRegion, stalePrices, totalVariants: totalVariantCount };
  }, [productGroups, totalVariantCount]);

  // =============================================
  // All visible store keys (for selection)
  // =============================================

  const visibleStoreKeys = useMemo(() => {
    const keys: string[] = [];
    for (const g of filtered.slice(0, 200)) {
      if (expandedProducts.has(g.productLineId)) {
        for (const s of g.stores) {
          keys.push(s.storeKey);
        }
      }
    }
    return keys;
  }, [filtered, expandedProducts]);

  const selectedCount = [...selectedStoreKeys].filter(k => visibleStoreKeys.includes(k)).length;
  const allVisibleSelected = visibleStoreKeys.length > 0 && visibleStoreKeys.every(k => selectedStoreKeys.has(k));

  // =============================================
  // Expand/Collapse
  // =============================================

  const toggleExpand = useCallback((id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedProducts(new Set(filtered.slice(0, 200).map(g => g.productLineId)));
  }, [filtered]);

  const collapseAll = useCallback(() => {
    setExpandedProducts(new Set());
  }, []);

  // =============================================
  // Selection
  // =============================================

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedStoreKeys(new Set());
    } else {
      setSelectedStoreKeys(new Set(visibleStoreKeys));
    }
  }, [allVisibleSelected, visibleStoreKeys]);

  const toggleSelectStore = useCallback((key: string) => {
    setSelectedStoreKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // =============================================
  // Helpers to find store row from key
  // =============================================

  const storeKeyMap = useMemo(() => {
    const map = new Map<string, { store: StoreRow; group: ProductGroup }>();
    for (const g of productGroups) {
      for (const s of g.stores) {
        map.set(s.storeKey, { store: s, group: g });
      }
    }
    return map;
  }, [productGroups]);

  // =============================================
  // Link testing (per store — deduplicated via product_line_id)
  // =============================================

  const testSingleUrl = useCallback(async (storeKey: string, url: string, showToast = true, region?: string): Promise<TestResult> => {
    const startTime = Date.now();
    setTestResults(prev => new Map(prev).set(storeKey, { status: 'testing' }));

    // Preserve product-identity query params (e.g. ?sku= for TreeD, ?id=), strip only fragments and tracking
    const baseUrl = (url.includes('?sku=') || url.includes('?id='))
      ? url.replace(/#.*$/, '')
      : url.replace(/[?#].*$/, '');

    try {
      const { data, error } = await supabase.functions.invoke('test-url', { body: { url: baseUrl, region } });
      const latencyMs = Date.now() - startTime;
      if (error) throw error;

      let result: TestResult;
      const fetchMethod = data.fetchMethod as TestResult['fetchMethod'];
      const isGeoRedirected = !!data.isGeoRedirected;
      const isKnownGeoRedirect = !!data.isKnownGeoRedirect;
      if (data.ok) {
        result = { status: 'ok', statusCode: data.statusCode, latencyMs, fetchMethod, isGeoRedirected: data.isKnownGeoRedirect ? false : isGeoRedirected, isKnownGeoRedirect };
      } else if (data.isRedirect) {
        result = { status: 'redirect', statusCode: data.statusCode, latencyMs, redirectUrl: data.redirectLocation, fetchMethod, isGeoRedirected };
      } else {
        result = { status: 'broken', statusCode: data.statusCode, latencyMs, error: data.error, fetchMethod };
      }

      setTestResults(prev => new Map(prev).set(storeKey, result));

      // Cache the result for the base URL
      const cacheStatus = result.status === 'ok' || result.status === 'geo_restricted' ? 'valid' : result.status === 'redirect' ? 'redirect' : 'invalid';
      await supabase.from('url_validation_cache').upsert({
        url: baseUrl,
        status: cacheStatus,
        status_code: result.statusCode ?? null,
        redirect_url: result.redirectUrl ?? null,
        last_checked: new Date().toISOString(),
        check_count: 1,
      }, { onConflict: 'url' });

      // Fan out: update all variants with the same product_line_id for this URL
      const entry = storeKeyMap.get(storeKey);
      if (entry) {
        const variantCount = entry.store.allFilamentIds.length;
        if (showToast) {
          const methodNote = result.fetchMethod && result.fetchMethod !== 'direct' ? ` (${result.fetchMethod})` : '';
          if (result.status === 'ok' && result.isKnownGeoRedirect) toast.success(`✅ Link valid (geo-redirect expected) — ${latencyMs}ms${variantCount > 1 ? ` · covers ${variantCount} variants` : ''}`);
          else if (result.status === 'ok') toast.success(`✅ Link active (${result.statusCode}) — ${latencyMs}ms${methodNote}${variantCount > 1 ? ` · covers ${variantCount} variants` : ''}`);
          else if (result.status === 'geo_restricted') toast.warning(`🌐 Geo-restricted${methodNote}`);
          else if (result.status === 'redirect') toast.warning(`⚠️ Redirect (${result.statusCode})${result.isGeoRedirected ? ' — geo-redirect' : ''}`);
          else toast.error(`❌ Link broken (${result.statusCode || result.error})`);
        }
      }
      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = latencyMs >= 4900 || err?.name === 'AbortError';
      const result: TestResult = {
        status: isTimeout ? 'timeout' : 'broken',
        latencyMs,
        error: isTimeout ? 'Request timeout (5s)' : (err?.message || 'Unknown error'),
      };
      setTestResults(prev => new Map(prev).set(storeKey, result));

      const baseUrl2 = (url.includes('?sku=') || url.includes('?id=')) ? url.replace(/#.*$/, '') : url.replace(/[?#].*$/, '');
      await supabase.from('url_validation_cache').upsert({
        url: baseUrl2,
        status: 'invalid',
        status_code: null,
        redirect_url: null,
        last_checked: new Date().toISOString(),
        consecutive_failures: 1,
      }, { onConflict: 'url' });

      if (showToast) toast.error(`❌ ${isTimeout ? 'Timeout (5s)' : 'Network error'}`);
      return result;
    }
  }, [storeKeyMap]);

  const testBatch = useCallback(async (storesToTest: StoreRow[]) => {
    // Deduplicate: only test unique base URLs per region
    const seen = new Set<string>();
    const deduped: StoreRow[] = [];
    let totalVariants = 0;
    let skippedCount = 0;
    for (const s of storesToTest) {
      if (!s.productUrl) { skippedCount++; continue; }
      const dedupKey = `${s.productUrl}::${s.region}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      deduped.push(s);
      totalVariants += s.allFilamentIds.length;
    }

    if (skippedCount > 0) toast.warning(`${skippedCount} store${skippedCount > 1 ? 's' : ''} skipped (no URL available)`);
    if (deduped.length === 0) { toast.info('No testable URLs'); return; }

    setBulkTesting(true);
    setBulkProgress({ done: 0, total: deduped.length, variants: totalVariants });
    abortRef.current = false;
    const startTime = Date.now();
    let done = 0, ok = 0, broken = 0, warnings = 0;

    for (let i = 0; i < deduped.length; i += 3) {
      if (abortRef.current) break;
      const batch = deduped.slice(i, i + 3);
      const results = await Promise.all(batch.map(s => testSingleUrl(s.storeKey, s.productUrl!, false, s.region)));
      results.forEach(r => { done++; if (r.status === 'ok') ok++; else if (r.status === 'broken' || r.status === 'timeout') broken++; else warnings++; });
      setBulkProgress({ done, total: deduped.length, variants: totalVariants });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkTesting(false);
    setBulkProgress(null);
    toast.success(`Tested ${done} products in ${elapsed}s (covering ${totalVariants} variants) — ${ok} active, ${broken} broken, ${warnings} warnings`);

    // Auto-trigger diagnosis if broken links found
    if (broken > 0) {
      setTimeout(() => {
        diagnoseRef.current();
      }, 500);
    }
  }, [testSingleUrl]);

  // =============================================
  // Price sync (per store — deduplicated, fans out to all variants)
  // =============================================

  const syncSinglePrice = useCallback(async (store: StoreRow, showToast = true): Promise<SyncResult> => {
    if (!store.productUrl) return { status: 'failed', error: 'No product URL' };
    if (store.linkStatus === 'broken') return { status: 'failed', error: 'Link is broken' };

    // Guard: skip bare/incomplete URLs that can never yield a valid product price.
    // Cases caught:
    //   (a) Homepage URL: path is "/" and no query string
    //   (b) Pattern-based URL where the store's pattern requires a query param (contains "?")
    //       but the resolved URL has no query string — slug substitution silently failed.
    try {
      const urlObj = new URL(store.productUrl);
      const hasProductPath = urlObj.pathname.length > 1; // more than just "/"
      const hasProductQuery = urlObj.search.length > 0;

      // Case (a): completely bare domain
      if (!hasProductPath && !hasProductQuery) {
        console.warn(`Skipping sync for ${store.storeName} (${store.region}): bare domain URL "${store.productUrl}"`);
        return { status: 'failed', error: 'No product_url_pattern configured and no existing product_url' };
      }

      // Case (b): URL has a trailing-slash path but NO query string, AND it looks like
      // a query-param-based product page (path ends with a directory-style segment like
      // /shop/product/ or /product/). This fingerprint indicates the {sku} or {slug}
      // substitution produced an empty token and the URL is unusable for price extraction.
      const pathEndsWithSlash = urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1;
      if (pathEndsWithSlash && !hasProductQuery) {
        // Heuristic: if the path contains "product" it's almost certainly meant to have a
        // query or slug after it. Skip rather than sending a bare product-directory URL.
        if (urlObj.pathname.toLowerCase().includes('product')) {
          console.warn(
            `Skipping sync for ${store.storeName} (${store.region}): ` +
            `URL "${store.productUrl}" looks like an incomplete product URL (no query string / slug)`
          );
          return { status: 'failed', error: 'Incomplete product URL — slug/SKU substitution likely failed' };
        }
      }
    } catch {
      // If URL parsing fails, proceed and let the edge function handle it
    }

    const oldPrice = store.price;
    setSyncResults(prev => new Map(prev).set(store.storeKey, { status: 'syncing' }));

    try {
      const { data, error } = await supabase.functions.invoke('get-current-price', {
        body: { productUrl: store.productUrl, currency: store.currency, forceRefresh: true, targetWeightGrams: store.netWeightG, filamentId: store.representativeId },
      });

      if (error) {
        const errorMsg = data?.error || error.message || 'Failed to fetch price';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ Failed to sync — ${errorMsg}`);
        // Persist sync failure to URL cache
        if (store.productUrl) {
          try {
            await supabase.from('url_validation_cache').upsert({
              url: store.productUrl.replace(/\?.*$/, ''),
              status: 'sync_failed',
              last_checked: new Date().toISOString(),
              consecutive_failures: 1,
            }, { onConflict: 'url' });
          } catch {}
        }
        return result;
      }

      if (!data?.success || data.price == null) {
        // Check if this is a "not available in region" response (e.g. Creality HTTP 404)
        if (data?.notAvailableInRegion) {
          const result: SyncResult = { status: 'unavailable', error: data.error || 'Product not available in this region' };
          setSyncResults(prev => new Map(prev).set(store.storeKey, result));
          if (showToast) toast.warning(`⚪ Not available in this region`);
          return result;
        }
        const errorMsg = data?.error || 'Invalid price data';
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        // Persist sync failure to URL cache
        if (store.productUrl) {
          try {
            await supabase.from('url_validation_cache').upsert({
              url: store.productUrl.replace(/\?.*$/, ''),
              status: 'sync_failed',
              last_checked: new Date().toISOString(),
              consecutive_failures: 1,
            }, { onConflict: 'url' });
          } catch {}
        }
        return result;
      }

      const { price, compareAtPrice, currency = store.currency } = data;

      // Fan out: update the representative filament via RPC (which logs price history)
      const { error: rpcError } = await supabase.rpc('update_filament_price_after_refresh', {
        p_filament_id: store.representativeId,
        p_new_price: price,
        p_compare_at_price: compareAtPrice || null,
        p_currency: currency,
        p_source: 'manual',
      });

      if (rpcError) {
        const errorMsg = rpcError.message?.includes('Unauthorized') ? 'Admin access required' : `Save failed: ${rpcError.message || 'Unknown error'}`;
        const result: SyncResult = { status: 'failed', error: errorMsg };
        setSyncResults(prev => new Map(prev).set(store.storeKey, result));
        if (showToast) toast.error(`✗ ${errorMsg}`);
        return result;
      }

      // Fan out to ALL variants with same product_line_id
      // Determine which price/url field to update based on region
      const regionFieldMap: Record<string, { priceField: string; urlField?: string }> = {
        US: { priceField: 'variant_price' },
        CA: { priceField: 'price_cad' },
        UK: { priceField: 'price_gbp' },
        EU: { priceField: 'price_eur' },
        AU: { priceField: 'price_aud' },
        JP: { priceField: 'price_jpy' },
      };
      const regionMapping = regionFieldMap[store.region];
      if (regionMapping && store.allFilamentIds.length > 1) {
        const updatePayload: Record<string, any> = {
          [regionMapping.priceField]: price,
          last_scraped_at: new Date().toISOString(),
        };
        // Update all OTHER variants (the representative was already updated via RPC)
        const otherIds = store.allFilamentIds.filter(id => id !== store.representativeId);
        if (otherIds.length > 0) {
          await supabase
            .from('filaments')
            .update(updatePayload)
            .in('id', otherIds);
        }
      }

      invalidatePriceCache(store.productUrl);

      const priceChanged = oldPrice != null && Math.abs(price - oldPrice) > 0.01;
      const pctChange = oldPrice && oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

      const result: SyncResult = {
        status: priceChanged ? 'success' : 'unchanged',
        oldPrice: oldPrice ?? undefined,
        newPrice: price,
        percentChange: pctChange,
        source: data.source || undefined,
        location: data.location || undefined,
        currencyMismatch: data.currencyMismatch || false,
        detectedCurrency: data.detectedCurrency || undefined,
        requestedCurrency: data.requestedCurrency || undefined,
      };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));

      // Update url_validation_cache to reflect successful sync
      if (store.productUrl) {
        const baseUrl = store.productUrl.replace(/\?.*$/, '');
        await supabase.from('url_validation_cache').upsert({
          url: baseUrl,
          status: 'valid',
          status_code: 200,
          redirect_url: null,
          last_checked: new Date().toISOString(),
          consecutive_failures: 0,
        }, { onConflict: 'url' });
      }

      if (showToast) {
        const variantNote = store.allFilamentIds.length > 1 ? ` · updated ${store.allFilamentIds.length} variants` : '';
        if (!priceChanged) toast.success(`✓ Price confirmed: ${store.currencySymbol}${price.toFixed(2)}${variantNote}`);
        else if (pctChange > 0) toast.warning(`⚠️ Price increased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (+${pctChange.toFixed(1)}%)${variantNote}`);
        else toast.success(`✓ Price decreased: ${store.currencySymbol}${oldPrice?.toFixed(2)} → ${store.currencySymbol}${price.toFixed(2)} (${pctChange.toFixed(1)}%)${variantNote}`);
      }
      return result;
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Unexpected error';
      const result: SyncResult = { status: 'failed', error: errorMsg };
      setSyncResults(prev => new Map(prev).set(store.storeKey, result));
      if (showToast) toast.error(`✗ ${errorMsg}`);
      return result;
    }
  }, [storeKeyMap]);

  const syncBatch = useCallback(async (storesToSync: StoreRow[]) => {
    // Deduplicate: only sync unique base URLs per region
    const seen = new Set<string>();
    const deduped: StoreRow[] = [];
    let totalVariants = 0;
    for (const s of storesToSync) {
      if (!s.productUrl || s.linkStatus === 'broken') continue;
      const dedupKey = `${s.productUrl}::${s.region}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      deduped.push(s);
      totalVariants += s.allFilamentIds.length;
    }

    if (deduped.length === 0) { toast.info('No syncable stores'); return; }

    setBulkSyncing(true);
    setBulkSyncProgress({ done: 0, total: deduped.length, variants: totalVariants });
    abortSyncRef.current = false;
    const startTime = Date.now();
    let done = 0, updated = 0, unchanged = 0, failed = 0, priceUp = 0, priceDown = 0;

    for (let i = 0; i < deduped.length; i += 2) {
      if (abortSyncRef.current) break;
      const batch = deduped.slice(i, i + 2);
      const results = await Promise.all(batch.map(async (s) => {
        try {
          return await syncSinglePrice(s, false);
        } catch (error: any) {
          console.error(`Sync failed for ${s.storeName}:`, error?.message || error);
          return { status: 'failed' as const, error: error?.message || 'Unexpected error' };
        }
      }));
      results.forEach(r => {
        done++;
        if (r.status === 'success') {
          updated++;
          if (r.percentChange && r.percentChange > 0) priceUp++;
          else if (r.percentChange && r.percentChange < 0) priceDown++;
        } else if (r.status === 'unchanged') unchanged++;
        else failed++;
      });
      setBulkSyncProgress({ done, total: deduped.length, variants: totalVariants });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setBulkSyncing(false);
    setBulkSyncProgress(null);
    queryClient.invalidateQueries({ queryKey: ['admin-pricing-data-grouped'] });
    queryClient.invalidateQueries({ queryKey: ['admin-recent-price-changes'] });

    const updatedDetail = updated > 0 ? ` (↑${priceUp} ↓${priceDown})` : '';
    if (abortSyncRef.current) {
      toast.info(`⚠️ Sync cancelled — ${done}/${deduped.length} stores: ${updated} updated${updatedDetail}, ${unchanged} unchanged, ${failed} failed`);
    } else {
      toast.success(`Synced ${done} stores: ${updated} updated${updatedDetail}, ${unchanged} unchanged, ${failed} failed`);
    }
  }, [syncSinglePrice, queryClient]);

  // =============================================
  // Bulk action handlers
  // =============================================

  const getSelectedStores = useCallback((): StoreRow[] => {
    return [...selectedStoreKeys]
      .map(k => storeKeyMap.get(k)?.store)
      .filter(Boolean) as StoreRow[];
  }, [selectedStoreKeys, storeKeyMap]);

  const handleTestSelected = useCallback(() => {
    testBatch(getSelectedStores());
  }, [getSelectedStores, testBatch]);

  const handleTestAllStale = useCallback(() => {
    const staleStores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.linkStatus === 'stale' || s.linkStatus === 'unknown') staleStores.push(s);
      }
    }
    testBatch(staleStores);
  }, [filtered, testBatch]);

  const handleSyncSelected = useCallback(() => {
    syncBatch(getSelectedStores());
  }, [getSelectedStores, syncBatch]);

  const handleSyncStale = useCallback(() => {
    const staleStores: StoreRow[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (!s.lastScrapedAt || (Date.now() - new Date(s.lastScrapedAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
          staleStores.push(s);
        }
      }
    }
    syncBatch(staleStores);
  }, [filtered, syncBatch]);

  // =============================================
  // CSV Export
  // =============================================

  const handleExportPricing = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        exportData.push({
          Product: g.cleanName,
          Brand: g.vendor,
          Material: g.material || '',
          Variants: String(g.variantCount),
          Store: s.storeName,
          Region: s.region,
          Price: s.price?.toFixed(2) || '',
          Currency: s.currency,
          Status: s.linkStatus,
          'Change %': s.priceChange?.percent?.toFixed(1) || '0',
          'Last Sync': s.lastScrapedAt || '',
          URL: s.productUrl || '',
        });
      }
    }
    downloadCSV(exportData, 'pricing-report');
    toast.success('Exported pricing report');
  }, [filtered]);

  const handleExportChanges = useCallback(() => {
    const exportData: Record<string, string>[] = [];
    for (const g of filtered) {
      for (const s of g.stores) {
        if (s.priceChange && s.priceChange.direction !== 'unchanged') {
          exportData.push({
            Product: g.cleanName,
            Brand: g.vendor,
            Variants: String(g.variantCount),
            Store: s.storeName,
            'Old Price': s.priceChange.oldPrice?.toFixed(2) || '',
            'New Price': s.priceChange.newPrice?.toFixed(2) || '',
            'Change %': s.priceChange.percent?.toFixed(1) || '',
            Currency: s.currency,
          });
        }
      }
    }
    if (exportData.length === 0) { toast.info('No price changes to export'); return; }
    downloadCSV(exportData, 'price-changes');
    toast.success(`Exported ${exportData.length} price changes`);
  }, [filtered]);

  // =============================================
  // Populate Regional URLs
  // =============================================

  const canPopulateUrls = vendorFilter !== 'all' && vendorFilter in BRAND_REGIONAL_CONFIGS;

  const handlePopulateRegionalUrls = useCallback(async () => {
    if (!canPopulateUrls) return;
    const vendor = vendorFilter;
    const productCount = filtered.length;
    const brandSlug = vendor.toLowerCase().replace(/\s+/g, '-');

    const confirmed = window.confirm(
      `Generate regional URLs for ${productCount} ${vendor} products?\n\nThis will fill in missing CA/UK/EU/AU/JP URLs by transforming the US URL using known store patterns.\n\nProducts without a US URL will be skipped.`
    );
    if (!confirmed) return;

    setIsPopulatingUrls(true);
    const toastId = toast.loading(`Generating regional URLs for ${vendor}...`);

    try {
      const { data, error } = await supabase.functions.invoke('populate-regional-urls', {
        body: {
          brandSlug,
          productType: 'filament',
          regions: ['CA', 'UK', 'EU', 'AU', 'JP'],
          validateUrls: false,
          dryRun: false,
        },
      });

      if (error) throw error;

      const updated = data?.updated ?? data?.results?.updated ?? 0;
      const skipped = data?.skipped ?? data?.results?.skipped ?? 0;
      const total = data?.total ?? data?.results?.total ?? 0;

      toast.success(`Generated ${updated} regional URLs for ${total} products. ${skipped} skipped (no US URL).`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-data-grouped'] });
    } catch (err: any) {
      console.error('Populate regional URLs error:', err);
      toast.error(`Failed to populate URLs: ${err.message}`, { id: toastId });
    } finally {
      setIsPopulatingUrls(false);
    }
  }, [canPopulateUrls, vendorFilter, filtered.length, queryClient]);

  // =============================================
  // Clear stale cache for inactive stores
  // =============================================

  

  const handleClearInactiveStoreCache = useCallback(async () => {
    const confirmed = window.confirm(
      'Clear URL validation cache entries for inactive stores?\n\nThis removes stale "Failed" status entries for stores that have been deactivated (e.g., Polymaker EU). The rows will disappear from this view on next reload.'
    );
    if (!confirmed) return;

    setIsClearingInactiveCache(true);
    const toastId = toast.loading('Finding inactive store URLs…');

    try {
      // Get all inactive store base_urls
      const { data: inactiveStores, error: storeError } = await supabase
        .from('brand_regional_stores')
        .select('base_url')
        .eq('is_active', false);

      if (storeError) throw storeError;

      const domains = (inactiveStores || [])
        .map(s => {
          try { return new URL(s.base_url).hostname; } catch { return null; }
        })
        .filter(Boolean) as string[];

      if (domains.length === 0) {
        toast.dismiss(toastId);
        toast.info('No inactive stores found');
        return;
      }

      // Delete url_validation_cache entries matching these domains
      let totalDeleted = 0;
      for (const domain of domains) {
        const { error: delError } = await supabase
          .from('url_validation_cache')
          .delete()
          .ilike('url', `%${domain}%`);
        if (!delError) totalDeleted++;
      }

      toast.dismiss(toastId);
      toast.success(`Cleared cache for ${totalDeleted} inactive store domain(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-url-validation-cache'] });
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error('Failed to clear cache: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsClearingInactiveCache(false);
    }
  }, [queryClient]);

  // =============================================
  // Failure Diagnosis
  // =============================================

  const failedSyncCount = useMemo(() => {
    let count = 0;
    syncResults.forEach(r => { if (r.status === 'failed') count++; });
    return count;
  }, [syncResults]);

  const failedTestCount = useMemo(() => {
    let count = 0;
    testResults.forEach(r => { if (r.status === 'broken' || r.status === 'timeout') count++; });
    return count;
  }, [testResults]);

  const totalFailureCount = failedSyncCount + failedTestCount;

  const handleDiagnoseFailures = useCallback(async () => {
    const failures: { product: string; region: string; currency: string; url: string; error: string; brand: string; extractedPrice?: number; source?: string; statusCode?: number; latencyMs?: number; storeKey?: string }[] = [];

    syncResults.forEach((result, storeKey) => {
      if (result.status !== 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      const testResult = testResults.get(storeKey);
      failures.push({
        product: entry.group.cleanName,
        region: entry.store.region,
        currency: entry.store.currency,
        url: entry.store.productUrl || '',
        error: result.error || 'Unknown error',
        brand: entry.group.vendor,
        extractedPrice: result.newPrice,
        source: result.source,
        statusCode: testResult?.statusCode,
        latencyMs: testResult?.latencyMs,
        storeKey: entry.store.storeKey,
      });
    });

    // Also collect test failures (broken links, timeouts)
    testResults.forEach((result, storeKey) => {
      if (result.status !== 'broken' && result.status !== 'timeout') return;
      // Skip if already covered by a sync failure for the same store
      const syncResult = syncResults.get(storeKey);
      if (syncResult?.status === 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      failures.push({
        product: entry.group.cleanName,
        region: entry.store.region,
        currency: entry.store.currency,
        url: entry.store.productUrl || '',
        error: `[LINK_TEST] ${result.error || `HTTP ${result.statusCode} - Link ${result.status}`}`,
        brand: entry.group.vendor,
        extractedPrice: 0,
        source: 'link_test',
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        storeKey: entry.store.storeKey,
      });
    });

    if (failures.length === 0) { toast.info('No failures to diagnose'); return; }

    setIsDiagnosing(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-sync-failures', {
        body: { failures },
      });
      if (error) throw error;
      setDiagnosisResult(data as DiagnosisResult);
      setShowDiagnosisModal(true);
      localStorage.setItem('filascope_last_diagnosis', JSON.stringify({ result: data, timestamp: new Date().toISOString() }));
    } catch (err: any) {
      toast.error(`Diagnosis failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  }, [syncResults, storeKeyMap, testResults]);

  // Keep ref in sync for auto-trigger from testBatch
  diagnoseRef.current = handleDiagnoseFailures;

  const handleRetryTransient = useCallback(async () => {
    if (!diagnosisResult) return;
    const transientPatterns = diagnosisResult.diagnoses.filter(d => d.isTransient);
    const transientProducts = new Set(transientPatterns.flatMap(d => d.affectedProducts));

    const storesToRetry: StoreRow[] = [];
    syncResults.forEach((result, storeKey) => {
      if (result.status !== 'failed') return;
      const entry = storeKeyMap.get(storeKey);
      if (!entry) return;
      const label = `${entry.group.cleanName} ${entry.store.region}`;
      if (transientProducts.has(label)) {
        storesToRetry.push(entry.store);
      }
    });

    if (storesToRetry.length === 0) { toast.info('No transient failures to retry'); return; }
    setShowDiagnosisModal(false);
    syncBatch(storesToRetry);
  }, [diagnosisResult, syncResults, storeKeyMap, syncBatch]);

  // =============================================
  // Render
  // =============================================

  if (filamentsLoading) {
    return <AdminLayout><PageLoadingSkeleton /></AdminLayout>;
  }

  const isBusy = bulkTesting || bulkSyncing;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pricing Data</h1>
            <p className="text-sm text-muted-foreground">
              {stats.totalProducts.toLocaleString()} products ({stats.totalVariants.toLocaleString()} variants) across {stats.totalStores.toLocaleString()} store entries
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalProducts.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{stats.totalVariants.toLocaleString()} variants</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-400/50 transition-colors" onClick={() => setStatusFilter('active')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-[11px] text-emerald-400/70">Active Links</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:border-yellow-400/50 transition-colors" onClick={() => setStatusFilter('stale')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.stale}</p>
              <p className="text-[11px] text-yellow-400/70">Stale Links</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5 cursor-pointer hover:border-red-400/50 transition-colors" onClick={() => setStatusFilter('broken')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.broken}</p>
              <p className="text-[11px] text-red-400/70">Broken Links</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/30 bg-purple-500/5 cursor-pointer hover:border-purple-400/50 transition-colors" onClick={() => setStatusFilter('alert')}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.alerts}</p>
              <p className="text-[11px] text-purple-400/70">Price Alerts</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.multiRegion}</p>
              <p className="text-[11px] text-muted-foreground">Multi-Region</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, brand, or material..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">🟢 Active</SelectItem>
              <SelectItem value="stale">🟡 Stale</SelectItem>
              <SelectItem value="broken">🔴 Broken</SelectItem>
              <SelectItem value="failed">🔴 Failed</SelectItem>
              <SelectItem value="alert">🟣 Price Alert</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} products</span>
        </div>

        {/* Bulk action toolbar */}
        <div className="flex items-center gap-3 flex-wrap rounded-lg border border-border/50 bg-card p-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all visible" />
            <span className="text-xs text-muted-foreground">
              {selectedCount > 0 ? <Badge variant="secondary" className="text-[10px]">{selectedCount} stores</Badge> : 'Select all'}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          {/* Expand/collapse */}
          <Button size="sm" variant="ghost" onClick={expandAll} className="text-xs gap-1.5">
            <ChevronsUpDown className="w-3.5 h-3.5" /> Expand All
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll} className="text-xs gap-1.5">
            Collapse All
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Link testing */}
          <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={handleTestSelected} className="text-xs gap-1.5">
            {bulkTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Test Selected ({selectedCount})
          </Button>
          <Button size="sm" variant="outline" disabled={isBusy} onClick={handleTestAllStale} className="text-xs gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Test All Stale
          </Button>
          <div className="h-4 w-px bg-border" />
          {/* Price sync */}
          <Button size="sm" variant="outline" disabled={selectedCount === 0 || isBusy} onClick={handleSyncSelected} className="text-xs gap-1.5">
            {bulkSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Resync Selected ({selectedCount})
          </Button>
          <Button size="sm" variant="outline" disabled={isBusy} onClick={handleSyncStale} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Resync Stale
            {stats.stalePrices > 0 && <Badge variant="secondary" className="text-[9px] ml-1">{stats.stalePrices}</Badge>}
          </Button>
          {(totalFailureCount > 0 || diagnosisResult) && (
            <>
              <div className="h-4 w-px bg-border" />
              <Button
                size="sm"
                variant="outline"
                disabled={isDiagnosing || (totalFailureCount === 0 && !diagnosisResult)}
                onClick={totalFailureCount > 0 ? handleDiagnoseFailures : () => setShowDiagnosisModal(true)}
                className="text-xs gap-1.5"
              >
                {isDiagnosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                {totalFailureCount > 0 ? `🤖 Diagnose (${totalFailureCount})` : 'Last Diagnosis'}
              </Button>
            </>
          )}
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={handleExportPricing} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportChanges} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Changes
          </Button>
          <div className="h-4 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={handleClearInactiveStoreCache} disabled={isClearingInactiveCache} className="text-xs gap-1.5 text-muted-foreground hover:text-destructive">
                {isClearingInactiveCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Clear Inactive
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear URL cache entries for deactivated stores (removes stale Failed rows)</TooltipContent>
          </Tooltip>
          {canPopulateUrls && (
            <>
              <div className="h-4 w-px bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={handlePopulateRegionalUrls} disabled={isBusy || isPopulatingUrls} className="text-xs gap-1.5">
                    {isPopulatingUrls ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} Populate URLs
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generate regional store URLs for {vendorFilter} products</TooltipContent>
              </Tooltip>
            </>
          )}
          {isBusy && (
            <Button size="sm" variant="ghost" onClick={() => { abortRef.current = true; abortSyncRef.current = true; }} className="text-xs text-destructive">
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bars */}
        {bulkProgress && (
          <div className="space-y-1">
            <Progress value={(bulkProgress.done / bulkProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Testing {bulkProgress.done}/{bulkProgress.total} products
              {bulkProgress.variants && <span className="text-muted-foreground/70"> (covering {bulkProgress.variants} variants)</span>}
            </p>
          </div>
        )}
        {bulkSyncProgress && (
          <div className="space-y-1">
            <Progress value={(bulkSyncProgress.done / bulkSyncProgress.total) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Syncing {bulkSyncProgress.done}/{bulkSyncProgress.total} products
              {bulkSyncProgress.variants && <span className="text-muted-foreground/70"> (covering {bulkSyncProgress.variants} variants)</span>}
            </p>
          </div>
        )}

        {/* Data table */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-10">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                    </TableHead>
                    <TableHead className="min-w-[220px]">Product / Store</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Compare</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Result</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(group => {
                    const isExpanded = expandedProducts.has(group.productLineId);

                    return (
                      <ProductGroupRows
                        key={group.productLineId}
                        group={group}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleExpand(group.productLineId)}
                        selectedStoreKeys={selectedStoreKeys}
                        onToggleSelectStore={toggleSelectStore}
                        testResults={testResults}
                        syncResults={syncResults}
                        isBusy={isBusy}
                        onTestUrl={testSingleUrl}
                        onSyncPrice={syncSinglePrice}
                      />
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                        No pricing data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 200 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Showing 200 of {filtered.length} products. Use filters to narrow down.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnosis Modal */}
      <Dialog open={showDiagnosisModal} onOpenChange={setShowDiagnosisModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Sync Failure Diagnosis
              {diagnosisResult && (
                <Badge className={`ml-2 text-[10px] ${
                  diagnosisResult.overallHealth === 'poor' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  diagnosisResult.overallHealth === 'fair' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {diagnosisResult.overallHealth === 'poor' ? '🔴' : diagnosisResult.overallHealth === 'fair' ? '🟡' : '🟢'} {diagnosisResult.overallHealth.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {diagnosisResult?.summary || 'Analyzing failures...'}
            </DialogDescription>
          </DialogHeader>

          {diagnosisResult && (
            <div className="space-y-3 mt-2">
              {diagnosisResult.diagnoses.map((d, i) => (
                <Card key={i} className={`border-l-4 ${
                  d.severity === 'high' ? 'border-l-red-500' :
                  d.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-emerald-500'
                }`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${
                          d.severity === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          d.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {d.severity}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{d.pattern}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{d.count} affected</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">{d.diagnosis}</p>
                    <p className="text-xs text-foreground"><span className="font-medium">Fix:</span> {d.suggestedFix}</p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5 h-7"
                        onClick={() => {
                          navigator.clipboard.writeText(generateLovablePrompt(d));
                          toast.success('Lovable fix prompt copied to clipboard');
                        }}
                      >
                        <Copy className="w-3 h-3" /> 📋 Copy Lovable Prompt
                      </Button>
                      {(d.pattern.includes('404') || d.pattern.toLowerCase().includes('broken link')) && d.contextualPromptParts?.failureDetails && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 h-7"
                            disabled={bulkSearchProgress?.running}
                            onClick={() => handleSearchAllBroken(d.contextualPromptParts!.failureDetails)}
                          >
                            {bulkSearchProgress?.running ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Searching {bulkSearchProgress.done}/{bulkSearchProgress.total}...</>
                            ) : (
                              <><Search className="w-3 h-3" /> 🔍 Search All Broken</>
                            )}
                          </Button>
                          {bulkSearchProgress && !bulkSearchProgress.running && bulkSearchProgress.found > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1.5 h-7 text-emerald-400 border-emerald-500/30"
                              onClick={() => handleApplyAllFixes(d.contextualPromptParts!.failureDetails)}
                            >
                              <Wrench className="w-3 h-3" /> Apply {bulkSearchProgress.found} fixes
                            </Button>
                          )}
                        </>
                      )}
                      {d.isTransient && (
                        <Badge variant="outline" className="text-[9px] text-muted-foreground">Transient — can retry</Badge>
                      )}
                    </div>

                    {d.affectedProducts.length > 0 && (
                      <Collapsible>
                        <CollapsibleTrigger className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1">
                          <ChevronRight className="w-3 h-3" /> Show {d.affectedProducts.length} affected products
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1 pl-4 space-y-1.5 max-h-48 overflow-y-auto">
                            {d.affectedProducts.map((p, j) => {
                              const detail = d.contextualPromptParts?.failureDetails?.[j];
                              const sr = detail ? searchResults[detail.url] : undefined;
                              const isBroken = d.pattern.includes('404') || d.pattern.toLowerCase().includes('broken link');

                              return (
                                <div key={j} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-muted-foreground font-mono flex-1 truncate">{p}</p>
                                    {isBroken && detail && !sr?.url && !sr?.loading && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[10px] h-6 px-2 gap-1 shrink-0"
                                        onClick={() => handleSearchStore(detail.url, detail.region)}
                                      >
                                        <Search className="w-3 h-3" /> Search
                                      </Button>
                                    )}
                                    {sr?.loading && (
                                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />
                                    )}
                                  </div>
                                  {sr?.url && (
                                    <div className="flex items-center gap-1.5 pl-2 text-[10px]">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <a href={sr.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate max-w-[200px]" title={sr.query ? `Search: ${sr.query}` : undefined}>
                                        {sr.url.replace(/^https?:\/\//, '').slice(0, 50)}
                                      </a>
                                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                                        {((sr.confidence || 0) * 100).toFixed(0)}%
                                      </Badge>
                                      <span className="text-muted-foreground text-[9px]">{sr.method}</span>
                                      <a href={sr.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground" /></a>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[9px] h-5 px-1.5 text-emerald-400"
                                        onClick={async () => {
                                          if (!detail) return;
                                          const col = REGION_URL_COLUMN_MAP[detail.region?.toUpperCase()] || 'product_url';
                                          const { data: filament } = await (supabase.from('filaments').select('id') as any).eq(col, detail.url).limit(1).maybeSingle();
                                          if (filament) {
                                            await supabase.from('filaments').update({ [col]: sr.url } as any).eq('id', filament.id);
                                            toast.success('URL updated');
                                            queryClient.invalidateQueries({ queryKey: ['admin-pricing-data-grouped'] });
                                          } else {
                                            toast.error('Could not find filament to update');
                                          }
                                        }}
                                      >
                                        Apply Fix
                                      </Button>
                                    </div>
                                  )}
                                  {sr?.error && !sr?.url && !sr?.loading && (
                                    <div className="flex items-center gap-1.5 pl-2 text-[10px]">
                                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                      <span className="text-amber-400">No match</span>
                                      {detail && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-[9px] h-5 px-1.5"
                                          onClick={() => {
                                            try {
                                              const urlObj = new URL(detail.url);
                                              const searchTerms = detail.product.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
                                              window.open(`${urlObj.origin}/search?q=${encodeURIComponent(searchTerms)}`, '_blank');
                                            } catch {
                                              toast.error('Could not build search URL');
                                            }
                                          }}
                                        >
                                          Manual Search
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              ))}

              {diagnosisResult.diagnoses.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full text-xs gap-1.5"
                  onClick={() => {
                    const fullPrompt = diagnosisResult.diagnoses
                      .map(d => generateLovablePrompt(d))
                      .join('\n\n---\n\n');
                    const header = `## Pricing Sync Diagnosis Report\n\n**Overall Health:** ${diagnosisResult.overallHealth}\n**Summary:** ${diagnosisResult.summary}\n\nThe following ${diagnosisResult.diagnoses.length} issue categories were found. Please address them in priority order:\n\n`;
                    navigator.clipboard.writeText(header + fullPrompt);
                    toast.success('Full diagnosis prompt copied to clipboard');
                  }}
                >
                  <Copy className="w-3 h-3" /> Copy All as Lovable Prompt
                </Button>
              )}

              {diagnosisResult.diagnoses.some(d => d.isTransient) && (
                <Button
                  variant="outline"
                  className="w-full text-xs gap-1.5"
                  onClick={handleRetryTransient}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry Transient Failures
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// =============================================
// ProductGroupRows - renders parent + children
// =============================================

interface ProductGroupRowsProps {
  group: ProductGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedStoreKeys: Set<string>;
  onToggleSelectStore: (key: string) => void;
  testResults: Map<string, TestResult>;
  syncResults: Map<string, SyncResult>;
  isBusy: boolean;
  onTestUrl: (storeKey: string, url: string, showToast?: boolean, region?: string) => Promise<TestResult>;
  onSyncPrice: (store: StoreRow, showToast?: boolean) => Promise<SyncResult>;
}

function ProductGroupRows({
  group, isExpanded, onToggleExpand, selectedStoreKeys, onToggleSelectStore,
  testResults, syncResults, isBusy, onTestUrl, onSyncPrice,
}: ProductGroupRowsProps) {
  return (
    <>
      {/* Parent row */}
      <TableRow
        className="bg-muted/30 hover:bg-muted/50 cursor-pointer border-b-0"
        onClick={onToggleExpand}
      >
        <TableCell className="w-8 px-2">
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="w-10">
          {/* No checkbox on parent — selection is per store */}
        </TableCell>
        <TableCell className="min-w-[220px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-foreground truncate max-w-[300px] block">{group.cleanName}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{group.vendor}</span>
              {group.material && <span className="text-[10px] text-muted-foreground font-mono">· {group.material}</span>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1">
              <Palette className="w-2.5 h-2.5" />
              {group.colorCount > 0 ? `${group.colorCount} colors` : `${group.variantCount} variants`}
            </Badge>
            {group.colorHexes.length > 0 && (
              <ColorSwatches hexes={group.colorHexes} max={6} />
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-xs">
          {group.hasPriceRange
            ? <span>${group.minPrice?.toFixed(2)} – ${group.maxPrice?.toFixed(2)}</span>
            : formatCurrency(group.minPrice, '$')
          }
        </TableCell>
        <TableCell></TableCell>
        <TableCell></TableCell>
        <TableCell></TableCell>
        <TableCell>
          <StatusSummary group={group} />
        </TableCell>
        <TableCell colSpan={1}>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {group.stores.length} store{group.stores.length !== 1 ? 's' : ''}
          </Badge>
        </TableCell>
        <TableCell colSpan={2}></TableCell>
      </TableRow>

      {/* Child store rows */}
      {isExpanded && group.stores.map((store, idx) => {
        const result = testResults.get(store.storeKey);
        const syncResult = syncResults.get(store.storeKey);
        const displayPrice = syncResult?.status === 'success' || syncResult?.status === 'unchanged'
          ? syncResult.newPrice ?? store.price
          : store.price;
        const isLast = idx === group.stores.length - 1;

        return (
          <TableRow
            key={store.storeKey}
            className={`${isLast ? '' : 'border-b-0'} hover:bg-muted/20 transition-colors duration-500 ${
              syncResult?.status === 'success' ? 'bg-emerald-500/10' :
              syncResult?.status === 'failed' ? 'bg-red-500/10' :
              syncResult?.status === 'unchanged' ? 'bg-yellow-500/5' : ''
            }`}
          >
            <TableCell className="w-8 px-2">
              <span className="text-muted-foreground/40 text-xs pl-1">└</span>
            </TableCell>
            <TableCell className="w-10">
              <Checkbox
                checked={selectedStoreKeys.has(store.storeKey)}
                onCheckedChange={() => onToggleSelectStore(store.storeKey)}
                aria-label={`Select ${store.storeName}`}
              />
            </TableCell>
            <TableCell className="min-w-[220px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs flex items-center gap-1.5 cursor-default">
                    <span>{store.regionFlag}</span>
                    <span className="font-medium">{group.vendor} {store.region}</span>
                    {store.isDerived && (
                      <span className="text-[9px] text-muted-foreground italic" title="URL derived from US store">🔗</span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {store.productUrl ? (() => { try { return new URL(store.productUrl).hostname; } catch { return store.productUrl; } })() : 'No URL'}
                  {store.isDerived && <p className="text-[10px] text-muted-foreground mt-0.5">Derived from US URL — not stored in database</p>}
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-mono text-xs">
              <span className={`flex items-center justify-end gap-1 ${
                syncResult?.status === 'success' && syncResult.percentChange
                  ? syncResult.percentChange > 0 ? 'text-red-400' : 'text-emerald-400'
                  : ''
              }`}>
                {formatCurrency(displayPrice, store.currencySymbol)}
                {syncResult?.source && (syncResult.status === 'success' || syncResult.status === 'unchanged') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 leading-tight ${syncResult.source === 'firecrawl' ? 'border-purple-400 text-purple-400' : syncResult.source === 'html' ? 'border-green-400 text-green-400' : 'border-emerald-400 text-emerald-400'}`}>
                        {syncResult.source === 'firecrawl' ? '🔥' : syncResult.source === 'html' ? '🌐' : '🛒'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {syncResult.source === 'firecrawl' ? 'Firecrawl' : syncResult.source === 'html' ? 'Direct Fetch' : 'Shopify JSON'}
                      {syncResult.location ? ` · ${syncResult.location}` : ''}
                    </TooltipContent>
                  </Tooltip>
                )}
                {syncResult?.currencyMismatch && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight border-yellow-400 text-yellow-400">
                        ⚠️
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Currency mismatch: got {syncResult.detectedCurrency}, expected {syncResult.requestedCurrency}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </TableCell>
            <TableCell className="text-right font-mono text-xs">
              {store.compareAtPrice != null && store.compareAtPrice > (displayPrice ?? 0)
                ? <span className="text-muted-foreground line-through">{formatCurrency(store.compareAtPrice, store.currencySymbol)}</span>
                : '—'}
            </TableCell>
            <TableCell>
              {syncResult ? (
                <SyncChangeIndicator syncResult={syncResult} currencySymbol={store.currencySymbol} currency={store.currency} />
              ) : (
                <PriceChangeIndicator change={store.priceChange} />
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{store.currency}</TableCell>
            <TableCell>
              {syncResult?.status === 'success' || syncResult?.status === 'unchanged'
                ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Active</Badge>
                : syncResult?.status === 'failed'
                ? <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">🔴 Failed</Badge>
                : syncResult?.status === 'unavailable'
                ? <Badge className="bg-muted/60 text-muted-foreground border-muted text-[10px]">⊘ N/A</Badge>
                : getLinkStatusBadge(store.linkStatus)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 flex-wrap">
                {result ? getTestResultBadge(result) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">⚪ Not Tested</Badge>
                )}
              {(syncResult?.status === 'success' || syncResult?.status === 'unchanged') && syncResult?.source && (
                  getSyncMethodBadge(syncResult.source)
                )}
                {syncResult?.status === 'unavailable' && (
                  <Badge className="bg-muted/60 text-muted-foreground border-muted text-[10px]">⊘ Not in Region</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
              {syncResult?.status === 'success' || syncResult?.status === 'unchanged'
                ? 'just now'
                : store.lastScrapedAt
                  ? formatDistanceToNow(new Date(store.lastScrapedAt), { addSuffix: true })
                  : '—'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {store.productUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        disabled={syncResult?.status === 'syncing' || store.linkStatus === 'broken' || isBusy}
                        onClick={() => onSyncPrice(store)}
                      >
                        {syncResult?.status === 'syncing'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RefreshCw className={`w-3.5 h-3.5 ${syncResult?.status === 'success' ? 'text-emerald-400' : syncResult?.status === 'failed' ? 'text-red-400' : ''}`} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {store.linkStatus === 'broken' ? 'Cannot sync — broken link' : `Sync price (updates ${store.allFilamentIds.length} variants)`}
                    </TooltipContent>
                  </Tooltip>
                )}
                {store.productUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7"
                        disabled={result?.status === 'testing' || isBusy}
                        onClick={() => onTestUrl(store.storeKey, store.productUrl!, true, store.region)}
                      >
                        {result?.status === 'testing'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Play className="w-3.5 h-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Test link</TooltipContent>
                  </Tooltip>
                )}
                {store.productUrl ? (
                  <a href={store.productUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
