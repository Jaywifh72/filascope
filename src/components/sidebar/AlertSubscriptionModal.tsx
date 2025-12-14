import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlertSubscription, SubscriptionFormData } from "@/hooks/useAlertSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Mail, Smartphone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AlertSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALERT_LEVELS = [
  { value: "critical", label: "Critical", description: "Fire risk, health hazard" },
  { value: "warning", label: "Warning", description: "Quality issues, recalls" },
  { value: "info", label: "Info", description: "General advisories" },
];

const POPULAR_BRANDS = [
  "Sunlu", "eSun", "Polymaker", "Hatchbox", "Overture", "Prusament",
  "ColorFabb", "Fillamentum", "Bambu Lab", "Inland", "Ziro", "Amolen",
];

export function AlertSubscriptionModal({ open, onOpenChange }: AlertSubscriptionModalProps) {
  const { user } = useAuth();
  const { subscription, isLoading, saveSubscription, isSaving, deleteSubscription } = useAlertSubscription();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [alertLevels, setAlertLevels] = useState<string[]>(["critical", "warning"]);
  const [brandFilters, setBrandFilters] = useState<string[]>([]);

  // Load existing subscription
  useEffect(() => {
    if (subscription) {
      setEmail(subscription.email);
      setPhone(subscription.phone || "");
      setEmailEnabled(subscription.email_enabled);
      setSmsEnabled(subscription.sms_enabled);
      setAlertLevels(subscription.alert_levels);
      setBrandFilters(subscription.brand_filters);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [subscription, user]);

  const toggleAlertLevel = (level: string) => {
    setAlertLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleBrand = (brand: string) => {
    setBrandFilters((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleSave = () => {
    const formData: SubscriptionFormData = {
      email,
      phone: phone || undefined,
      alert_levels: alertLevels,
      brand_filters: brandFilters,
      sms_enabled: smsEnabled,
      email_enabled: emailEnabled,
    };
    saveSubscription(formData);
    onOpenChange(false);
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Subscribe to Safety Alerts
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Please sign in to subscribe to safety alerts.
            </p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Subscribe to Safety Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified when new safety alerts are posted
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            {/* Email notification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label>Email Notifications</Label>
              </div>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={(checked) => setEmailEnabled(checked === true)}
                />
                <Label htmlFor="email-enabled" className="text-sm font-normal">
                  Enable email notifications
                </Label>
              </div>
            </div>

            {/* SMS notification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label>SMS Notifications (optional)</Label>
              </div>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-enabled"
                  checked={smsEnabled}
                  onCheckedChange={(checked) => setSmsEnabled(checked === true)}
                  disabled={!phone}
                />
                <Label htmlFor="sms-enabled" className="text-sm font-normal">
                  Enable SMS for critical alerts only
                </Label>
              </div>
            </div>

            {/* Alert levels */}
            <div className="space-y-3">
              <Label>Alert Levels</Label>
              <div className="space-y-2">
                {ALERT_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level.value}`}
                      checked={alertLevels.includes(level.value)}
                      onCheckedChange={() => toggleAlertLevel(level.value)}
                    />
                    <Label htmlFor={`level-${level.value}`} className="text-sm font-normal flex-1">
                      <span className="font-medium">{level.label}</span>
                      <span className="text-muted-foreground ml-1">({level.description})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Brand Filters (optional)</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setBrandFilters(POPULAR_BRANDS)}
                  >
                    Select all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setBrandFilters([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Only receive alerts for selected brands. Leave empty for all brands.
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((brand) => (
                  <Badge
                    key={brand}
                    variant={brandFilters.includes(brand) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleBrand(brand)}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          {subscription && (
            <Button
              variant="destructive"
              onClick={() => {
                deleteSubscription();
                onOpenChange(false);
              }}
              disabled={isSaving}
            >
              Unsubscribe
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !email}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
