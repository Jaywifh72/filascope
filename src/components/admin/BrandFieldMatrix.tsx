import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Search, Download } from "lucide-react";
import type { BrandFieldFillRates } from "@/hooks/useFieldFillRates";
import { TRACKED_FIELDS } from "@/hooks/useFieldFillRates";

interface BrandFieldMatrixProps {
  brands: BrandFieldFillRates[];
}

type SortField = 'vendor' | 'productCount' | 'overallPercentage' | string;
type SortDirection = 'asc' | 'desc';

function getCellColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500/20 text-green-700 dark:text-green-300';
  if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
  if (percentage >= 20) return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
  return 'bg-red-500/20 text-red-700 dark:text-red-300';
}

// Key fields to show in the matrix (subset for readability)
const MATRIX_FIELDS = [
  'transmission_distance',
  'color_hex',
  'tensile_strength_xy_mpa',
  'density_g_cm3',
  'nozzle_temp_min_c',
  'drying_temp_c',
  'tds_url',
  'mpn',
];

export function BrandFieldMatrix({ brands }: BrandFieldMatrixProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('productCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showWorstOnly, setShowWorstOnly] = useState(false);

  const displayFields = TRACKED_FIELDS.filter(f => MATRIX_FIELDS.includes(f.field));

  const filteredBrands = useMemo(() => {
    let result = brands.filter(b => 
      b.vendor.toLowerCase().includes(search.toLowerCase())
    );

    if (showWorstOnly) {
      result = result.filter(b => b.overallPercentage < 50);
    }

    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortField === 'vendor') {
        aVal = a.vendor;
        bVal = b.vendor;
      } else if (sortField === 'productCount') {
        aVal = a.productCount;
        bVal = b.productCount;
      } else if (sortField === 'overallPercentage') {
        aVal = a.overallPercentage;
        bVal = b.overallPercentage;
      } else {
        aVal = a.fields[sortField]?.percentage ?? 0;
        bVal = b.fields[sortField]?.percentage ?? 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [brands, search, sortField, sortDirection, showWorstOnly]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportCSV = () => {
    const headers = ['Brand', 'Products', 'Overall %', ...displayFields.map(f => f.label)];
    const rows = filteredBrands.map(b => [
      b.vendor,
      b.productCount,
      b.overallPercentage,
      ...displayFields.map(f => b.fields[f.field]?.percentage ?? 0)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-coverage-by-brand.csv';
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Brand Field Coverage Matrix</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Button
              variant={showWorstOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowWorstOnly(!showWorstOnly)}
            >
              Worst Only
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('vendor')}>
                    Brand
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('productCount')}>
                    #
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('overallPercentage')}>
                    Avg
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                {displayFields.map(field => (
                  <TableHead key={field.field} className="text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort(field.field)}
                      className="text-xs px-1"
                    >
                      {field.label.replace(' ', '\n').split(' ')[0]}
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.slice(0, 50).map(brand => (
                <TableRow key={brand.vendor}>
                  <TableCell className="sticky left-0 bg-background font-medium">
                    {brand.vendor}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{brand.productCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.overallPercentage >= 50 ? "default" : "destructive"}>
                      {brand.overallPercentage}%
                    </Badge>
                  </TableCell>
                  {displayFields.map(field => {
                    const pct = brand.fields[field.field]?.percentage ?? 0;
                    return (
                      <TableCell key={field.field} className="text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCellColor(pct)}`}>
                          {pct}%
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredBrands.length > 50 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Showing 50 of {filteredBrands.length} brands
          </p>
        )}
      </CardContent>
    </Card>
  );
}
