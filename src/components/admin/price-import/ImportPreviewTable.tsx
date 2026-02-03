import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ScrapedProduct } from '@/types/priceImport';
import { formatPrice } from '@/utils/formatPrice';

interface ImportPreviewTableProps {
  products: ScrapedProduct[];
  maxItems?: number;
}

type SortField = 'brand' | 'region' | 'product_title' | 'price' | 'available';
type SortDirection = 'asc' | 'desc';

const REGION_BADGE_COLORS: Record<string, string> = {
  US: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  UK: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  EU: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  AU: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  JP: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  CN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const REGION_EMOJI: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  UK: '🇬🇧',
  EU: '🇪🇺',
  AU: '🇦🇺',
  JP: '🇯🇵',
  CN: '🇨🇳',
};

export function ImportPreviewTable({ 
  products, 
  maxItems = 50 
}: ImportPreviewTableProps) {
  const [sortField, setSortField] = useState<SortField>('brand');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      let aVal: string | number | boolean;
      let bVal: string | number | boolean;

      switch (sortField) {
        case 'brand':
          aVal = a.brand.toLowerCase();
          bVal = b.brand.toLowerCase();
          break;
        case 'region':
          aVal = a.region;
          bVal = b.region;
          break;
        case 'product_title':
          aVal = a.product_title.toLowerCase();
          bVal = b.product_title.toLowerCase();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'available':
          aVal = a.available ? 1 : 0;
          bVal = b.available ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted.slice(0, maxItems);
  }, [products, sortField, sortDirection, maxItems]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-4 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Preview (showing {sortedProducts.length} of {products.length.toLocaleString()})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader field="brand">Brand</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader field="region">Region</SortableHeader>
                </TableHead>
                <TableHead className="min-w-[250px]">
                  <SortableHeader field="product_title">Product Title</SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                  <SortableHeader field="price">Price</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader field="available">Stock</SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product, index) => (
                <TableRow key={`${product.product_url}-${index}`}>
                  <TableCell className="font-medium">{product.brand}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={REGION_BADGE_COLORS[product.region] || ''}
                    >
                      {REGION_EMOJI[product.region] || '🌍'} {product.region}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={product.full_title}>
                    {product.product_title}
                    {product.variant_title && (
                      <span className="text-muted-foreground ml-1">
                        - {product.variant_title}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(product.price, product.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span 
                      className={`inline-block w-2 h-2 rounded-full ${
                        product.available ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      title={product.available ? 'In Stock' : 'Out of Stock'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
