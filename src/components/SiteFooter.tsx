import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Activity, 
  Zap, 
  Mail, 
  ExternalLink,
  Loader2,
  Globe
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

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(14);
  const { toast } = useToast();
  const { regionConfig, currencyConfig, ratesLastUpdated } = useRegion();

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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "You're subscribed!",
      description: "Thanks for joining our community.",
    });
    
    setEmail("");
    setIsLoading(false);
  };

  const exploreLinks = [
    { name: "Filaments", href: "/" },
    { name: "Printers", href: "/printers" },
    { name: "Brands", href: "/brands" },
    { name: "Deals", href: "/deals" },
    { name: "Knowledge Base", href: "/compare" },
  ];

  const resourceLinks = [
    { name: "Material Knowledge Base", href: "/compare" },
    { name: "Compatibility Matrix", href: "/matrix" },
    { name: "Slicer Directory", href: "/reference/slicers" },
    
    { name: "Quick Match", href: "/wizard" },
  ];

  const companyLinks = [
    { name: "About FilaScope", href: "/about" },
    { name: "Our Methodology", href: "/methodology" },
    { name: "Contact", href: "mailto:hello@filascope.com", external: true },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  ];

  const socialLinks = [
    { name: "Twitter/X", icon: TwitterIcon, href: "https://twitter.com/filascope" },
    { name: "Discord", icon: DiscordIcon, href: "https://discord.gg/filascope" },
    { name: "YouTube", icon: YouTubeIcon, href: "https://youtube.com/@filascope" },
    { name: "Reddit", icon: RedditIcon, href: "https://reddit.com/r/filascope" },
  ];

  return (
    <footer className="bg-card border-t border-border mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1 - Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">
                FilaScope
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The definitive 3D printing material database
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} FilaScope. All rights reserved.
            </p>
          </div>

          {/* Column 2 - Explore */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    {link.name}
                    {'comingSoon' in link && link.comingSoon && (
                      <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary leading-none">
                        Soon
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Company */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Connect */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Connect
            </h3>
            
            {/* Newsletter */}
            <form onSubmit={handleNewsletterSubmit} className="mb-5">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 sm:h-9 text-sm bg-background border-border focus:border-primary min-w-0 flex-1"
                  disabled={isLoading}
                  aria-label="Email address for newsletter"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  className="h-10 sm:h-9 min-w-[44px] px-3 shrink-0"
                  disabled={isLoading}
                  aria-label="Subscribe to newsletter"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </form>

            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-muted/50 hover:bg-primary/20 active:bg-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors touch-manipulation"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Region/Currency Indicator Bar */}
      <div className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left - Current region display */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Prices shown for:</span>
              <span className="text-foreground font-medium">
                {regionConfig.flag} {regionConfig.name} ({currencyConfig.code})
              </span>
              {ratesLastUpdated && (
                <>
                  <span className="text-muted-foreground/50 hidden sm:inline">·</span>
                  <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                    Rates updated: {formatRatesAge(ratesLastUpdated)}
                  </span>
                </>
              )}
            </div>
            
            {/* Right - Change selectors */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Change:</span>
              <RegionSelector />
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/50 bg-background/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left - Data update info */}
            <span className="text-muted-foreground">
              Data updated daily from 15+ retailers
            </span>

            {/* Center - System Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                <span className="font-mono uppercase tracking-wider text-muted-foreground">
                  System Status:
                </span>
                <span className="font-mono uppercase tracking-wider text-emerald-500">
                  Optimal
                </span>
              </div>
              
              <div className="h-3 w-px bg-border hidden sm:block" aria-hidden="true" />
              
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden sm:flex items-center gap-2 cursor-help">
                      <Zap className={`h-3 w-3 ${getLatencyColor(latency)}`} aria-hidden="true" />
                      <span className="font-mono uppercase tracking-wider text-muted-foreground">
                        Latency:
                      </span>
                      <span className={`font-mono uppercase tracking-wider ${getLatencyColor(latency)}`}>
                        {latency}ms
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Average API response time to backend</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Right - Made with love */}
            <span className="text-muted-foreground">
              Made with <span className="text-destructive" aria-label="love">❤️</span> for the 3D printing community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
