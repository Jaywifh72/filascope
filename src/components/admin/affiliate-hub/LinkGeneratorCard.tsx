import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Link2, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import type { AffiliateProgram } from "@/types/affiliate";
import { buildAffiliateLinkLocal } from "@/utils/affiliateLinks";

interface LinkGeneratorCardProps {
  program: AffiliateProgram;
}

export function LinkGeneratorCard({ program }: LinkGeneratorCardProps) {
  const [path, setPath] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const isRedirectLink = program.link_generation_method === "redirect_link";
  const isAwinRedirect = program.link_generation_method === "awin_redirect";

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

      {isRedirectLink ? (
        <>
          {/* Redirect link mode — show default tracking link */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Default Tracking Link</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted/50 rounded px-3 py-2 text-sm font-mono text-foreground break-all">
                {program.default_tracking_link || program.link_template}
              </code>
              <Button size="icon" variant="ghost" onClick={() => copy(program.default_tracking_link || program.link_template)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Product-specific links must be created via the {program.affiliate_network} dashboard.
              Use the "Create a link" tool — enter any product URL in the Landing Page field.
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => copy(homepageLink)}>
              <Copy className="w-3 h-3 mr-1.5" /> Copy Homepage Link
            </Button>
            {program.portal_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={program.portal_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Open Dashboard
                </a>
              </Button>
            )}
          </div>
        </>
      ) : isAwinRedirect ? (
        <>
          {/* Awin redirect mode — deep-linkable with URL encoding */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Product URL or Path</Label>
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/products/esun-pla-plus-black-1kg"
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={generate}>Generate</Button>
          </div>

          {generatedUrl && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Generated Awin Link</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted/50 rounded px-3 py-2 text-xs font-mono text-foreground break-all">
                  {generatedUrl}
                </code>
                <Button size="icon" variant="ghost" onClick={() => copy(generatedUrl)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="text-xs space-y-1 bg-muted/20 rounded p-3">
                <div><span className="text-blue-400">Redirect:</span> <span className="font-mono">www.awin1.com/cread.php</span></div>
                <div><span className="text-green-400">Merchant:</span> <span className="font-mono">{program.awin_merchant_id}</span></div>
                <div><span className="text-yellow-400">Publisher:</span> <span className="font-mono">{program.awin_publisher_id}</span></div>
                <div><span className="text-purple-400">Destination:</span> <span className="font-mono">{program.store_base_url}{path || "/"}</span></div>
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
            {program.portal_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={program.portal_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Open Awin Dashboard
                </a>
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* URL parameter mode — existing behavior */}
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
        </>
      )}
    </Card>
  );
}
