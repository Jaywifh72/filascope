import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends NavLinkProps {
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const NavLink = ({ 
  className, 
  activeClassName = "text-primary border-primary font-bold", 
  children, 
  ...props 
}: CustomNavLinkProps) => {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        cn(
          // Base styles with reserved border space to prevent layout shift
          "px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-md",
          "text-white/90 hover:text-primary hover:bg-white/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Always reserve space for underline
          "border-b-2 border-transparent",
          className,
          isActive && activeClassName
        )
      }
      // Accessibility: announce current page to screen readers
      {...props}
    >
      {({ isActive }) => (
        <span aria-current={isActive ? "page" : undefined}>{children}</span>
      )}
    </RouterNavLink>
  );
};
