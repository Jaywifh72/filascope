import { useState } from "react";
import { Heart, FileText, Share2 } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { ShareModal } from "./ShareModal";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickActionsProps {
  filamentId: string;
  tdsUrl: string | null;
  productTitle: string;
}

export function QuickActions({ filamentId, tdsUrl, productTitle }: QuickActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);
  
  const hasTds = tdsUrl && tdsUrl.trim() !== '' && !tdsUrl.includes('N/A');

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
      
      {/* Share */}
      <button
        onClick={() => setShareOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5",
          "text-sm text-muted-foreground",
          "hover:text-primary",
          "transition-colors",
          "focus:outline-none focus:text-primary"
        )}
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </button>
      
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        productTitle={productTitle}
      />
    </div>
  );
}
