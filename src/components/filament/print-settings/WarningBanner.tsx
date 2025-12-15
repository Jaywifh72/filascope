import { AlertTriangle, Wrench, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningBannerProps {
  warnings: Array<{
    type: 'notice' | 'requirement';
    icon: string;
    message: string;
    link?: string;
  }>;
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border-l-4",
            warning.type === 'notice' 
              ? "bg-amber-500/10 border-amber-500" 
              : "bg-primary/10 border-primary"
          )}
        >
          <span className="text-lg flex-shrink-0">{warning.icon}</span>
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm font-medium",
              warning.type === 'notice' ? "text-amber-200" : "text-primary"
            )}>
              {warning.type === 'notice' ? 'Important Notice' : 'Special Requirement'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {warning.message}
            </p>
            {warning.link && (
              <a 
                href={warning.link}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                Read more
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
