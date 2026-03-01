import { useRef, useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TruncatedProductNameProps {
  title: string;
  vendor: string;
}

/**
 * Product name cell that detects real CSS truncation via ResizeObserver
 * and conditionally shows an ⓘ icon + tooltip with full name.
 */
export function TruncatedProductName({ title, vendor }: TruncatedProductNameProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = textRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    checkTruncation();
    const ro = new ResizeObserver(checkTruncation);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkTruncation, title]);

  const nameSpan = (
    <span className="flex items-center min-w-0">
      <span
        ref={textRef}
        className="truncate text-primary group-hover:text-primary/80 group-hover:underline cursor-pointer"
      >
        {title}
      </span>
      {isTruncated && (
        <Info className="shrink-0 ml-1 w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors cursor-help" />
      )}
    </span>
  );

  if (!isTruncated) return nameSpan;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{nameSpan}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-[420px] bg-popover border border-border px-3 py-2"
        >
          <p className="text-xs text-muted-foreground mb-0.5">{vendor}</p>
          <p className="text-sm text-popover-foreground">{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
