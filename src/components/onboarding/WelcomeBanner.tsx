import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'filascope_welcome_banner_dismissed';

export function WelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // Default true to prevent flash
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsDismissed(false);
      // Animate in after a short delay
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation before removing from DOM
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsDismissed(true);
    }, 300);
  };
  
  if (isDismissed) return null;
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/5",
        "transition-all duration-300 transform",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 -translate-y-4"
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          {/* Icon */}
          <div className="hidden sm:flex shrink-0 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Beaker className="w-6 h-6 text-primary" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary sm:hidden" />
              <h2 className="text-sm font-semibold text-foreground">
                New to 3D printing materials?
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Not sure which filament to choose? Our Quick Match wizard finds your perfect material in under 60 seconds.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              asChild
              size="sm"
              className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90"
            >
              <Link to="/wizard">
                Start Quick Match
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
