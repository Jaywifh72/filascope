import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Mail, MessageCircle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DealFilament } from "./DealCard";

// X/Twitter icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Discord icon
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

interface DealShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealFilament;
  discount: number;
}

export function DealShareModal({ open, onOpenChange, deal, discount }: DealShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const dealUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/filament/${deal.id}` 
    : "";
  
  const priceStr = deal.variant_price != null ? `$${deal.variant_price.toFixed(2)}` : '?';
  const shareText = `${deal.product_title} is ${discount}% off — now ${priceStr} at ${deal.vendor ?? 'store'}. Found on FilaScope`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(dealUrl);
      setCopied(true);
      toast({
        title: "✓ Link copied!",
        description: "Share this deal with your friends.",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDiscordCopy = async () => {
    const msg = `🔥 ${shareText}\n${dealUrl}`;
    try {
      await navigator.clipboard.writeText(msg);
      toast({
        title: "✓ Copied for Discord!",
        description: "Paste this message in any Discord channel.",
        duration: 2000,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareOptions = [
    {
      name: "X (Twitter)",
      icon: XIcon,
      color: "hover:bg-muted/80 hover:border-primary/30",
      action: () => window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 ${shareText}`)}&url=${encodeURIComponent(dealUrl)}`,
        "_blank", "noopener,noreferrer"
      ),
    },
    {
      name: "Reddit",
      icon: MessageCircle,
      color: "hover:bg-muted/80 hover:border-primary/30",
      action: () => window.open(
        `https://reddit.com/submit?url=${encodeURIComponent(dealUrl)}&title=${encodeURIComponent(shareText)}`,
        "_blank", "noopener,noreferrer"
      ),
    },
    {
      name: "Discord",
      icon: DiscordIcon,
      color: "hover:bg-muted/80 hover:border-primary/30",
      action: handleDiscordCopy,
    },
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-muted/80 hover:border-primary/30",
      action: () => window.open(
        `mailto:?subject=${encodeURIComponent(`${discount}% off ${deal.product_title}`)}&body=${encodeURIComponent(`${shareText}\n\n${dealUrl}`)}`,
        "_self"
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Share this deal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deal Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            {deal.featured_image && (
              <img
                src={deal.featured_image}
                alt={deal.product_title}
                className="w-12 h-12 object-contain rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{deal.product_title}</p>
              <p className="text-xs text-primary">{discount}% off</p>
            </div>
          </div>

          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={dealUrl}
              className="flex-1 text-sm bg-muted/50"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              className={cn(
                "shrink-0 w-20",
                copied && "bg-emerald-600 hover:bg-emerald-600"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Social Share Options */}
          <div className="grid grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3",
                  "rounded-lg border border-border",
                  "transition-colors",
                  option.color
                )}
                aria-label={`Share via ${option.name}`}
              >
                <option.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
