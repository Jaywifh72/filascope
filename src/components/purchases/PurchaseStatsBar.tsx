import { DollarSign, ShoppingBag, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PurchaseStats } from "@/hooks/useUserPurchases";

interface PurchaseStatsBarProps {
  stats: PurchaseStats;
}

export function PurchaseStatsBar({ stats }: PurchaseStatsBarProps) {
  const topMaterial = Object.entries(stats.spendingByMaterial)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const topBrand = Object.entries(stats.spendingByBrand)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Total Purchases */}
      <Card className="bg-card/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalPurchases}</p>
            <p className="text-xs text-muted-foreground">Total Purchases</p>
          </div>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="bg-card/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              ${stats.totalSpent.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Total Spent
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Material */}
      <Card className="bg-card/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">
              {topMaterial[0]?.[0] || "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {topMaterial.length > 0
                ? `Top material · $${topMaterial[0][1].toFixed(0)}`
                : "No spending data"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SpendingBreakdown({ stats }: PurchaseStatsBarProps) {
  const materialEntries = Object.entries(stats.spendingByMaterial)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const brandEntries = Object.entries(stats.spendingByBrand)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxMaterial = materialEntries[0]?.[1] || 1;
  const maxBrand = brandEntries[0]?.[1] || 1;

  if (stats.totalSpent === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* By Material */}
      <Card className="bg-card/50">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold">Spending by Material</h4>
          <div className="space-y-2">
            {materialEntries.map(([material, amount]) => (
              <div key={material} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{material}</span>
                  <span className="text-muted-foreground">${amount.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(amount / maxMaterial) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Brand */}
      <Card className="bg-card/50">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold">Spending by Brand</h4>
          <div className="space-y-2">
            {brandEntries.map(([brand, amount]) => (
              <div key={brand} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{brand}</span>
                  <span className="text-muted-foreground">${amount.toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500/70"
                    style={{ width: `${(amount / maxBrand) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
