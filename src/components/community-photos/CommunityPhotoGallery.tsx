import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Heart, SortAsc, ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { SharePrintDialog } from "./SharePrintDialog";
import { PhotoLightbox } from "./PhotoLightbox";
import {
  useCommunityPhotos,
  type PhotoSortOption,
  type PhotoFilterOption,
} from "@/hooks/useCommunityPhotos";

interface CommunityPhotoGalleryProps {
  productId: string;
  productType?: string;
  productName?: string;
}

export function CommunityPhotoGallery({
  productId,
  productType = "filament",
  productName,
}: CommunityPhotoGalleryProps) {
  const { user } = useAuth();
  const {
    photos,
    isLoading,
    uploadPhoto,
    isUploading,
    toggleLike,
    reportPhoto,
    deletePhoto,
  } = useCommunityPhotos(productId, productType);

  const [sortBy, setSortBy] = useState<PhotoSortOption>("recent");
  const [filter, setFilter] = useState<PhotoFilterOption>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Get unique printers from photos
  const printerOptions = useMemo(() => {
    const printers = new Map<string, string>();
    photos.forEach((p) => {
      if (p.printer_id && p.printer) {
        printers.set(p.printer_id, p.printer.display_name || p.printer.model_name);
      }
    });
    return Array.from(printers.entries()).map(([id, name]) => ({ id, name }));
  }, [photos]);

  // Filter & sort
  const displayPhotos = useMemo(() => {
    let result = [...photos];

    if (filter === "mine" && user?.id) {
      result = result.filter((p) => p.user_id === user.id);
    } else if (filter !== "all") {
      result = result.filter((p) => p.printer_id === filter);
    }

    if (sortBy === "popular") {
      result.sort((a, b) => b.like_count - a.like_count);
    }
    // "recent" is default from query

    return result;
  }, [photos, filter, sortBy, user?.id]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Community Prints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Camera className="w-4 h-4" />
            </div>
            Community Prints
            {photos.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-normal">
                {photos.length}
              </Badge>
            )}
          </CardTitle>

          <SharePrintDialog
            productId={productId}
            productType={productType}
            onUpload={uploadPhoto}
            isUploading={isUploading}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {photos.length > 0 && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as PhotoSortOption)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SortAsc className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Liked</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                {[
                  { key: "all" as const, label: "All" },
                  ...(user ? [{ key: "mine" as const, label: "My Photos" }] : []),
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      filter === item.key
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted/80 border border-transparent"
                    )}
                  >
                    {item.label}
                  </button>
                ))}

                {printerOptions.length > 0 && (
                  <Select
                    value={filter !== "all" && filter !== "mine" ? filter : "all-printers"}
                    onValueChange={(v) => setFilter(v === "all-printers" ? "all" : v)}
                  >
                    <SelectTrigger className="w-[130px] h-7 text-xs">
                      <SelectValue placeholder="By Printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-printers">All Printers</SelectItem>
                      {printerOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Photo Grid (Masonry-style with CSS columns) */}
            {displayPhotos.length > 0 ? (
              <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                {displayPhotos.map((photo, idx) => {
                  const mainFile = photo.files[0];
                  if (!mainFile) return null;

                  const displayName = photo.user_profile?.display_name || "Anonymous";
                  const initials = displayName.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={photo.id}
                      className="break-inside-avoid rounded-xl overflow-hidden border border-border/40 bg-card/60 cursor-pointer group hover:border-primary/30 transition-all"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <div className="relative">
                        <img
                          src={mainFile.file_url}
                          alt={photo.caption || "Community print"}
                          className="w-full object-cover"
                          loading="lazy"
                        />
                        {/* Multi-photo indicator */}
                        {photo.files.length > 1 && (
                          <div className="absolute top-2 right-2 bg-background/70 backdrop-blur text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            +{photo.files.length - 1}
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 space-y-1.5">
                        {/* User */}
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={photo.user_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {displayName}
                          </span>
                        </div>

                        {/* Caption snippet */}
                        {photo.caption && (
                          <p className="text-xs text-foreground/80 line-clamp-2">
                            {photo.caption}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {photo.printer && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                                {photo.printer.display_name || photo.printer.model_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart
                              className={cn(
                                "w-3 h-3",
                                photo.liked_by_me && "fill-pink-400 text-pink-400"
                              )}
                            />
                            {photo.like_count > 0 && <span>{photo.like_count}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No photos match your filter.
              </p>
            )}
          </>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-base text-muted-foreground mb-1">Share a print made with this filament</p>
            <p className="text-sm text-muted-foreground mb-5">
              {productName ? `Show the community what's possible with ${productName}` : 'Show the community what you\'ve made'}
            </p>
            <SharePrintDialog
              productId={productId}
              productType={productType}
              onUpload={uploadPhoto}
              isUploading={isUploading}
            />
            <p className="text-xs text-muted-foreground mt-4">Accepted formats: JPG, PNG, WebP · Max 5MB</p>
          </div>
        )}
      </CardContent>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={displayPhotos}
          initialIndex={lightboxIndex}
          open={true}
          onOpenChange={(open) => !open && setLightboxIndex(null)}
          onToggleLike={(id, liked) => toggleLike({ photoId: id, liked })}
          onReport={reportPhoto}
          onDelete={deletePhoto}
        />
      )}
    </Card>
  );
}
