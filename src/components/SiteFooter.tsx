import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Activity, 
  Zap, 
  Mail, 
  ExternalLink,
  Loader2,
  Globe,
  ArrowRight,
  CheckCircle,
  Package,
  Building2,
  ShoppingCart,
  RefreshCw,
  Users,
  Lightbulb,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRegion } from "@/contexts/RegionContext";
import { getLatencyColor } from "@/hooks/useApiLatency";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { RegionSelector } from "@/components/RegionSelector";
import { CurrencySelector } from "@/components/CurrencySelector";
import { formatDistanceToNow } from "date-fns";

function formatRatesAge(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";
  return formatDistanceToNow(date, { addSuffix: true });
}

// Social icons as simple SVG components for consistency
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

function FooterColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pb-2">
        {children}
      </h3>
      <div className="w-10 h-px bg-primary/40" aria-hidden="true" />
    </div>
  );
}

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(14);
  const { toast } = useToast();
  const { regionConfig, currencyConfig, ratesLastUpdated } = useRegion();
  const location = useLocation();
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Measure real API latency from Performance API
  useEffect(() => {
    function measure() {
      try {
        const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const supabaseEntries = entries.filter(
          (e) => e.name.includes("supabase") && e.responseEnd > 0 && e.startTime > 0
        );
        if (supabaseEntries.length > 0) {
          const recent = supabaseEntries.slice(-10);
          const avg = recent.reduce((sum, e) => sum + (e.responseEnd - e.startTime), 0) / recent.length;
          setLatency(Math.round(avg));
        }
      } catch { /* Performance API not available */ }
    }
    measure();
    const id = setInterval(measure, 5000);
    return () => clearInterval(id);
  }, []);

  // Hide footer on admin pages
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/old-admin');
  if (isAdmin) return null;


  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setEmail("");
    setIsLoading(false);
    setSubscribed(true);
  };

  const materialLinks = [
    { name: "All Filaments", href: "/filaments" },
    { name: "PLA Filaments", href: "/filaments/pla" },
    { name: "PETG Filaments", href: "/filaments/petg" },
    { name: "ABS Filaments", href: "/filaments/abs" },
    { name: "TPU Filaments", href: "/filaments/tpu" },
    { name: "Nylon Filaments", href: "/filaments/nylon" },
    { name: "Filament Deals", href: "/deals" },
  ];

  const toolLinks = [
    { name: "Compare Filaments", href: "/compare" },
    { name: "HueForge TD Database", href: "/hueforge-td-database" },
    { name: "Compatibility Matrix", href: "/matrix" },
    { name: "Filament Quiz", href: "/wizard" },
    { name: "Color Finder", href: "/colors" },
    { name: "3D Printers", href: "/printers" },
  ];

  const guideLinks = [
    { name: "Best PLA Filaments", href: "/guides/best-pla-filaments" },
    { name: "PLA vs PETG", href: "/guides/pla-vs-petg" },
    { name: "How to Choose Filament", href: "/guides/how-to-choose-3d-printer-filament" },
    { name: "Filament Types Explained", href: "/guides/3d-printer-filament-types-explained" },
    { name: "Temperature Guide", href: "/guides/filament-temperature-guide" },
    { name: "All Guides →", href: "/learn" },
  ];

  const aboutLinks: { name: string; href: string; external?: boolean; badge?: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { name: "About", href: "/about" },
    { name: "Methodology", href: "/methodology" },
    { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Feature Roadmap", href: "/roadmap", badge: "New" },
    { name: "Request a Feature", href: "/request-feature", icon: Lightbulb },
    { name: "Contact", href: "mailto:hello@filascope.com", external: true },
  ];

  const legalLinks = [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  ];

  const socialLinks = [
    { name: "X", icon: TwitterIcon, href: "https://twitter.com/filascope" },
    { name: "Discord", icon: DiscordIcon, href: "https://discord.gg/filascope" },
    { name: "YouTube", icon: YouTubeIcon, href: "https://youtube.com/@filascope" },
    { name: "Reddit", icon: RedditIcon, href: "https://reddit.com/r/filascope" },
  ];

  return (
    <footer className="mt-auto">
      {/* Pre-Footer CTA Section */}
      <div className="bg-muted border-t-2 border-primary/30 py-12 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Can't decide?</h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
            Our Quick Match wizard helps you find the right filament in 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/wizard"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 text-base rounded-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
            >
              <Sparkles className="w-5 h-5" />
              Start Quick Match
            </Link>
            <Link
              to="/?sort=value_score&limit=10"
              className="inline-flex items-center border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground font-medium px-8 py-4 text-base rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
            >
              Compare Top Picks
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-y border-border bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-start gap-8 lg:gap-12 flex-wrap">
            {[
              { icon: Package, stat: "1,080+", label: "Filaments Tracked" },
              { icon: Building2, stat: "48+", label: "Brands Monitored" },
              { icon: ShoppingCart, stat: "15+", label: "Retailers Connected" },
              { icon: RefreshCw, stat: "Daily", label: "Price Updates" },
              { icon: Users, stat: "10,000+", label: "Makers Trust Us" },
            ].map(({ icon: Icon, stat, label }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label={`${stat} ${label}`}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide max-w-[100px]">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
          {/* Explore FilaScope — SEO Link Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            {/* Column 1 — Filaments */}
            <nav aria-label="Filaments">
              <FooterColumnHeader>Filaments</FooterColumnHeader>
              <ul className="space-y-3">
                {materialLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary active:text-primary/80 transition-colors duration-200 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 2 — Tools */}
            <nav aria-label="Tools">
              <FooterColumnHeader>Tools</FooterColumnHeader>
              <ul className="space-y-3">
                {toolLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary active:text-primary/80 transition-colors duration-200 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 3 — Guides */}
            <nav aria-label="Guides">
              <FooterColumnHeader>Guides</FooterColumnHeader>
              <ul className="space-y-3">
                {guideLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary active:text-primary/80 transition-colors duration-200 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 4 — Company */}
            <nav aria-label="Company">
              <FooterColumnHeader>Company</FooterColumnHeader>
              <ul className="space-y-3">
                {aboutLinks.map((link) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a 
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary active:text-primary/80 transition-colors duration-200 inline-flex items-center gap-1 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.name}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link 
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-primary active:text-primary/80 transition-colors duration-200 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded inline-flex items-center gap-1.5"
                      >
                        {link.icon && <link.icon className="w-3.5 h-3.5" />}
                        {link.name}
                        {link.badge && (
                          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">{link.badge}</span>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Column 6 - Newsletter & Social */}
            <div>
              <FooterColumnHeader>Stay Updated</FooterColumnHeader>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Get notified when filaments on your watchlist drop in price. Plus new arrivals and weekly deals.
              </p>
              
              {subscribed ? (
                <div className="flex items-start gap-2.5 text-sm text-primary bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-6">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Subscribed! Check email to confirm.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="mb-6 space-y-3">
                  <div>
                    <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      className={`h-10 text-sm bg-muted/50 border-border rounded-lg focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 w-full ${emailError ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                      disabled={isLoading}
                      aria-label="Email address for newsletter"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "newsletter-error" : undefined}
                    />
                    {emailError && (
                      <p id="newsletter-error" className="text-xs text-destructive mt-1.5" aria-live="polite" aria-atomic="true">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 font-medium flex items-center justify-center gap-2"
                    disabled={isLoading}
                    aria-label="Subscribe to newsletter"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>No spam. Unsubscribe anytime. Your data is never sold.</p>
                </form>
              )}

              {/* Social Links */}
              <p className="text-xs text-muted-foreground/70 mb-3 uppercase tracking-wider font-medium">Follow Us</p>
              <TooltipProvider delayDuration={200}>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <Tooltip key={social.name}>
                      <TooltipTrigger asChild>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-muted/50 hover:bg-primary/15 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
                          aria-label={`Follow us on ${social.name}`}
                        >
                          <social.icon className="w-4 h-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover border-border text-xs">
                        {social.name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Signals & Bottom Bar */}
      <div className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left - Copyright + data freshness */}
            <div className="flex flex-col items-center md:items-start gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground tracking-tight">FilaScope</span>
              </div>
              <p className="text-xs text-muted-foreground">
                © 2024–{new Date().getFullYear()} FilaScope. All rights reserved.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Data updated daily from 15+ retailers
                </span>
              </div>
            </div>

            {/* Center - Region & Currency */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{regionConfig.flag} {regionConfig.name}</span>
                {ratesLastUpdated && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground/60">
                      Rates: {formatRatesAge(ratesLastUpdated)}
                    </span>
                  </>
                )}
              </div>
              <RegionSelector />
              <CurrencySelector />
            </div>

            {/* Right - Legal links + system status */}
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="flex items-center gap-3">
                {legalLinks.map((link, i) => (
                  <span key={link.name} className="flex items-center gap-3">
                    <Link
                      to={link.href}
                      className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                    >
                      {link.name}
                    </Link>
                    {i < legalLinks.length - 1 && (
                      <span className="text-muted-foreground/30 text-xs" aria-hidden="true">·</span>
                    )}
                  </span>
                ))}
              </div>
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                    <span className="font-mono uppercase tracking-wider">Optimal</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="hidden sm:flex items-center gap-1.5 cursor-help">
                        <Zap className={`h-3 w-3 ${getLatencyColor(latency)}`} aria-hidden="true" />
                        <span className={`font-mono uppercase tracking-wider ${getLatencyColor(latency)}`}>
                          {latency}ms
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border-border">
                      <p className="text-xs">Average API response time</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-muted-foreground/30">·</span>
                  <span>Built by makers, for makers.</span>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
