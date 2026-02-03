import { useState } from 'react';
import { format } from 'date-fns';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { usePriceImportHistory } from '@/hooks/usePriceImportHistory';
import type { ImportHistoryEntry } from '@/types/priceImport';

export function ImportHistoryTable() {
  const { data: history, isLoading, error } = usePriceImportHistory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load import history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No imports yet. Upload a JSON file to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Done</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">Partial</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <>
                  <TableRow 
                    key={entry.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(entry.id)}
                  >
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {expandedId === entry.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(entry.started_at), 'MMM d, yyyy')}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {format(new Date(entry.started_at), 'HH:mm')}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.success_details?.filename || entry.brand_slug}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {((entry.products_updated || 0) + (entry.products_failed || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(entry.products_updated || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(entry.products_failed || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(entry.status)}
                        {getStatusBadge(entry.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedId === entry.id && (
                    <TableRow key={`${entry.id}-details`}>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <ExpandedDetails entry={entry} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpandedDetails({ entry }: { entry: ImportHistoryEntry }) {
  const { success_details, error_details } = entry;
  
  return (
    <div className="py-4 px-6 space-y-4">
      {success_details && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {success_details.created !== undefined && (
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2 font-medium">{success_details.created}</span>
            </div>
          )}
          {success_details.updated !== undefined && (
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <span className="ml-2 font-medium">{success_details.updated}</span>
            </div>
          )}
          {success_details.skipped !== undefined && (
            <div>
              <span className="text-muted-foreground">Skipped:</span>
              <span className="ml-2 font-medium">{success_details.skipped}</span>
            </div>
          )}
          {success_details.brands && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Brands:</span>
              <span className="ml-2">{success_details.brands.join(', ')}</span>
            </div>
          )}
          {success_details.regions && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Regions:</span>
              <span className="ml-2">{success_details.regions.join(', ')}</span>
            </div>
          )}
        </div>
      )}
      
      {error_details?.errors && error_details.errors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-destructive mb-2">
            Errors ({error_details.errors.length}):
          </p>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {error_details.errors.slice(0, 10).map((err, i) => (
              <div key={i} className="text-xs bg-destructive/10 rounded p-2">
                <span className="font-medium">{err.product}:</span>{' '}
                <span className="text-muted-foreground">{err.reason}</span>
              </div>
            ))}
            {error_details.errors.length > 10 && (
              <p className="text-xs text-muted-foreground">
                ... and {error_details.errors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
