import { useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { AffiliateProgram } from "@/types/affiliate";
import { ProgramOverviewCard } from "./ProgramOverviewCard";
import { LinkGeneratorCard } from "./LinkGeneratorCard";
import { DiscountCodesCard } from "./DiscountCodesCard";
import { CampaignsCard } from "./CampaignsCard";
import { RestrictionsCard } from "./RestrictionsCard";
import { ProgramFormDialog } from "./ProgramFormDialog";

interface BrandAccordionItemProps {
  brandName: string;
  programs: AffiliateProgram[];
}

export function BrandAccordionItem({ brandName, programs }: BrandAccordionItemProps) {
  const [editingProgram, setEditingProgram] = useState<AffiliateProgram | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addRegionOpen, setAddRegionOpen] = useState(false);

  const allActive = programs.every((p) => p.is_active && p.account_status === "active");
  const hasPending = programs.some((p) => p.account_status === "pending_verification");
  const hasIssues = programs.some((p) => p.account_status === "suspended" || p.account_status === "rejected");

  const statusDot = hasIssues
    ? "bg-red-500"
    : hasPending
    ? "bg-yellow-500"
    : allActive
    ? "bg-green-500"
    : "bg-muted-foreground";

  const openEdit = (p: AffiliateProgram) => {
    setEditingProgram(p);
    setEditDialogOpen(true);
  };

  const openAddRegion = () => {
    setEditingProgram(null);
    setAddRegionOpen(true);
  };

  return (
    <>
      <AccordionItem value={brandName}>
        <AccordionTrigger className="hover:no-underline px-4 py-3">
          <div className="flex items-center gap-3 w-full mr-4">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot}`} />
            <span className="font-semibold text-foreground">{brandName}</span>
            <Badge variant="secondary" className="text-xs">
              {programs.length} region{programs.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <Tabs defaultValue={programs[0]?.region_code} className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <TabsList>
                {programs.map((p) => (
                  <TabsTrigger key={p.region_code} value={p.region_code}>
                    {p.region_code}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button size="sm" variant="ghost" onClick={openAddRegion}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Region
              </Button>
            </div>

            {programs.map((p) => (
              <TabsContent key={p.region_code} value={p.region_code} className="space-y-4 mt-0">
                <ProgramOverviewCard program={p} onEdit={() => openEdit(p)} />
                <LinkGeneratorCard program={p} />
                <DiscountCodesCard programId={p.id} />
                <CampaignsCard programId={p.id} />
                <RestrictionsCard programId={p.id} />
              </TabsContent>
            ))}
          </Tabs>
        </AccordionContent>
      </AccordionItem>

      <ProgramFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        program={editingProgram}
      />

      {/* Add Region dialog pre-fills brand name */}
      <ProgramFormDialog
        open={addRegionOpen}
        onOpenChange={setAddRegionOpen}
        program={{ brand_name: brandName } as any}
      />
    </>
  );
}
