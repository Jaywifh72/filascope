import { cn } from "@/lib/utils";

interface SkipLinkProps {
  /** Target element ID to skip to (without the #) */
  targetId?: string;
  /** Link text for screen readers and visible focus state */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skip to Main Content Link
 * 
 * WCAG 2.1 AA Requirement: Bypass Blocks (2.4.1)
 * Provides keyboard users a way to skip repetitive navigation
 * 
 * The link is visually hidden until focused, then appears at the top of the viewport.
 */
export const SkipLink = ({ 
  targetId = "main-content", 
  children = "Skip to main content",
  className 
}: SkipLinkProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Set tabindex to make the target focusable if it isn't already
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Visually hidden by default
        "absolute left-4 -translate-y-full",
        // Appear on focus with smooth transition
        "focus:translate-y-4 focus:z-[9999]",
        "transition-transform duration-200",
        // High contrast styling for visibility
        "bg-primary text-primary-foreground",
        "px-6 py-3 rounded-md",
        "font-semibold text-sm",
        // Strong focus indicator
        "focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        // Shadow for separation from content
        "shadow-lg",
        className
      )}
    >
      {children}
    </a>
  );
};

/**
 * Secondary Skip Links for complex pages
 * Allows skipping to specific sections like filters, results, etc.
 */
export const SkipLinks = ({ 
  links 
}: { 
  links: Array<{ targetId: string; label: string }> 
}) => {
  return (
    <div className="skip-links-container">
      {links.map((link, index) => (
        <SkipLink 
          key={link.targetId} 
          targetId={link.targetId}
          className={cn(
            // Stack multiple skip links vertically when focused
            index > 0 && "focus:translate-y-16"
          )}
        >
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
};
