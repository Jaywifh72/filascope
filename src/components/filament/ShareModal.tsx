import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Mail, Twitter, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
}

export function ShareModal({ open, onOpenChange, productTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${productTitle} on FilaScope`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
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
  
  const shareOptions = [
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'Reddit',
      icon: MessageCircle,
      url: `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this filament</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={currentUrl}
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
          <div className="grid grid-cols-3 gap-3">
            {shareOptions.map((option) => (
              <a
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4",
                  "rounded-lg border border-border",
                  "hover:bg-muted/50 hover:border-primary/30",
                  "transition-colors"
                )}
              >
                <option.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{option.name}</span>
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
