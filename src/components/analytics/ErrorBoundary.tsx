import React, { Component, ErrorInfo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = crypto.randomUUID();
    this.setState({ errorId });
    
    // Log error to database
    this.logError(error, errorInfo, errorId);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
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

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-[400px] flex items-center justify-center p-8"
          data-testid="error-boundary-fallback"
          data-error-id={this.state.errorId}
        >
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              We've logged this error and will look into it. Please try refreshing the page.
            </p>
            {this.state.errorId && (
              <p className="text-xs text-muted-foreground/60 mb-4">
                Error ID: {this.state.errorId.slice(0, 8)}
              </p>
            )}
            <div className="flex gap-3 justify-center">
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
