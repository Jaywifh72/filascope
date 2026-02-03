import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpDown, ExternalLink } from 'lucide-react';
import { getRegionFlag, REGION_DISPLAY } from '@/config/countries';
import type { Store, StoreType } from '@/types/regional';

interface StoreTableProps {
  stores: Store[];
  onEdit: (store: Store) => void;
  onDelete: (store: Store) => void;
  onToggleActive: (store: Store) => void;
  isUpdating?: boolean;
}

type SortField = 'name' | 'store_type' | 'region' | 'currency_code' | 'is_active';
type SortDirection = 'asc' | 'desc';

const STORE_TYPE_LABELS: Record<StoreType, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  marketplace: { label: 'Marketplace', variant: 'default' },
  brand_direct: { label: 'Brand Direct', variant: 'secondary' },
  retailer: { label: 'Retailer', variant: 'outline' },
};

export function StoreTable({
  stores,
  onEdit,
  onDelete,
  onToggleActive,
  isUpdating = false,
}: StoreTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStores = [...stores].sort((a, b) => {
    let aValue: string | boolean = '';
    let bValue: string | boolean = '';

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'store_type':
        aValue = a.store_type;
        bValue = b.store_type;
        break;
      case 'region':
        aValue = a.region;
        bValue = b.region;
        break;
      case 'currency_code':
        aValue = a.currency_code || '';
        bValue = b.currency_code || '';
        break;
      case 'is_active':
        aValue = a.is_active;
        bValue = b.is_active;
        break;
    }

    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc'
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    </TableHead>
  );

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No stores found matching your filters.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="name">Store</SortableHeader>
          <SortableHeader field="store_type">Type</SortableHeader>
          <SortableHeader field="region">Region</SortableHeader>
          <SortableHeader field="currency_code">Currency</SortableHeader>
          <TableHead>Ships From</TableHead>
          <SortableHeader field="is_active">Active</SortableHeader>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedStores.map((store) => {
          const typeConfig = STORE_TYPE_LABELS[store.store_type];
          const regionDisplay = REGION_DISPLAY[store.region] || { flag: '🌐', name: store.region };

          return (
            <TableRow key={store.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{store.name}</span>
                  <span className="text-xs text-muted-foreground">{store.slug}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <span>{regionDisplay.flag}</span>
                  <span>{store.region}</span>
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{store.currency_code || '-'}</span>
              </TableCell>
              <TableCell>
                {store.ships_from && store.ships_from.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {store.ships_from.slice(0, 3).map((country) => (
                      <Badge key={country} variant="outline" className="text-xs">
                        {getRegionFlag(country)} {country}
                      </Badge>
                    ))}
                    {store.ships_from.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{store.ships_from.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={store.is_active}
                  onCheckedChange={() => onToggleActive(store)}
                  disabled={isUpdating}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {store.base_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={store.base_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(store)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(store)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
