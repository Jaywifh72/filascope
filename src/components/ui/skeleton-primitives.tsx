import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

/* ─── SkeletonBox ─── */
interface SkeletonBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

export function SkeletonBox({ width, height, className, style, ...props }: SkeletonBoxProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.06]",
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}

/* ─── SkeletonText ─── */
interface SkeletonTextProps {
  lines?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-3", md: "h-4", lg: "h-6" } as const;

export function SkeletonText({ lines = 3, size = "md", className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={cn(sizeMap[size], i === lines - 1 && lines > 1 ? "w-[60%]" : "w-full")}
        />
      ))}
    </div>
  );
}

/* ─── SkeletonCircle ─── */
interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <SkeletonBox
      className={cn("rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ─── SkeletonImage ─── */
interface SkeletonImageProps {
  aspectRatio?: string;
  className?: string;
}

export function SkeletonImage({ aspectRatio = "1/1", className }: SkeletonImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.06] flex items-center justify-center",
        className
      )}
      style={{ aspectRatio }}
    >
      <ImageIcon className="w-8 h-8 opacity-[0.15]" />
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}
