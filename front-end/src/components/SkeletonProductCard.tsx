import React from 'react';

export const SkeletonProductCard = () => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col h-full transition-all duration-300">
            <div className="w-full h-64 skeleton-loader mb-4 border border-slate-200 dark:border-slate-800"></div>
            <div className="space-y-3 flex-1">
                <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                        <div className="h-3 w-16 skeleton-loader text-xs block"></div>
                        <div className="h-6 w-full skeleton-loader font-bold block"></div>
                    </div>
                    <div className="h-6 w-16 skeleton-loader block pt-1 mt-1 font-bold"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-8 skeleton-loader rounded-lg border border-slate-200 dark:border-slate-800"></div>
                    <div className="h-8 skeleton-loader rounded-lg border border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="mt-auto pt-4 flex justify-between gap-2">
                    <div className="h-10 w-24 skeleton-loader font-bold border border-slate-200 dark:border-slate-800"></div>
                    <div className="flex gap-2">
                        <div className="h-10 w-10 skeleton-loader rounded-xl border border-slate-200 dark:border-slate-800"></div>
                        <div className="h-10 w-10 skeleton-loader rounded-xl border border-slate-200 dark:border-slate-800"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
