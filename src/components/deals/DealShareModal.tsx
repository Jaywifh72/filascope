import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Mail, Twitter, MessageCircle, Facebook, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DealFilament } from "./DealCard";

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
  
  const shareText = `🔥 ${discount}% off ${deal.product_title} on FilaScope! Check out this deal:`;

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

  const shareOptions = [
    {
      name: "Email",
      icon: Mail,
      color: "hover:bg-blue-500/10 hover:border-blue-500/30",
      url: `mailto:?subject=${encodeURIComponent(`${discount}% off ${deal.product_title}`)}&body=${encodeURIComponent(`${shareText}\n\n${dealUrl}`)}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "hover:bg-sky-500/10 hover:border-sky-500/30",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(dealUrl)}`,
    },
    {
      name: "Reddit",
      icon: MessageCircle,
      color: "hover:bg-orange-500/10 hover:border-orange-500/30",
      url: `https://reddit.com/submit?url=${encodeURIComponent(dealUrl)}&title=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "hover:bg-blue-600/10 hover:border-blue-600/30",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dealUrl)}&quote=${encodeURIComponent(shareText)}`,
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
              <p className="text-xs text-green-400">{discount}% off</p>
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
                copied && "bg-green-600 hover:bg-green-600"
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
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3",
                  "rounded-lg border border-border",
                  "transition-colors",
                  option.color
                )}
              >
                <option.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{option.name}</span>
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
