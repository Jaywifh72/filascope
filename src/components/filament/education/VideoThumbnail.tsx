import { useState } from 'react';
import { VIDEO_TUTORIALS, VIDEO_CATEGORIES, VideoTutorial } from '@/lib/videoTutorials';
import { Play, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VideoPlayerModal } from './VideoPlayerModal';
import { useAchievements } from '@/hooks/useAchievements';

interface VideoThumbnailProps {
  videoId: string;
  compact?: boolean;
  className?: string;
}

export function VideoThumbnail({ videoId, compact = false, className }: VideoThumbnailProps) {
  const video = VIDEO_TUTORIALS[videoId];
  const [showPlayer, setShowPlayer] = useState(false);
  const { incrementStat } = useAchievements();

  if (!video) return null;

  const category = VIDEO_CATEGORIES[video.category];

  const handlePlay = () => {
    incrementStat('tutorials_watched');
    if (video.youtubeId) {
      setShowPlayer(true);
    } else if (video.externalUrl) {
      window.open(video.externalUrl, '_blank');
    }
  };

  const thumbnailUrl = video.thumbnail || 
    (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` : null);

  if (compact) {
    return (
      <>
        <button
          onClick={handlePlay}
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors w-full text-left group',
            className
          )}
        >
          <div className="relative flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-muted">
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{video.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </p>
          </div>
        </button>
        
        {video.youtubeId && (
          <VideoPlayerModal
            video={video}
            open={showPlayer}
            onOpenChange={setShowPlayer}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border border-border bg-card overflow-hidden group cursor-pointer',
          className
        )}
        onClick={handlePlay}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {thumbnailUrl && (
            <img 
              src={thumbnailUrl} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
            {video.duration}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight">{video.title}</h4>
            <Badge 
              variant="outline" 
              className={cn('text-xs shrink-0', category.color)}
            >
              {category.icon}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        </div>
      </div>

      {video.youtubeId && (
        <VideoPlayerModal
          video={video}
          open={showPlayer}
          onOpenChange={setShowPlayer}
        />
      )}
    </>
  );
}

// Simple inline video link
export function VideoLink({ videoId, children }: { videoId: string; children?: React.ReactNode }) {
  const video = VIDEO_TUTORIALS[videoId];
  const [showPlayer, setShowPlayer] = useState(false);
  const { incrementStat } = useAchievements();

  if (!video) return null;

  const handleClick = () => {
    incrementStat('tutorials_watched');
    if (video.youtubeId) {
      setShowPlayer(true);
    } else if (video.externalUrl) {
      window.open(video.externalUrl, '_blank');
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
      >
        <Play className="h-3 w-3" />
        {children || video.title}
        {video.externalUrl && <ExternalLink className="h-3 w-3" />}
      </button>
      
      {video.youtubeId && (
        <VideoPlayerModal
          video={video}
          open={showPlayer}
          onOpenChange={setShowPlayer}
        />
      )}
    </>
  );
}
