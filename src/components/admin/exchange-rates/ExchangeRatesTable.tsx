import { Edit, Trash2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CURRENCIES } from '@/config/currencies';
import { CurrencyExchangeRate, CurrencyCode } from '@/types/regional';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  rates: CurrencyExchangeRate[];
  isLoading: boolean;
  onEdit: (rate: CurrencyExchangeRate) => void;
  onDelete: (id: string) => void;
}

export function ExchangeRatesTable({ rates, isLoading, onEdit, onDelete }: Props) {
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (rates.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">No exchange rates configured</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add exchange rates to enable price conversions across regions.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Currency Pair</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Inverse Rate</TableHead>
            <TableHead>Example</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((rate) => {
            const targetConfig = CURRENCIES[rate.target_currency as CurrencyCode];
            const baseConfig = CURRENCIES[rate.base_currency as CurrencyCode];
            const isBaseSame = rate.base_currency === rate.target_currency;

            return (
              <TableRow key={rate.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {rate.base_currency}
                    </Badge>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <Badge variant={isBaseSame ? 'secondary' : 'default'} className="font-mono">
                      {rate.target_currency}
                    </Badge>
                    {targetConfig && (
                      <span className="text-sm text-muted-foreground">
                        {targetConfig.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-medium">
                    {rate.rate.toFixed(6)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-muted-foreground">
                    {rate.inverse_rate.toFixed(6)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {baseConfig?.symbol}100 = {targetConfig?.symbol}{(100 * rate.rate).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {rate.source || 'manual'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(rate.fetched_at), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(rate)}
                      disabled={isBaseSame}
                      title={isBaseSame ? 'Cannot edit base rate' : 'Edit rate'}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={isBaseSame}
                          title={isBaseSame ? 'Cannot delete base rate' : 'Delete rate'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Exchange Rate?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the {rate.base_currency} → {rate.target_currency} exchange rate.
                            Price conversions for {rate.target_currency} will fall back to default rates.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(rate.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
