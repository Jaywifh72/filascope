import React, { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  countdown: number | null;
  hasAutoRetried: boolean;
}

type ErrorType = 'network' | 'timeout' | 'server' | 'unknown';

const ERROR_DESCRIPTIONS: Record<ErrorType, string> = {
  network: 'You appear to be offline. Check your internet connection and try again.',
  timeout: "This is taking longer than expected. Our servers might be busy.",
  server: "We're having server issues. Our team has been notified.",
  unknown: 'An unexpected error occurred. Please try refreshing the page.',
};

function classifyError(error: Error | null): ErrorType {
  if (!navigator.onLine) return 'network';
  const msg = (error?.message || '').toLowerCase();
  if (/fetch|network|offline|failed to fetch|net::/.test(msg)) return 'network';
  if (/timeout|aborted|timed out/.test(msg)) return 'timeout';
  if (/5\d{2}|server|internal/.test(msg)) return 'server';
  return 'unknown';
}

function CountdownCircle({ seconds, total }: { seconds: number; total: number }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const progress = ((total - seconds) / total) * c;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="inline-block mr-1.5">
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2" opacity={0.15} />
      <circle
        cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2"
        strokeDasharray={c} strokeDashoffset={c - progress}
        strokeLinecap="round"
        transform="rotate(-90 10 10)"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    countdown: null,
    hasAutoRetried: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = crypto.randomUUID();
    this.setState({ errorId });
    this.logError(error, errorInfo, errorId);
    this.props.onError?.(error, errorInfo);
  }

  public componentDidUpdate(_: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      const type = classifyError(this.state.error);
      const alreadyRetried = sessionStorage.getItem('error_boundary_retried') === 'true';
      if ((type === 'network' || type === 'timeout') && !alreadyRetried) {
        this.setState({ countdown: 5 });
        this.countdownInterval = setInterval(() => {
          this.setState(prev => {
            const next = (prev.countdown ?? 1) - 1;
            if (next <= 0) {
              if (this.countdownInterval) clearInterval(this.countdownInterval);
              sessionStorage.setItem('error_boundary_retried', 'true');
              window.location.reload();
              return { ...prev, countdown: 0, hasAutoRetried: true };
            }
            return { ...prev, countdown: next };
          });
        }, 1000);
      }
    }
  }

  public componentWillUnmount() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private async logError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id') || 'unknown';
      
      await supabase.from('error_logs').insert({
        error_id: errorId,
        error_type: 'react_error_boundary',
        error_message: error.message,
        error_stack: error.stack || null,
        component_stack: errorInfo.componentStack || null,
        page_url: window.location.href,
        route: window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: sessionId,
        device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        metadata: {
          timestamp: new Date().toISOString(),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          memory: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize,
        },
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyErrorId = () => {
    const id = this.state.errorId;
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      toast({ title: 'Error ID copied', description: id.slice(0, 6) });
    }).catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = classifyError(this.state.error);
      const shortId = this.state.errorId?.slice(0, 6) || Math.random().toString(36).slice(2, 8);

      return (
        <div 
          className="min-h-[400px] flex items-center justify-center p-8"
          data-testid="error-boundary-fallback"
          data-error-id={this.state.errorId}
        >
          <div className="text-center max-w-md">
            {/* Icon with pulse */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 animate-pulse opacity-30" />
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2 mt-5">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-2">
              {ERROR_DESCRIPTIONS[errorType]}
            </p>

            {/* Error ID badge */}
            <span className="inline-block text-[10px] font-mono text-muted-foreground/50 bg-white/[0.04] px-2 py-1 rounded mt-1">
              Error ID: {shortId}
            </span>

            {/* Auto-retry countdown */}
            {this.state.countdown !== null && this.state.countdown > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center">
                <CountdownCircle seconds={this.state.countdown} total={5} />
                Retrying in {this.state.countdown}s…
              </p>
            )}

            <div className="flex gap-3 justify-center mt-6">
              <Button 
                onClick={this.handleRefresh}
                variant="default"
                data-testid="error-refresh-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                data-testid="error-home-button"
              >
                Go Home
              </Button>
              <Button
                onClick={this.handleCopyErrorId}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy ID
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = async (
    error: Error | string,
    context?: Record<string, unknown>
  ) => {
    const errorId = crypto.randomUUID();
    const sessionId = sessionStorage.getItem('analytics_session_id') || 'unknown';
    
    try {
      await supabase.from('error_logs').insert({
        error_id: errorId,
        error_type: 'manual_report',
        error_message: typeof error === 'string' ? error : error.message,
        error_stack: typeof error === 'object' ? error.stack : null,
        page_url: window.location.href,
        route: window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: sessionId,
        device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        metadata: {
          ...context,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to report error:', logError);
    }
    
    return errorId;
  };
  
  return { reportError };
}

// Global error handler for uncaught errors
export function initializeGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    const sessionId = sessionStorage.getItem('analytics_session_id') || 'unknown';
    
    supabase.from('error_logs').insert({
      error_id: crypto.randomUUID(),
      error_type: 'uncaught_error',
      error_message: event.message,
      error_stack: event.error?.stack || null,
      page_url: window.location.href,
      route: window.location.pathname,
      user_agent: navigator.userAgent,
      session_id: sessionId,
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }).then(() => {});
  });

  window.addEventListener('unhandledrejection', (event) => {
    const sessionId = sessionStorage.getItem('analytics_session_id') || 'unknown';
    
    supabase.from('error_logs').insert({
      error_id: crypto.randomUUID(),
      error_type: 'unhandled_rejection',
      error_message: event.reason?.message || String(event.reason),
      error_stack: event.reason?.stack || null,
      page_url: window.location.href,
      route: window.location.pathname,
      user_agent: navigator.userAgent,
      session_id: sessionId,
      device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
      metadata: {
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }).then(() => {});
  });
}
