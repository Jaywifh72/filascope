import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { VideoTutorial, VIDEO_CATEGORIES } from '@/lib/videoTutorials';
import { Clock, ExternalLink } from 'lucide-react';

interface VideoPlayerModalProps {
  video: VideoTutorial;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({ video, open, onOpenChange }: VideoPlayerModalProps) {
  const category = VIDEO_CATEGORIES[video.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-lg">{video.title}</DialogTitle>
            <Badge variant="outline" className={category.color}>
              {category.icon} {category.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* YouTube Embed */}
          {video.youtubeId && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          )}

          {/* Video info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {video.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </span>
              {video.youtubeId && (
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Watch on YouTube
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            
            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {video.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
