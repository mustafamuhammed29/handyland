import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const AppFrame = ({
    children,
    title,
    subtitle,
    icon,
    mode,
    quoteData,
    handlePrevStep,
    step,
    displayPrice
}: any) => (
    <div className="relative w-full max-w-5xl mx-auto min-h-[650px] bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500">
        <div className="relative z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-6 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
            <div className="flex items-center gap-4">
                {mode === 'wizard' && !quoteData ? (
                    <button
                        onClick={handlePrevStep}
                        aria-label="Zurück"
                        title="Zurück"
                        className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm hover:scale-105 active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </button>
                ) : (
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                        {icon}
                    </div>
                )}
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
                    {subtitle && <p className="text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
                </div>
            </div>

            {mode === 'wizard' && !quoteData && (
                <div className="flex flex-row md:flex-col items-end gap-3 justify-between">
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-full shadow-inner">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Bis zu</span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                            {Math.round(displayPrice)} €
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 hidden sm:flex">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="relative">
                                <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                {step === i && (
                                    <div className="absolute -top-1 -bottom-1 -left-1 -right-1 bg-blue-400/30 rounded-full blur-[2px]" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="relative z-20 p-6 md:p-12 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
            {children}
        </div>
    </div>
);
