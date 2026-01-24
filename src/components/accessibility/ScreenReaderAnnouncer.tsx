import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

type AnnouncementPoliteness = "polite" | "assertive";

interface AnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
  /** Clear current announcements */
  clear: () => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

/**
 * Screen Reader Announcer Provider
 * 
 * WCAG 2.1 AA Requirement: Status Messages (4.1.3)
 * Provides a way to announce dynamic content changes to screen readers
 * without moving focus.
 * 
 * Usage:
 * 1. Wrap your app with <ScreenReaderAnnouncerProvider>
 * 2. Use the useAnnouncer() hook to announce changes
 */
export const ScreenReaderAnnouncerProvider = ({ children }: { children: React.ReactNode }) => {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = "polite") => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the appropriate message
    if (politeness === "assertive") {
      setAssertiveMessage(message);
    } else {
      setPoliteMessage(message);
    }

    // Clear after a delay to allow re-announcement of same message
    timeoutRef.current = setTimeout(() => {
      setPoliteMessage("");
      setAssertiveMessage("");
    }, 1000);
  }, []);

  const clear = useCallback(() => {
    setPoliteMessage("");
    setAssertiveMessage("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce, clear }}>
      {children}
      
      {/* Polite live region - for non-urgent updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      {/* Assertive live region - for urgent updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
};

/**
 * Hook to access the screen reader announcer
 * 
 * @example
 * const { announce } = useAnnouncer();
 * 
 * // Announce filter changes
 * announce("Showing 24 results filtered by PLA");
 * 
 * // Urgent announcement
 * announce("Error: Failed to save", "assertive");
 */
export const useAnnouncer = () => {
  const context = useContext(AnnouncerContext);
  
  // Provide a no-op fallback if used outside provider
  if (!context) {
    return {
      announce: (message: string, _politeness?: AnnouncementPoliteness) => {
        console.warn("useAnnouncer: No provider found. Message not announced:", message);
      },
      clear: () => {},
    };
  }
  
  return context;
};

/**
 * Inline Screen Reader Only Text
 * For adding context to interactive elements without visual display
 */
export const ScreenReaderOnly = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Visual and Screen Reader Status Indicator
 * Shows status with appropriate ARIA attributes
 */
export const StatusIndicator = ({ 
  message, 
  isLoading = false,
  className 
}: { 
  message: string;
  isLoading?: boolean;
  className?: string;
}) => (
  <div 
    role="status" 
    aria-live="polite" 
    aria-busy={isLoading}
    className={className}
  >
    {message}
  </div>
);
