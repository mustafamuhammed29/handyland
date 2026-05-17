import React from 'react';
import { User, ArrowRight } from 'lucide-react';

interface ContactStepProps {
    formData: {
        fullName: string;
        email: string;
    };
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNext: () => void;
    t: any;
}

export const ContactStep: React.FC<ContactStepProps> = ({ formData, errors, handleChange, onNext, t }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/30">
                    <User className="w-7 h-7 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('sellDevice.contactInfo')}</h3>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vollständiger Name</label>
                    <input
                        name="fullName"
                        required
                        placeholder="Vor- und Nachname"
                        value={formData.fullName}
                        className={`w-full bg-slate-950/50 border ${errors.fullName ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                        onChange={handleChange}
                    />
                    {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-Mail</label>
                    <input
                        name="email"
                        required
                        type="email"
                        placeholder="ihre@email.de"
                        value={formData.email}
                        className={`w-full bg-slate-950/50 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all`}
                        onChange={handleChange}
                    />
                    {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                </div>
            </div>
            <button type="button" onClick={onNext} className="w-full py-4 mt-8 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold text-lg transition-all flex items-center justify-center gap-2">
                Weiter zur Adresse <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
};
