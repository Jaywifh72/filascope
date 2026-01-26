import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilamentsInventoryTabProps {
  searchTerm: string;
  selectedBrand: string;
}

export function FilamentsInventoryTab({
  searchTerm,
  selectedBrand,
}: FilamentsInventoryTabProps) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-500" />
          Filaments Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">Filaments table coming in Part 3</p>
          <p className="text-sm">
            Current filters: Search "{searchTerm || '(none)'}" | Brand "{selectedBrand || 'All'}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
