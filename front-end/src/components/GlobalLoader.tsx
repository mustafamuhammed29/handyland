import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { Loader } from 'lucide-react';

export const GlobalLoader: React.FC = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-start p-6 md:p-10 animate-in fade-in duration-200 overflow-hidden">
            <div className="w-full max-w-7xl h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-8 relative flex items-center justify-center">
                 <Loader className="w-8 h-8 text-slate-400 animate-spin absolute right-4" />
            </div>
            <div className="w-full max-w-7xl flex flex-col gap-6">
                <div className="w-3/4 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="w-1/2 h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
        </div>
    );
};
