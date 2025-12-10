import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Shield, Archive, Database, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import filascopeLogo from "@/assets/filascope-logo.png";
import { CurrencySelector } from "@/components/CurrencySelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#333] bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80">
        <div className="flex h-20 md:h-32 items-center px-6 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={filascopeLogo} 
              alt="FilaScope" 
              className="h-16 md:h-28 w-auto object-contain"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/printers">PRINTERS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/brands">BRANDS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/compare">COMPARE</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
              <Link to="/materials/compare">MATERIALS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-red-400 hover:text-red-300 font-mono text-xs">
              <Link to="/deals">DEALS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-purple-400 hover:text-purple-300 font-mono text-xs">
              <Link to="/wizard">WIZARD</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="text-amber-400 hover:text-amber-300 font-mono text-xs">
                <Link to="/admin/dashboard">ADMIN</Link>
              </Button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <CurrencySelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-[#333] bg-[#1A1A1A] font-mono text-xs">
                    <User className="w-3 h-3 mr-1.5" />
                    {user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#333]">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-mono">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  <DropdownMenuItem asChild>
                    <Link to="/vault" className="flex items-center font-mono text-xs">
                      <Archive className="w-3 h-3 mr-2" />
                      MY VAULT
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center font-mono text-xs">
                      <Settings className="w-3 h-3 mr-2" />
                      SETTINGS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#333]" />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="flex items-center font-mono text-xs">
                          <Shield className="w-3 h-3 mr-2" />
                          ADMIN
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/maintenance" className="flex items-center font-mono text-xs">
                          <Database className="w-3 h-3 mr-2" />
                          MAINTENANCE
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#333]" />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="font-mono text-xs">
                    <LogOut className="w-3 h-3 mr-2" />
                    SIGN OUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="border-[#333] bg-[#1A1A1A] font-mono text-xs">
                <Link to="/auth">
                  <LogIn className="w-3 h-3 mr-1.5" />
                  LOGIN
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
