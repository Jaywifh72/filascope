import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, FileText, Download, ExternalLink, 
  BookOpen, Code, Database, Shield, Zap, ListChecks, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocItem {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  category: "architecture" | "guides" | "api" | "data";
  date?: string;
  vendor?: string; // For data exports
}

const docs: DocItem[] = [
  {
    title: "Architecture Review",
    description: "Complete data flow analysis, failure modes, security assessment, and prioritized action plan",
    path: "/docs/filascope-architecture-review.md",
    icon: Database,
    category: "architecture",
    date: "December 18, 2025"
  },
  {
    title: "Engineering Review",
    description: "DB schema analysis, API boundaries, state management, background jobs, authorization model, production risks, and prioritized fixes",
    path: "/docs/filascope-engineering-review.md",
    icon: Code,
    category: "architecture",
    date: "December 18, 2025"
  },
  {
    title: "Observability & Data Correctness Guide",
    description: "Instrumentation plan, test strategies, invariants, debug playbook, and dashboard/alert configuration",
    path: "/docs/filascope-observability-guide.md",
    icon: Shield,
    category: "guides",
    date: "December 18, 2025"
  },
  {
    title: "Bambu Lab Filaments (226 products)",
    description: "Complete CSV export of all Bambu Lab filament products with pricing, specifications, and URLs",
    path: "generate-csv",
    icon: Database,
    category: "data",
    date: "December 25, 2024",
    vendor: "Bambu Lab"
  },
  {
    title: "Elegoo Filaments (1,127 products)",
    description: "Complete CSV export of all Elegoo filament products with pricing, specifications, and URLs",
    path: "generate-csv",
    icon: Database,
    category: "data",
    date: "December 25, 2024",
    vendor: "Elegoo"
  }
];

const AdminDocs = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [downloadingVendor, setDownloadingVendor] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (!loading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, loading, user, navigate]);

  const handleDownloadCSV = async (vendor: string) => {
    setDownloadingVendor(vendor);
    try {
      const { data, error } = await supabase.functions.invoke('generate-filament-csv', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });
      
      // Since we can't pass query params easily, let's use a direct fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-filament-csv?vendor=${encodeURIComponent(vendor)}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vendor.toLowerCase().replace(/\s+/g, '-')}-filaments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded ${vendor} filament data`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingVendor(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const categoryIcons = {
    architecture: Database,
    guides: BookOpen,
    api: Code,
    data: Database
  };

  const categoryLabels = {
    architecture: "Architecture",
    guides: "Guides",
    api: "API Reference",
    data: "Data Exports"
  };

  const groupedDocs = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocItem[]>);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{docs.filter(d => d.category === 'architecture').length}</p>
                <p className="text-xs text-muted-foreground">Architecture Docs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{docs.filter(d => d.category === 'guides').length}</p>
                <p className="text-xs text-muted-foreground">Guides</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Code className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{docs.filter(d => d.category === 'api').length}</p>
                <p className="text-xs text-muted-foreground">API References</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{docs.filter(d => d.category === 'data').length}</p>
                <p className="text-xs text-muted-foreground">Data Exports</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Documents by Category */}
        {Object.entries(groupedDocs).map(([category, categoryDocs]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h2>
              </div>
              
              <div className="grid gap-4">
                {categoryDocs.map((doc) => {
                  const DocIcon = doc.icon;
                  return (
                    <Card key={doc.path} className="p-5 bg-card border-border hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <DocIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{doc.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                            {doc.date && (
                              <p className="text-xs text-muted-foreground/70 mt-2">Last updated: {doc.date}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {doc.category === 'data' && doc.vendor ? (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleDownloadCSV(doc.vendor!)}
                              disabled={downloadingVendor === doc.vendor}
                            >
                              {downloadingVendor === doc.vendor ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              {downloadingVendor === doc.vendor ? 'Generating...' : 'Download CSV'}
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <a href={doc.path} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View
                                </a>
                              </Button>
                              <Button variant="default" size="sm" asChild>
                                <a href={doc.path} download>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {docs.length === 0 && (
          <Card className="p-8 bg-card border-border text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Documentation Yet</h3>
            <p className="text-muted-foreground">Documentation files will appear here once created.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDocs;
