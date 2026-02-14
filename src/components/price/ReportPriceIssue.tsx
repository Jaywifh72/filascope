import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportPriceIssueProps {
  filamentId: string;
  currentPrice: number | null;
  currency?: string;
  productTitle?: string;
}

export function ReportPriceIssue({ filamentId, currentPrice, currency = 'USD', productTitle }: ReportPriceIssueProps) {
  const [open, setOpen] = useState(false);
  const [correctPrice, setCorrectPrice] = useState('');
  const [source, setSource] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctPrice) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('user_price_reports' as any).insert({
        filament_id: filamentId,
        reported_price: parseFloat(correctPrice),
        source_description: source || null,
        reporter_email: email || null,
        current_db_price: currentPrice,
        currency,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: 'Thanks!',
        description: "We'll verify this price soon.",
      });
      setOpen(false);
      setCorrectPrice('');
      setSource('');
      setEmail('');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Flag className="w-3 h-3" />
          <span>Report incorrect price</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Price Issue</DialogTitle>
          <DialogDescription>
            {productTitle ? `Help us fix the price for ${productTitle}.` : 'Help us keep prices accurate.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correct-price">Correct price ({currency})*</Label>
            <Input
              id="correct-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="29.99"
              value={correctPrice}
              onChange={(e) => setCorrectPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Where did you see this price?</Label>
            <Input
              id="source"
              placeholder="e.g. Official store, Amazon listing"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Your email (optional, for follow-up)</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !correctPrice}>
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
