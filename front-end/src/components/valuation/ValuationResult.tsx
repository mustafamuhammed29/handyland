import React from 'react';
import { CheckCircle2, BadgeEuro, Smartphone, RotateCcw, ShieldCheck, Wallet, Truck, ArrowRight } from 'lucide-react';
import { AppFrame } from './AppFrame';

export const ValuationResult = ({
    t,
    formData,
    quoteData,
    selectedDevice,
    countdown,
    loading,
    handleSubmitQuote,
    navigate
}: any) => {
    return (
        <div className="w-full max-w-5xl mx-auto z-10 duration-500">
            <AppFrame
                title={t('valuation.result') || 'Dein Angebot ist da!'}
                subtitle={`${t('valuation.yourOffer') || 'Exklusives Angebot für dich'} (Ref: ${quoteData.quoteReference || '…'})`}
                icon={<BadgeEuro className="w-7 h-7" />}
            >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm">
                            <div className="w-28 h-28 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center shrink-0 p-3 shadow-inner border border-slate-100 dark:border-slate-800/50">
                                {selectedDevice?.imageUrl ? (
                                    <img
                                        src={selectedDevice.imageUrl}
                                        alt={selectedDevice.modelName}
                                        className="object-contain w-full h-full drop-shadow-sm"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                    />
                                ) : null}
                                <Smartphone className={`w-12 h-12 text-slate-400 ${selectedDevice?.imageUrl ? 'hidden' : ''}`} />
                            </div>
                            <div className="text-center sm:text-left pt-2">
                                <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-tight">{formData.model}</h3>
                                <p className="text-blue-600 dark:text-blue-400 font-bold mt-1 text-lg">{formData.storage}</p>
                            </div>
                        </div>

                        <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                                <span className="text-slate-500 font-bold text-sm">Bildschirm</span>
                                <span className="font-bold text-slate-900 dark:text-white capitalize truncate bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm">{formData.screenCondition}</span>
                            </div>
                            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                                <span className="text-slate-500 font-bold text-sm">Gehäuse</span>
                                <span className="font-bold text-slate-900 dark:text-white capitalize truncate bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm">{formData.bodyCondition}</span>
                            </div>
                            <div className="p-5 flex items-center justify-between">
                                <span className="text-slate-500 font-bold text-sm">Zustand</span>
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                                    {formData.isFunctional ? <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> : <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>}
                                    {formData.isFunctional ? 'Funktionsfähig' : 'Teildefekt'}
                                </span>
                            </div>
                        </div>

                        <button onClick={() => window.location.reload()} className="w-full py-4 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-2 transition-colors bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                            <RotateCcw className="w-4 h-4" /> {t('valuation.newValuation') || 'Neues Gerät bewerten'}
                        </button>
                    </div>

                    <div className="flex flex-col lg:col-span-3">
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden flex-1 flex flex-col justify-center shadow-xl">
                            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/10 blur-[60px] rounded-full pointer-events-none" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/20 blur-[60px] rounded-full pointer-events-none" />

                            <div className="inline-flex items-center justify-center gap-2 bg-emerald-400 text-emerald-950 font-black px-5 py-2 rounded-full uppercase tracking-wider mb-8 mx-auto shadow-lg">
                                <CheckCircle2 size={18} /> Bestpreis gesichert
                            </div>

                            <p className="text-blue-200 font-medium mb-2 text-lg">
                                Dein garantierter Auszahlungsbetrag
                            </p>

                            <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white mb-6 drop-shadow-md">
                                {quoteData.estimatedValue} <span className="text-5xl sm:text-7xl font-bold text-blue-300 ml-[-0.2em]">€</span>
                            </div>

                            {countdown && (
                                <div className="inline-flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold mx-auto">
                                    <ShieldCheck size={18} className="text-emerald-300" /> Preis gültig für: {countdown}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 pt-8 border-t border-white/20">
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-100 uppercase tracking-wider">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Wallet size={18} /></div>
                                    Schnelle Auszahlung
                                </div>
                                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-100 uppercase tracking-wider">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Truck size={18} /></div>
                                    Gratis Versand
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4 mt-6">
                            <button
                                onClick={() => navigate('/')}
                                className="py-5 rounded-2xl font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                            >
                                {t('common.cancel') || 'Nein, danke'}
                            </button>
                            <button
                                onClick={handleSubmitQuote}
                                disabled={loading}
                                className="relative py-5 bg-emerald-500 rounded-2xl font-black text-white hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                <span className="text-lg">{loading ? (t('common.loading') || 'Wird gespeichert...') : (t('valuation.saveValuation') || 'Angebot annehmen')}</span>
                                {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>

                        <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Wie geht es weiter?</p>
                            <div className="flex items-center justify-between gap-2">
                                {[
                                    { icon: '✅', label: 'Angebot annehmen' },
                                    { icon: '📦', label: 'Gerät einsenden' },
                                    { icon: '💰', label: 'Geld erhalten' }
                                ].map((s, i) => (
                                    <React.Fragment key={s.label}>
                                        <div className="flex flex-col items-center gap-1.5 text-center flex-1">
                                            <span className="text-2xl">{s.icon}</span>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.label}</span>
                                        </div>
                                        {i < 2 && <div className="w-6 h-px bg-slate-300 dark:bg-slate-700 flex-shrink-0" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </AppFrame>
        </div>
    );
};
