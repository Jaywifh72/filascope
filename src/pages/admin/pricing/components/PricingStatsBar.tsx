import { Card, CardContent } from '@/components/ui/card';
import type { PricingStats } from '../types';

interface PricingStatsBarProps {
  stats: PricingStats;
  onStatusFilter: (status: string) => void;
}

export function PricingStatsBar({ stats, onStatusFilter }: PricingStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => onStatusFilter('all')}>
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.totalProducts.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">{stats.totalVariants.toLocaleString()} variants</p>
        </CardContent>
      </Card>
      <Card className="border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-400/50 transition-colors" onClick={() => onStatusFilter('active')}>
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-[11px] text-emerald-400/70">Active Links</p>
        </CardContent>
      </Card>
      <Card className="border-yellow-500/30 bg-yellow-500/5 cursor-pointer hover:border-yellow-400/50 transition-colors" onClick={() => onStatusFilter('stale')}>
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.stale}</p>
          <p className="text-[11px] text-yellow-400/70">Stale Links</p>
        </CardContent>
      </Card>
      <Card className="border-red-500/30 bg-red-500/5 cursor-pointer hover:border-red-400/50 transition-colors" onClick={() => onStatusFilter('broken')}>
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.broken}</p>
          <p className="text-[11px] text-red-400/70">Broken Links</p>
        </CardContent>
      </Card>
      <Card className="border-purple-500/30 bg-purple-500/5 cursor-pointer hover:border-purple-400/50 transition-colors" onClick={() => onStatusFilter('alert')}>
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
  );
}
