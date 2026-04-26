import React, { useEffect, useState } from 'react';
import { Settings, RefreshCw, Clock, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MaintenancePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [dots, setDots] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState({
        title: '',
        message: '',
        estimatedTime: '',
        statusText1: '',
        statusText2: ''
    });

    const [isAdminBypass, setIsAdminBypass] = useState(false);

    const safeT = (key: string, defaultVal: string) => {
        const res = t(key, { defaultValue: defaultVal });
        if (!res || typeof res !== 'string' || res.trim() === '' || res === key) return defaultVal;
        return res;
    };

    useEffect(() => {
        // Fetch dynamic maintenance info from unblocked endpoint
        let isMounted = true;
        fetch('/api/maintenance-info', { 
            credentials: 'include',
            cache: 'no-store'
        })
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data.bypassActive) setIsAdminBypass(true);

                if (data.maintenance || data.bypassActive) {
                    setContent({
                        title: data.title || safeT('maintenance.default_title', 'Wartungsarbeiten'),
                        message: data.message || safeT('maintenance.default_message', 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!'),
                        estimatedTime: data.estimatedTime || '',
                        statusText1: data.statusText1 || safeT('maintenance.diagnosing', 'System wird diagnostiziert...'),
                        statusText2: data.statusText2 || safeT('maintenance.repairing', 'Neue Reparaturen werden angewendet...')
                    });
                } else {
                    // If maintenance is OFF but we are on this page, show generic message
                    setContent({
                        title: safeT('maintenance.default_title', 'Wartungsarbeiten'),
                        message: safeT('maintenance.not_active', 'Das System ist online. Bitte aktualisieren Sie die Seite.'),
                        estimatedTime: '',
                        statusText1: safeT('maintenance.diagnosing', 'System wird diagnostiziert...'),
                        statusText2: safeT('maintenance.repairing', 'Neue Reparaturen werden angewendet...')
                    });
                }
                setIsLoading(false);
            })
            .catch(() => {
                if (!isMounted) return;
                // Fallback to localized defaults
                setContent({
                    title: safeT('maintenance.default_title', 'Wartungsarbeiten'),
                    message: safeT('maintenance.default_message', 'Wir führen gerade wichtige Systemwartungen durch, um Ihnen ein noch besseres Erlebnis zu bieten. Wir sind gleich wieder für Sie da!'),
                    estimatedTime: '',
                    statusText1: safeT('maintenance.diagnosing', 'System wird diagnostiziert...'),
                    statusText2: safeT('maintenance.repairing', 'Neue Reparaturen werden angewendet...')
                });
                setIsLoading(false);
            });
        
        return () => { isMounted = false; };
    }, [t]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = () => window.location.reload();

    return (
        <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-700">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="absolute w-[40rem] h-[40rem] bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full flex flex-col items-center">
                
                {isAdminBypass && (
                    <div className="mb-8 w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-xl text-sm font-semibold animate-pulse">
                        ⚠️ You are viewing this page as an Admin.<br/>
                        The site is working for you, but customers will see this screen!
                    </div>
                )}

                {/* Hero Illustration */}
                <div className="relative mb-12 flex justify-center items-center w-40 h-40 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>
                    
                    <div className="relative w-24 h-40 bg-slate-800 border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center -rotate-12 transition-all duration-700 group-hover:rotate-0">
                        <div className="absolute inset-1 bg-slate-900 rounded-2xl overflow-hidden text-center">
                            <Zap className="absolute top-4 left-4 w-12 h-12 text-blue-500/10 opacity-50 transform rotate-45" strokeWidth={1} />
                            <Zap className="absolute bottom-10 right-4 w-8 h-8 text-amber-500/10 opacity-50 transform -rotate-12" strokeWidth={1} />
                            <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-700 mx-4 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-1/2 animate-[loading_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    </div>

                    <div className="absolute -top-4 -right-4 bg-amber-500 p-3 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce text-white transform rotate-12 z-20">
                        <Settings className="w-8 h-8 animate-spin-slow" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    HANDY<span className="text-blue-500">LAND</span>
                </h1>
                <div className="h-1.5 w-20 bg-gradient-to-r from-blue-600 to-amber-400 rounded-full mx-auto mb-10" />

                <h2 className="text-3xl font-bold text-amber-400 mb-4 min-h-[40px]">
                    {isLoading ? (safeT('maintenance.loading', 'Wird geladen') + dots) : content.title}
                </h2>
                
                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md mx-auto whitespace-pre-wrap">
                    {content.message}
                </p>

                {/* Status indicators */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-8 space-y-4 w-full shadow-2xl">
                    <div className="flex items-center gap-4 group/item">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping shrink-0" />
                        <span className="text-slate-300 font-semibold group-hover/item:text-blue-400 transition-colors">
                            {content.statusText1 || safeT('maintenance.diagnosing', 'System wird diagnostiziert...')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 group/item">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shrink-0" style={{ animationDelay: '200ms' }} />
                        <span className="text-slate-300 font-semibold group-hover/item:text-amber-400 transition-colors">
                            {content.statusText2 || safeT('maintenance.repairing', 'Neue Reparaturen werden angewendet...')}
                        </span>
                    </div>
                </div>

                {/* Time estimate */}
                {content.estimatedTime && (
                    <div className="flex items-center justify-center gap-2 text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-6 py-2.5 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Clock className="w-4 h-4" />
                        <span>{safeT('maintenance.expected_return', 'Voraussichtliche Rückkehr')}: {content.estimatedTime}</span>
                    </div>
                )}

                {/* Refresh Button */}
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 text-lg group active:scale-95"
                >
                    <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                    {safeT('common.refresh', 'Status aktualisieren')}
                </button>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
