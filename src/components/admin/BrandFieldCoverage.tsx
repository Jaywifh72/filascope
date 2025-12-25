import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFieldCoverage } from "@/hooks/useBrandDataQuality";

interface BrandFieldCoverageProps {
  brandSlug: string;
  brandName: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Basic Info': 'bg-blue-500',
  'Pricing': 'bg-green-500',
  'Identifiers': 'bg-orange-500',
  'Enrichment': 'bg-purple-500',
  'Print Settings': 'bg-red-500',
  'Physical': 'bg-cyan-500',
};

export function BrandFieldCoverage({ brandSlug, brandName }: BrandFieldCoverageProps) {
  const { data: fields, isLoading } = useFieldCoverage(brandSlug);

  const categorizedFields = useMemo(() => {
    if (!fields) return {};
    
    const grouped: Record<string, typeof fields> = {};
    fields.forEach(field => {
      if (!grouped[field.category]) grouped[field.category] = [];
      grouped[field.category].push(field);
    });
    return grouped;
  }, [fields]);

  const categoryAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    Object.entries(categorizedFields).forEach(([category, categoryFields]) => {
      const sum = categoryFields.reduce((acc, f) => acc + f.percentage, 0);
      averages[category] = Math.round(sum / categoryFields.length);
    });
    return averages;
  }, [categorizedFields]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!fields || fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Field Coverage: {brandName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No filaments found for this brand.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Field Coverage: {brandName}
          <Badge variant="secondary" className="ml-2">
            {fields[0]?.totalCount || 0} filaments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Summaries */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(categoryAverages).map(([category, average]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category}</span>
                <span className="text-sm text-muted-foreground">{average}%</span>
              </div>
              <Progress 
                value={average} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {/* Detailed Field List */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">Field Details</h4>
          
          {Object.entries(categorizedFields).map(([category, categoryFields]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-500'}`} />
                <span className="text-sm font-medium">{category}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                {categoryFields.map(field => (
                  <div 
                    key={field.field}
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                  >
                    <span className="truncate">{field.label}</span>
                    <span className={`font-medium ${
                      field.percentage >= 80 ? 'text-green-600 dark:text-green-400' :
                      field.percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {field.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
