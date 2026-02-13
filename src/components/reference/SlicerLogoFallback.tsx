import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SlicerLogoProps {
  src?: string;
  name: string;
  className?: string;
}

export function SlicerLogo({ src, name, className = 'w-10 h-10' }: SlicerLogoProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div className={cn(
        'rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center flex-shrink-0',
        className
      )}>
        <span className="text-lg font-bold text-white/80 leading-none">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      className={cn('object-contain flex-shrink-0', className)}
      onError={() => setFailed(true)}
    />
  );
}
