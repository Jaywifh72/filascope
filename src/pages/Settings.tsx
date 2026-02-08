import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { SettingsSidebar, type SettingsSection } from "@/components/settings/SettingsSidebar";
import { SettingsProfileSection } from "@/components/settings/SettingsProfileSection";
import { SettingsPrintingSection } from "@/components/settings/SettingsPrintingSection";
import { SettingsPreferencesSection } from "@/components/settings/SettingsPreferencesSection";
import { SettingsPrivacySection } from "@/components/settings/SettingsPrivacySection";
import { SettingsAccountSection } from "@/components/settings/SettingsAccountSection";
import { SettingsNotificationsSection } from "@/components/settings/SettingsNotificationsSection";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const {
    profile,
    setProfile,
    loading,
    saving,
    slugError,
    uploadingAvatar,
    updateProfile,
    validateSlug,
    uploadAvatar,
    removeAvatar,
    deleteAccount,
    changePassword,
  } = useSettings();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (!user) return null;

  const handleSaveProfile = () => {
    updateProfile({
      display_name: profile.display_name,
      bio: profile.bio,
      username_slug: profile.username_slug,
      social_links: profile.social_links,
      is_public: profile.is_public,
    });
  };

  const handleSavePrinting = () => {
    updateProfile({
      printing_setup: profile.printing_setup,
      skill_level: profile.skill_level,
    });
  };

  const handleSavePreferences = () => {
    updateProfile({
      preferences: profile.preferences,
    });
  };

  const handleSavePrivacy = () => {
    updateProfile({
      is_public: profile.is_public,
      wishlist_public: profile.wishlist_public,
      reviews_public: profile.reviews_public,
      projects_public: profile.projects_public,
      purchases_public: profile.purchases_public,
    });
  };

  const handleSaveNotifications = () => {
    updateProfile({
      notification_settings: profile.notification_settings,
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <SettingsProfileSection
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            uploadingAvatar={uploadingAvatar}
            slugError={slugError}
            userId={user.id}
            onSave={handleSaveProfile}
            onValidateSlug={validateSlug}
            onUploadAvatar={uploadAvatar}
            onRemoveAvatar={removeAvatar}
          />
        );
      case "printing":
        return (
          <SettingsPrintingSection
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSave={handleSavePrinting}
          />
        );
      case "preferences":
        return (
          <SettingsPreferencesSection
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSave={handleSavePreferences}
          />
        );
      case "privacy":
        return (
          <SettingsPrivacySection
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSave={handleSavePrivacy}
          />
        );
      case "account":
        return (
          <SettingsAccountSection
            user={user}
            isAdmin={isAdmin}
            onChangePassword={changePassword}
            onDeleteAccount={deleteAccount}
          />
        );
      case "notifications":
        return (
          <SettingsNotificationsSection
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSave={handleSaveNotifications}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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

        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, preferences, and account.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            <div className="flex-1 min-w-0">{renderSection()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
