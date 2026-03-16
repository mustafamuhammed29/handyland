import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    fallback?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    fallback = '/placeholder.webp',
}) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && imgRef.current) {
                    imgRef.current.src = src;
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (imgRef.current) observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {!loaded && !error && (
                <div
                    className="absolute inset-0 bg-slate-800 animate-pulse rounded-inherit"
                    style={{ borderRadius: 'inherit' }}
                />
            )}
            <img
                ref={imgRef}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    if (imgRef.current) imgRef.current.src = fallback;
                    setLoaded(true);
                }}
            />
        </div>
    );
};
