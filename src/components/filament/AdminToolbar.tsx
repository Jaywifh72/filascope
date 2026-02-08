import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, ImageIcon, RefreshCw, Link2, Palette, Database, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AdminToolbarProps {
  productUrl?: string | null;
  rescrapingImage?: boolean;
  scrapingData?: boolean;
  scrapingColors?: boolean;
  onEditImage: () => void;
  onRescrapeImage: () => void;
  onEditUrl: () => void;
  onScrapeData: () => void;
  onScrapeColors: () => void;
}

export function AdminToolbar({
  productUrl,
  rescrapingImage = false,
  scrapingData = false,
  scrapingColors = false,
  onEditImage,
  onRescrapeImage,
  onEditUrl,
  onScrapeData,
  onScrapeColors,
}: AdminToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-lg border transition-colors",
        isOpen
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-transparent"
      )}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              isOpen
                ? "text-amber-400"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <Wrench className="w-3.5 h-3.5" />
            Admin Tools
            <ChevronDown className={cn(
              "w-3 h-3 transition-transform",
              isOpen && "rotate-180"
            )} />
            <span className="text-[10px] text-muted-foreground/40 ml-1">
              Ctrl+Shift+A
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1">
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={onEditImage} className="gap-1.5 text-xs h-8 border-amber-500/20 hover:border-amber-500/40">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Edit Image
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit product image URL</TooltipContent>
                </Tooltip>

                {productUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onRescrapeImage}
                        disabled={rescrapingImage}
                        className="gap-1.5 text-xs h-8 border-amber-500/20 hover:border-amber-500/40"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", rescrapingImage && "animate-spin")} />
                        Rescrape Image
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Rescrape image from product URL</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={onEditUrl} className="gap-1.5 text-xs h-8 border-amber-500/20 hover:border-amber-500/40">
                      <Link2 className="w-3.5 h-3.5" />
                      Edit URL
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit product URL</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onScrapeData}
                      disabled={scrapingData || !productUrl}
                      className="gap-1.5 text-xs h-8 border-amber-500/20 hover:border-amber-500/40"
                    >
                      <Database className={cn("w-3.5 h-3.5", scrapingData && "animate-spin")} />
                      Scrape Data
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {productUrl ? "Scrape all data from product URL" : "No product URL set"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onScrapeColors}
                      disabled={scrapingColors || !productUrl}
                      className="gap-1.5 text-xs h-8 border-amber-500/20 hover:border-amber-500/40"
                    >
                      <Palette className={cn("w-3.5 h-3.5", scrapingColors && "animate-pulse")} />
                      Scrape Colors
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Scrape color variants from product URL</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
