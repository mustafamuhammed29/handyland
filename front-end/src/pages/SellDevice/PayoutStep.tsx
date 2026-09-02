import React from 'react';
import { CreditCard, CheckCircle2, Truck, ArrowLeft, ShieldCheck } from 'lucide-react';
import { validateIban } from '../../utils/ibanUtils';
import { useTranslation } from "react-i18next";

interface PayoutStepProps {
    formData: {
        bankName: string;
        iban: string;
    };
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPrev: () => void;
    t: any;
}

export const PayoutStep: React.FC<PayoutStepProps> = ({ formData, errors, handleChange, onPrev, t }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <CreditCard className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('sellDevice.checkBankDetails', 'Bankverbindung & Auszahlung')}</h3>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">{t('sellDevice.bankName', 'Bankname')}</label>
                    <input
                        name="bankName"
                        placeholder="z.B. Sparkasse, Deutsche Bank, N26"
                        value={formData.bankName}
                        className={`w-full bg-slate-950/50 border ${errors.bankName ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                        onChange={handleChange}
                    />
                    {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">{t('sellDevice.ibanLabel', 'IBAN')}</label>
                    <div className="relative">
                        <input
                            name="iban"
                            placeholder="DE00 0000 0000 0000 0000 00"
                            value={formData.iban}
                            className={`w-full bg-slate-950/50 border ${errors.iban ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all uppercase`}
                            onChange={handleChange}
                        />
                        {formData.iban && !errors.iban && validateIban(formData.iban, t).valid && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                        )}
                    </div>
                    {errors.iban && <p className="text-red-400 text-xs mt-1">{errors.iban}</p>}
                </div>
            </div>
            
            <div className="mt-8 bg-slate-950/80 p-5 rounded-xl border border-slate-800 flex items-start gap-4">
                <div className="p-2 bg-brand-primary/10 rounded-lg shrink-0">
                    <Truck className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    <p className="text-slate-900 dark:text-white font-bold mb-0.5">{t('sellDevice.freeShipping', 'Kostenloser versicherter DHL-Versand')}</p>
                    {t('sellDevice.freeShippingDesc', { hours: 48 })}
                </div>
            </div>

            <div className="flex gap-4 mt-6">
                <button type="button" onClick={onPrev} title={t('sellDevice.backBtn', 'Zurück')} className="py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-all cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button type={t('submit')} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-emerald-950 font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <ShieldCheck className="w-5 h-5" /> {t('sellDevice.completeOrder', 'Verkauf verbindlich abschließen')}
                </button>
            </div>
        </div>
    );
};
