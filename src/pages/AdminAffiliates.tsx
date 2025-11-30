import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Shield, 
  ExternalLink, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const AdminAffiliates = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AffiliateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AffiliateConfig | null>(null);
  const [formData, setFormData] = useState({
    vendor_name: "",
    affiliate_url_pattern: "",
    amazon_us_tag: "",
    amazon_uk_tag: "",
    amazon_de_tag: "",
    notes: "",
  });

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
      fetchConfigs();
    }
  }, [isAdmin]);

  const fetchConfigs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("affiliate_configs")
      .select("*")
      .order("vendor_name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load affiliate configurations",
        variant: "destructive",
      });
    } else {
      setConfigs(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setFormData({
      vendor_name: "",
      affiliate_url_pattern: "",
      amazon_us_tag: "",
      amazon_uk_tag: "",
      amazon_de_tag: "",
      notes: "",
    });
    setShowDialog(true);
  };

  const handleEdit = (config: AffiliateConfig) => {
    setEditingConfig(config);
    setFormData({
      vendor_name: config.vendor_name,
      affiliate_url_pattern: config.affiliate_url_pattern || "",
      amazon_us_tag: config.amazon_us_tag || "",
      amazon_uk_tag: config.amazon_uk_tag || "",
      amazon_de_tag: config.amazon_de_tag || "",
      notes: config.notes || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string, vendorName: string) => {
    if (!confirm(`Delete affiliate config for ${vendorName}?`)) return;

    const { error } = await supabase
      .from("affiliate_configs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });
      fetchConfigs();
    }
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

    if (editingConfig) {
      const { error } = await supabase
        .from("affiliate_configs")
        .update(payload)
        .eq("id", editingConfig.id);

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
        fetchConfigs();
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
        fetchConfigs();
      }
    }
  };

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
            <h1 className="text-3xl font-bold text-foreground">Affiliate Link Setup</h1>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Affiliate Link Configurations
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure affiliate URL patterns and Amazon tags for different brands. Use{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-xs">{"{{url}}"}</code> in patterns
              as a placeholder for the original product URL.
            </p>
          </div>

          {configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No affiliate configurations yet.</p>
              <p className="text-sm">Click "Add Configuration" to create your first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>URL Pattern</TableHead>
                    <TableHead>Amazon US</TableHead>
                    <TableHead>Amazon UK</TableHead>
                    <TableHead>Amazon DE</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.vendor_name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {config.affiliate_url_pattern || (
                          <span className="text-muted-foreground italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{config.amazon_us_tag || "-"}</TableCell>
                      <TableCell>{config.amazon_uk_tag || "-"}</TableCell>
                      <TableCell>{config.amazon_de_tag || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {config.notes || (
                          <span className="text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(config)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(config.id, config.vendor_name)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Edit" : "Add"} Affiliate Configuration
              </DialogTitle>
              <DialogDescription>
                Configure affiliate links for a brand or vendor. Amazon tags will be appended
                to Amazon links automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="vendor_name">Vendor Name *</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_name: e.target.value })
                  }
                  placeholder="e.g., Polymaker, Bambu Lab"
                  disabled={!!editingConfig}
                />
              </div>

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