import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Flag,
  Trash2,
  Printer,
  Thermometer,
  Layers,
  Grid3X3,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { CommunityPhoto } from "@/hooks/useCommunityPhotos";

interface PhotoLightboxProps {
  photos: CommunityPhoto[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleLike: (photoId: string, liked: boolean) => void;
  onReport: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  open,
  onOpenChange,
  onToggleLike,
  onReport,
  onDelete,
}: PhotoLightboxProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const photo = photos[currentIndex];
  if (!photo) return null;

  const file = photo.files[currentFileIndex] || photo.files[0];
  const isOwner = user?.id === photo.user_id;
  const displayName = photo.user_profile?.display_name || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  const goNext = () => {
    setCurrentFileIndex(0);
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goPrev = () => {
    setCurrentFileIndex(0);
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const hasSettings = photo.nozzle_temp || photo.bed_temp || photo.layer_height || photo.infill_pct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden max-h-[95vh]">
        <div className="flex flex-col md:flex-row max-h-[95vh]">
          {/* Image Area */}
          <div className="relative flex-1 bg-black/90 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {file && (
              <img
                src={file.file_url}
                alt={photo.caption || "Community print"}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}

            {/* File navigation dots */}
            {photo.files.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photo.files.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentFileIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentFileIndex
                        ? "bg-white scale-110"
                        : "bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Prev/Next photo navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-background/80 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-background/80 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-background/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border p-4 overflow-y-auto space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarImage src={photo.user_profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(photo.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Caption */}
            {photo.caption && (
              <p className="text-sm text-foreground/90">{photo.caption}</p>
            )}

            {/* Printer */}
            {photo.printer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Printer className="w-4 h-4 shrink-0" />
                <span>{photo.printer.display_name || photo.printer.model_name}</span>
              </div>
            )}

            {/* Print Settings */}
            {hasSettings && (
              <div className="grid grid-cols-2 gap-2">
                {photo.nozzle_temp && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Thermometer className="w-3.5 h-3.5 shrink-0" />
                    <span>Nozzle: {photo.nozzle_temp}°C</span>
                  </div>
                )}
                {photo.bed_temp && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Thermometer className="w-3.5 h-3.5 shrink-0" />
                    <span>Bed: {photo.bed_temp}°C</span>
                  </div>
                )}
                {photo.layer_height && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>{photo.layer_height}mm</span>
                  </div>
                )}
                {photo.infill_pct && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
                    <span>{photo.infill_pct}% infill</span>
                  </div>
                )}
              </div>
            )}

            {/* Model Source */}
            {photo.model_source && (
              <div className="text-sm">
                <span className="text-muted-foreground">Model: </span>
                {photo.model_source.startsWith("http") ? (
                  <a
                    href={photo.model_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {new URL(photo.model_source).hostname.replace("www.", "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-foreground/80">{photo.model_source}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleLike(photo.id, photo.liked_by_me)}
                className={cn(
                  "gap-1.5",
                  photo.liked_by_me && "text-pink-400"
                )}
              >
                <Heart
                  className={cn(
                    "w-4 h-4",
                    photo.liked_by_me && "fill-pink-400"
                  )}
                />
                {photo.like_count > 0 && <span className="text-xs">{photo.like_count}</span>}
              </Button>

              {!isOwner && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReport(photo.id)}
                  className="text-muted-foreground gap-1.5 ml-auto"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="text-xs">Report</span>
                </Button>
              )}

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onDelete(photo.id); onOpenChange(false); }}
                  className="text-destructive gap-1.5 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
