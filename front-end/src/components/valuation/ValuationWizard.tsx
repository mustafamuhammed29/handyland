import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { AppFrame } from './AppFrame';

export const ValuationWizard = ({
    t,
    step,
    selectedDevice,
    formData,
    setFormData,
    handleNextStep,
    screenConditions,
    bodyConditions,
    handleCalculateOffer,
    loading,
    mode,
    quoteData,
    handlePrevStep,
    displayPrice
}: any) => {
    return (
        <div className="w-full max-w-5xl mx-auto z-10">
            <AppFrame
                title={selectedDevice?.modelName || 'Bewertung'}
                subtitle="Ermittle deinen Preis in Sekunden"
                mode={mode}
                quoteData={quoteData}
                handlePrevStep={handlePrevStep}
                step={step}
                displayPrice={displayPrice}
            >
                <div className="max-w-4xl mx-auto duration-200">
                    {step === 1 && (
                        <div className="py-4">
                            <h2 className="text-3xl md:text-4xl font-black mb-10 text-slate-900 dark:text-white text-center tracking-tight">
                                {t('valuation.step2')}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {(selectedDevice?.validStorages || ['128 GB', '256 GB', '512 GB']).map((s: string) => (
                                    <button
                                        key={s}
                                        onClick={() => { setFormData({ ...formData, storage: s }); handleNextStep(); }}
                                        className={`relative p-8 rounded-[2rem] border-2 text-center transition-all overflow-hidden hover:scale-[1.01] ${formData.storage === s
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                                            }`}
                                    >
                                        {formData.storage === s && (
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600" />
                                        )}
                                        <span className={`text-2xl font-black ${formData.storage === s ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {s}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="py-4">
                            <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 dark:text-white text-center tracking-tight">
                                {t('valuation.step3')}
                            </h2>
                            <p className="text-center text-slate-400 text-sm mb-8">Halte das Gerät bei guter Beleuchtung und prüfe den Bildschirm sorgfältig.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {screenConditions.map((c: any) => {
                                    const icons: Record<string, string> = { hervorragend: '✨', sehr_gut: '🟢', gut: '🟡', beschadigt: '🔴' };
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => { setFormData({ ...formData, screenCondition: c.id }); handleNextStep(); }}
                                            className={`p-6 rounded-[2rem] border-2 text-left bg-white dark:bg-slate-900 transition-all hover:scale-[1.01] shadow-sm flex flex-col items-start gap-3 relative overflow-hidden ${formData.screenCondition === c.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{icons[c.id] || '📱'}</span>
                                                    <h3 className={`font-black text-xl ${formData.screenCondition === c.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{c.title}</h3>
                                                </div>
                                                {formData.screenCondition === c.id ? (
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm"><CheckCircle2 size={20} /></div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{c.desc}</p>
                                            {formData.screenCondition === c.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="py-4">
                            <h2 className="text-3xl md:text-4xl font-black mb-3 text-slate-900 dark:text-white text-center tracking-tight">
                                {t('valuation.step4BodyTitle') || 'Wie ist der Zustand des Gehäuses?'}
                            </h2>
                            <p className="text-center text-slate-400 text-sm mb-8">Rahmen, Rückseite und Kanten — prüfe auf Kratzer, Dellen und Risse.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {bodyConditions.map((c: any) => {
                                    const icons: Record<string, string> = { hervorragend: '💎', sehr_gut: '🟢', gut: '🟡', beschadigt: '🔴' };
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => { setFormData({ ...formData, bodyCondition: c.id }); handleNextStep(); }}
                                            className={`p-6 rounded-[2rem] border-2 text-left bg-white dark:bg-slate-900 transition-all hover:scale-[1.01] shadow-sm flex items-start gap-4 justify-between relative overflow-hidden ${formData.bodyCondition === c.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                        >
                                            {formData.bodyCondition === c.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />}
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-0.5">{icons[c.id] || '📱'}</span>
                                                <div>
                                                    <h3 className={`font-black text-xl mb-2 ${formData.bodyCondition === c.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{c.title}</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{c.desc}</p>
                                                </div>
                                            </div>
                                            {formData.bodyCondition === c.id ? (
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1"><CheckCircle2 size={20} /></div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0 mt-1" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="py-4">
                            <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900 dark:text-white text-center tracking-tight">
                                {t('valuation.step5FuncTitle') || 'Funktioniert dein Gerät einwandfrei?'}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 text-center max-w-2xl mx-auto leading-relaxed">
                                Kameras, Lautsprecher, Mikrofone und Tasten arbeiten fehlerfrei. Das Gerät ist auf Werkseinstellungen zurückgesetzt und jegliche Kontosperren (z.B. iCloud/Google) sind entfernt.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                <button
                                    onClick={() => handleCalculateOffer(true)}
                                    disabled={loading}
                                    className="relative p-10 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] text-center transition-all group disabled:opacity-50 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors shadow-inner">
                                            <CheckCircle2 className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Ja</h3>
                                        <p className="text-slate-500 font-medium">100% Funktionalität</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleCalculateOffer(false)}
                                    disabled={loading}
                                    className="relative p-10 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-500 dark:hover:border-red-500 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:scale-[1.02] text-center transition-all group disabled:opacity-50 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-red-50 dark:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors shadow-inner">
                                            <Zap className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-red-500 transition-colors pointer-events-none" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Nein</h3>
                                        <p className="text-slate-500 font-medium">Teildefekt oder gesperrt</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </AppFrame>
        </div>
    );
};
