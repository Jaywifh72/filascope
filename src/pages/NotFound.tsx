import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Search, Home, Printer, Tag, Layers, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check if this is an encoded URL that should redirect
    const decodedPath = decodeURIComponent(location.pathname);
    if (decodedPath !== location.pathname && decodedPath.includes('?')) {
      const [basePath, queryString] = decodedPath.split('?');
      console.log("[NotFound] Redirecting encoded URL to correct format:", {
        from: location.pathname,
        to: `${basePath}?${queryString}`
      });
      navigate(`${basePath}?${queryString}`, { replace: true });
      return;
    }
    
    // Log 404 error to database for tracking
    const log404Error = async () => {
      try {
        const sessionId = sessionStorage.getItem('analytics_session_id') || 'unknown';
        await supabase.from('error_logs').insert({
          error_id: crypto.randomUUID(),
          error_type: '404_not_found',
          error_message: `Page not found: ${location.pathname}`,
          page_url: window.location.href,
          route: location.pathname,
          user_agent: navigator.userAgent,
          session_id: sessionId,
          device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
          metadata: {
            referrer: document.referrer || null,
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        });
      } catch {
        // Silently fail logging
      }
    };
    
    log404Error();
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickLinks = [
    { to: "/", label: "Browse Filaments", icon: Layers, description: "Explore our complete filament database" },
    { to: "/printers", label: "Browse Printers", icon: Printer, description: "Find your perfect 3D printer" },
    { to: "/deals", label: "Today's Deals", icon: Tag, description: "Check out the latest discounts" },
    { to: "/wizard", label: "Quick Match", icon: HelpCircle, description: "Get personalized recommendations" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* noindex prevents soft-404 crawl budget waste.
          Canonical → homepage so no duplicate authority is split to the 404 URL.
          og:url → homepage so social unfurls don't canonicalize the broken path. */}
      <DocumentHead
        title="Page Not Found | FilaScope"
        robots="noindex, nofollow"
        canonical="https://filascope.com/"
        ogUrl="https://filascope.com/"
      />
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* 3D Print Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-card border border-border/50 shadow-xl mb-4">
            <div className="relative">
              {/* Stylized broken filament spool */}
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <div className="text-5xl font-bold text-primary opacity-80">?</div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary/20 rounded-full animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-destructive/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl sm:text-7xl font-bold text-foreground mb-4">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
          Page Not Found
        </h2>
        <p className="text-lg text-muted-foreground mb-2 max-w-md mx-auto">
          {location.pathname.startsWith('/filament/') 
            ? "The filament you're looking for might have been discontinued, or the page has moved."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          Requested: <code className="text-xs bg-muted px-2 py-1 rounded">{location.pathname}</code>
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-10 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try searching for what you need..."
              className="w-full h-14 pl-12 pr-32 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              aria-label="Search for filaments, printers, or brands"
            />
            <Button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              disabled={!searchQuery.trim()}
            >
              Search
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>

        {/* Quick Links */}
        <div className="mb-10">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group flex flex-col items-center gap-2 p-4 bg-card hover:bg-card/80 border border-border hover:border-primary/50 rounded-xl transition-all duration-200"
              >
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Home Button */}
        <Button asChild size="lg" variant="outline">
          <Link to="/" className="gap-2">
            <Home className="w-4 h-4" />
            Back to Homepage
          </Link>
        </Button>

        {/* Help text */}
        <p className="mt-8 text-xs text-muted-foreground/60">
          If you believe this is an error, please{" "}
          <a 
            href="mailto:support@filascope.com?subject=404 Error Report" 
            className="text-primary hover:underline"
          >
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default NotFound;
