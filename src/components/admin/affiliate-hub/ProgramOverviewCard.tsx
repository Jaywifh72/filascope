import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Pencil, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { AffiliateProgram, CommissionTier } from "@/types/affiliate";
import { buildAffiliateLinkLocal } from "@/utils/affiliateLinks";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  pending_verification: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  suspended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface ProgramOverviewCardProps {
  program: AffiliateProgram;
  onEdit: () => void;
}

export function ProgramOverviewCard({ program, onEdit }: ProgramOverviewCardProps) {
  const [testLink, setTestLink] = useState("");
  const [tiersOpen, setTiersOpen] = useState(false);

  const tiers = program.commission_tiers as CommissionTier[] | null;
  const isRedirectLink = program.link_generation_method === "redirect_link";

  const handleTestLink = () => {
    const url = buildAffiliateLinkLocal(program, "/products/test-product");
    setTestLink(url);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const statusClass = statusColors[program.account_status || "active"] || statusColors.active;

  return (
    <Card className="p-5 bg-card border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">Program Overview</h3>
          <Badge variant="outline" className={statusClass}>
            {(program.account_status || "active").replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleTestLink}>
            <FlaskConical className="w-3.5 h-3.5 mr-1.5" /> Test Link
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <InfoRow label="Affiliate Network" value={program.affiliate_network} />
        <InfoRow label="Commission" value={
          tiers && tiers.length > 0
            ? `${Math.min(...tiers.map(t => t.rate))}% – ${Math.max(...tiers.map(t => t.rate))}% tiered`
            : program.commission_rate ? `${program.commission_rate}% ${program.commission_type || ""}` : "—"
        } />
        <InfoRow label="Affiliate ID" value={program.affiliate_id} mono />
        <InfoRow label="Cookie Duration" value={program.cookie_duration_hours ? `${program.cookie_duration_hours}h` : "—"} />
        <InfoRow label="Referral Handle" value={program.referral_handle} mono />
        <InfoRow label="Cart Persistence" value={program.cart_persistence_days ? `${program.cart_persistence_days}d` : "—"} />
        <InfoRow label="Account Email" value={program.account_email} />
        <InfoRow label="Attribution" value={program.attribution_model} />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-32 shrink-0">Portal URL</span>
          {program.portal_url ? (
            <a href={program.portal_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
              {program.portal_url} <ExternalLink className="w-3 h-3" />
            </a>
          ) : <span className="text-muted-foreground">—</span>}
        </div>
        <InfoRow label="Payout" value={[program.payout_schedule, program.payout_method, program.payout_currency].filter(Boolean).join(" · ") || "—"} />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground w-32 shrink-0">Store URL</span>
          <a href={program.store_base_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
            {program.store_base_url} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <InfoRow label="Deep Linking" value={isRedirectLink && !program.deep_linking_supported ? "Via Dashboard" : program.deep_linking_supported ? "Yes" : "No"} />

        {/* Impact.com / redirect_link specific fields */}
        {isRedirectLink && (
          <>
            <InfoRow label="Tracking Domain" value={program.tracking_domain} mono />
            <InfoRow label="Campaign ID" value={program.impact_campaign_id} mono />
            <InfoRow label="Partner ID" value={program.impact_media_partner_id} mono />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-32 shrink-0">Default Link</span>
              {program.default_tracking_link ? (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-mono text-xs text-foreground truncate">{program.default_tracking_link}</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => copyText(program.default_tracking_link!)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              ) : <span className="text-muted-foreground">—</span>}
            </div>
          </>
        )}
      </div>

      {/* Commission Tiers */}
      {tiers && tiers.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setTiersOpen(!tiersOpen)}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            {tiersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {tiersOpen ? "Hide" : "View"} commission tiers
          </button>
          {tiersOpen && (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Stage</th>
                    <th className="px-3 py-1.5 text-left font-medium">Rate</th>
                    <th className="px-3 py-1.5 text-left font-medium">Monthly Sales Range</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.stage} className="border-t border-border">
                      <td className="px-3 py-1.5 text-foreground">{tier.stage}</td>
                      <td className="px-3 py-1.5 font-mono text-foreground">{tier.rate}%</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{tier.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Link template */}
      <div>
        <span className="text-xs text-muted-foreground">Link Template</span>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 bg-muted/50 rounded px-3 py-2 text-xs font-mono text-foreground break-all">
            {program.link_template}
          </code>
          <Button size="icon" variant="ghost" className="shrink-0" onClick={() => copyText(program.link_template)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Notes callouts */}
      {program.status_notes && (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-300">
          <strong>Status Notes:</strong> {program.status_notes}
        </div>
      )}
      {program.program_notes && (
        <div className="rounded-md bg-muted/30 border border-border p-3 text-sm text-muted-foreground">
          {program.program_notes}
        </div>
      )}

      {/* Test link output */}
      {testLink && (
        <div className="flex items-center gap-2">
          <Input readOnly value={testLink} className="font-mono text-xs" />
          <Button size="icon" variant="ghost" onClick={() => copyText(testLink)}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={`text-foreground truncate ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
    </div>
  );
}
