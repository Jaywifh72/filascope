import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { AffiliateProgram } from "@/types/affiliate";
import { buildAffiliateLinkLocal } from "@/utils/affiliateLinks";

interface LinkGeneratorCardProps {
  program: AffiliateProgram;
}

export function LinkGeneratorCard({ program }: LinkGeneratorCardProps) {
  const [path, setPath] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const generate = () => {
    const url = buildAffiliateLinkLocal(program, path || "");
    setGeneratedUrl(url);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const homepageLink = buildAffiliateLinkLocal(program, "");

  return (
    <Card className="p-5 bg-card border-border space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" /> Link Generator
      </h3>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Product Path</Label>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/products/kobra-3"
            className="font-mono text-sm"
          />
        </div>
        <Button onClick={generate}>Generate</Button>
      </div>

      {generatedUrl && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Generated URL</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted/50 rounded px-3 py-2 text-xs font-mono text-foreground break-all">
              {generatedUrl}
            </code>
            <Button size="icon" variant="ghost" onClick={() => copy(generatedUrl)}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* URL breakdown */}
          <div className="text-xs space-y-1 bg-muted/20 rounded p-3">
            <div><span className="text-blue-400">Base:</span> <span className="font-mono">{program.store_base_url}</span></div>
            <div><span className="text-green-400">Path:</span> <span className="font-mono">{path || "/"}</span></div>
            <div><span className="text-yellow-400">Tracking:</span> <span className="font-mono">{program.tracking_parameter}={program.tracking_value}</span></div>
            <div><span className="text-purple-400">UTM:</span> <span className="font-mono">utm_source=filascope&utm_medium=affiliate</span></div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => copy(generatedUrl || homepageLink)}>
          <Copy className="w-3 h-3 mr-1.5" /> Copy Link
        </Button>
        <Button size="sm" variant="outline" onClick={() => copy(homepageLink)}>
          <Copy className="w-3 h-3 mr-1.5" /> Copy Homepage Link
        </Button>
      </div>
    </Card>
  );
}
