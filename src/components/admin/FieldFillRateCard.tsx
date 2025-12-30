import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { FieldFillRate } from "@/hooks/useFieldFillRates";

interface FieldFillRateCardProps {
  field: FieldFillRate;
}

function getStatusColor(percentage: number): string {
  if (percentage >= 70) return 'text-green-600 dark:text-green-400';
  if (percentage >= 30) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getProgressColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBadgeVariant(percentage: number): 'default' | 'secondary' | 'destructive' {
  if (percentage >= 70) return 'default';
  if (percentage >= 30) return 'secondary';
  return 'destructive';
}

export function FieldFillRateCard({ field }: FieldFillRateCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{field.label}</span>
            {field.description && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{field.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress 
              value={field.percentage} 
              className="h-1.5 flex-1"
            />
            <span className={`text-xs font-medium ${getStatusColor(field.percentage)}`}>
              {field.percentage}%
            </span>
          </div>
        </div>
      </div>
      <div className="ml-3 text-right">
        <span className="text-xs text-muted-foreground">
          {field.filled.toLocaleString()} / {field.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

interface FieldCategorySectionProps {
  title: string;
  fields: FieldFillRate[];
  icon?: React.ReactNode;
}

export function FieldCategorySection({ title, fields, icon }: FieldCategorySectionProps) {
  const avgPercentage = fields.length > 0 
    ? Math.round(fields.reduce((sum, f) => sum + f.percentage, 0) / fields.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant={getBadgeVariant(avgPercentage)}>
            {avgPercentage}% avg
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map(field => (
          <FieldFillRateCard key={field.field} field={field} />
        ))}
      </CardContent>
    </Card>
  );
}
