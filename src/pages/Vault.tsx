import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVaultProfile } from "@/hooks/useVaultProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { VaultHeroBar } from "@/components/vault/VaultHeroBar";
import { VaultSidebar, type VaultTab } from "@/components/vault/VaultSidebar";
import { VaultMobileNav } from "@/components/vault/VaultMobileNav";
import { VaultDashboard } from "@/components/vault/VaultDashboard";
import { VaultWishlistTab } from "@/components/vault/VaultWishlistTab";
import { VaultPurchasedTab } from "@/components/vault/VaultPurchasedTab";
import { VaultProjectsTab } from "@/components/vault/VaultProjectsTab";
import { VaultReviewsTab } from "@/components/vault/VaultReviewsTab";
import { VaultNotesTab } from "@/components/vault/VaultNotesTab";
import { VaultAlertsTab } from "@/components/vault/VaultAlertsTab";
import { VaultHistoryTab } from "@/components/vault/VaultHistoryTab";
import { VaultSkeleton } from "@/components/skeletons/VaultSkeleton";

const VALID_TABS: VaultTab[] = [
  "dashboard",
  "wishlist",
  "purchased",
  "projects",
  "reviews",
  "notes",
  "alerts",
  "history",
];

// Map legacy tab values to new ones
const TAB_ALIASES: Record<string, VaultTab> = {
  liked: "wishlist",
  comments: "reviews",
};

const Vault = () => {
  const { user, loading } = useAuth();
  const { profile, counts, isLoading: profileLoading } = useVaultProfile();
  const isMobile = useIsMobile();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // URL-based tab state with fallbacks
  const rawTab = searchParams.get("tab") || "dashboard";
  const activeTab: VaultTab =
    VALID_TABS.includes(rawTab as VaultTab)
      ? (rawTab as VaultTab)
      : TAB_ALIASES[rawTab] || "dashboard";

  const setActiveTab = (tab: VaultTab) => {
    if (tab === "dashboard") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  if (loading || profileLoading) {
    return <VaultSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show mobile nav at anything below desktop (< 1024px)
  const showMobileNav = !isDesktop;

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Hero Bar */}
      <VaultHeroBar profile={profile} counts={counts} onStatClick={setActiveTab} />

      {/* Mobile / Tablet Nav (< 1024px) */}
      {showMobileNav && (
        <div className="mb-4">
          <VaultMobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Desktop/Tablet: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar - only on desktop */}
        {isDesktop && (
          <VaultSidebar
            activeTab={activeTab}
            counts={counts}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0" key={activeTab}>
          <div className="animate-fade-in">
            <TabContent activeTab={activeTab} profile={profile} counts={counts} onNavigate={setActiveTab} />
          </div>
        </main>
      </div>
    </div>
  );
};

function TabContent({
  activeTab,
  profile,
  counts,
  onNavigate,
}: {
  activeTab: VaultTab;
  profile: any;
  counts: any;
  onNavigate: (tab: VaultTab) => void;
}) {
  switch (activeTab) {
    case "dashboard":
      return <VaultDashboard profile={profile} counts={counts} onNavigate={onNavigate} />;
    case "wishlist":
      return <VaultWishlistTab />;
    case "purchased":
      return <VaultPurchasedTab />;
    case "projects":
      return <VaultProjectsTab />;
    case "reviews":
      return <VaultReviewsTab />;
    case "notes":
      return <VaultNotesTab />;
    case "alerts":
      return <VaultAlertsTab />;
    case "history":
      return <VaultHistoryTab />;
    default:
      return <VaultDashboard profile={profile} counts={counts} onNavigate={onNavigate} />;
  }
}

export default Vault;
