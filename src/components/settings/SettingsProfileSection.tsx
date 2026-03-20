import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Loader2, Trash2, ExternalLink } from "lucide-react";
import type { ProfileData } from "@/hooks/useSettings";

const MAX_BIO_LENGTH = 280;

interface Props {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  saving: boolean;
  uploadingAvatar: boolean;
  slugError: string | null;
  userId: string;
  onSave: () => void;
  onValidateSlug: (slug: string) => void;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
}

export function SettingsProfileSection({
  profile,
  setProfile,
  saving,
  uploadingAvatar,
  slugError,
  userId,
  onSave,
  onValidateSlug,
  onUploadAvatar,
  onRemoveAvatar,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (profile.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    if (profile.email) return profile.email.slice(0, 2).toUpperCase();
    return "U";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadAvatar(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Your personal information and public presence</CardDescription>
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
                <AvatarImage src={profile.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="text-lg bg-muted">{getInitials()}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
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
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Camera className="w-4 h-4 mr-2" />Upload Photo</>}
              </Button>
              {profile.avatar_url && (
                <Button variant="ghost" size="sm" onClick={onRemoveAvatar} disabled={uploadingAvatar} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />Remove
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Upload a JPEG, PNG, WebP, or GIF image (max 5MB).</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
        </div>

        <Separator className="bg-border/50" />

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
          <Input
            id="displayName"
            value={profile.display_name}
            onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="Enter your display name"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">This is how your name will appear across the site.</p>
        </div>

        {/* Username/slug */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
          <Input
            id="username"
            value={profile.username_slug}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
              setProfile(prev => ({ ...prev, username_slug: val }));
            }}
            onBlur={() => onValidateSlug(profile.username_slug)}
            placeholder="e.g. makerjohn"
            maxLength={30}
          />
          {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          {profile.username_slug && !slugError && (
            <p className="text-xs text-muted-foreground">
              Profile URL: filascope.com/user/{profile.username_slug}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value.slice(0, MAX_BIO_LENGTH) }))}
            placeholder="Tell the community about yourself..."
            maxLength={MAX_BIO_LENGTH}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">{profile.bio.length}/{MAX_BIO_LENGTH}</p>
        </div>

        <Separator className="bg-border/50" />

        {/* Social Links */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Social Links</Label>
          {[
            { key: "printables", label: "Printables", placeholder: "https://www.printables.com/@username" },
            { key: "thingiverse", label: "Thingiverse", placeholder: "https://www.thingiverse.com/username" },
            { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
            { key: "instagram", label: "Instagram", placeholder: "@username" },
          ].map((platform) => (
            <div key={platform.key} className="space-y-1">
              <Label htmlFor={`social-${platform.key}`} className="text-xs text-muted-foreground">{platform.label}</Label>
              <Input
                id={`social-${platform.key}`}
                value={profile.social_links[platform.key] || ""}
                onChange={(e) =>
                  setProfile(prev => ({
                    ...prev,
                    social_links: { ...prev.social_links, [platform.key]: e.target.value },
                  }))
                }
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={onSave} disabled={saving || !!slugError}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Profile"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/user/${profile.username_slug || userId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />Preview Profile
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
