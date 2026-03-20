import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EmbedCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function EmbedCodeDialog({ open, onOpenChange, productId }: EmbedCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const origin = typeof window !== "undefined" ? window.location.origin : "https://filascope.com";
  const embedUrl = `${origin}/embed/${productId}`;
  const embedCode = `<iframe src="${embedUrl}" width="400" height="220" style="border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;" loading="lazy" title="FilaScope Product Card"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: "✓ Embed code copied!",
        description: "Paste this into your blog or website HTML.",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy embed code.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Embed Product Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add this FilaScope product card to your blog or website. The embed
            auto-updates with the latest price and score data.
          </p>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <iframe
              src={embedUrl}
              width="100%"
              height="220"
              style={{ border: "1px solid hsl(var(--border))", borderRadius: 12, overflow: "hidden" }}
              loading="lazy"
              title="Embed preview"
            />
          </div>

          {/* Code */}
          <div className="relative">
            <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all border border-border font-mono">
              {embedCode}
            </pre>
            <Button
              size="sm"
              onClick={handleCopy}
              className={cn(
                "absolute top-2 right-2 h-7",
                copied && "bg-emerald-600 hover:bg-emerald-600"
              )}
              aria-label={copied ? "Copied" : "Copy embed code"}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            The embed is read-only and links back to FilaScope for full details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
