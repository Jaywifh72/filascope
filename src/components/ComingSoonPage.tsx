import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogIn, Lock, Mail, Eye, EyeOff, Database, BarChart, Zap, Bell } from "lucide-react";

interface ComingSoonPageProps {
  onLoginSuccess: () => void;
}

// Countdown logic
const calculateTimeLeft = () => {
  const targetDate = new Date("February 15, 2026 00:00:00").getTime();
  const now = new Date().getTime();
  const difference = targetDate - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, mins: 0, secs: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    secs: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

const CountdownCard = ({ value, label }: { value: number; label: string }) => (
  <div 
    className="flex flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-4 rounded-xl"
    style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    }}
  >
    <span 
      className="text-3xl sm:text-5xl font-black text-white tabular-nums"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs sm:text-sm text-white/50 uppercase tracking-widest mt-1">
      {label}
    </span>
  </div>
);

const FeatureItem = ({ icon: Icon, label, color }: { icon: typeof Database; label: string; color: string }) => (
  <div className="flex flex-col items-center gap-3 text-center">
    <div 
      className="relative p-4 rounded-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Icon glow */}
      <div 
        className="absolute inset-0 rounded-xl opacity-40 blur-xl"
        style={{ background: color }}
      />
      <Icon className="relative w-7 h-7 text-white" />
    </div>
    <span className="text-sm text-white/70 font-medium">{label}</span>
  </div>
);

export const ComingSoonPage = ({ onLoginSuccess }: ComingSoonPageProps) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged in successfully!");
        onLoginSuccess();
      }
    } catch {
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) {
      toast.error("Please enter your email");
      return;
    }
    setNotifyLoading(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("You're on the list! We'll notify you when we launch.");
    setNotifyEmail("");
    setNotifyLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden"
      style={{ background: '#0A0C10' }}
    >
      {/* Background glows */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-30 blur-[120px] pointer-events-none"
        style={{ background: '#00CFE8' }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: '#FF0055' }}
      />
      <div 
        className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: '#00CFE8' }}
      />

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        
        {/* Logo Section with Glassmorphic Container and Scan Line */}
        <div 
          className="relative mb-10 p-8 sm:p-12 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Scan line animation */}
          <div 
            className="absolute left-0 right-0 h-[2px] animate-scan pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, #00CFE8, transparent)',
              boxShadow: '0 0 20px 4px rgba(0, 207, 232, 0.6)',
            }}
          />
          
          {/* Logo */}
          <div className="relative">
            <img 
              src="/filascope-logo.svg" 
              alt="FilaScope" 
              className="h-14 sm:h-20 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <h1 
              className="hidden text-3xl sm:text-4xl font-black text-white tracking-tight"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              FILASCOPE
            </h1>
          </div>
        </div>

        {/* Coming Soon Text */}
        <h2 
          className="text-2xl sm:text-3xl font-bold text-white/90 mb-2 text-center"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Coming Soon
        </h2>
        <p className="text-white/50 text-center mb-8 max-w-md">
          The ultimate 3D printing filament database is launching soon. Be the first to know.
        </p>

        {/* Countdown Timer */}
        <div className="flex gap-3 sm:gap-5 mb-10">
          <CountdownCard value={timeLeft.days} label="Days" />
          <CountdownCard value={timeLeft.hours} label="Hours" />
          <CountdownCard value={timeLeft.mins} label="Mins" />
          <CountdownCard value={timeLeft.secs} label="Secs" />
        </div>

        {/* Email Capture */}
        <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-12">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="Enter your email"
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#00CFE8]/50 focus:ring-[#00CFE8]/20 rounded-xl"
            />
          </div>
          <Button 
            type="submit"
            disabled={notifyLoading}
            className="h-12 px-6 font-semibold rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #00CFE8 0%, #0088FF 100%)',
              boxShadow: '0 4px 20px rgba(0, 207, 232, 0.35)',
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            {notifyLoading ? "Joining..." : "Notify Me"}
          </Button>
        </form>

        {/* Features */}
        <div className="flex gap-8 sm:gap-16 mb-12">
          <FeatureItem icon={Database} label="Massive Database" color="#00CFE8" />
          <FeatureItem icon={BarChart} label="Smart Comparisons" color="#00CFE8" />
          <FeatureItem icon={Zap} label="Printer Optimization" color="#FF0055" />
        </div>

        {/* Admin Login Toggle */}
        {!showLogin ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLogin(true)}
            className="text-white/30 hover:text-white/60 hover:bg-white/5"
          >
            <Lock className="w-4 h-4 mr-2" />
            Admin Access
          </Button>
        ) : (
          <Card 
            className="w-full max-w-sm border-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <LogIn className="w-5 h-5" />
                Admin Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowLogin(false)}
                    className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #00CFE8 0%, #0088FF 100%)',
                    }}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
