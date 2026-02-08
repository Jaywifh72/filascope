import { useState } from "react";
import { Copy, Check, Mail, MessageCircle, Code2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EmbedCodeDialog } from "./EmbedCodeDialog";

// Simple X/Twitter icon
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

interface SharePopoverProps {
  /** The trigger element */
  children: React.ReactNode;
  /** URL to share (defaults to current page) */
  shareUrl?: string;
  /** Pre-composed share text */
  shareText: string;
  /** Optional product ID for embed widget */
  productId?: string;
  /** Title for the popover */
  title?: string;
  /** Alignment of the popover */
  align?: "start" | "center" | "end";
  /** Side of the popover */
  side?: "top" | "bottom" | "left" | "right";
}

export function SharePopover({
  children,
  shareUrl,
  shareText,
  productId,
  title = "Share",
  align = "end",
  side = "bottom",
}: SharePopoverProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const { toast } = useToast();

  const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "✓ Link copied!",
        description: "Share link copied to clipboard.",
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
    const discordMessage = `${shareText}\n${url}`;
    try {
      await navigator.clipboard.writeText(discordMessage);
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
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Reddit",
      icon: MessageCircle,
      action: () => {
        window.open(
          `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      name: "Discord",
      icon: DiscordIcon,
      action: handleDiscordCopy,
    },
    {
      name: "Email",
      icon: Mail,
      action: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
          "_self"
        );
      },
    },
  ];

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          className="w-72 p-3"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <p className="text-sm font-medium mb-3">{title}</p>

          {/* Copy link */}
          <div className="flex items-center gap-1.5 mb-3">
            <Input
              readOnly
              value={url}
              className="flex-1 text-xs h-8 bg-muted/50"
              aria-label="Share URL"
            />
            <Button
              size="sm"
              variant="secondary"
              className={cn("h-8 w-16 shrink-0", copied && "bg-emerald-600 hover:bg-emerald-600 text-primary-foreground")}
              onClick={handleCopy}
              aria-label={copied ? "Link copied" : "Copy link"}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {shareOptions.map((opt) => (
              <button
                key={opt.name}
                onClick={opt.action}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-2",
                  "rounded-lg border border-border",
                  "hover:bg-muted/50 hover:border-primary/30",
                  "transition-colors text-muted-foreground hover:text-foreground"
                )}
                aria-label={`Share via ${opt.name}`}
              >
                <opt.icon className="w-4 h-4" />
                <span className="text-[10px]">{opt.name}</span>
              </button>
            ))}
          </div>

          {/* Embed option */}
          {productId && (
            <button
              onClick={() => {
                setOpen(false);
                setEmbedOpen(true);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 mt-1",
                "rounded-lg border border-dashed border-border",
                "hover:bg-muted/50 hover:border-primary/30",
                "transition-colors text-xs text-muted-foreground hover:text-foreground"
              )}
              aria-label="Get embed code"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Embed on your website</span>
            </button>
          )}
        </PopoverContent>
      </Popover>

      {/* Embed dialog rendered outside popover */}
      {productId && (
        <EmbedCodeDialog
          open={embedOpen}
          onOpenChange={setEmbedOpen}
          productId={productId}
        />
      )}
    </>
  );
}
