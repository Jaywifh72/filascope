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
  FileCode,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileText,
  HardDrive,
} from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

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

interface FirmwareRelease {
  id: string;
  version: string;
  release_date: string | null;
  release_notes: string | null;
  changelog: string | null;
  download_url: string | null;
  file_size_mb: number | null;
  known_issues: string | null;
  is_latest: boolean;
  source_url: string | null;
  created_at: string;
}

interface FirmwareSectionProps {
  printerId: string;
  brandName: string | null;
  printerName: string;
}

export const FirmwareSection = ({ printerId, brandName, printerName }: FirmwareSectionProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScrapingFirmware, setIsScrapingFirmware] = useState(false);

  // Fetch firmware releases for this printer
  const { data: firmware, isLoading: isFirmwareLoading } = useQuery({
    queryKey: ["printer-firmware", printerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_firmware")
        .select("*")
        .eq("printer_id", printerId)
        .order("release_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as FirmwareRelease[];
    },
  });

  // Mutation to scrape firmware
  const scrapeFirmwareMutation = useMutation({
    mutationFn: async () => {
      setIsScrapingFirmware(true);
      const { data, error } = await supabase.functions.invoke("scrape-printer-firmware", {
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
        title: "Firmware Scraped",
        description: `Found ${data.firmware_count || 0} firmware releases`,
      });
      queryClient.invalidateQueries({ queryKey: ["printer-firmware", printerId] });
      setIsScrapingFirmware(false);
    },
    onError: (error: any) => {
      toast({
        title: "Scrape Failed",
        description: error.message || "Failed to scrape firmware",
        variant: "destructive",
      });
      setIsScrapingFirmware(false);
    },
  });

  const latestFirmware = firmware?.find((fw) => fw.is_latest);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Firmware History</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                All firmware releases for {printerName}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrapeFirmwareMutation.mutate()}
              disabled={isScrapingFirmware || scrapeFirmwareMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingFirmware ? "animate-spin" : ""}`} />
              {isScrapingFirmware ? "Scraping..." : "Scrape Firmware"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isFirmwareLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !firmware || firmware.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground space-y-4">
            <FileCode className="h-12 w-12 mx-auto opacity-30" />
            <p>No firmware releases found for this printer.</p>
            {isAdmin && (
              <Button
                variant="default"
                onClick={() => scrapeFirmwareMutation.mutate()}
                disabled={isScrapingFirmware}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isScrapingFirmware ? "animate-spin" : ""}`} />
                Scrape Firmware Now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Firmware Highlight */}
            {latestFirmware && (
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-primary-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Latest Version
                        </Badge>
                        <span className="text-2xl font-bold font-mono">v{latestFirmware.version}</span>
                      </div>
                      {latestFirmware.release_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Released {format(new Date(latestFirmware.release_date), "MMMM d, yyyy")}
                        </div>
                      )}
                      {latestFirmware.release_notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
                          {latestFirmware.release_notes}
                        </p>
                      )}
                    </div>
                    {latestFirmware.download_url && (
                      <a
                        href={latestFirmware.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    )}
                    {!latestFirmware.download_url && latestFirmware.source_url && (
                      <a
                        href={latestFirmware.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Source
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Firmware Releases */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                All Releases ({firmware.length})
              </h4>
              <Accordion type="single" collapsible className="space-y-2">
                {firmware.map((fw) => (
                  <AccordionItem
                    key={fw.id}
                    value={fw.id}
                    className="border rounded-lg px-4 bg-card hover:bg-muted/30 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="font-mono font-bold text-lg">v{fw.version}</span>
                          {fw.is_latest && (
                            <Badge variant="secondary" className="text-xs">Latest</Badge>
                          )}
                        </div>
                        {fw.release_date && (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(fw.release_date), "MMM d, yyyy")}
                          </span>
                        )}
                        {fw.file_size_mb && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {fw.file_size_mb} MB
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        {fw.release_notes && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Release Notes
                            </h5>
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-1 prose-li:my-0">
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: renderReleaseNotes(fw.release_notes)
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {fw.changelog && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold">Changelog</h5>
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: renderReleaseNotes(fw.changelog)
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {fw.known_issues && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              Known Issues
                            </h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                              {fw.known_issues}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {fw.download_url && (
                            <a
                              href={fw.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="gap-2">
                                <Download className="h-3 w-3" />
                                Download Firmware
                              </Button>
                            </a>
                          )}
                          {fw.source_url && (
                            <a
                              href={fw.source_url}
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FirmwareSection;