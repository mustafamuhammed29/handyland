import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUrl';

interface LazyImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallback?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '',
  fallback = '/placeholder-device.svg'
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const imageSrc = error ? fallback : getImageUrl(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-700/50 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 
                    ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
};
