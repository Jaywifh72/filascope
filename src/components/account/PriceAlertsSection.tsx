import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDatabasePriceAlerts } from '@/hooks/useDatabasePriceAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TrendingDown, ExternalLink, Trash2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export function PriceAlertsSection() {
  const { user } = useAuth();
  const { alerts, triggeredAlerts, isLoading, removeAlert } = useDatabasePriceAlerts();
  const { formatPrice } = useCurrency();

  if (!user) return null;

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BellOff className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-2">No price alerts set</p>
            <p className="text-muted-foreground/70 text-xs">
              Browse filaments and click "Set Price Alert" to get notified when prices drop.
            </p>
            <div className="mt-4">
              <Button asChild className="bg-primary hover:bg-primary/80 text-primary-foreground font-medium px-6 py-2.5 rounded-lg transition-colors">
                <Link to="/filaments">Browse Filaments</Link>
              </Button>
            </div>
            <Link to="/vault?tab=wishlist" className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors mt-3">
              Or set alerts from your wishlist →
            </Link>
            <p className="text-xs text-slate-500 mt-3">
              💡 Get notified when filaments on your wishlist drop in price
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            Price Alerts
          </span>
          {triggeredAlerts.length > 0 && (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              {triggeredAlerts.length} triggered!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const currentPrice = alert.filament?.variant_price;
          const isTriggered = currentPrice && currentPrice <= alert.target_price;
          const percentDrop = currentPrice && alert.current_price_when_set
            ? Math.round((1 - currentPrice / alert.current_price_when_set) * 100)
            : 0;

          return (
            <div
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isTriggered 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-muted/30 border-border'
              }`}
            >
              {/* Image */}
              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {alert.filament?.featured_image ? (
                  <img
                    src={alert.filament.featured_image}
                    alt={alert.filament.product_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Bell className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/filament/${alert.filament_id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {alert.filament?.product_title || 'Unknown filament'}
                </Link>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Alert: {formatPrice(alert.target_price)}</span>
                  {currentPrice && (
                    <>
                      <span>•</span>
                      <span className={isTriggered ? 'text-green-400' : ''}>
                        Now: {formatPrice(currentPrice)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status */}
              {isTriggered && (
                <Badge className="bg-green-500 text-white shrink-0">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {percentDrop > 0 ? `-${percentDrop}%` : 'Target reached!'}
                </Badge>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8"
                >
                  <Link to={`/filament/${alert.filament_id}`}>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAlert(alert.filament_id)}
                  className="h-8 w-8 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
