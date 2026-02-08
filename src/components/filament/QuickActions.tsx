import { useState } from "react";
import { FileText, Share2 } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { SharePopover } from "@/components/sharing/SharePopover";
import { PrivateNotePopover } from "@/components/notes/PrivateNotePopover";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickActionsProps {
  filamentId: string;
  tdsUrl: string | null;
  productTitle: string;
  /** Optional price string e.g. "$24.99" for share text */
  priceDisplay?: string;
  /** Optional store name e.g. "Amazon US" for share text */
  storeName?: string;
}

export function QuickActions({ filamentId, tdsUrl, productTitle, priceDisplay, storeName }: QuickActionsProps) {
  const hasTds = tdsUrl && tdsUrl.trim() !== '' && !tdsUrl.includes('N/A');

  // Build rich share text
  let shareText = `Check out ${productTitle} on FilaScope`;
  if (priceDisplay && storeName) {
    shareText = `Check out ${productTitle} on FilaScope — ${priceDisplay} at ${storeName}`;
  } else if (priceDisplay) {
    shareText = `Check out ${productTitle} on FilaScope — ${priceDisplay}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Wishlist - using existing LikeButton */}
      <LikeButton 
        filamentId={filamentId} 
        size="sm" 
      />
      
      {/* Data Sheet */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {hasTds ? (
              <a
                href={tdsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "text-sm text-muted-foreground",
                  "hover:text-primary",
                  "transition-colors",
                  "focus:outline-none focus:text-primary"
                )}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Data Sheet</span>
              </a>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "text-sm text-muted-foreground/50",
                  "cursor-not-allowed"
                )}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Data Sheet</span>
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {hasTds ? "View Technical Data Sheet" : "No TDS available"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Private Note */}
      <PrivateNotePopover
        productId={filamentId}
        productType="filament"
        productTitle={productTitle}
        compact
      />
      
      {/* Share */}
      <SharePopover
        shareText={shareText}
        productId={filamentId}
        title="Share this filament"
      >
        <button
          className={cn(
            "inline-flex items-center gap-1.5",
            "text-sm text-muted-foreground",
            "hover:text-primary",
            "transition-colors",
            "focus:outline-none focus:text-primary"
          )}
          aria-label="Share this filament"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </SharePopover>
    </div>
  );
}
