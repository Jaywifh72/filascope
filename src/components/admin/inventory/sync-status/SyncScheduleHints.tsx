import { Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SyncScheduleHints() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Suggested Sync Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="bg-muted/50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-xs space-y-1">
            <p className="font-medium">Recommended sync frequencies:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li><span className="font-medium">🇺🇸 US:</span> Every 6 hours (primary market)</li>
              <li><span className="font-medium">🇨🇦 CA:</span> Every 12 hours</li>
              <li><span className="font-medium">🇪🇺 EU:</span> Every 24 hours</li>
              <li><span className="font-medium">🇬🇧 UK / 🇦🇺 AU:</span> Weekly</li>
            </ul>
            <p className="text-muted-foreground pt-1">
              Adjust based on price volatility and store update patterns.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
