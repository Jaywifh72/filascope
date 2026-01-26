import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SyncStatusTab() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-500" />
          Sync History & Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Sync history and status coming in Part 3</p>
          <p className="text-sm">
            This tab will show sync logs from brand_sync_logs table
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
