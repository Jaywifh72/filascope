import { useState, useCallback, useRef, useEffect } from 'react';
import { Printer, BookOpen, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilamentImageFallback } from '@/components/ui/FilamentImageFallback';

type ImageType = 'filament' | 'printer' | 'brand' | 'guide' | 'generic';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  type: ImageType;
  brandName?: string;
  colorHex?: string | null;
  material?: string | null;
  aspectRatio?: string;
  className?: string;
  containerClassName?: string;
}

function FallbackVisual({ type, brandName, colorHex, material }: Pick<ImageWithFallbackProps, 'type' | 'brandName' | 'colorHex' | 'material'>) {
  switch (type) {
    case 'filament':
      return <FilamentImageFallback colorHex={colorHex} material={material} />;
    case 'printer':
      return (
        <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-white/[0.02]">
          <Printer className="w-12 h-12 text-muted-foreground/30" />
          <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Image coming soon</span>
        </div>
      );
    case 'brand':
      return (
        <div className="flex items-center justify-center w-full h-full bg-white/[0.02]">
          <span className="text-3xl font-bold text-muted-foreground/30">
            {brandName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      );
    case 'guide':
      return (
        <div className="flex items-center justify-center w-full h-full bg-white/[0.02]">
          <BookOpen className="w-10 h-10 text-muted-foreground/20" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center w-full h-full bg-white/[0.02]">
          <ImageOff className="w-10 h-10 text-muted-foreground/20" />
        </div>
      );
  }
}

export function ImageWithFallback({
  src,
  alt,
  type,
  brandName,
  colorHex,
  material,
  aspectRatio = '4/3',
  className,
  containerClassName,
}: ImageWithFallbackProps) {
  const hasSrc = Boolean(src);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(hasSrc ? 'loading' : 'error');
  const retriedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset when src changes
  useEffect(() => {
    retriedRef.current = false;
    setStatus(src ? 'loading' : 'error');
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  }, [src]);

  const handleLoad = useCallback(() => setStatus('loaded'), []);

  const handleError = useCallback(() => {
    if (!retriedRef.current && src) {
      retriedRef.current = true;
      // Auto-retry once after 2s with cache-bust
      retryTimerRef.current = setTimeout(() => {
        setStatus('loading');
        // Force re-render with cache-bust by updating status; 
        // the img src will include ?_retry=1 via the computed retrySrc
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [src]);

  const imgSrc = !src ? '' : (retriedRef.current && status === 'loading')
    ? `${src}${src.includes('?') ? '&' : '?'}_retry=1`
    : src;

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ aspectRatio }}
    >
      {/* Real img tag always in DOM for SEO */}
      <img
        src={imgSrc || undefined}
        alt={alt}
        loading="lazy"
        onLoad={hasSrc ? handleLoad : undefined}
        onError={hasSrc ? handleError : undefined}
        aria-hidden={!hasSrc || status === 'error'}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
      />

      {/* Overlay: skeleton or fallback */}
      {status !== 'loaded' && (
        <div className="absolute inset-0">
          {status === 'loading' ? (
            <div className="w-full h-full bg-muted/50 animate-pulse" />
          ) : (
            <FallbackVisual type={type} brandName={brandName} colorHex={colorHex} material={material} />
          )}
        </div>
      )}
    </div>
  );
}
