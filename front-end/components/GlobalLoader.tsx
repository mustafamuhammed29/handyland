import React from 'react';
import { useLoading } from '../context/LoadingContext';
import { Loader } from 'lucide-react';

export const GlobalLoader: React.FC = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <Loader className="w-12 h-12 text-cyan-400 animate-spin relative z-10" />
                </div>
                <p className="text-white font-bold tracking-wider animate-pulse">SYSTEM PROCESSING</p>
            </div>
        </div>
    );
};
