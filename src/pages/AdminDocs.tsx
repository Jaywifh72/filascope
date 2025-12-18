import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, FileText, Download, ExternalLink, 
  BookOpen, Code, Database, Shield, Zap, ListChecks
} from "lucide-react";

interface DocItem {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  category: "architecture" | "guides" | "api";
  date?: string;
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
  }
];

const AdminDocs = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (!loading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, loading, user, navigate]);

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
    api: Code
  };

  const categoryLabels = {
    architecture: "Architecture",
    guides: "Guides",
    api: "API Reference"
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
        <div className="grid grid-cols-3 gap-4 mb-8">
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
