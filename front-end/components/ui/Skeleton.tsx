import React from 'react';

// Base shimmer animation via CSS class
const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, rgba(30,41,59,0.5) 25%, rgba(51,65,85,0.5) 50%, rgba(30,41,59,0.5) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite ease-in-out',
};

// Inject keyframes once
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
    if (!document.head.querySelector('[data-skeleton-style]')) {
        style.setAttribute('data-skeleton-style', '');
        document.head.appendChild(style);
    }
}

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`rounded-xl ${className}`} style={shimmerStyle} />
);

// Card skeleton (marketplace, accessories)
export const CardSkeleton: React.FC = () => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4">
        <SkeletonBlock className="w-full h-48" />
        <SkeletonBlock className="w-3/4 h-4" />
        <SkeletonBlock className="w-1/2 h-4" />
        <div className="flex justify-between items-center pt-2">
            <SkeletonBlock className="w-20 h-6" />
            <SkeletonBlock className="w-24 h-10 rounded-xl" />
        </div>
    </div>
);

// Dashboard stat card skeleton
export const StatSkeleton: React.FC = () => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
            <SkeletonBlock className="w-10 h-10 rounded-lg" />
            <SkeletonBlock className="w-16 h-4" />
        </div>
        <SkeletonBlock className="w-20 h-8" />
        <SkeletonBlock className="w-32 h-3" />
    </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
    <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <SkeletonBlock className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <SkeletonBlock className="w-1/3 h-4" />
            <SkeletonBlock className="w-1/4 h-3" />
        </div>
        <SkeletonBlock className="w-20 h-6 rounded-lg" />
    </div>
);

// Page-level marketplace skeleton
export const MarketplaceSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
    </div>
);

// Single text line skeleton 
export const TextSkeleton: React.FC<{ width?: string }> = ({ width = 'w-full' }) => (
    <SkeletonBlock className={`${width} h-4`} />
);
