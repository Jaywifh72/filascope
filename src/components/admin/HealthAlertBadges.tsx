import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, Globe } from 'lucide-react';

interface HealthAlerts {
  staleProducts: number;
  lowPassRate: boolean;
  missingStores: number;
  lastCheckPassRate: number | null;
}

export function HealthAlertBadges() {
  const [alerts, setAlerts] = useState<HealthAlerts>({
    staleProducts: 0,
    lowPassRate: false,
    missingStores: 0,
    lastCheckPassRate: null,
  });

  useEffect(() => {
    fetchHealthAlerts();
  }, []);

  const fetchHealthAlerts = async () => {
    try {
      // Check stale products (> 7 days old)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: staleCount } = await supabase
        .from('filaments')
        .select('id', { count: 'exact', head: true })
        .eq('variant_available', true)
        .not('variant_price', 'is', null)
        .or(`last_scraped_at.is.null,last_scraped_at.lt.${sevenDaysAgo}`);

      // Get latest health check result
      const { data: latestCheck } = await supabase
        .from('admin_activity_log')
        .select('details')
        .eq('action_type', 'weekly_health_check')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const passRate = (latestCheck?.details as any)?.result?.overall_pass_rate;

      // Count brands without stores
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('id')
        .eq('is_visible', true);

      const { data: stores } = await supabase
        .from('brand_regional_stores')
        .select('brand_id')
        .eq('is_active', true);

      const brandsWithStores = new Set(stores?.map(s => s.brand_id) || []);
      const missingStores = (brands?.length || 0) - brandsWithStores.size;

      setAlerts({
        staleProducts: staleCount || 0,
        lowPassRate: passRate != null && passRate < 80,
        missingStores,
        lastCheckPassRate: passRate || null,
      });
    } catch (error) {
      console.error('Error fetching health alerts:', error);
    }
  };

  const hasAlerts = alerts.staleProducts > 50 || alerts.lowPassRate || alerts.missingStores > 10;

  if (!hasAlerts) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {alerts.lowPassRate && alerts.lastCheckPassRate != null && (
        <Link to="/admin/region-test">
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pass Rate: {alerts.lastCheckPassRate}%
          </Badge>
        </Link>
      )}
      
      {alerts.staleProducts > 50 && (
        <Link to="/admin/price-freshness">
          <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer">
            <Clock className="w-3 h-3 mr-1" />
            {alerts.staleProducts} Stale Prices
          </Badge>
        </Link>
      )}
      
      {alerts.missingStores > 10 && (
        <Link to="/admin/regional-expansion">
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 cursor-pointer">
            <Globe className="w-3 h-3 mr-1" />
            {alerts.missingStores} Missing Stores
          </Badge>
        </Link>
      )}
    </div>
  );
}
