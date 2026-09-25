import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface SkeletonImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  imageClassName?: string;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  src,
  alt = 'Media thumbnail',
  className = '',
  containerClassName = '',
  imageClassName = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${containerClassName || className}`}>
      {/* Shimmering Skeleton Loader */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 animate-pulse flex items-center justify-center">
          {/* Subtle Cyber Shimmer Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-shimmer" />
          <Film className="w-6 h-6 text-slate-800 animate-pulse" />
        </div>
      )}

      {/* Fallback in case image fails to load */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-600 p-2 text-center">
          <Film className="w-8 h-8 text-slate-700 mb-1" />
          <span className="text-[10px] text-slate-500 font-mono">StreamX</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${imageClassName}`}
          {...props}
        />
      )}
    </div>
  );
};

// Full Grid Card Skeleton for when items are being fetched
export const SeriesCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-black border border-cyan-500/15 overflow-hidden flex flex-col animate-pulse shadow-md">
      {/* Poster Skeleton */}
      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-shimmer" />
        <div className="absolute top-2 left-2 w-12 h-4 rounded-md bg-slate-800/80" />
        <div className="absolute top-2 right-2 w-8 h-4 rounded-md bg-slate-800/80" />
      </div>

      {/* Meta Skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800 rounded-md w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-slate-900 rounded w-12" />
          <div className="h-3 bg-slate-900 rounded w-16" />
        </div>
      </div>
    </div>
  );
};

// Hero Carousel Card Skeleton
export const CarouselCardSkeleton: React.FC = () => {
  return (
    <div className="shrink-0 w-[82vw] sm:w-80 h-56 rounded-2xl bg-black border border-cyan-500/20 overflow-hidden relative animate-pulse snap-start">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full animate-shimmer" />
      <div className="absolute top-3 left-3 flex gap-2">
        <div className="w-14 h-5 rounded-lg bg-slate-800" />
        <div className="w-10 h-5 rounded-lg bg-slate-800" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 space-y-2">
        <div className="h-5 bg-slate-800 rounded-md w-2/3" />
        <div className="h-3 bg-slate-900 rounded w-1/3" />
      </div>
    </div>
  );
};
