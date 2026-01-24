import { useState } from "react";
import { Share2, Link2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ShareFilteredViewProps {
  getShareableURL: () => string;
  filterCount?: number;
}

export function ShareFilteredView({ getShareableURL, filterCount = 0 }: ShareFilteredViewProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareURL = getShareableURL();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      setCopied(true);
      toast({
        title: "✓ Link copied!",
        description: "Share this filtered view with others.",
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={filterCount === 0}
        >
          <Share2 className="w-4 h-4" />
          Share View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Share Filtered View
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this link to share your current filter settings with others.
            {filterCount > 0 && (
              <span className="block mt-1 text-primary">
                {filterCount} filter{filterCount !== 1 ? "s" : ""} applied
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareURL}
              className="flex-1 text-sm bg-muted/50"
            />
            <Button
              onClick={handleCopy}
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

          <p className="text-xs text-muted-foreground">
            Anyone with this link will see the same filters you have selected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
