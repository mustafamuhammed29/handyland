import React from 'react';
import { WifiOff, RefreshCw, ServerCrash, ShieldAlert } from 'lucide-react';

interface GlobalErrorProps {
    onRetry?: () => void;
    errorType?: 'connection' | 'maintenance' | 'unknown';
}

export const GlobalError: React.FC<GlobalErrorProps> = ({ onRetry, errorType = 'connection' }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

            <div className="relative max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in duration-300">

                {/* Icon Container */}
                <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative group">
                    <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-20"></div>
                    {errorType === 'connection' ? (
                        <WifiOff className="w-10 h-10 text-red-500" />
                    ) : (
                        <ServerCrash className="w-10 h-10 text-red-500" />
                    )}
                </div>

                {/* Text Content */}
                <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                    {errorType === 'connection' ? 'System Offline' : 'Critical Error'}
                </h1>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    {errorType === 'connection'
                        ? "Unable to establish a secure connection to the Handyland Network. The server may be offline or unreachable."
                        : "An unexpected system failure has occurred. Diagnostics are running."
                    }
                </p>

                {/* Tech Specs Decoration */}
                <div className="flex justify-center gap-4 mb-8 text-[10px] font-mono text-red-400/60 uppercase tracking-widest border-y border-red-500/10 py-2">
                    <span>err_code: 0x503</span>
                    <span>•</span>
                    <span>net_status: disconnected</span>
                </div>

                {/* Actions */}
                <button
                    onClick={() => {
                        if (onRetry) onRetry();
                        else window.location.reload();
                    }}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2 group"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Re-Initialize Connection</span>
                </button>

                <p className="mt-6 text-xs text-slate-500 font-mono">
                    Handyland Secure Systems v4.0.2
                </p>
            </div>
        </div>
    );
};
