import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends NavLinkProps {
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const NavLink = ({ 
  className, 
  activeClassName = "text-[#00CFE8] font-bold", 
  children, 
  ...props 
}: CustomNavLinkProps) => {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        cn(
          // Base styles with increased horizontal padding and Inter font
          "relative px-6 py-3 text-sm font-semibold transition-colors duration-200 font-inter",
          "text-white/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Hover effect - text color shift to cyan
          "hover:text-[#00CFE8]",
          // Group for underline animation
          "group",
          className,
          isActive && activeClassName
        )
      }
      {...props}
    >
      {({ isActive }) => (
        <>
          <span aria-current={isActive ? "page" : undefined}>{children}</span>
          {/* Animated underline - slides in from center on hover, always visible when active */}
          <span 
            className={cn(
              "absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[#00CFE8] transition-all duration-300 ease-out",
              isActive ? "w-full" : "w-0 group-hover:w-full"
            )}
          />
        </>
      )}
    </RouterNavLink>
  );
};
