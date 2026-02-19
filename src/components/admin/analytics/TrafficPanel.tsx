import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, BarChart2, Users, FileText, Edit2, Check, X } from "lucide-react";

const GA4_PROPERTY_ID = "G-Q96R53VCKM";
const GA4_BASE = "https://analytics.google.com";

const quickLinks = [
  {
    label: "GA4 Overview",
    description: "Real-time and summary dashboard",
    href: `${GA4_BASE}/analytics/web/`,
    icon: BarChart2,
  },
  {
    label: "Audience Reports",
    description: "Users, sessions, demographics",
    href: `${GA4_BASE}/analytics/web/#/p${GA4_PROPERTY_ID}/reports/explorer`,
    icon: Users,
  },
  {
    label: "Pages & Screens",
    description: "Top pages by views and engagement",
    href: `${GA4_BASE}/analytics/web/#/p${GA4_PROPERTY_ID}/reports/lifecycle/traffic-acquisition`,
    icon: FileText,
  },
  {
    label: "Looker Studio",
    description: "Custom dashboards and reports",
    href: "https://lookerstudio.google.com/",
    icon: BarChart2,
  },
];

export function TrafficPanel() {
  const [embedUrl, setEmbedUrl] = useState<string>(() => localStorage.getItem("looker-studio-url") || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(embedUrl);

  function saveUrl() {
    localStorage.setItem("looker-studio-url", draft);
    setEmbedUrl(draft);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(embedUrl);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic Overview</CardTitle>
          <CardDescription>
            Traffic data is powered by Google Analytics 4 (Measurement ID: {GA4_PROPERTY_ID}). View detailed reports
            directly in GA4 or configure a Looker Studio embed below.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {/* Looker Studio embed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Looker Studio Report</CardTitle>
              <CardDescription>Paste your Looker Studio embed URL to display your report inline.</CardDescription>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => { setDraft(embedUrl); setEditing(true); }}>
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                {embedUrl ? "Change URL" : "Configure"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="looker-url">Looker Studio Embed URL</Label>
                <Input
                  id="looker-url"
                  placeholder="https://lookerstudio.google.com/embed/reporting/..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  In Looker Studio: Share → Embed report → Copy the src URL from the iframe tag.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveUrl}>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full rounded-lg border border-border"
              style={{ height: 600 }}
              allowFullScreen
              title="Looker Studio Report"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center border-2 border-dashed border-border rounded-lg">
              <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No report configured</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click "Configure" to paste your Looker Studio embed URL and display your GA4 report here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Google Search Console</p>
                <p className="text-xs text-muted-foreground">Crawl status, search queries, Core Web Vitals</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </a>
        <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Bing Webmaster Tools</p>
                <p className="text-xs text-muted-foreground">Bing/Edge crawl status and indexing</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  );
}
