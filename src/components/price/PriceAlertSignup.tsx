import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PriceAlertSignupProps {
  filamentId: string;
  currentPrice: number | null;
  productTitle: string;
  className?: string;
}

export function PriceAlertSignup({
  filamentId,
  currentPrice,
  productTitle,
  className,
}: PriceAlertSignupProps) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? (currentPrice * 0.85).toFixed(2) : ""
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !targetPrice) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from("price_alerts")
        .insert({
          filament_id: filamentId,
          target_price: parseFloat(targetPrice),
          email,
        });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to set alert");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20",
          className
        )}
      >
        <Check className="h-4 w-4 text-green-400" />
        <span className="text-sm text-green-400">
          Alert set! We'll email you when {productTitle} drops below $
          {parseFloat(targetPrice).toFixed(2)}.
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Bell className="h-4 w-4 text-amber-400" />
        Get Price Drop Alert
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 h-9 text-sm"
        />
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            required
            className="w-24 h-9 text-sm pl-5"
            placeholder="Target"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading} className="h-9">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Set Alert"
          )}
        </Button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-[10px] text-muted-foreground">
        We'll notify you once if the price drops below your target. No spam, ever.
      </p>
    </div>
  );
}
