import React, { useEffect, useState } from 'react';
import { Settings, RefreshCw, Clock, Smartphone, Zap } from 'lucide-react';

const MaintenancePage: React.FC = () => {
    const [dots, setDots] = useState('');
    const [content, setContent] = useState({
        title: 'Wartungsarbeiten',
        message: 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!',
        estimatedTime: 'wenige Minuten'
    });

    useEffect(() => {
        // Fetch dynamic maintenance info from unblocked endpoint
        fetch('/api/maintenance-info')
            .then(res => res.json())
            .then(data => {
                if(data.maintenance && data.title) {
                    setContent({
                        title: data.title,
                        message: data.message,
                        estimatedTime: data.estimatedTime
                    });
                }
            })
            .catch(() => {});
    }, []);

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
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="absolute w-[40rem] h-[40rem] bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full flex flex-col items-center">
                
                {/* Hero Illustration: Broken Phone being Repaired */}
                <div className="relative mb-12 flex justify-center items-center w-40 h-40">
                    {/* Glowing Aura */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                    
                    {/* The Broken Phone */}
                    <div className="relative w-24 h-40 bg-slate-800 border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center -rotate-12 transition-transform hover:rotate-0 duration-500">
                        {/* Screen */}
                        <div className="absolute inset-1 bg-slate-900 rounded-2xl overflow-hidden text-center">
                            {/* Crack in screen */}
                            <Zap className="absolute top-4 left-4 w-12 h-12 text-white/5 opacity-50 transform rotate-45" strokeWidth={1} />
                            <Zap className="absolute bottom-10 right-4 w-8 h-8 text-white/5 opacity-50 transform -rotate-12" strokeWidth={1} />
                        </div>
                    </div>

                    {/* Repair Tool Orbiting */}
                    <div className="absolute -top-4 -right-4 bg-amber-500 p-3 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce text-white transform rotate-12 z-20">
                        <Settings className="w-8 h-8 animate-spin-slow" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    HANDY<span className="text-brand-primary">LAND</span>
                </h1>
                <div className="h-1 w-16 bg-gradient-to-r from-brand-primary to-amber-400 rounded-full mx-auto mb-8" />

                <h2 className="text-3xl font-bold text-amber-400 mb-4 h-10">
                    {content.title}{dots}
                </h2>
                
                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md mx-auto">
                    {content.message}
                </p>

                {/* Status indicators */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 space-y-4 w-full shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-brand-primary rounded-full animate-ping shrink-0" />
                        <span className="text-slate-300 font-medium">Diagnosing system...</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shrink-0" style={{ animationDelay: '200ms' }} />
                        <span className="text-slate-300 font-medium">Applying fresh repairs...</span>
                    </div>
                </div>

                {/* Time estimate */}
                {content.estimatedTime && (
                    <div className="flex items-center justify-center gap-2 text-amber-500/80 font-medium bg-amber-500/10 px-4 py-2 rounded-full mb-8">
                        <Clock className="w-4 h-4" />
                        <span>Expected Return: {content.estimatedTime}</span>
                    </div>
                )}

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 text-lg group"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Status
                </button>
            </div>
        </div>
    );
};

export default MaintenancePage;
