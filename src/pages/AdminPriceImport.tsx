import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Play, TestTube } from 'lucide-react';
import { usePriceImport } from '@/hooks/usePriceImport';
import { FileDropzone } from '@/components/admin/price-import/FileDropzone';
import { ImportFileSummary } from '@/components/admin/price-import/ImportFileSummary';
import { ImportPreviewTable } from '@/components/admin/price-import/ImportPreviewTable';
import { ImportProgressBar } from '@/components/admin/price-import/ImportProgressBar';
import { ImportHistoryTable } from '@/components/admin/price-import/ImportHistoryTable';

export default function AdminPriceImport() {
  const {
    parsedFile,
    progress,
    result,
    isProcessing,
    handleFileSelect,
    runImport,
    clearFile,
  } = usePriceImport();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Price Import</h1>
          <p className="text-muted-foreground">
            Upload scraped price data to update product prices
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Upload Price Data</CardTitle>
                <CardDescription>
                  Select a JSON file exported from the price scraper
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FileDropzone
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
              hasFile={!!parsedFile}
              onClear={clearFile}
            />
          </CardContent>
        </Card>

        {/* File Summary */}
        {parsedFile?.isValid && (
          <ImportFileSummary parsedFile={parsedFile} />
        )}

        {/* Preview Table */}
        {parsedFile?.isValid && parsedFile.products.length > 0 && (
          <ImportPreviewTable products={parsedFile.products} />
        )}

        {/* Action Buttons */}
        {parsedFile?.isValid && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => runImport(true)}
              disabled={isProcessing}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Dry Run
            </Button>
            <Button
              size="lg"
              onClick={() => runImport(false)}
              disabled={isProcessing}
            >
              <Play className="w-4 h-4 mr-2" />
              Import {parsedFile.products.length.toLocaleString()} Prices
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        {progress.status !== 'idle' && (
          <ImportProgressBar progress={progress} />
        )}

        {/* Import Result Summary */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Import Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ResultStat label="Total" value={result.total} />
                <ResultStat label="Created" value={result.created} variant="success" />
                <ResultStat label="Updated" value={result.updated} variant="success" />
                <ResultStat label="Skipped" value={result.skipped} variant="warning" />
                <ResultStat label="Errors" value={result.errors.length} variant="error" />
              </div>
              
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Errors ({result.errors.length}):
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <div key={i} className="text-xs bg-destructive/10 rounded p-2">
                        <span className="font-medium">{err.product}:</span>{' '}
                        <span className="text-muted-foreground">{err.reason}</span>
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import History */}
        <ImportHistoryTable />
      </div>
    </AdminLayout>
  );
}

function ResultStat({ 
  label, 
  value, 
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-destructive',
  };

  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className={`text-2xl font-bold ${colorClasses[variant]}`}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
