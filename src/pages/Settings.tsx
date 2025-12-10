import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Globe, Shield, Loader2 } from "lucide-react";
import { z } from "zod";

const displayNameSchema = z.string().trim().max(50, "Display name must be less than 50 characters").optional();

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || user.email || "");
      } else {
        setEmail(user.email || "");
      }
      setLoading(false);
    };

    loadProfile();
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;

    const validation = displayNameSchema.safeParse(displayName);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    }
  };

  const handleCurrencyChange = (value: string) => {
    if (value in CURRENCIES) {
      setCurrency(value as CurrencyCode);
      toast({
        title: "Currency Updated",
        description: `Your preferred currency is now ${CURRENCIES[value as CurrencyCode].name}.`,
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Profile</CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Your email cannot be changed.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                  <Input 
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">This is how your name will appear across the site.</p>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving}
                  className="mt-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Globe className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">Preferred Currency</Label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency" className="w-full sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([code, info]) => (
                        <SelectItem key={code} value={code}>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-sm">{info.symbol}</span>
                            <span>{info.name}</span>
                            <span className="text-muted-foreground">({code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All prices will be displayed in your preferred currency. This setting syncs across all your devices.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Shield className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account</CardTitle>
                    <CardDescription>Account information and status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-xs text-muted-foreground">Your current account role</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <span className="px-3 py-1 text-xs font-mono bg-amber-500/20 text-amber-400 rounded-full">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-mono bg-primary/20 text-primary rounded-full">
                        USER
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-xs text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
