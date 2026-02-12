import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SlicerLogoProps {
  src?: string;
  name: string;
  className?: string;
}

export function SlicerLogo({ src, name, className = 'w-10 h-10' }: SlicerLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials = name.slice(0, 2).toUpperCase();

  if (!src || failed) {
    return (
      <div className={cn(
        'rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center flex-shrink-0',
        className
      )}>
        <span className="text-lg font-bold text-cyan-400 leading-none">{initials}</span>
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
