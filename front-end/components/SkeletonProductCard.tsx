import React from 'react';

export const SkeletonProductCard = () => {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 flex flex-col h-full animate-pulse">
            <div className="w-full h-64 bg-slate-800 rounded-2xl mb-4"></div>
            <div className="space-y-3 flex-1">
                <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                        <div className="h-3 w-16 bg-slate-800 rounded"></div>
                        <div className="h-6 w-full bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-slate-800 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-8 bg-slate-800 rounded-lg"></div>
                    <div className="h-8 bg-slate-800 rounded-lg"></div>
                </div>
                <div className="mt-auto pt-4 flex gap-2">
                    <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
                    <div className="h-10 w-12 bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
};
