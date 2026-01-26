import { ExternalLink, Copy, Plus, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { RegionCode } from '@/types/regional';
import { REGIONS } from '@/config/regions';

interface RegionalUrlCellProps {
  productId: string;
  productType: 'filament' | 'printer';
  regionCode: RegionCode;
  url?: string | null;
  storeName?: string | null;
  isVerified?: boolean;
  isPrimary?: boolean;
  onEdit?: () => void;
  compact?: boolean;
}

export function RegionalUrlCell({
  productId,
  productType,
  regionCode,
  url,
  storeName,
  isVerified = false,
  isPrimary = false,
  onEdit,
  compact = false,
}: RegionalUrlCellProps) {
  const region = REGIONS[regionCode];

  const copyUrl = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const getDomainFromUrl = (urlString: string): string => {
    try {
      return new URL(urlString).hostname.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  // No URL configured
  if (!url) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-muted-foreground/50">
              <AlertCircle className="w-3 h-3 text-destructive/60" />
              {!compact && <span className="text-xs">Not configured</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            No {region?.name || regionCode} URL configured
          </TooltipContent>
        </Tooltip>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onEdit}
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // URL exists
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-primary hover:underline inline-flex items-center gap-1 max-w-[120px] truncate',
              compact && 'max-w-[80px]'
            )}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {storeName || getDomainFromUrl(url)}
            </span>
          </a>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-all">
          {url}
        </TooltipContent>
      </Tooltip>

      {/* Verification status */}
      {isVerified && (
        <Tooltip>
          <TooltipTrigger>
            <Check className="w-3 h-3 text-green-500" />
          </TooltipTrigger>
          <TooltipContent>Verified URL</TooltipContent>
        </Tooltip>
      )}

      {/* Primary indicator */}
      {isPrimary && !compact && (
        <span className="text-[10px] uppercase text-muted-foreground bg-muted px-1 rounded">
          primary
        </span>
      )}

      {/* Copy button */}
      {!compact && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={copyUrl}
        >
          <Copy className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
