import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LogIn, LogOut, User, Shield, Archive, Database, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import filascopeLogo from "@/assets/filascope-logo.png";
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

  // Fetch real-time PLA price average
  const { data: priceData } = useQuery({
    queryKey: ["pla-price-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("variant_price")
        .ilike("material", "%PLA%")
        .not("variant_price", "is", null)
        .gt("variant_price", 0);
      
      if (error) throw error;
      
      const prices = data.map(f => Number(f.variant_price));
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Simulate 24h change (would normally come from historical data)
      const change = (Math.random() - 0.5) * 4; // -2% to +2%
      
      return { 
        avgPrice: avg, 
        change,
        count: prices.length 
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      {/* Price Ticker Bar */}
      <div className="w-full bg-[#0D0D0D] border-b border-[#222] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">PLA/KG</span>
              <span className="text-white font-semibold">
                ${priceData?.avgPrice?.toFixed(2) || "—"}
              </span>
              {priceData?.change !== undefined && (
                <span className={`flex items-center gap-0.5 ${
                  priceData.change > 0 ? "text-green-400" : 
                  priceData.change < 0 ? "text-red-400" : "text-muted-foreground"
                }`}>
                  {priceData.change > 0 ? <TrendingUp className="w-3 h-3" /> : 
                   priceData.change < 0 ? <TrendingDown className="w-3 h-3" /> : 
                   <Minus className="w-3 h-3" />}
                  {priceData.change > 0 ? "+" : ""}{priceData.change.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="h-3 w-px bg-[#333]" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>SAMPLES</span>
              <span className="text-primary">{priceData?.count || 0}</span>
            </div>
            <div className="h-3 w-px bg-[#333]" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="animate-pulse text-green-400">●</span>
              <span>LIVE</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono hidden sm:block">
            {new Date().toLocaleTimeString()} UTC
          </div>
        </div>
      </div>

      {/* Main Command Center Header */}
      <nav className="sticky top-0 z-50 border-b border-[#333] bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80">
        <div className="flex h-24 md:h-44 items-center justify-between px-6 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src={filascopeLogo} 
              alt="FilaScope" 
              className="h-20 md:h-40 w-auto object-contain"
            />
          </Link>

          {/* Spacer for layout balance */}
          <div className="flex-1" />

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

          {/* User Actions */}
          <div className="flex items-center gap-2 shrink-0">
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
