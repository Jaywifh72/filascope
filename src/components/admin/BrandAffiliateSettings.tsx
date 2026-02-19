import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  Save,
  ExternalLink,
  Link,
  TestTube,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AffiliateConfig {
  id: string;
  vendor_name: string;
  brand_id: string | null;
  affiliate_network: string | null;
  affiliate_id: string | null;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
  amazon_ca_tag: string | null;
  amazon_au_tag: string | null;
  amazon_jp_tag: string | null;
  awin_advertiser_id: string | null;
  awin_affiliate_id: string | null;
  impact_program_id: string | null;
  impact_media_partner_id: string | null;
  tracking_url_template: string | null;
  commission_rate: number | null;
  cookie_duration_days: number | null;
  is_active: boolean;
  signup_url: string | null;
  notes: string | null;
}

interface BrandAffiliateSettingsProps {
  brandId: string;
  brandName: string;
  brandSlug: string;
}

const AFFILIATE_NETWORKS = [
  { value: "amazon", label: "Amazon Associates", description: "Direct Amazon affiliate program" },
  { value: "awin", label: "Awin (ShareASale)", description: "Awin network (includes ShareASale)" },
  { value: "impact", label: "Impact", description: "Impact Radius affiliate network" },
  { value: "goaffpro", label: "GoAffPro", description: "GoAffPro affiliate platform" },
  { value: "shareasale", label: "ShareASale", description: "ShareASale network" },
  { value: "direct", label: "Direct Program", description: "Brand's own affiliate program" },
  { value: "none", label: "No Program", description: "No affiliate program available" },
];

// Pre-researched affiliate program info for major brands
const BRAND_AFFILIATE_INFO: Record<string, { 
  network: string; 
  signupUrl?: string;
  notes?: string;
  commissionRate?: number;
  cookieDays?: number;
}> = {
  "elegoo": {
    network: "impact",
    signupUrl: "https://www.elegoo.com/pages/elegoo-affiliate-impact-shareasale",
    notes: "Also available via ShareASale. Impact ID format: elegoo.pxf.io",
    commissionRate: 8,
    cookieDays: 30,
  },
  "bambu-lab": {
    network: "awin",
    signupUrl: "https://ui.awin.com/merchant-profile/46345",
    notes: "Awin merchant ID: 46345. ~3-5% commission typical",
    commissionRate: 4,
    cookieDays: 30,
  },
  "creality": {
    network: "awin",
    signupUrl: "https://www.creality.com/resources/affiliate-program",
    notes: "Available via Awin. Also has ShareASale presence.",
    commissionRate: 5,
    cookieDays: 30,
  },
  "prusa": {
    network: "direct",
    signupUrl: "https://partner.prusa3d.com/affiliates/",
    notes: "Direct affiliate program. UTM-based tracking.",
    commissionRate: 5,
    cookieDays: 45,
  },
  "polymaker": {
    network: "goaffpro",
    signupUrl: "https://us.polymaker.com/pages/affiliates-program",
    notes: "Uses GoAffPro. Referral code format: ?ref=CODE",
    commissionRate: 10,
    cookieDays: 30,
  },
  "matterhackers": {
    network: "direct",
    signupUrl: "https://www.matterhackers.com/about/affiliate",
    notes: "Direct affiliate program. Contact for details.",
    commissionRate: 5,
    cookieDays: 30,
  },
  "overture": {
    network: "direct",
    notes: "Direct affiliate program. URL format: ?aff=ID",
    commissionRate: 5,
    cookieDays: 30,
  },
  "anycubic": {
    network: "awin",
    signupUrl: "https://www.anycubic.com/pages/affiliate-program",
    notes: "Available via Awin and ShareASale",
    commissionRate: 5,
    cookieDays: 30,
  },
  "esun": {
    network: "amazon",
    notes: "Primarily sold on Amazon. Use Amazon Associates tags.",
  },
  "hatchbox": {
    network: "amazon",
    notes: "Amazon-only brand. Use Amazon Associates tags.",
  },
  "flashforge": {
    network: "shareasale",
    signupUrl: "https://www.shareasale.com/",
    notes: "Available via ShareASale network",
    commissionRate: 5,
    cookieDays: 30,
  },
  "colorfabb": {
    network: "direct",
    signupUrl: "https://colorfabb.com/",
    notes: "Contact directly for affiliate partnership",
  },
  "fillamentum": {
    network: "direct",
    notes: "Contact directly for affiliate partnership",
  },
};

export function BrandAffiliateSettings({ brandId, brandName, brandSlug }: BrandAffiliateSettingsProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [formData, setFormData] = useState<Partial<AffiliateConfig>>({
    vendor_name: brandName,
    brand_id: brandId,
    affiliate_network: null,
    affiliate_id: null,
    affiliate_url_pattern: null,
    amazon_us_tag: null,
    amazon_uk_tag: null,
    amazon_de_tag: null,
    amazon_ca_tag: null,
    amazon_au_tag: null,
    amazon_jp_tag: null,
    awin_advertiser_id: null,
    awin_affiliate_id: null,
    impact_program_id: null,
    impact_media_partner_id: null,
    tracking_url_template: null,
    commission_rate: null,
    cookie_duration_days: null,
    is_active: true,
    signup_url: null,
    notes: null,
  });

  // Always-on query for badge status (cheap: select only needed fields)
  const { data: badgeConfig } = useQuery({
    queryKey: ["affiliate-config-badge", brandId, brandName],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_configs")
        .select("id, affiliate_network, is_active")
        .eq("brand_id", brandId)
        .maybeSingle();
      if (data) return data;
      // Fallback: vendor_name match (for rows without brand_id set)
      const { data: fallback } = await supabase
        .from("affiliate_configs")
        .select("id, affiliate_network, is_active")
        .ilike("vendor_name", brandName)
        .is("brand_id", null)
        .maybeSingle();
      return fallback ?? null;
    },
  });

  // Fetch existing config (full record, only when panel is open)
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["affiliate-config", brandId, brandName],
    queryFn: async () => {
      // Try by brand_id first (preferred), then vendor_name fallback
      const { data: byId } = await supabase
        .from("affiliate_configs")
        .select("*")
        .eq("brand_id", brandId)
        .maybeSingle();
      if (byId) return byId as AffiliateConfig;

      const { data: byName, error } = await supabase
        .from("affiliate_configs")
        .select("*")
        .ilike("vendor_name", brandName)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (byName as AffiliateConfig) ?? null;
    },
    enabled: isOpen,
  });

  // Update form when config loads
  useEffect(() => {
    if (existingConfig) {
      setFormData({
        ...existingConfig,
        brand_id: brandId,
      });
    } else {
      // Pre-fill with known affiliate info
      const knownInfo = BRAND_AFFILIATE_INFO[brandSlug];
      if (knownInfo) {
        setFormData(prev => ({
          ...prev,
          vendor_name: brandName,
          brand_id: brandId,
          affiliate_network: knownInfo.network,
          signup_url: knownInfo.signupUrl || null,
          notes: knownInfo.notes || null,
          commission_rate: knownInfo.commissionRate || null,
          cookie_duration_days: knownInfo.cookieDays || null,
        }));
      }
    }
  }, [existingConfig, brandId, brandName, brandSlug]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<AffiliateConfig>) => {
      const payload = {
        ...data,
        vendor_name: brandName,
        brand_id: brandId,
        updated_at: new Date().toISOString(),
      };

      if (existingConfig?.id) {
        const { error } = await supabase
          .from("affiliate_configs")
          .update(payload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("affiliate_configs")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-config", brandId, brandName] });
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-configs"] });
      toast.success(`Affiliate settings saved for ${brandName}`);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Test affiliate URL transformation
  const handleTestUrl = async () => {
    if (!testUrl) {
      toast.error("Enter a URL to test");
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-affiliate-url", {
        body: { url: testUrl, vendor: brandName },
      });

      if (error) throw error;
      setTestResult(data.url);
    } catch (err) {
      toast.error("Test failed: " + (err as Error).message);
      setTestResult(null);
    } finally {
      setIsTesting(false);
    }
  };

  // Badge uses the always-on lightweight query so it shows correctly without opening the panel
  const isConfigured = !!(badgeConfig?.affiliate_network && badgeConfig?.is_active);
  const knownInfo = BRAND_AFFILIATE_INFO[brandSlug];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between mt-2 bg-muted/30 hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm">Affiliate Settings</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConfigured ? "default" : "outline"}
              className={isConfigured ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
            >
              {isConfigured ? "Configured" : knownInfo ? "Info Available" : "Not Set"}
            </Badge>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4 animate-in slide-in-from-top-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Pre-researched info banner */}
            {knownInfo && !existingConfig && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Pre-researched Info Available</p>
                    <p className="text-muted-foreground">{knownInfo.notes}</p>
                    {knownInfo.signupUrl && (
                      <a
                        href={knownInfo.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        Apply for affiliate program <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Affiliate Network Selector */}
            <div>
              <Label>Affiliate Network</Label>
              <Select
                value={formData.affiliate_network || ""}
                onValueChange={(value) => setFormData({ ...formData, affiliate_network: value || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network..." />
                </SelectTrigger>
                <SelectContent>
                  {AFFILIATE_NETWORKS.map((network) => (
                    <SelectItem key={network.value} value={network.value}>
                      <div className="flex flex-col">
                        <span>{network.label}</span>
                        <span className="text-xs text-muted-foreground">{network.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Network-specific fields */}
            {formData.affiliate_network === "amazon" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Amazon US Tag</Label>
                  <Input
                    value={formData.amazon_us_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_us_tag: e.target.value || null })}
                    placeholder="yourtag-20"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon UK Tag</Label>
                  <Input
                    value={formData.amazon_uk_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_uk_tag: e.target.value || null })}
                    placeholder="yourtag-21"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon DE Tag</Label>
                  <Input
                    value={formData.amazon_de_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_de_tag: e.target.value || null })}
                    placeholder="yourtag-21"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon CA Tag</Label>
                  <Input
                    value={formData.amazon_ca_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_ca_tag: e.target.value || null })}
                    placeholder="yourtag-20"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon AU Tag</Label>
                  <Input
                    value={formData.amazon_au_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_au_tag: e.target.value || null })}
                    placeholder="yourtag-22"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon JP Tag</Label>
                  <Input
                    value={formData.amazon_jp_tag || ""}
                    onChange={(e) => setFormData({ ...formData, amazon_jp_tag: e.target.value || null })}
                    placeholder="yourtag-22"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {formData.affiliate_network === "awin" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Awin Affiliate ID</Label>
                  <Input
                    value={formData.awin_affiliate_id || ""}
                    onChange={(e) => setFormData({ ...formData, awin_affiliate_id: e.target.value || null })}
                    placeholder="Your Awin ID"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Advertiser/Merchant ID</Label>
                  <Input
                    value={formData.awin_advertiser_id || ""}
                    onChange={(e) => setFormData({ ...formData, awin_advertiser_id: e.target.value || null })}
                    placeholder="e.g., 46345 for Bambu"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {formData.affiliate_network === "impact" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Impact Media Partner ID</Label>
                  <Input
                    value={formData.impact_media_partner_id || ""}
                    onChange={(e) => setFormData({ ...formData, impact_media_partner_id: e.target.value || null })}
                    placeholder="Your Impact ID"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Program ID</Label>
                  <Input
                    value={formData.impact_program_id || ""}
                    onChange={(e) => setFormData({ ...formData, impact_program_id: e.target.value || null })}
                    placeholder="e.g., elegoo"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {(formData.affiliate_network === "direct" || 
              formData.affiliate_network === "goaffpro" ||
              formData.affiliate_network === "shareasale") && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Affiliate ID / Referral Code</Label>
                  <Input
                    value={formData.affiliate_id || ""}
                    onChange={(e) => setFormData({ ...formData, affiliate_id: e.target.value || null })}
                    placeholder="Your affiliate ID or referral code"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    URL Pattern
                    <span className="text-muted-foreground ml-1">(use {"{{url}}"} for original URL)</span>
                  </Label>
                  <Input
                    value={formData.affiliate_url_pattern || ""}
                    onChange={(e) => setFormData({ ...formData, affiliate_url_pattern: e.target.value || null })}
                    placeholder="?ref={{id}} or https://click.linksynergy.com/..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Commission & Cookie Info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Commission %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission_rate || ""}
                  onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="5"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Cookie Days</Label>
                <Input
                  type="number"
                  value={formData.cookie_duration_days || ""}
                  onChange={(e) => setFormData({ ...formData, cookie_duration_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="30"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.is_active ? "active" : "inactive"}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signup URL */}
            <div>
              <Label className="text-xs">Program Signup URL</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.signup_url || ""}
                  onChange={(e) => setFormData({ ...formData, signup_url: e.target.value || null })}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
                {formData.signup_url && (
                  <a
                    href={formData.signup_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="h-8">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                placeholder="Additional notes about this affiliate program..."
                className="text-sm min-h-[60px]"
              />
            </div>

            {/* Test URL Section */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs mb-2 block">Test Affiliate URL</Label>
              <div className="flex gap-2">
                <Input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="Enter a product URL to test..."
                  className="h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={handleTestUrl}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <TestTube className="w-3 h-3" />
                  )}
                </Button>
              </div>
              {testResult && (
                <div className="mt-2 p-2 bg-background rounded text-xs break-all">
                  <div className="flex items-center gap-1 text-green-500 mb-1">
                    <Check className="w-3 h-3" />
                    <span>Transformed URL:</span>
                  </div>
                  <a
                    href={testResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {testResult.length > 80 ? testResult.substring(0, 80) + "..." : testResult}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Save Button */}
            <Button
              className="w-full"
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Affiliate Settings
            </Button>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}