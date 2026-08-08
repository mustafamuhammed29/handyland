import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ImageCompareSliderProps {
    imgBefore: string;
    imgAfter: string;
    labelBefore?: string;
    labelAfter?: string;
    height?: string;
    interactive?: boolean;
}

const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({ 
    imgBefore, 
    imgAfter, 
    labelBefore = 'Before', 
    labelAfter = 'After',
    height = '100%',
    interactive = true
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!interactive || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
        
        setSliderPosition(percent);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        handleMove(e.touches[0].clientX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchend', handleMouseUp);
        } else {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full overflow-hidden select-none bg-slate-900 group ${interactive ? 'cursor-ew-resize' : ''}`}
            style={{ height }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={(e) => {
                if (!interactive) return;
                setIsDragging(true);
                handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
                if (!interactive) return;
                setIsDragging(true);
                handleMove(e.touches[0].clientX);
            }}
        >
            {/* After Image (Background) */}
            <img 
                src={imgAfter} 
                alt="After" 
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
            />
            {/* After Label */}
            <span className="absolute bottom-3 right-3 text-xs bg-emerald-500/90 text-white font-bold px-2.5 py-1 rounded shadow-lg backdrop-blur-sm uppercase tracking-wider z-10 pointer-events-none">
                {labelAfter}
            </span>

            {/* Before Image (Foreground, Clipped) */}
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img 
                    src={imgBefore} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                />
                {/* Before Label */}
                <span className="absolute bottom-3 left-3 text-xs bg-red-500/90 text-white font-bold px-2.5 py-1 rounded shadow-lg backdrop-blur-sm uppercase tracking-wider z-10">
                    {labelBefore}
                </span>
            </div>

            {/* Slider Line & Handle */}
            {interactive && (
                <div 
                    className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
                    style={{ left: `calc(${sliderPosition}% - 2px)` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl border border-slate-200 pointer-events-none group-hover:scale-110 transition-transform">
                        <GripVertical size={16} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageCompareSlider;
