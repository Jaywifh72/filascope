import { useState } from "react";
import { Link2, Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WishlistCollection } from "@/hooks/useWishlistCollections";
import { useWishlistShare } from "@/hooks/useWishlistShare";

interface ShareWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: WishlistCollection[];
}

export function ShareWishlistDialog({
  open,
  onOpenChange,
  collections,
}: ShareWishlistDialogProps) {
  const { createShareLink, shares } = useWishlistShare();
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [title, setTitle] = useState("My Wishlist");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(30);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await createShareLink({
      collectionId: selectedCollection === "all" ? undefined : selectedCollection,
      title,
      expiresInDays: expiresInDays || undefined,
    });
    if (result) {
      setGeneratedUrl(result.url);
    }
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Your Wishlist
          </DialogTitle>
          <DialogDescription>
            Generate a link to share your wishlist with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Collection</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.item_count || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My 3D Printing Wishlist"
            />
          </div>

          <div className="space-y-2">
            <Label>Expiration</Label>
            <Select
              value={expiresInDays?.toString() || "never"}
              onValueChange={(v) => setExpiresInDays(v === "never" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Expires in 7 days</SelectItem>
                <SelectItem value="30">Expires in 30 days</SelectItem>
                <SelectItem value="90">Expires in 90 days</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {generatedUrl ? (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={generatedUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy} aria-label={copied ? "Copied" : "Copy link"}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}

          {generatedUrl && (
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedUrl(null);
                setTitle("My Wishlist");
              }}
              className="w-full"
            >
              Generate New Link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
