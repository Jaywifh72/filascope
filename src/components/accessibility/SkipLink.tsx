import { cn } from "@/lib/utils";

interface SkipLinkProps {
  /** Target element ID to skip to (without the #) */
  targetId?: string;
  /** Link text for screen readers and visible focus state */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const skipLinkClasses =
  "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-6 focus:py-3 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background focus:shadow-lg transition-none";

/**
 * Skip to Main Content Link
 * 
 * WCAG 2.1 AA Requirement: Bypass Blocks (2.4.1)
 * Provides keyboard users a way to skip repetitive navigation
 * 
 * Uses sr-only + focus:not-sr-only pattern for bulletproof hiding.
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
      className={cn(skipLinkClasses, className)}
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
    <>
      {links.map((link) => (
        <SkipLink 
          key={link.targetId} 
          targetId={link.targetId}
        >
          {link.label}
        </SkipLink>
      ))}
    </>
  );
};
