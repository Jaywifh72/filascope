import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Loader2,
} from 'lucide-react';

interface ParsedRow {
  product_id: string;
  price: number;
  currency: string;
  store_url?: string;
  notes?: string;
  productName?: string;
  currentPrice?: number;
  priceChange?: number;
  status: 'pending' | 'valid' | 'invalid' | 'success' | 'error';
  error?: string;
}

interface PriceBulkImportProps {
  onImportComplete: () => void;
}

export function PriceBulkImport({ onImportComplete }: PriceBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'importing' | 'complete'>('idle');

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const requiredHeaders = ['product_id', 'price'];

    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const price = parseFloat(row.price);
      if (isNaN(price) || price <= 0) {
        rows.push({
          product_id: row.product_id || '',
          price: 0,
          currency: row.currency || 'USD',
          store_url: row.store_url,
          notes: row.notes,
          status: 'invalid',
          error: 'Invalid price value',
        });
        continue;
      }

      if (!row.product_id) {
        rows.push({
          product_id: '',
          price,
          currency: row.currency || 'USD',
          status: 'invalid',
          error: 'Missing product_id',
        });
        continue;
      }

      rows.push({
        product_id: row.product_id,
        price,
        currency: row.currency || 'USD',
        store_url: row.store_url,
        notes: row.notes,
        status: 'pending',
      });
    }

    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setImportStatus('validating');
      setIsValidating(true);

      // Validate product IDs by looking them up
      const validIds = parsed.filter((r) => r.status === 'pending').map((r) => r.product_id);

      const { data: products } = await supabase
        .from('filaments')
        .select('id, product_title, variant_price')
        .in('id', validIds);

      const productMap = new Map(products?.map((p) => [p.id, p]) || []);

      const validated = parsed.map((row) => {
        if (row.status === 'invalid') return row;

        const product = productMap.get(row.product_id);
        if (!product) {
          return {
            ...row,
            status: 'invalid' as const,
            error: 'Product not found',
          };
        }

        const priceChange = product.variant_price
          ? ((row.price - product.variant_price) / product.variant_price) * 100
          : null;

        return {
          ...row,
          productName: product.product_title,
          currentPrice: product.variant_price,
          priceChange,
          status: 'valid' as const,
        };
      });

      setParsedData(validated);
      setIsValidating(false);
      setImportStatus('idle');
    } catch (error) {
      toast.error('Failed to parse CSV: ' + (error as Error).message);
      setIsValidating(false);
      setImportStatus('idle');
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const validRows = parsedData.filter((r) => r.status === 'valid');
      setImportStatus('importing');
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress(((i + 1) / validRows.length) * 100);

        try {
          // Update filament price
          const { error: updateError } = await supabase
            .from('filaments')
            .update({
              variant_price: row.price,
              last_scraped_at: new Date().toISOString(),
              price_source: 'bulk_import',
              product_url: row.store_url || undefined,
            })
            .eq('id', row.product_id);

          if (updateError) throw updateError;

          // Insert price history
          await supabase.from('price_history').insert({
            filament_id: row.product_id,
            price: row.price,
            currency: row.currency,
            source: 'bulk_import',
            notes: row.notes || null,
            recorded_at: new Date().toISOString(),
            region: 'US',
          });

          // Update status
          setParsedData((prev) =>
            prev.map((r) =>
              r.product_id === row.product_id ? { ...r, status: 'success' as const } : r
            )
          );
          successCount++;
        } catch (error) {
          setParsedData((prev) =>
            prev.map((r) =>
              r.product_id === row.product_id
                ? { ...r, status: 'error' as const, error: (error as Error).message }
                : r
            )
          );
          errorCount++;
        }
      }

      setImportStatus('complete');
      return { successCount, errorCount };
    },
    onSuccess: ({ successCount, errorCount }) => {
      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} prices`);
      } else {
        toast.warning(`Imported ${successCount} prices, ${errorCount} failed`);
      }
      onImportComplete();
    },
    onError: (error) => {
      toast.error('Import failed: ' + (error as Error).message);
      setImportStatus('idle');
    },
  });

  const downloadTemplate = () => {
    const template = 'product_id,price,currency,store_url,notes\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedData.filter((r) => r.status === 'invalid').length;
  const successCount = parsedData.filter((r) => r.status === 'success').length;
  const errorCount = parsedData.filter((r) => r.status === 'error').length;

  const reset = () => {
    setParsedData([]);
    setImportProgress(0);
    setImportStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Price Import
          </CardTitle>
          <CardDescription>
            Upload a CSV file to update multiple product prices at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isValidating || importMutation.isPending}
            />
            <Button variant="outline" onClick={downloadTemplate} className="gap-2 whitespace-nowrap">
              <Download className="w-4 h-4" />
              Template
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Required columns:</strong> product_id, price
            </p>
            <p>
              <strong>Optional columns:</strong> currency, store_url, notes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Import Preview
                </CardTitle>
                <div className="flex gap-3 mt-2">
                  {validCount > 0 && (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {validCount} valid
                    </Badge>
                  )}
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="text-red-500 border-red-500/30">
                      <XCircle className="w-3 h-3 mr-1" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                  {successCount > 0 && (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                      {successCount} imported
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="outline" className="text-red-500 border-red-500/30">
                      {errorCount} failed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset}>
                  Clear
                </Button>
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={validCount === 0 || importMutation.isPending || importStatus === 'complete'}
                  className="gap-2"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import {validCount} Prices</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {importMutation.isPending && (
              <div className="mb-4 space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Importing... {Math.round(importProgress)}%
                </p>
              </div>
            )}

            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow
                      key={index}
                      className={
                        row.status === 'invalid' || row.status === 'error'
                          ? 'bg-red-500/5'
                          : row.status === 'success'
                          ? 'bg-emerald-500/5'
                          : row.priceChange && Math.abs(row.priceChange) > 20
                          ? 'bg-amber-500/5'
                          : ''
                      }
                    >
                      <TableCell>
                        {row.status === 'valid' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {row.status === 'invalid' && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {row.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {row.status === 'error' && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {row.status === 'pending' && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.productName || row.product_id}
                        {row.error && (
                          <p className="text-xs text-red-500 mt-1">{row.error}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {row.currentPrice ? `$${row.currentPrice.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${row.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.priceChange !== undefined && row.priceChange !== null && (
                          <Badge
                            variant="outline"
                            className={
                              Math.abs(row.priceChange) > 20
                                ? 'text-amber-500 border-amber-500/30'
                                : row.priceChange > 0
                                ? 'text-red-500 border-red-500/30'
                                : row.priceChange < 0
                                ? 'text-emerald-500 border-emerald-500/30'
                                : ''
                            }
                          >
                            {row.priceChange > 0 ? '+' : ''}
                            {row.priceChange.toFixed(1)}%
                            {Math.abs(row.priceChange) > 20 && (
                              <AlertTriangle className="w-3 h-3 ml-1" />
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {row.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
