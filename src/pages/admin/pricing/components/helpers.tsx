import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpRight, ArrowDownRight, Minus, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { LinkStatus, TestResult, SyncResult, StoreRow, ProductGroup } from '../types';

export function getLinkStatusBadge(status: LinkStatus) {
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

export function getSyncMethodBadge(source: string | undefined) {
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

export function getBypassMethodLabel(result: TestResult): string | null {
  if (!result.fetchMethod || result.fetchMethod === 'direct') return null;
  if (result.fetchMethod === 'spoofed') return 'Spoofed';
  if (result.fetchMethod === 'redirected') return 'Redirected';
  return null;
}

export function getTestResultBadge(result: TestResult | undefined) {
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

export function PriceChangeIndicator({ change }: { change: StoreRow['priceChange'] }) {
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

export function SyncChangeIndicator({ syncResult, currencySymbol, currency }: { syncResult: SyncResult; currencySymbol: string; currency?: string }) {
  const fmt = (v?: number) => v != null ? `${currencySymbol}${v.toFixed(currency === 'JPY' ? 0 : 2)}` : '—';

  if (syncResult.status === 'syncing') return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  if (syncResult.status === 'unavailable') {
    return (
      <Tooltip>
        <TooltipTrigger asChild><span className="text-muted-foreground cursor-default text-xs">⊘</span></TooltipTrigger>
        <TooltipContent className="max-w-xs">{syncResult.error || 'Not available in this region'}</TooltipContent>
      </Tooltip>
    );
  }
  if (syncResult.status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild><span className="text-destructive cursor-default text-xs font-medium">✗</span></TooltipTrigger>
        <TooltipContent className="max-w-xs">{syncResult.error || 'Price extraction failed'}</TooltipContent>
      </Tooltip>
    );
  }
  if (syncResult.status === 'unchanged') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground flex items-center gap-1 text-xs cursor-default"><Minus className="w-3 h-3" /> Same</span>
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
        <TooltipContent>{fmt(syncResult.oldPrice)} → {fmt(syncResult.newPrice)}</TooltipContent>
      </Tooltip>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

export function StatusSummary({ group }: { group: ProductGroup }) {
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

export function ColorSwatches({ hexes, max = 10 }: { hexes: string[]; max?: number }) {
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
