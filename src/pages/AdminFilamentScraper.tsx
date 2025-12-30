import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FilamentProductScraper } from "@/components/admin/FilamentProductScraper";
import { Shield, Package } from "lucide-react";

const AdminFilamentScraper = () => {
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-primary" />
          <Package className="w-6 h-6 text-violet-500" />
          <h1 className="text-2xl font-bold text-foreground">Filament Product Scraper</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Scrape product pages to automatically extract filament data. Review and edit before saving to the database.
        </p>
        <FilamentProductScraper />
      </div>
    </div>
  );
};

export default AdminFilamentScraper;
