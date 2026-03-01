import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";

const HREFLANGS = ["en-US", "en-CA", "en-GB", "en-AU", "en", "x-default"];
const PRERENDER_SITEMAP_PATH = "/sitemap-pages.xml";

type StatusResult = "loading" | "ok" | "error";

async function isValidSitemapResponse(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/xml,text/xml,text/plain,*/*" },
    });

    if (!response.ok) return false;

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    return contentType.includes("xml") || /<(urlset|sitemapindex)\b/i.test(body);
  } catch {
    return false;
  }
}

function StatusBadge({ status, label }: { status: StatusResult; label: string }) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {status === "ok" ? (
        <CheckCircle2 className="w-4 h-4 text-[hsl(142,76%,36%)]" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive" />
      )}
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

export function SeoHealthPanel() {
  const [robotsStatus, setRobotsStatus] = useState<StatusResult>("loading");
  const [prerenderStatus, setPrerenderStatus] = useState<StatusResult>("loading");
  const [isRecheckingPrerender, setIsRecheckingPrerender] = useState(false);

  const checkPrerenderStatus = useCallback(async () => {
    setIsRecheckingPrerender(true);
    setPrerenderStatus("loading");

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
      const edgeUrl = projectId
        ? `https://${projectId}.supabase.co/functions/v1/prerender?path=${encodeURIComponent(PRERENDER_SITEMAP_PATH)}`
        : null;

      const checks = [isValidSitemapResponse(PRERENDER_SITEMAP_PATH)];
      if (edgeUrl) checks.push(isValidSitemapResponse(edgeUrl));

      const results = await Promise.all(checks);
      setPrerenderStatus(results.some(Boolean) ? "ok" : "error");
    } catch {
      setPrerenderStatus("error");
    } finally {
      setIsRecheckingPrerender(false);
    }
  }, []);

  // Check robots.txt
  useEffect(() => {
    fetch("/robots.txt", { method: "GET" })
      .then((r) => setRobotsStatus(r.ok ? "ok" : "error"))
      .catch(() => setRobotsStatus("error"));
  }, []);

  // Check prerender health via same-origin sitemap + direct edge fallback
  useEffect(() => {
    void checkPrerenderStatus();
  }, [checkPrerenderStatus]);

  // Page counts
  const { data: pageCounts } = useQuery({
    queryKey: ["analytics-page-counts"],
    queryFn: async () => {
      const [filaments, printers] = await Promise.all([
        supabase.from("filaments").select("id", { count: "exact", head: true }),
        supabase.from("printers").select("id", { count: "exact", head: true }),
      ]);
      return {
        filaments: filaments.count || 0,
        printers: printers.count || 0,
        total: (filaments.count || 0) + (printers.count || 0),
      };
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Status checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
              <StatusBadge status={robotsStatus} label="robots.txt reachable" />
              <StatusBadge
                status="ok"
                label="Sitemap configured (filascope.com/sitemap.xml)"
              />
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={prerenderStatus} label="Prerender edge function active" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => void checkPrerenderStatus()}
                  disabled={isRecheckingPrerender}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRecheckingPrerender ? "animate-spin" : ""}`}
                  />
                  Recheck
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hreflang Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {HREFLANGS.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs font-mono">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indexable Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Filaments</span>
                <span className="font-bold text-foreground">{pageCounts?.filaments.toLocaleString() ?? "…"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Printers</span>
                <span className="font-bold text-foreground">{pageCounts?.printers.toLocaleString() ?? "…"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium text-foreground">Total estimated pages</span>
                <span className="font-bold text-primary text-lg">{pageCounts?.total.toLocaleString() ?? "…"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">External Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Sitemap",
                href: "https://filascope.com/sitemap.xml",
                desc: "View live XML sitemap",
              },
              {
                label: "Google Search Console",
                href: "https://search.google.com/search-console",
                desc: "Coverage, queries, Core Web Vitals",
              },
              {
                label: "Bing Webmaster Tools",
                href: "https://www.bing.com/webmasters",
                desc: "Bing/Edge indexing status",
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
