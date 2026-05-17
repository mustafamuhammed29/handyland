import React from 'react';
import { AlertTriangle, X, Loader2, ShieldCheck } from 'lucide-react';
import { maskIban } from '../../utils/ibanUtils';

interface ConfirmModalProps {
    formData: {
        fullName: string;
        bankName: string;
        iban: string;
    };
    quote: any;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: () => void;
    t: any;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ formData, quote, isSubmitting, onClose, onSubmit, t }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg font-bold">{t('sellDevice.checkBankDetails')}</h3>
                    </div>
                    <button onClick={onClose} title={t('common.close')} className="text-slate-500 hover:text-slate-900 dark:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                    {t('sellDevice.verifyBankWarning')}
                </p>
                <div className="bg-slate-950 rounded-xl p-4 mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-500">{t('sellDevice.fullName')}:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Shop Adresse:</span>
                        <span className="text-slate-900 dark:text-white text-right">Walldorfer Str. 13, 69168 Wiesloch</span>
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">{t('sellDevice.bankName')}:</span>
                        <span className="text-slate-900 dark:text-white font-medium">{formData.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">{t('sellDevice.ibanLabel')}:</span>
                        <span className="text-slate-900 dark:text-white font-mono text-xs">{maskIban(formData.iban)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Auszahlung:</span>
                        <span className="text-emerald-400 font-bold">€{quote?.price}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                    >
                        {t('sellDevice.backBtn')}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        {isSubmitting ? t('sellDevice.processing') : t('sellDevice.confirmBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};
