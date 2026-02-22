import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bot, Copy, Search, ChevronRight, Loader2, CheckCircle2, AlertTriangle, ExternalLink, RotateCcw, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductType, DiagnosisResult, DiagnosisItem } from '../types';
import { generateLovablePrompt, REGION_URL_COLUMN_MAP } from '../constants';
import { PRODUCT_TYPE_CONFIGS } from '../types';

interface DiagnosisModalProps {
  productType: ProductType;
  diagnosisResult: DiagnosisResult | null;
  showModal: boolean;
  onClose: (open: boolean) => void;
  searchResults: Record<string, { loading: boolean; url?: string; confidence?: number; method?: string; query?: string; error?: boolean }>;
  bulkSearchProgress: { running: boolean; done: number; total: number; found: number } | null;
  onSearchStore: (url: string, region: string) => void;
  onSearchAllBroken: (failureDetails: Array<{ product: string; region: string; url: string; error: string; statusCode?: number; latencyMs?: number; brand: string }>) => void;
  onApplyAllFixes: (failureDetails: Array<{ product: string; region: string; url: string; error: string; brand: string }>) => void;
  onRetryTransient: () => void;
}

export function DiagnosisModal({
  productType,
  diagnosisResult,
  showModal,
  onClose,
  searchResults,
  bulkSearchProgress,
  onSearchStore,
  onSearchAllBroken,
  onApplyAllFixes,
  onRetryTransient,
}: DiagnosisModalProps) {
  const config = PRODUCT_TYPE_CONFIGS[productType];
  const queryClient = useQueryClient();

  return (
    <Dialog open={showModal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Sync Failure Diagnosis
            {diagnosisResult && (
              <Badge className={`ml-2 text-[10px] ${
                diagnosisResult.overallHealth === 'poor' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                diagnosisResult.overallHealth === 'fair' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {diagnosisResult.overallHealth === 'poor' ? '🔴' : diagnosisResult.overallHealth === 'fair' ? '🟡' : '🟢'} {diagnosisResult.overallHealth.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {diagnosisResult?.summary || 'Analyzing failures...'}
          </DialogDescription>
        </DialogHeader>

        {diagnosisResult && (
          <div className="space-y-3 mt-2">
            {diagnosisResult.diagnoses.map((d, i) => (
              <Card key={i} className={`border-l-4 ${
                d.severity === 'high' ? 'border-l-red-500' :
                d.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-emerald-500'
              }`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${
                        d.severity === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        d.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {d.severity}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{d.pattern}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{d.count} affected</Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">{d.diagnosis}</p>
                  <p className="text-xs text-foreground"><span className="font-medium">Fix:</span> {d.suggestedFix}</p>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 h-7"
                      onClick={() => {
                        navigator.clipboard.writeText(generateLovablePrompt(d));
                        toast.success('Lovable fix prompt copied to clipboard');
                      }}
                    >
                      <Copy className="w-3 h-3" /> 📋 Copy Lovable Prompt
                    </Button>
                    {(d.pattern.includes('404') || d.pattern.toLowerCase().includes('broken link')) && d.contextualPromptParts?.failureDetails && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5 h-7"
                          disabled={bulkSearchProgress?.running}
                          onClick={() => onSearchAllBroken(d.contextualPromptParts!.failureDetails)}
                        >
                          {bulkSearchProgress?.running ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Searching {bulkSearchProgress.done}/{bulkSearchProgress.total}...</>
                          ) : (
                            <><Search className="w-3 h-3" /> 🔍 Search All Broken</>
                          )}
                        </Button>
                        {bulkSearchProgress && !bulkSearchProgress.running && bulkSearchProgress.found > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 h-7 text-emerald-400 border-emerald-500/30"
                            onClick={() => onApplyAllFixes(d.contextualPromptParts!.failureDetails)}
                          >
                            <Wrench className="w-3 h-3" /> Apply {bulkSearchProgress.found} fixes
                          </Button>
                        )}
                      </>
                    )}
                    {d.isTransient && (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">Transient — can retry</Badge>
                    )}
                  </div>

                  {d.affectedProducts.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1">
                        <ChevronRight className="w-3 h-3" /> Show {d.affectedProducts.length} affected products
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 pl-4 space-y-1.5 max-h-48 overflow-y-auto">
                          {d.affectedProducts.map((p, j) => {
                            const detail = d.contextualPromptParts?.failureDetails?.[j];
                            const sr = detail ? searchResults[detail.url] : undefined;
                            const isBroken = d.pattern.includes('404') || d.pattern.toLowerCase().includes('broken link');

                            return (
                              <div key={j} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-muted-foreground font-mono flex-1 truncate">{p}</p>
                                  {isBroken && detail && !sr?.url && !sr?.loading && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-[10px] h-6 px-2 gap-1 shrink-0"
                                      onClick={() => onSearchStore(detail.url, detail.region)}
                                    >
                                      <Search className="w-3 h-3" /> Search
                                    </Button>
                                  )}
                                  {sr?.loading && (
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />
                                  )}
                                </div>
                                {sr?.url && (
                                  <div className="flex items-center gap-1.5 pl-2 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <a href={sr.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline truncate max-w-[200px]" title={sr.query ? `Search: ${sr.query}` : undefined}>
                                      {sr.url.replace(/^https?:\/\//, '').slice(0, 50)}
                                    </a>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                      {((sr.confidence || 0) * 100).toFixed(0)}%
                                    </Badge>
                                    <span className="text-muted-foreground text-[9px]">{sr.method}</span>
                                    <a href={sr.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground" /></a>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-[9px] h-5 px-1.5 text-emerald-400"
                                      onClick={async () => {
                                        if (!detail) return;
                                        const col = REGION_URL_COLUMN_MAP[detail.region?.toUpperCase()] || 'product_url';
                                        const { data: product } = await (supabase.from(config.tableName as any).select('id') as any).eq(col, detail.url).limit(1).maybeSingle();
                                        if (product) {
                                          await supabase.from(config.tableName as any).update({ [col]: sr.url } as any).eq('id', product.id);
                                          toast.success('URL updated');
                                          queryClient.invalidateQueries({ queryKey: ['admin-pricing-data', productType] });
                                        } else {
                                          toast.error('Could not find product to update');
                                        }
                                      }}
                                    >
                                      Apply Fix
                                    </Button>
                                  </div>
                                )}
                                {sr?.error && !sr?.url && !sr?.loading && (
                                  <div className="flex items-center gap-1.5 pl-2 text-[10px]">
                                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="text-amber-400">No match</span>
                                    {detail && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[9px] h-5 px-1.5"
                                        onClick={() => {
                                          try {
                                            const urlObj = new URL(detail.url);
                                            const searchTerms = detail.product.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
                                            window.open(`${urlObj.origin}/search?q=${encodeURIComponent(searchTerms)}`, '_blank');
                                          } catch {
                                            toast.error('Could not build search URL');
                                          }
                                        }}
                                      >
                                        Manual Search
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            ))}

            {diagnosisResult.diagnoses.length > 1 && (
              <Button
                variant="outline"
                className="w-full text-xs gap-1.5"
                onClick={() => {
                  const fullPrompt = diagnosisResult.diagnoses
                    .map(d => generateLovablePrompt(d))
                    .join('\n\n---\n\n');
                  const header = `## Pricing Sync Diagnosis Report\n\n**Overall Health:** ${diagnosisResult.overallHealth}\n**Summary:** ${diagnosisResult.summary}\n\nThe following ${diagnosisResult.diagnoses.length} issue categories were found. Please address them in priority order:\n\n`;
                  navigator.clipboard.writeText(header + fullPrompt);
                  toast.success('Full diagnosis prompt copied to clipboard');
                }}
              >
                <Copy className="w-3 h-3" /> Copy All as Lovable Prompt
              </Button>
            )}

            {diagnosisResult.diagnoses.some(d => d.isTransient) && (
              <Button
                variant="outline"
                className="w-full text-xs gap-1.5"
                onClick={onRetryTransient}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Transient Failures
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
