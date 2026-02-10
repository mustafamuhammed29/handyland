import React, { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    icon: ReactNode;
    showBackLink?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, icon, showBackLink = true }) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-12 overflow-hidden bg-slate-900">
            {/* Animated Binary Code Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-lg perspective-container z-10">
                <div className="glass-modern rounded-[2.5rem] p-8 md:p-10 border border-slate-700/50 shadow-2xl relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl">

                    {/* Scanner Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40 animate-[scan_3s_linear_infinite]"></div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group">
                           {icon}
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            {title}
                        </h2>
                        <p className="text-slate-500 text-xs mt-2 font-mono tracking-widest uppercase">
                            {subtitle}
                        </p>
                    </div>

                    {children}

                    {showBackLink && (
                        <div className="mt-8 pt-6 border-t border-slate-800/50 text-center space-y-4">
                            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white text-[10px] font-black flex items-center justify-center gap-2 mx-auto transition-colors uppercase tracking-widest">
                                <ChevronLeft className="w-4 h-4" /> Return to Core
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
