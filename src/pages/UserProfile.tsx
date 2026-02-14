import { useParams } from "react-router-dom";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileReviewsTab } from "@/components/profile/ProfileReviewsTab";
import { ProfileProjectsTab } from "@/components/profile/ProfileProjectsTab";
import { ProfileCollectionTab } from "@/components/profile/ProfileCollectionTab";
import { ProfileActivityTab } from "@/components/profile/ProfileActivityTab";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const {
    profile,
    reviews,
    projects,
    wishlistItems,
    activity,
    badges,
    totalHelpfulVotes,
    isLoading,
    isOwnProfile,
    isVisible,
    isNotFound,
  } = usePublicProfile(userId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isNotFound || !profile || (!isVisible && !isOwnProfile)) {
    return (
      <div className="min-h-screen bg-background">
        <DocumentHead title="Profile Not Found | FilaScope" />
        <div className="container max-w-4xl py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">
            This maker hasn't set up their profile yet, or it's set to private.
          </p>
        </div>
      </div>
    );
  }

  const showCollection = profile.wishlist_public && wishlistItems.length > 0;
  const pageTitle = profile.display_name
    ? `${profile.display_name} | FilaScope Maker Profile`
    : "Maker Profile | FilaScope";

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title={pageTitle}
        description={profile.bio || undefined}
        ogTitle={pageTitle}
        ogDescription={profile.bio || undefined}
      />

      <div className="container max-w-4xl py-8 px-4 sm:px-6">
        <ProfileHeader
          profile={profile}
          badges={badges}
          reviewCount={reviews.length}
          projectCount={projects.length}
          helpfulVotes={totalHelpfulVotes}
          isOwnProfile={isOwnProfile}
        />

        <Tabs defaultValue="reviews" className="mt-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            {showCollection && <TabsTrigger value="collection">Collection</TabsTrigger>}
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-4">
            <ProfileReviewsTab reviews={reviews} />
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <ProfileProjectsTab projects={projects} />
          </TabsContent>

          {showCollection && (
            <TabsContent value="collection" className="mt-4">
              <ProfileCollectionTab items={wishlistItems} />
            </TabsContent>
          )}

          <TabsContent value="activity" className="mt-4">
            <ProfileActivityTab activity={activity} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
