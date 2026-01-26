import { Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PrintersInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
}

export function PrintersInventoryTab({
  searchTerm,
  selectedBrand,
}: PrintersInventoryTabProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-cyan-500" />
          Printers Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Printers table coming in Part 3</p>
          <p className="text-sm">
            Current filters: Search "{searchTerm || '(none)'}" | Brand "{selectedBrand || 'All'}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
