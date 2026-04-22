import { useParams, Link } from "react-router-dom";
import { FilamentCardSkeletonGrid } from "@/components/FilamentCardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentHead } from "@/components/seo/DocumentHead";
import {
  Folder,
  Star,
  Printer,
  DollarSign,
  Wrench,
  Copy,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useWishlistCollections } from "@/hooks/useWishlistCollections";
import { useCollectionActions } from "@/hooks/useCollectionItems";
import { useRegion } from "@/contexts/RegionContext";
import { resolveFilamentPrice } from "@/lib/resolveFilamentPrice";

const ICON_MAP: Record<string, React.ReactNode> = {
  folder: <Folder className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  printer: <Printer className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
};

export default function PublicCollection() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const { user } = useAuth();
  const { createCollection } = useWishlistCollections();
  const { addToCollection } = useCollectionActions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-collection", username, slug],
    queryFn: async () => {
      if (!username || !slug) throw new Error("Missing params");

      // Find the profile by username_slug using the public view (excludes email/sensitive fields)
      const { data: profileRaw, error: profileError } = await supabase
        .from("v_public_profiles" as any)
        .select("id, display_name, avatar_url, username_slug")
        .eq("username_slug", username)
        .single();
      const profile = profileRaw as unknown as { id: string; display_name: string | null; avatar_url: string | null; username_slug: string | null } | null;

      if (profileError) throw profileError;

      // Find the collection
      const { data: collection, error: collError } = await supabase
        .from("wishlist_collections")
        .select("*")
        .eq("user_id", profile.id)
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      if (collError) throw collError;

      // Get items
      const { data: items, error: itemsError } = await supabase
        .from("user_favorites")
        .select(`
          id,
          created_at,
          filament:filaments (
            id, product_title, vendor, material, featured_image,
            variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy,
            net_weight_g, pack_quantity, color_hex
          )
        `)
        .eq("user_id", profile.id)
        .eq("collection_id", collection.id)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      return {
        profile,
        collection,
        items: items || [],
      };
    },
    enabled: !!username && !!slug,
  });

  const handleClone = async () => {
    if (!user) {
      toast.error("Please sign in to clone this collection");
      return;
    }
    if (!data) return;

    const newColl = await createCollection(`${data.collection.name} (cloned)`, {
      icon: data.collection.icon,
      color: data.collection.color,
      description: `Cloned from ${data.profile.display_name || data.profile.username_slug}'s collection`,
    });

    if (newColl) {
      // Add all items
      for (const item of data.items) {
        if (item.filament?.id) {
          await addToCollection(item.filament.id, newColl.id);
        }
      }
      toast.success(`Collection cloned with ${data.items.length} items!`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <FilamentCardSkeletonGrid count={6} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This collection is either private or doesn't exist.
        </p>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const { profile, collection, items } = data;
  const { currency, convertPrice, hasRates, formatPrice } = useRegion();

  // Sum collection value in user currency via the canonical resolver
  const totalValue = items.reduce((sum: number, item: any) => {
    if (!item.filament) return sum;
    const resolved = resolveFilamentPrice(item.filament, {
      userCurrency: currency,
      convertFromCurrency: convertPrice,
      hasRates,
    });
    return sum + (resolved.spoolPrice ?? 0);
  }, 0);

  return (
    <>
      <DocumentHead
        title={`${collection.name} by ${profile.display_name || profile.username_slug} — FilaScope`}
        description={`${collection.name}: ${items.length} filaments curated by ${profile.display_name || profile.username_slug}`}
      />

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/user/${profile.username_slug || profile.id}`}
            className="text-sm text-muted-foreground hover:text-primary mb-3 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            {profile.display_name || "Back to profile"}
          </Link>

          <div className="flex items-start justify-between gap-4 mt-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: collection.color + "20", color: collection.color }}
              >
                {ICON_MAP[collection.icon] || <Folder className="h-5 w-5" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground mt-1">{collection.description}</p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={handleClone}>
              <Copy className="h-4 w-4 mr-2" />
              Clone Collection
            </Button>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
            {totalValue > 0 && (
              <span>Estimated value: {formatPrice(totalValue, { showApproximate: true })}</span>
            )}
            <span>
              by{" "}
              <Link
                to={`/user/${profile.username_slug || profile.id}`}
                className="text-primary hover:underline"
              >
                {profile.display_name || profile.username_slug}
              </Link>
            </span>
          </div>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">This collection is empty</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item: any) => (
              <Link
                key={item.id}
                to={`/filament/${item.filament?.id}`}
                className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="aspect-[3/2] bg-muted/30 relative overflow-hidden">
                  {item.filament?.featured_image ? (
                    <img
                      src={item.filament.featured_image}
                      alt={item.filament.product_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : item.filament?.color_hex ? (
                    <div className="w-full h-full" style={{ backgroundColor: item.filament.color_hex }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground truncate">{item.filament?.vendor}</p>
                  <p className="text-sm font-medium truncate mt-0.5">{item.filament?.product_title}</p>
                  <div className="flex items-center justify-between mt-2">
                    {item.filament?.material && (
                      <Badge variant="secondary" className="text-xs">{item.filament.material}</Badge>
                    )}
                    {(() => {
                      if (!item.filament) return null;
                      const resolved = resolveFilamentPrice(item.filament, {
                        userCurrency: currency,
                        convertFromCurrency: convertPrice,
                        hasRates,
                      });
                      if (resolved.spoolPrice == null) return null;
                      return (
                        <span className="text-sm font-mono font-semibold text-primary">
                          {formatPrice(resolved.spoolPrice, { showApproximate: resolved.isConverted })}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
