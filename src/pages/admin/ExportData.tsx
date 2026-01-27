import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { fixProductUrl } from '@/lib/urlValidation';

interface FilamentRecord {
  vendor: string | null;
  product_title: string | null;
  product_url: string | null;
  variant_price: number | null;
  msrp: number | null;
}

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export default function ExportData() {
  const [copied, setCopied] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');

  const { data: filaments, isLoading, error } = useQuery({
    queryKey: ['export-all-filaments'],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      const allFilaments: FilamentRecord[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('filaments')
          .select('vendor, product_title, product_url, variant_price, msrp')
          .order('vendor', { ascending: true })
          .order('product_title', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allFilaments.push(...data);
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      return allFilaments;
    },
  });

  useEffect(() => {
    if (filaments && filaments.length > 0) {
      const headers = ['Brand', 'Product Name', 'Current URL', 'New_Working_URL', 'Current Price', 'MSRP'];
      const rows = [headers.join(',')];

      for (const f of filaments) {
        const originalUrl = f.product_url || '';
        const correctedUrl = fixProductUrl(originalUrl, f.vendor);
        // Show "Verified" if no correction needed, otherwise show the corrected URL
        const newWorkingUrl = correctedUrl === originalUrl ? 'Verified' : correctedUrl;
        
        const row = [
          escapeCSV(f.vendor),
          escapeCSV(f.product_title),
          escapeCSV(f.product_url),
          escapeCSV(newWorkingUrl),
          f.variant_price?.toFixed(2) || '',
          f.msrp?.toFixed(2) || ''
        ];
        rows.push(row.join(','));
      }

      setCsvContent(rows.join('\n'));
    }
  }, [filaments]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      toast.success('CSV content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'filascope_filament_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV file downloaded');
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Export Filament Data</h1>
            <p className="text-muted-foreground">
              {isLoading 
                ? 'Loading filaments...' 
                : `${filaments?.length || 0} filaments loaded`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleDownload} 
              disabled={isLoading || !csvContent}
              variant="default"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button 
              onClick={handleCopy} 
              disabled={isLoading || !csvContent}
              variant="outline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading all filaments...</span>
          </div>
        )}

        {error && (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
            <p className="text-destructive">Error loading filaments: {(error as Error).message}</p>
          </div>
        )}

        {csvContent && (
          <textarea
            readOnly
            value={csvContent}
            className="w-full h-[calc(100vh-220px)] p-4 font-mono text-xs bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        )}
      </div>
    </AdminLayout>
  );
}
