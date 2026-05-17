import React from 'react';
import { MapPin, Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface AddressStepProps {
    onPrev: () => void;
    onNext: () => void;
    t: any;
}

export const AddressStep: React.FC<AddressStepProps> = ({ onPrev, onNext, t }) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                    <MapPin className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Versandadresse (HandyLand Shop)</h3>
            </div>
            <div className="bg-slate-950/50 border border-slate-700 rounded-xl p-6 text-center shadow-inner">
                <p className="text-slate-700 dark:text-slate-300 mb-6">Bitte verpacken Sie Ihr Gerät sicher und senden Sie es direkt an unseren Shop. Wir bearbeiten es sofort nach Erhalt der Sendung.</p>
                <div className="bg-slate-900 border border-brand-primary/30 p-6 rounded-xl inline-block text-left text-slate-900 dark:text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 blur-2xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-3 border-b border-slate-800 pb-3 relative z-10">
                        <div className="p-2 bg-brand-primary/20 rounded-lg">
                            <Home className="w-5 h-5 text-brand-primary" />
                        </div>
                        <p className="font-bold text-xl text-brand-primary tracking-wide">HandyLand</p>
                    </div>
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300 relative z-10">
                        <p className="font-medium text-slate-900 dark:text-white">z.H. Ankauf-Abteilung</p>
                        <p>Walldorfer Straße 13</p>
                        <p>69168 Wiesloch</p>
                    </div>
                </div>
                <p className="text-sm text-amber-500/80 font-medium mt-6">Tipp: Versenden Sie das Gerät zwingend als versichertes Paket (z.B. mit DHL), damit Sie eine Sendungsnummer erhalten.</p>
            </div>
            <div className="flex gap-4 mt-8">
                <button type="button" onClick={onPrev} title={t('sellDevice.backBtn', 'Zurück')} className="py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-bold transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button type="button" onClick={onNext} className="flex-1 py-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-slate-900 font-bold text-lg transition-all flex items-center justify-center gap-2">
                    Weiter zur Auszahlung <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
