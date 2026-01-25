import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, RefreshCw, Plus, Clock, TrendingUp, AlertCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExchangeRatesTable } from '@/components/admin/exchange-rates/ExchangeRatesTable';
import { AddExchangeRateDialog } from '@/components/admin/exchange-rates/AddExchangeRateDialog';
import { EditExchangeRateDialog } from '@/components/admin/exchange-rates/EditExchangeRateDialog';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CURRENCIES, CURRENCY_LIST } from '@/config/currencies';
import { CurrencyCode, CurrencyExchangeRate } from '@/types/regional';
import { formatDistanceToNow } from 'date-fns';

export default function AdminExchangeRates() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<CurrencyExchangeRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all exchange rates
  const { data: exchangeRates, isLoading, refetch } = useQuery({
    queryKey: ['admin-exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('*')
        .order('target_currency');
      
      if (error) throw error;
      return data as CurrencyExchangeRate[];
    },
  });

  // Delete rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('currency_exchange_rates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exchange-rates'] });
      toast({ title: 'Exchange rate deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete rate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Stats
  const stats = {
    totalRates: exchangeRates?.length || 0,
    currenciesCovered: new Set(exchangeRates?.map(r => r.target_currency)).size,
    lastUpdated: exchangeRates?.reduce((latest, rate) => {
      const rateDate = new Date(rate.fetched_at);
      return rateDate > latest ? rateDate : latest;
    }, new Date(0)),
    missingCurrencies: CURRENCY_LIST.filter(
      c => !exchangeRates?.some(r => r.target_currency === c.code)
    ),
  };

  const hasStaleRates = stats.lastUpdated && 
    (new Date().getTime() - stats.lastUpdated.getTime()) > 24 * 60 * 60 * 1000;

  // Export to JSON
  const handleExportJSON = () => {
    if (!exchangeRates || exchangeRates.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const exportData = exchangeRates.map(rate => ({
      base_currency: rate.base_currency,
      target_currency: rate.target_currency,
      rate: rate.rate,
      inverse_rate: rate.inverse_rate,
      source: rate.source,
      fetched_at: rate.fetched_at,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast({ title: `Exported ${exchangeRates.length} exchange rates` });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with back navigation */}
        <AdminPageHeader
          title="Currency Exchange Rates"
          description="Manage exchange rates for regional price conversions"
          icon={DollarSign}
          iconColor="text-green-500"
          actions={
            <>
              <Button variant="outline" onClick={handleExportJSON} className="gap-2">
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Rate
              </Button>
            </>
          }
        />

        {/* Stale Warning */}
        {hasStaleRates && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">Exchange rates may be outdated</p>
                <p className="text-sm text-muted-foreground">
                  Last update was {stats.lastUpdated ? formatDistanceToNow(stats.lastUpdated, { addSuffix: true }) : 'unknown'}.
                  Consider updating rates for accurate price conversions.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-card">
            <p className="text-2xl font-bold text-foreground">{stats.totalRates}</p>
            <p className="text-sm text-muted-foreground">Total Rates</p>
          </Card>
          <Card className="p-4 bg-card">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{stats.currenciesCovered}</p>
            </div>
            <p className="text-sm text-muted-foreground">Currencies Covered</p>
          </Card>
          <Card className="p-4 bg-card">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">
                {stats.lastUpdated && stats.lastUpdated.getTime() > 0
                  ? formatDistanceToNow(stats.lastUpdated, { addSuffix: true })
                  : 'Never'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
          </Card>
          <Card className="p-4 bg-card">
            <p className={`text-2xl font-bold ${stats.missingCurrencies.length > 0 ? 'text-amber-500' : 'text-green-500'}`}>
              {stats.missingCurrencies.length}
            </p>
            <p className="text-sm text-muted-foreground">Missing Currencies</p>
            {stats.missingCurrencies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.missingCurrencies.slice(0, 3).map(c => (
                  <Badge key={c.code} variant="outline" className="text-xs">
                    {c.code}
                  </Badge>
                ))}
                {stats.missingCurrencies.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{stats.missingCurrencies.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Main Table */}
        <ExchangeRatesTable
          rates={exchangeRates || []}
          isLoading={isLoading}
          onEdit={setEditingRate}
          onDelete={(id) => deleteRateMutation.mutate(id)}
        />

        {/* Add Dialog */}
        <AddExchangeRateDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          existingCurrencies={exchangeRates?.map(r => r.target_currency as CurrencyCode) || []}
          onSuccess={() => {
            refetch();
            setShowAddDialog(false);
          }}
        />

        {/* Edit Dialog */}
        <EditExchangeRateDialog
          rate={editingRate}
          open={!!editingRate}
          onOpenChange={(open) => !open && setEditingRate(null)}
          onSuccess={() => {
            refetch();
            setEditingRate(null);
          }}
        />
        </div>
      </div>
    </AdminLayout>
  );
}
