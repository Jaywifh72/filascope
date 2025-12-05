import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Shield, 
  ExternalLink, 
  Pencil, 
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Store
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AffiliateConfig {
  id: string;
  vendor_name: string;
  affiliate_url_pattern: string | null;
  amazon_us_tag: string | null;
  amazon_uk_tag: string | null;
  amazon_de_tag: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface BrandWithConfig {
  brand: string;
  config: AffiliateConfig | null;
}

const AdminAffiliates = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AffiliateConfig[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vendor_name: "",
    affiliate_url_pattern: "",
    amazon_us_tag: "",
    amazon_uk_tag: "",
    amazon_de_tag: "",
    notes: "",
  });

  // All brands including Amazon at the top
  const allBrands = ["Amazon", ...brands];

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch brands and configs in parallel
    const [brandsResult, configsResult] = await Promise.all([
      supabase.from("printer_brands").select("brand").order("brand"),
      supabase.from("affiliate_configs").select("*").order("vendor_name"),
    ]);

    if (brandsResult.error) {
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: "destructive",
      });
    } else {
      setBrands(brandsResult.data?.map(b => b.brand) || []);
    }

    if (configsResult.error) {
      toast({
        title: "Error",
        description: "Failed to load affiliate configurations",
        variant: "destructive",
      });
    } else {
      setConfigs(configsResult.data || []);
    }
    
    setIsLoading(false);
  };

  const getConfigForBrand = (brand: string): AffiliateConfig | null => {
    return configs.find(c => c.vendor_name.toLowerCase() === brand.toLowerCase()) || null;
  };

  const hasAnyConfig = (brand: string): boolean => {
    const config = getConfigForBrand(brand);
    if (!config) return false;
    return !!(config.affiliate_url_pattern || config.amazon_us_tag || config.amazon_uk_tag || config.amazon_de_tag);
  };

  const handleEdit = (brand: string) => {
    const config = getConfigForBrand(brand);
    setEditingBrand(brand);
    setFormData({
      vendor_name: brand,
      affiliate_url_pattern: config?.affiliate_url_pattern || "",
      amazon_us_tag: config?.amazon_us_tag || "",
      amazon_uk_tag: config?.amazon_uk_tag || "",
      amazon_de_tag: config?.amazon_de_tag || "",
      notes: config?.notes || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.vendor_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Vendor name is required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      vendor_name: formData.vendor_name.trim(),
      affiliate_url_pattern: formData.affiliate_url_pattern.trim() || null,
      amazon_us_tag: formData.amazon_us_tag.trim() || null,
      amazon_uk_tag: formData.amazon_uk_tag.trim() || null,
      amazon_de_tag: formData.amazon_de_tag.trim() || null,
      notes: formData.notes.trim() || null,
    };

    const existingConfig = getConfigForBrand(formData.vendor_name);

    if (existingConfig) {
      const { error } = await supabase
        .from("affiliate_configs")
        .update(payload)
        .eq("id", existingConfig.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update configuration",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Configuration updated successfully",
        });
        setShowDialog(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("affiliate_configs")
        .insert([payload]);

      if (error) {
        toast({
          title: "Error",
          description: error.message.includes("duplicate")
            ? "A configuration for this vendor already exists"
            : "Failed to create configuration",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Configuration created successfully",
        });
        setShowDialog(false);
        fetchData();
      }
    }
  };

  const configuredCount = allBrands.filter(b => hasAnyConfig(b)).length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Affiliate Link Setup</h1>
              <p className="text-muted-foreground text-sm">
                {configuredCount} of {allBrands.length} brands configured
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{allBrands.length}</p>
                <p className="text-sm text-muted-foreground">Total Brands</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{configuredCount}</p>
                <p className="text-sm text-muted-foreground">Configured</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{allBrands.length - configuredCount}</p>
                <p className="text-sm text-muted-foreground">Not Configured</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 mb-6 bg-muted/30 border-border">
          <p className="text-sm text-muted-foreground">
            Configure affiliate URL patterns and Amazon tags for each brand. Use{" "}
            <code className="px-1 py-0.5 bg-muted rounded text-xs">{"{{url}}"}</code> in patterns
            as a placeholder for the original product URL. Amazon tags are appended automatically to Amazon links.
          </p>
        </Card>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBrands.map((brand) => {
            const config = getConfigForBrand(brand);
            const isConfigured = hasAnyConfig(brand);
            const isAmazon = brand === "Amazon";

            return (
              <Card 
                key={brand} 
                className={`p-4 bg-card border-border transition-all hover:border-primary/50 ${
                  isAmazon ? "ring-2 ring-primary/20" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{brand}</h3>
                    {isAmazon && (
                      <Badge variant="secondary" className="text-xs">Marketplace</Badge>
                    )}
                  </div>
                  <Badge 
                    variant={isConfigured ? "default" : "outline"} 
                    className={isConfigured ? "bg-green-500/10 text-green-600 border-green-500/30" : ""}
                  >
                    {isConfigured ? "Configured" : "Not Set"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL Pattern:</span>
                    <span className={config?.affiliate_url_pattern ? "text-foreground" : "text-muted-foreground/50"}>
                      {config?.affiliate_url_pattern ? "Set" : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amazon US:</span>
                    <span className={config?.amazon_us_tag ? "text-foreground font-mono text-xs" : "text-muted-foreground/50"}>
                      {config?.amazon_us_tag || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amazon UK:</span>
                    <span className={config?.amazon_uk_tag ? "text-foreground font-mono text-xs" : "text-muted-foreground/50"}>
                      {config?.amazon_uk_tag || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amazon DE:</span>
                    <span className={config?.amazon_de_tag ? "text-foreground font-mono text-xs" : "text-muted-foreground/50"}>
                      {config?.amazon_de_tag || "Not set"}
                    </span>
                  </div>
                </div>

                {config?.notes && (
                  <p className="text-xs text-muted-foreground mb-3 italic truncate">
                    {config.notes}
                  </p>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleEdit(brand)}
                >
                  <Pencil className="w-3 h-3 mr-2" />
                  {isConfigured ? "Edit" : "Configure"}
                </Button>
              </Card>
            );
          })}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Configure {editingBrand}
              </DialogTitle>
              <DialogDescription>
                Set up affiliate links for {editingBrand}. Amazon tags will be appended
                to Amazon links automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="affiliate_url_pattern">
                  Affiliate URL Pattern
                  <span className="text-xs text-muted-foreground ml-2">
                    (Use {`{{url}}`} as placeholder)
                  </span>
                </Label>
                <Input
                  id="affiliate_url_pattern"
                  value={formData.affiliate_url_pattern}
                  onChange={(e) =>
                    setFormData({ ...formData, affiliate_url_pattern: e.target.value })
                  }
                  placeholder="e.g., https://affiliate.site/click?url={{url}}&ref=yourcode"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amazon_us_tag">Amazon US Tag</Label>
                  <Input
                    id="amazon_us_tag"
                    value={formData.amazon_us_tag}
                    onChange={(e) =>
                      setFormData({ ...formData, amazon_us_tag: e.target.value })
                    }
                    placeholder="yourtag-20"
                  />
                </div>
                <div>
                  <Label htmlFor="amazon_uk_tag">Amazon UK Tag</Label>
                  <Input
                    id="amazon_uk_tag"
                    value={formData.amazon_uk_tag}
                    onChange={(e) =>
                      setFormData({ ...formData, amazon_uk_tag: e.target.value })
                    }
                    placeholder="yourtag-21"
                  />
                </div>
                <div>
                  <Label htmlFor="amazon_de_tag">Amazon DE Tag</Label>
                  <Input
                    id="amazon_de_tag"
                    value={formData.amazon_de_tag}
                    onChange={(e) =>
                      setFormData({ ...formData, amazon_de_tag: e.target.value })
                    }
                    placeholder="yourtag-21"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this configuration"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminAffiliates;
