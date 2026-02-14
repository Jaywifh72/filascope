import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AppWindow,
  Download,
  RefreshCw,
  Calendar,
  ExternalLink,
  CheckCircle2,
  FileText,
  Layers,
  Smartphone,
  MonitorSmartphone,
  Monitor,
} from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

interface SoftwareRelease {
  id: string;
  software_name: string;
  software_type: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  changelog: string | null;
  download_url: string | null;
  download_url_windows: string | null;
  download_url_mac: string | null;
  download_url_linux: string | null;
  supported_platforms: string[] | null;
  is_latest: boolean;
  source_url: string | null;
  created_at: string;
  is_mobile_app: boolean | null;
  google_play_url: string | null;
  app_store_url: string | null;
}

interface SoftwareSectionProps {
  printerId: string;
  brandName: string | null;
  printerName: string;
}

const softwareTypeIcons: Record<string, React.ReactNode> = {
  slicer: <Layers className="h-4 w-4" />,
  studio: <MonitorSmartphone className="h-4 w-4" />,
  app: <Smartphone className="h-4 w-4" />,
  plugin: <AppWindow className="h-4 w-4" />,
};

const softwareTypeLabels: Record<string, string> = {
  slicer: "Slicer",
  studio: "Studio",
  app: "Mobile App",
  plugin: "Plugin",
};

// OS icons as inline SVGs
const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M3 5.557l7.357-1.002v7.102H3V5.557zm0 12.886l7.357 1.002v-7.088H3v6.086zm8.146 1.119L21 21v-8.643h-9.854v7.205zm0-14.124v7.218H21V3L11.146 4.438z"/>
  </svg>
);

const MacIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const LinuxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.534a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.002c-.06-.135-.12-.2-.233-.334-.148-.134-.363-.198-.609-.469-.245-.201-.524-.333-.79-.4h-.006c-.08-.002-.16.002-.24.022a1.17 1.17 0 00.058-.2c.107-.534 0-1.2-.253-1.936-.253-.667-.616-1.404-1.063-2.004l-.016-.019c-.12-.133-.32-.27-.454-.199-.134.066-.035.27.12.469l.015.02c.377.533.794 1.13 1.079 1.803.349.8.488 1.601.349 2.203a.544.544 0 01-.064.2c-.078.002-.117.004-.2.004-.239 0-.483-.06-.733-.136.16-.002.32-.003.474-.04.264-.06.5-.135.658-.333l.014-.017c.087-.2.119-.465.041-.799-.158-.667-.622-1.598-1.343-2.435-.72-.936-1.746-1.868-2.967-2.535-1.22-.668-2.64-1.137-4.034-1.203-.193-.006-.385-.006-.576.003a1.414 1.414 0 00-.046.135c-.049.165-.074.332-.072.467 0 .067.002.133.008.199l.032.066c.04.07.09.135.152.198.116.134.286.27.505.402.438.264.953.456 1.39.6 1.41.467 2.33.602 2.691.865.24.133.312.27.18.401-.132.135-.434.133-.948.066-.515-.063-1.19-.2-1.977-.466-.787-.2-1.485-.469-2.03-.869-.39-.266-.68-.602-.777-1.002-.055-.2-.05-.401.016-.604h-.02c-.173.065-.353.132-.52.2-.627.267-1.161.601-1.456 1.003-.295.401-.343.87-.127 1.403.349.87 1.653 1.87 3.445 2.552 1.792.667 4.07 1.138 6.12 1.002 1.024-.067 1.964-.27 2.729-.669.765-.4 1.347-.934 1.627-1.735v-.003c.28-.8.15-1.869-.238-2.869a5.556 5.556 0 00-.178-.466c-.08.135-.16.2-.262.334-.166.133-.416.268-.738.4.298-1.137-.022-2.536-1.063-4.004-.868-1.2-1.963-2.135-2.746-2.803-.245-.201-.452-.4-.597-.534-.145-.134-.267-.268-.35-.4-.082-.135-.138-.268-.135-.402.006-.134.065-.268.218-.334.153-.067.396-.067.665.067.27.134.56.401.858.869.299.467.577 1.068.821 1.736v.003h.001c.195.603.389 1.203.647 1.736-.072-.468-.223-1.002-.445-1.603-.221-.6-.516-1.27-.85-1.87a4.676 4.676 0 00-1.109-1.402c-.413-.334-.857-.601-1.35-.667h-.008a2.55 2.55 0 00-.532-.035c-.227.015-.45.06-.666.133-.45.135-.841.4-1.105.801-.264.401-.399.868-.399 1.335a3.39 3.39 0 00.053.536c.021.14.05.28.09.415.05.2.118.4.209.6.182.401.439.8.772 1.136.334.334.744.601 1.212.8.468.2.995.336 1.559.4.564.067 1.166.067 1.79 0 .296-.032.585-.083.87-.152z"/>
  </svg>
);

// App store icons as inline SVGs for consistency
const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
  </svg>
);

const AppStoreIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M11.624 7.222c-.876 0-2.232-.996-3.66-.96-1.884.024-3.612 1.092-4.584 2.784-1.956 3.396-.504 8.412 1.404 11.172.936 1.344 2.04 2.856 3.504 2.808 1.404-.06 1.932-.912 3.636-.912 1.692 0 2.172.912 3.66.876 1.512-.024 2.472-1.368 3.396-2.724 1.068-1.56 1.512-3.072 1.536-3.156-.036-.012-2.94-1.128-2.976-4.488-.024-2.808 2.292-4.152 2.4-4.212-1.32-1.932-3.348-2.148-4.056-2.196-1.848-.144-3.396 1.008-4.26 1.008zm3.12-2.832c.78-.936 1.296-2.244 1.152-3.54-1.116.048-2.46.744-3.264 1.68-.72.828-1.344 2.16-1.176 3.432 1.236.096 2.508-.636 3.288-1.572z"/>
  </svg>
);

// Sanitization configuration for release notes
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['h2', 'h3', 'h4', 'strong', 'em', 'code', 'br', 'li', 'ul', 'ol'],
  ALLOWED_ATTR: ['class'],
};

// Helper to render and sanitize markdown-style release notes
const renderReleaseNotes = (text: string): string => {
  // Phase 1: Strip all HTML from raw input to prevent XSS
  const cleanText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  
  // Phase 2: Apply markdown-to-HTML transformations on safe plain text
  const html = cleanText
    .replace(/^### (.*$)/gm, '<h4 class="text-sm font-semibold mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  
  // Phase 3: Final sanitization of generated HTML
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};

// Helper to determine supported platforms display text
const getSupportedPlatformsText = (release: SoftwareRelease): string | null => {
  const platforms = release.supported_platforms || ['windows', 'mac', 'linux'];
  const hasWindowsUrl = !!release.download_url_windows || !!release.download_url;
  const hasMacUrl = !!release.download_url_mac || !!release.download_url;
  const hasLinuxUrl = !!release.download_url_linux || !!release.download_url;
  
  // Check if all platforms have same/generic URL (no OS-specific URLs)
  const hasNoOsSpecificUrls = !release.download_url_windows && !release.download_url_mac && !release.download_url_linux;
  
  if (hasNoOsSpecificUrls && release.download_url) {
    const platformNames = platforms.map(p => {
      if (p === 'windows') return 'Windows';
      if (p === 'mac') return 'Mac';
      if (p === 'linux') return 'Linux';
      return p;
    });
    return `For ${platformNames.join(', ')}`;
  }
  
  return null;
};

export const SoftwareSection = ({ printerId, brandName, printerName }: SoftwareSectionProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScrapingSoftware, setIsScrapingSoftware] = useState(false);

  // Fetch software releases for this printer
  const { data: software, isLoading: isSoftwareLoading } = useQuery({
    queryKey: ["printer-software", printerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_software")
        .select("*")
        .eq("printer_id", printerId)
        .order("software_name", { ascending: true })
        .order("release_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as SoftwareRelease[];
    },
  });

  // Mutation to scrape software
  const scrapeSoftwareMutation = useMutation({
    mutationFn: async () => {
      setIsScrapingSoftware(true);
      const { data, error } = await supabase.functions.invoke("scrape-printer-software", {
        body: {
          printerId,
          brandName,
          printerName,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Software Scraped",
        description: `Found ${data.software_count || 0} software releases`,
      });
      queryClient.invalidateQueries({ queryKey: ["printer-software", printerId] });
      setIsScrapingSoftware(false);
    },
    onError: (error: any) => {
      toast({
        title: "Scrape Failed",
        description: error.message || "Failed to scrape software",
        variant: "destructive",
      });
      setIsScrapingSoftware(false);
    },
  });

  // Group software by name
  const groupedSoftware = software?.reduce((acc, sw) => {
    if (!acc[sw.software_name]) {
      acc[sw.software_name] = [];
    }
    acc[sw.software_name].push(sw);
    return acc;
  }, {} as Record<string, SoftwareRelease[]>) || {};

  const softwareNames = Object.keys(groupedSoftware);

  // Render OS-specific download section for current version
  const renderOsDownloads = (release: SoftwareRelease) => {
    const hasWindowsUrl = !!release.download_url_windows;
    const hasMacUrl = !!release.download_url_mac;
    const hasLinuxUrl = !!release.download_url_linux;
    const hasGenericUrl = !!release.download_url;
    
    // If no OS-specific URLs but has generic URL, show unified message
    if (!hasWindowsUrl && !hasMacUrl && !hasLinuxUrl && hasGenericUrl) {
      const platformsText = getSupportedPlatformsText(release);
      return (
        <div className="space-y-3">
          {platformsText && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {platformsText}
            </p>
          )}
          <a href={release.download_url!} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="gap-2">
              <Download className="h-3 w-3" />
              Download
            </Button>
          </a>
        </div>
      );
    }
    
    // If we have OS-specific URLs, show tabs
    if (hasWindowsUrl || hasMacUrl || hasLinuxUrl) {
      const defaultTab = hasWindowsUrl ? 'windows' : hasMacUrl ? 'mac' : 'linux';
      
      return (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="windows" disabled={!hasWindowsUrl && !hasGenericUrl} className="gap-2">
              <WindowsIcon /> Windows
            </TabsTrigger>
            <TabsTrigger value="mac" disabled={!hasMacUrl && !hasGenericUrl} className="gap-2">
              <MacIcon /> Mac
            </TabsTrigger>
            <TabsTrigger value="linux" disabled={!hasLinuxUrl && !hasGenericUrl} className="gap-2">
              <LinuxIcon /> Linux
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="windows" className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                v{release.version}
              </Badge>
              {release.release_date && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(release.release_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <a href={release.download_url_windows || release.download_url!} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                <Download className="h-3 w-3" />
                Download for Windows
              </Button>
            </a>
          </TabsContent>
          
          <TabsContent value="mac" className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                v{release.version}
              </Badge>
              {release.release_date && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(release.release_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <a href={release.download_url_mac || release.download_url!} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                <Download className="h-3 w-3" />
                Download for Mac
              </Button>
            </a>
          </TabsContent>
          
          <TabsContent value="linux" className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                v{release.version}
              </Badge>
              {release.release_date && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(release.release_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <a href={release.download_url_linux || release.download_url!} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                <Download className="h-3 w-3" />
                Download for Linux
              </Button>
            </a>
          </TabsContent>
        </Tabs>
      );
    }
    
    // No downloads available
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/50">
              <AppWindow className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle>Software & Apps</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Slicers, studio software, and mobile apps for {printerName}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrapeSoftwareMutation.mutate()}
              disabled={isScrapingSoftware || scrapeSoftwareMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingSoftware ? "animate-spin" : ""}`} />
              {isScrapingSoftware ? "Scraping..." : "Scrape Software"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSoftwareLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !software || software.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-4">
            <AppWindow className="h-12 w-12 mx-auto opacity-30" />
            <p>No software releases found for this printer.</p>
            {isAdmin && (
              <Button
                variant="default"
                onClick={() => scrapeSoftwareMutation.mutate()}
                disabled={isScrapingSoftware}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isScrapingSoftware ? "animate-spin" : ""}`} />
                Scrape Software Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {softwareNames.map((name) => {
              const releases = groupedSoftware[name];
              const latestRelease = releases.find(r => r.is_latest) || releases[0];
              const softwareType = latestRelease.software_type;
              
              const isMobileApp = latestRelease.is_mobile_app;
              
              // For mobile apps, show simplified card without version history
              if (isMobileApp) {
                return (
                  <Card key={name} className="bg-muted/30">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Smartphone className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {name}
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                Mobile App
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Official mobile app for {brandName} printers
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {latestRelease.google_play_url && (
                          <a
                            href={latestRelease.google_play_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="default" variant="outline" className="gap-2 bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20">
                              <PlayStoreIcon />
                              Google Play
                            </Button>
                          </a>
                        )}
                        {latestRelease.app_store_url && (
                          <a
                            href={latestRelease.app_store_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="default" variant="outline" className="gap-2 bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20">
                              <AppStoreIcon />
                              App Store
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
              // Regular software with version history - separate into Current and Older
              const currentRelease = latestRelease;
              const olderReleases = releases.filter(r => r.id !== currentRelease.id);
              
              return (
                <Card key={name} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background">
                          {softwareTypeIcons[softwareType] || <AppWindow className="h-4 w-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {softwareTypeLabels[softwareType] || softwareType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Version Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Current Version
                      </h4>
                      <div className="border rounded-lg p-4 bg-primary/5 border-primary/20 space-y-4">
                        {/* OS-specific downloads */}
                        {renderOsDownloads(currentRelease)}
                        
                        {/* Source link */}
                        {currentRelease.source_url && (
                          <a href={currentRelease.source_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-2">
                              <ExternalLink className="h-3 w-3" />
                              View Source
                            </Button>
                          </a>
                        )}
                        
                        {/* Release notes */}
                        {currentRelease.release_notes && (
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <h5 className="text-sm font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Release Notes
                            </h5>
                            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: renderReleaseNotes(currentRelease.release_notes) }} />
                            </div>
                          </div>
                        )}
                        
                        {currentRelease.changelog && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold">Changelog</h5>
                            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                              <div dangerouslySetInnerHTML={{ __html: renderReleaseNotes(currentRelease.changelog) }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Older Versions Section */}
                    {olderReleases.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Older Versions ({olderReleases.length})
                        </h4>
                        <Accordion type="single" collapsible className="space-y-2">
                          {olderReleases.map((sw) => (
                            <AccordionItem
                              key={sw.id}
                              value={sw.id}
                              className="border rounded-lg px-4 bg-background hover:bg-muted/30 transition-colors"
                            >
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="flex items-center gap-4 w-full">
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <span className="font-mono font-bold">v{sw.version}</span>
                                  </div>
                                  {sw.release_date && (
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(sw.release_date), "MMM d, yyyy")}
                                    </span>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="space-y-4 pt-2">
                                  {sw.release_notes && (
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Release Notes
                                      </h5>
                                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg prose prose-sm dark:prose-invert max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: renderReleaseNotes(sw.release_notes) }} />
                                      </div>
                                    </div>
                                  )}

                                  {sw.changelog && (
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-semibold">Changelog</h5>
                                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        <div dangerouslySetInnerHTML={{ __html: renderReleaseNotes(sw.changelog) }} />
                                      </div>
                                    </div>
                                  )}

                                  {/* No download links for older versions - only release notes */}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoftwareSection;
