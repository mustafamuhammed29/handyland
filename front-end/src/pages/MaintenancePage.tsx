import React, { useEffect, useState } from 'react';
import { Wrench, RefreshCw, Clock } from 'lucide-react';

const MaintenancePage: React.FC = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => window.location.reload();

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full">
                {/* Icon */}
                <div className="flex items-center justify-center mb-8">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)] animate-bounce">
                        <Wrench className="w-14 h-14 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
                    HANDY<span className="text-brand-primary">LAND</span>
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-brand-primary to-amber-400 rounded-full mx-auto mb-8" />

                <h2 className="text-2xl font-bold text-amber-400 mb-4">
                    Wartungsarbeiten{dots}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-10">
                    Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten.
                    Wir sind gleich wieder für Sie da!
                </p>

                {/* Status indicators */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 space-y-3 text-left">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                        <span className="text-slate-300">System-Updates werden angewendet</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shrink-0" style={{ animationDelay: '200ms' }} />
                        <span className="text-slate-300">Datenbank wird optimiert</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-2.5 h-2.5 bg-slate-600 rounded-full shrink-0" />
                        <span className="text-slate-500">Dienste werden neu gestartet</span>
                    </div>
                </div>

                {/* Time estimate */}
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-8">
                    <Clock className="w-4 h-4" />
                    <span>Geschätzte Dauer: wenige Minuten</span>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary hover:brightness-110 text-black font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/30 text-lg"
                >
                    <RefreshCw className="w-5 h-5" />
                    Seite neu laden
                </button>
            </div>
        </div>
    );
};

export default MaintenancePage;
