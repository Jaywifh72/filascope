import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
} from "lucide-react";
import { format } from "date-fns";

interface SoftwareRelease {
  id: string;
  software_name: string;
  software_type: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  changelog: string | null;
  download_url: string | null;
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
              
              return (
                <Card key={name} className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background">
                          {softwareTypeIcons[softwareType] || <AppWindow className="h-4 w-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {name}
                            {latestRelease.is_mobile_app && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                                <Smartphone className="h-3 w-3 mr-1" />
                                Mobile App
                              </Badge>
                            )}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {softwareTypeLabels[softwareType] || softwareType}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Latest: v{latestRelease.version}
                          </Badge>
                        </div>
                        {latestRelease.release_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(latestRelease.release_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {releases.map((sw) => (
                        <AccordionItem
                          key={sw.id}
                          value={sw.id}
                          className="border rounded-lg px-4 bg-background hover:bg-muted/30 transition-colors"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-4 w-full">
                              <div className="flex items-center gap-2 min-w-[100px]">
                                <span className="font-mono font-bold">v{sw.version}</span>
                                {sw.is_latest && (
                                  <Badge variant="secondary" className="text-xs">Latest</Badge>
                                )}
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
                                    <div 
                                      dangerouslySetInnerHTML={{ 
                                        __html: sw.release_notes
                                          .replace(/^### (.*$)/gm, '<h4 class="text-sm font-semibold mt-3 mb-1">$1</h4>')
                                          .replace(/^## (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
                                          .replace(/^# (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
                                          .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                                          .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                          .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
                                          .replace(/\n\n/g, '<br/><br/>')
                                          .replace(/\n/g, '<br/>')
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {sw.changelog && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-semibold">Changelog</h5>
                                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                    <div 
                                      dangerouslySetInnerHTML={{ 
                                        __html: sw.changelog
                                          .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                                          .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                          .replace(/\n/g, '<br/>')
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-2">
                                {sw.download_url && (
                                  <a
                                    href={sw.download_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm" className="gap-2">
                                      <Download className="h-3 w-3" />
                                      Download
                                    </Button>
                                  </a>
                                )}
                                {sw.google_play_url && (
                                  <a
                                    href={sw.google_play_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm" variant="outline" className="gap-2 bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20">
                                      <PlayStoreIcon />
                                      Google Play
                                    </Button>
                                  </a>
                                )}
                                {sw.app_store_url && (
                                  <a
                                    href={sw.app_store_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm" variant="outline" className="gap-2 bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20">
                                      <AppStoreIcon />
                                      App Store
                                    </Button>
                                  </a>
                                )}
                                {sw.source_url && (
                                  <a
                                    href={sw.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm" variant="outline" className="gap-2">
                                      <ExternalLink className="h-3 w-3" />
                                      View Source
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
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
