import { useState } from "react";
import { useAffiliatePrograms, useUpdateProgram } from "@/hooks/useAffiliatePrograms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Pencil, Plus, Link2, Image, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AffiliateLinkTester } from "./AffiliateLinkTester";
import { ProgramFormDialog } from "./ProgramFormDialog";
import type { AffiliateProgram } from "@/types/affiliate";

const REGION_FLAGS: Record<string, string> = {
  AU: "🇦🇺", UK: "🇬🇧", US: "🇺🇸", CA: "🇨🇦", EU: "🇪🇺", JP: "🇯🇵", CN: "🇨🇳",
};

/** Extract a URL from program notes matching a pattern */
function extractUrlFromNotes(notes: string | null, pattern: RegExp): string | null {
  if (!notes) return null;
  const match = notes.match(pattern);
  return match ? match[0] : null;
}

export function ProgramsTab() {
  const { data: programs, isLoading } = useAffiliatePrograms();
  const updateProgram = useUpdateProgram();
  const [editingProgram, setEditingProgram] = useState<AffiliateProgram | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activateProgram, setActivateProgram] = useState<AffiliateProgram | null>(null);

  const handleToggleActive = (program: AffiliateProgram) => {
    // If activating an inactive program, show confirmation dialog
    if (!program.is_active) {
      setActivateProgram(program);
      return;
    }
    // Deactivating — no confirmation needed
    updateProgram.mutate(
      { id: program.id, is_active: false },
      {
        onSuccess: () => toast({ title: "Program deactivated" }),
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  const confirmActivate = () => {
    if (!activateProgram) return;
    updateProgram.mutate(
      { id: activateProgram.id, is_active: true },
      {
        onSuccess: () => {
          toast({ title: `${activateProgram.brand_name} ${activateProgram.region_code} affiliate program activated. Links are now live.` });
          setActivateProgram(null);
        },
        onError: (e) => {
          toast({ title: "Error", description: e.message, variant: "destructive" });
          setActivateProgram(null);
        },
      }
    );
  };

  const isPendingVerification = (p: AffiliateProgram) =>
    !p.is_active && (p.account_status === "pending_verification" || p.program_notes?.toLowerCase().includes("verification"));

  const getCreativesUrl = (p: AffiliateProgram) =>
    extractUrlFromNotes(p.program_notes, /https:\/\/creatives\.goaffpro\.com\/\S+/);

  const getSettingsUrl = (p: AffiliateProgram) =>
    extractUrlFromNotes(p.program_notes, /https:\/\/\S+goaffpro\.com\/settings\S*/);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Affiliate Programs</CardTitle>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Program
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading programs…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Link Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(programs || []).map((p) => {
                  const flag = REGION_FLAGS[p.region_code] || "🌐";
                  const pending = isPendingVerification(p);
                  const creativesUrl = getCreativesUrl(p);
                  const settingsUrl = getSettingsUrl(p);

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.brand_name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {flag} {p.region_code}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.affiliate_network}</TableCell>
                      <TableCell className="text-sm">
                        {p.commission_rate != null
                          ? p.commission_type === "fixed"
                            ? `$${p.commission_rate} fixed`
                            : `${p.commission_rate}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate block cursor-help">
                              {p.link_template}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md break-all text-xs">
                            {p.link_template}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {pending ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs cursor-help">
                                Pending Verification
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              Account submitted. Awaiting GoAffPro approval (24–48hrs). Activate once confirmed.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Switch
                            checked={!!p.is_active}
                            onCheckedChange={() => handleToggleActive(p)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" onClick={() => setEditingProgram(p)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {p.portal_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={p.portal_url} target="_blank" rel="noopener noreferrer">
                                    <Link2 className="w-4 h-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Portal</TooltipContent>
                            </Tooltip>
                          )}
                          {creativesUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={creativesUrl} target="_blank" rel="noopener noreferrer">
                                    <Image className="w-4 h-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Creatives</TooltipContent>
                            </Tooltip>
                          )}
                          {settingsUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={settingsUrl} target="_blank" rel="noopener noreferrer">
                                    <Settings className="w-4 h-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Settings</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AffiliateLinkTester programs={programs || []} />

      <ProgramFormDialog
        open={showAddDialog || !!editingProgram}
        onOpenChange={(open) => {
          if (!open) { setShowAddDialog(false); setEditingProgram(null); }
        }}
        program={editingProgram}
      />

      {/* Activation confirmation dialog */}
      <AlertDialog open={!!activateProgram} onOpenChange={(open) => { if (!open) setActivateProgram(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Activate {activateProgram?.brand_name} {activateProgram?.region_code} affiliate program?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Confirm your GoAffPro account (ID: {activateProgram?.affiliate_id || "N/A"}) has been approved before activating. Untracked clicks will not earn commission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate}>Confirm &amp; Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
