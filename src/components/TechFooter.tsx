import { Activity, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export function TechFooter() {
  const [latency, setLatency] = useState(14);

  // Simulate realistic latency fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 8) + 10); // 10-17ms range
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left: System Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-500" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              System Status:
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-500">
              Optimal
            </span>
          </div>
          
          <div className="h-3 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Latency:
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
              {latency}ms
            </span>
          </div>
        </div>

        {/* Right: Copyright/Branding */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            FilaScope v2.0
          </span>
          <div className="h-3 w-px bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
