import { useState } from "react";
import { Link } from "react-router-dom";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { ArrowLeft, Bell, Loader2, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FeatureComingSoonProps {
  /** Feature name shown as the page title */
  featureName: string;
  /** Brief description of what the feature will do */
  description: string;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Optional additional details shown below the description */
  details?: string[];
  /** Optional related working features to link to */
  relatedFeatures?: { name: string; href: string }[];
}

const DEFAULT_RELATED = [
  { name: "Filament Database", href: "/" },
  { name: "Printer Registry", href: "/printers" },
  { name: "Brand Directory", href: "/brands" },
  { name: "Deal Tracker", href: "/deals" },
];

export function FeatureComingSoon({
  featureName,
  description,
  icon,
  details,
  relatedFeatures = DEFAULT_RELATED,
}: FeatureComingSoonProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "You're on the list!",
      description: `We'll notify you when ${featureName} launches.`,
    });
    setEmail("");
    setIsLoading(false);
  };

  return (
    <>
      <DocumentHead
        title={`${featureName} — Coming Soon | FilaScope`}
        description={`${featureName} is coming soon to FilaScope. ${description}`}
      />

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider">
            <Rocket className="w-3.5 h-3.5" />
            Coming Soon
          </div>

          {/* Icon */}
          {icon && (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {icon}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {featureName}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            {description}
          </p>

          {/* Details */}
          {details && details.length > 0 && (
            <ul className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto text-left">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Email signup */}
          <div className="max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              Get notified when this launches
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 bg-background border-border"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 gap-2 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Notify Me
              </Button>
            </form>
          </div>

          {/* Back to homepage */}
          <div className="pt-4">
            <Link to="/">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Homepage
              </Button>
            </Link>
          </div>

          {/* Related features */}
          {relatedFeatures.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                Explore Available Features
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {relatedFeatures.map((feature) => (
                  <Link key={feature.href} to={feature.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                    >
                      {feature.name}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default FeatureComingSoon;
