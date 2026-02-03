import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileJson, Package, Globe, DollarSign } from 'lucide-react';
import type { ParsedFile } from '@/types/priceImport';

interface ImportFileSummaryProps {
  parsedFile: ParsedFile;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const REGION_EMOJI: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  UK: '🇬🇧',
  EU: '🇪🇺',
  AU: '🇦🇺',
  JP: '🇯🇵',
  CN: '🇨🇳',
};

export function ImportFileSummary({ parsedFile }: ImportFileSummaryProps) {
  const { filename, fileSize, products, brands, regions, currencies } = parsedFile;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileJson className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{filename}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            icon={<Package className="w-5 h-5" />}
            value={products.length.toLocaleString()}
            label="Products"
          />
          <StatCard
            icon={<span className="text-lg">🏷️</span>}
            value={brands.length}
            label="Brands"
          />
          <StatCard
            icon={<Globe className="w-5 h-5" />}
            value={regions.length}
            label="Regions"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            value={currencies.join(', ')}
            label="Currency"
          />
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Brands:</p>
            <div className="flex flex-wrap gap-2">
              {brands.map(brand => (
                <Badge key={brand} variant="secondary">
                  {brand}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Regions:</p>
            <div className="flex flex-wrap gap-2">
              {regions.map(region => (
                <Badge key={region} variant="outline" className="gap-1">
                  <span>{REGION_EMOJI[region] || '🌍'}</span>
                  <span>{region}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string | number; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
      <div className="text-muted-foreground mb-1">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
