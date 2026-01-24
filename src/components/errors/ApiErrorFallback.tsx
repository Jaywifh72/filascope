import { AlertTriangle, RefreshCw, WifiOff, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiErrorFallbackProps {
  /** Error message to display (optional, shows default if not provided) */
  message?: string;
  /** Custom title for the error */
  title?: string;
  /** Retry callback function */
  onRetry?: () => void;
  /** Whether a retry is in progress */
  isRetrying?: boolean;
  /** Type of error to customize the icon and message */
  errorType?: 'network' | 'server' | 'generic';
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * API Error Fallback Component
 * 
 * Shows a user-friendly error message when API calls fail.
 * Provides retry functionality and helpful guidance.
 */
export function ApiErrorFallback({
  message,
  title,
  onRetry,
  isRetrying = false,
  errorType = 'generic',
  className,
  size = 'md',
}: ApiErrorFallbackProps) {
  const errorConfig = {
    network: {
      icon: WifiOff,
      defaultTitle: "Connection Issue",
      defaultMessage: "Unable to connect. Please check your internet connection and try again.",
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    server: {
      icon: ServerCrash,
      defaultTitle: "Server Error",
      defaultMessage: "Our servers are having trouble. Please try again in a few moments.",
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    generic: {
      icon: AlertTriangle,
      defaultTitle: "Something Went Wrong",
      defaultMessage: "We couldn't load this content. Please try again.",
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted/50",
    },
  };

  const config = errorConfig[errorType];
  const Icon = config.icon;

  const sizeStyles = {
    sm: {
      container: "p-4",
      icon: "w-8 h-8",
      iconWrapper: "w-12 h-12",
      title: "text-sm font-medium",
      message: "text-xs",
      button: "h-8 text-xs px-3",
    },
    md: {
      container: "p-6",
      icon: "w-10 h-10",
      iconWrapper: "w-16 h-16",
      title: "text-base font-semibold",
      message: "text-sm",
      button: "h-9 text-sm px-4",
    },
    lg: {
      container: "p-8",
      icon: "w-12 h-12",
      iconWrapper: "w-20 h-20",
      title: "text-lg font-semibold",
      message: "text-base",
      button: "h-10 px-5",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-border/50",
        styles.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn(
        "flex items-center justify-center rounded-full mb-4",
        config.bgColor,
        styles.iconWrapper
      )}>
        <Icon className={cn(styles.icon, config.iconColor)} aria-hidden="true" />
      </div>
      
      <h3 className={cn("text-foreground mb-2", styles.title)}>
        {title || config.defaultTitle}
      </h3>
      
      <p className={cn("text-muted-foreground mb-4 max-w-xs", styles.message)}>
        {message || config.defaultMessage}
      </p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className={styles.button}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline Error Message Component
 * 
 * For smaller, inline error states within components.
 */
export function InlineError({
  message = "Failed to load",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-primary hover:underline text-sm font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Empty State with Error Component
 * 
 * For when data returns empty but might be due to an error.
 */
export function EmptyStateWithRetry({
  title = "No data available",
  message = "We couldn't find any results. This might be a temporary issue.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      )}
    </div>
  );
}
