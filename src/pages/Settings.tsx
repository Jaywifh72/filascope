import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Globe, Shield, Loader2, Camera, Trash2, TrendingUp, Eye, ExternalLink } from "lucide-react";
import { z } from "zod";
import { ProgressDashboard } from "@/components/filament/education/ProgressDashboard";

const displayNameSchema = z.string().trim().max(50, "Display name must be less than 50 characters").optional();
const slugSchema = z.string().regex(/^[a-z0-9-]{3,30}$/, "3-30 characters: lowercase letters, numbers, hyphens only");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BIO_LENGTH = 280;

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currency, setCurrency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [usernameSlug, setUsernameSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [wishlistPublic, setWishlistPublic] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url, bio, is_public, username_slug, social_links, wishlist_public")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || user.email || "");
        setAvatarUrl(data.avatar_url || null);
        setBio((data as any).bio || "");
        setUsernameSlug((data as any).username_slug || "");
        setIsPublic((data as any).is_public || false);
        setWishlistPublic((data as any).wishlist_public || false);
        setSocialLinks(((data as any).social_links as Record<string, string>) || {});
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

  const validateSlug = useCallback(async (slug: string) => {
    if (!slug) {
      setSlugError(null);
      return;
    }
    const result = slugSchema.safeParse(slug);
    if (!result.success) {
      setSlugError(result.error.errors[0]?.message || "Invalid slug");
      return;
    }
    // Check uniqueness
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username_slug", slug)
      .neq("id", user?.id || "")
      .maybeSingle();
    if (data) {
      setSlugError("This username is already taken");
    } else {
      setSlugError(null);
    }
  }, [user?.id]);

  const handleSavePublicProfile = async () => {
    if (!user) return;
    if (slugError) return;

    // Validate slug if provided
    if (usernameSlug) {
      const result = slugSchema.safeParse(usernameSlug);
      if (!result.success) {
        toast({ title: "Invalid username", description: result.error.errors[0]?.message, variant: "destructive" });
        return;
      }
    }

    setSavingPublicProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio: bio.trim() || null,
        username_slug: usernameSlug.trim() || null,
        is_public: isPublic,
        wishlist_public: wishlistPublic,
        social_links: socialLinks,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    setSavingPublicProfile(false);
    if (error) {
      const msg = error.message.includes("idx_profiles_username_slug")
        ? "This username is already taken."
        : "Failed to save. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Public Profile Updated", description: "Your public profile settings have been saved." });
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting parameter
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlWithCacheBust,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBust);
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setUploadingAvatar(true);

    try {
      // List files in user's folder
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(user.id);

      // Delete all files in user's folder
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(filePaths);
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      toast({
        title: "Avatar Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
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
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <Avatar className="w-20 h-20 border-2 border-border">
                        <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                        <AvatarFallback className="text-lg bg-muted">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Upload Photo
                          </>
                        )}
                      </Button>
                      {avatarUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a JPEG, PNG, WebP, or GIF image (max 5MB).
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <Separator className="bg-border/50" />

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

            {/* Public Profile Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Public Profile</CardTitle>
                    <CardDescription>Control what others can see about you</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO_LENGTH))}
                    placeholder="Tell the community about yourself..."
                    maxLength={MAX_BIO_LENGTH}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/{MAX_BIO_LENGTH}
                  </p>
                </div>

                <Separator className="bg-border/50" />

                {/* Username slug */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={usernameSlug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setUsernameSlug(val);
                    }}
                    onBlur={() => validateSlug(usernameSlug)}
                    placeholder="e.g. makerjohn"
                    maxLength={30}
                  />
                  {slugError && (
                    <p className="text-xs text-destructive">{slugError}</p>
                  )}
                  {usernameSlug && !slugError && (
                    <p className="text-xs text-muted-foreground">
                      Profile URL: filascope.lovable.app/user/{usernameSlug}
                    </p>
                  )}
                </div>

                <Separator className="bg-border/50" />

                {/* Social Links */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Social Links</Label>
                  {[
                    { key: "printables", label: "Printables", placeholder: "https://www.printables.com/@username" },
                    { key: "thingiverse", label: "Thingiverse", placeholder: "https://www.thingiverse.com/username" },
                    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
                  ].map((platform) => (
                    <div key={platform.key} className="space-y-1">
                      <Label htmlFor={`social-${platform.key}`} className="text-xs text-muted-foreground">
                        {platform.label}
                      </Label>
                      <Input
                        id={`social-${platform.key}`}
                        value={socialLinks[platform.key] || ""}
                        onChange={(e) =>
                          setSocialLinks((prev) => ({ ...prev, [platform.key]: e.target.value }))
                        }
                        placeholder={platform.placeholder}
                        type="url"
                      />
                    </div>
                  ))}
                </div>

                <Separator className="bg-border/50" />

                {/* Privacy Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Make my profile public</p>
                      <p className="text-xs text-muted-foreground">Allow others to see your profile, reviews, and projects</p>
                    </div>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show my wishlist on my profile</p>
                      <p className="text-xs text-muted-foreground">Let visitors see your saved filaments</p>
                    </div>
                    <Switch
                      checked={wishlistPublic}
                      onCheckedChange={setWishlistPublic}
                      disabled={!isPublic}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSavePublicProfile}
                    disabled={savingPublicProfile || !!slugError}
                  >
                    {savingPublicProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Public Profile"
                    )}
                  </Button>
                  {user && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/user/${usernameSlug || user.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview Profile
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

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

            {/* Learning Progress Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Learning Progress</CardTitle>
                    <CardDescription>Track your 3D printing journey</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProgressDashboard />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
