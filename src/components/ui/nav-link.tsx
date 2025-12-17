import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends NavLinkProps {
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const NavLink = ({ 
  className, 
  activeClassName = "text-primary border-b-2 border-primary", 
  children, 
  ...props 
}: CustomNavLinkProps) => {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        cn(
          "px-4 py-3 text-sm font-semibold transition-colors duration-200 rounded-md",
          "text-white/90 hover:text-primary hover:bg-white/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
          isActive && activeClassName
        )
      }
      {...props}
    >
      {children}
    </RouterNavLink>
  );
};
