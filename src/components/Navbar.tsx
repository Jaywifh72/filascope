import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Search, Tag, GitCompare, Grid3x3, Sparkles, Wrench, LogIn } from "lucide-react";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">🎯</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">SPOOL</span>
              <span className="text-foreground">STASH</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Filament Finder
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/brands" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Brands
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/compare" className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Compare
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/matrix" className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              Matrix
            </Link>
          </Button>
          <Button variant="ghost" asChild className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300">
            <Link to="/deals" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Deals
            </Link>
          </Button>
          <Button variant="ghost" asChild className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300">
            <Link to="/wizard" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Wizard
            </Link>
          </Button>
          <Button variant="ghost" asChild className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300">
            <Link to="/diagnose" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Diagnose
            </Link>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Find Filament
            </Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border">
                  {user.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem asChild>
                  <Link to="/admin">Admin Panel</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild className="border-border">
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
