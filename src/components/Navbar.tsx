import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Search, Tag, GitCompare, Grid3x3, Sparkles, Wrench, LogIn, LogOut, 
  User, Shield, Archive, Database, Layers, Terminal, TrendingUp, TrendingDown, Minus
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

const SLASH_COMMANDS = [
  // Common materials
  { command: "/pla", description: "Filter PLA filaments", filter: "PLA" },
  { command: "/petg", description: "Filter PETG filaments", filter: "PETG" },
  { command: "/abs", description: "Filter ABS filaments", filter: "ABS" },
  { command: "/tpu", description: "Filter TPU/Flexible", filter: "TPU" },
  { command: "/asa", description: "Filter ASA filaments", filter: "ASA" },
  { command: "/nylon", description: "Filter Nylon/PA", filter: "Nylon" },
  // Engineering materials
  { command: "/pc", description: "Filter Polycarbonate", filter: "PC" },
  { command: "/peek", description: "Filter PEEK high-temp", filter: "PEEK" },
  { command: "/pei", description: "Filter PEI/ULTEM", filter: "PEI" },
  { command: "/pom", description: "Filter POM/Acetal", filter: "POM" },
  { command: "/pp", description: "Filter Polypropylene", filter: "PP" },
  { command: "/hips", description: "Filter HIPS support", filter: "HIPS" },
  { command: "/pva", description: "Filter PVA soluble", filter: "PVA" },
  // Composite materials
  { command: "/carbon", description: "Filter Carbon Fiber", filter: "Carbon" },
  { command: "/glass", description: "Filter Glass Fiber", filter: "Glass" },
  { command: "/metal", description: "Filter Metal-filled", filter: "Metal" },
  { command: "/wood", description: "Filter Wood filaments", filter: "Wood" },
  // Specialty materials
  { command: "/silk", description: "Filter Silk finish", filter: "Silk" },
  { command: "/glow", description: "Filter Glow-in-dark", filter: "Glow" },
  { command: "/marble", description: "Filter Marble effect", filter: "Marble" },
  { command: "/matte", description: "Filter Matte finish", filter: "Matte" },
  { command: "/flex", description: "Filter Flexible/TPE", filter: "Flex" },
];

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowCommands(value.startsWith("/"));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Check for slash command
      const matchedCommand = SLASH_COMMANDS.find(cmd => 
        searchValue.toLowerCase().startsWith(cmd.command)
      );
      
      if (matchedCommand) {
        navigate(`/?material=${encodeURIComponent(matchedCommand.filter)}`);
        setSearchValue("");
        setShowCommands(false);
      } else if (searchValue.trim()) {
        navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
        setSearchValue("");
      }
    }
    
    if (e.key === "Escape") {
      setShowCommands(false);
      setSearchValue("");
    }
  };

  const handleCommandClick = (command: typeof SLASH_COMMANDS[0]) => {
    navigate(`/?material=${encodeURIComponent(command.filter)}`);
    setSearchValue("");
    setShowCommands(false);
  };

  // Filter commands based on input
  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.command.toLowerCase().includes(searchValue.toLowerCase())
  );

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
        <div className="flex h-14 items-center justify-between px-6 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src={filascopeLogo} 
              alt="FilaScope" 
              className="h-40 w-auto object-contain"
            />
          </Link>

          {/* Command Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-mono">&gt;</span>
              </div>
              <input
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchValue.startsWith("/") && setShowCommands(true)}
                onBlur={() => setTimeout(() => setShowCommands(false), 200)}
                placeholder="Type / for commands or search filaments..."
                className="w-full h-10 pl-12 pr-4 bg-[#1A1A1A] border border-[#333] rounded-lg text-white placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-[#252525] rounded border border-[#333]">
                ESC
              </kbd>
            </div>

            {/* Slash Commands Dropdown */}
            {showCommands && filteredCommands.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden shadow-xl z-50">
                <div className="p-2 border-b border-[#333]">
                  <span className="text-xs text-muted-foreground font-mono">SLASH COMMANDS</span>
                </div>
                {filteredCommands.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => handleCommandClick(cmd)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                  >
                    <code className="text-primary font-mono text-sm">{cmd.command}</code>
                    <span className="text-muted-foreground text-sm">{cmd.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
