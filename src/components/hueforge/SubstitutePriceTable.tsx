import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ExternalLink } from 'lucide-react';
import type { TDFilament } from './SubstituteFilamentPicker';

type SortKey = 'vendor' | 'td' | 'td_diff' | 'price';

interface Props {
  source: TDFilament;
  substitutes: TDFilament[];
  formatPrice?: (price: number) => string;
}

export function SubstitutePriceTable({ source, substitutes, formatPrice }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('td_diff');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sourceTd = source.transmission_distance ?? 0;
  const sourcePrice = source.variant_price;

  const sorted = [...substitutes].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;
    switch (sortKey) {
      case 'vendor': aVal = a.vendor || ''; bVal = b.vendor || ''; break;
      case 'td': aVal = a.transmission_distance ?? 0; bVal = b.transmission_distance ?? 0; break;
      case 'td_diff': aVal = Math.abs((a.transmission_distance ?? 0) - sourceTd); bVal = Math.abs((b.transmission_distance ?? 0) - sourceTd); break;
      case 'price': aVal = a.variant_price ?? Infinity; bVal = b.variant_price ?? Infinity; break;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortKey }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortKey === field ? 'text-primary' : 'text-muted-foreground'}`} />
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('vendor')}>Brand <SortIcon field="vendor" /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('td')}>TD <SortIcon field="td" /></TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('td_diff')}>TD Diff <SortIcon field="td_diff" /></TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('price')}>Price <SortIcon field="price" /></TableHead>
              <TableHead className="text-right">Price Diff</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.slice(0, 50).map((f) => {
              const td = f.transmission_distance ?? 0;
              const tdDiff = td - sourceTd;
              const priceDiff = sourcePrice != null && f.variant_price != null
                ? f.variant_price - sourcePrice
                : null;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium text-sm">{f.vendor}</TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">{f.product_title}</TableCell>
                  <TableCell className="text-right text-sm">{td.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={Math.abs(tdDiff) <= 0.05 ? 'text-green-400' : Math.abs(tdDiff) <= 0.2 ? 'text-amber-400' : ''}>
                      {tdDiff >= 0 ? '+' : ''}{tdDiff.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {f.variant_price != null && formatPrice ? formatPrice(f.variant_price) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {priceDiff != null && formatPrice ? (
                      <span className={priceDiff < 0 ? 'text-green-400' : priceDiff > 0 ? 'text-red-400' : ''}>
                        {priceDiff >= 0 ? '+' : ''}{formatPrice(Math.abs(priceDiff))}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link to={`/filament/${f.product_handle || f.id}`}><ExternalLink className="w-3 h-3" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
