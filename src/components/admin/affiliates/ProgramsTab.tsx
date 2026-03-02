import { useState } from "react";
import { useAffiliatePrograms, useUpdateProgram } from "@/hooks/useAffiliatePrograms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AffiliateLinkTester } from "./AffiliateLinkTester";
import { ProgramFormDialog } from "./ProgramFormDialog";
import type { AffiliateProgram } from "@/types/affiliate";

export function ProgramsTab() {
  const { data: programs, isLoading } = useAffiliatePrograms();
  const updateProgram = useUpdateProgram();
  const [editingProgram, setEditingProgram] = useState<AffiliateProgram | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleToggleActive = (program: AffiliateProgram) => {
    updateProgram.mutate(
      { id: program.id, is_active: !program.is_active },
      {
        onSuccess: () => toast({ title: "Program updated" }),
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

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
                {(programs || []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.brand_name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {p.region_code}
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
                      <Switch
                        checked={!!p.is_active}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingProgram(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {p.portal_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={p.portal_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
