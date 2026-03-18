import React from 'react';
import { LanguageCode } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useValuation } from '../hooks/useValuation';
import { ValuationLanding } from './valuation/ValuationLanding';
import { ValuationWizard } from './valuation/ValuationWizard';
import { ValuationResult } from './valuation/ValuationResult';

interface ValuationProps {
    lang: LanguageCode;
}

export const Valuation: React.FC<ValuationProps> = ({ lang }) => {
    const valuation = useValuation();
    const { settings } = useSettings();

    const screenConditions = settings?.valuation?.screenConditions || [
        { id: 'hervorragend', title: 'Hervorragend', desc: 'Keine sichtbaren Kratzer. Wie neu.' },
        { id: 'sehr_gut', title: 'Sehr Gut', desc: 'Leichte Gebrauchsspuren, nicht sichtbar aus 20 cm.' },
        { id: 'gut', title: 'Gut', desc: 'Sichtbare Kratzer, kein Riss.' },
        { id: 'beschadigt', title: 'Beschädigt', desc: 'Risse, gebrochenes Glas oder defekte Pixel.' }
    ];

    const bodyConditions = settings?.valuation?.bodyConditions || [
        { id: 'hervorragend', title: 'Hervorragend', desc: 'Keine sichtbaren Gebrauchsspuren, wie neu aus der Box.' },
        { id: 'sehr_gut', title: 'Sehr Gut', desc: 'Leichte Spuren die bei normalem Abstand nicht sichtbar sind.' },
        { id: 'gut', title: 'Gut', desc: 'Sichtbare Kratzer oder leichte Gebrauchsspuren, keine Dellen.' },
        { id: 'beschadigt', title: 'Beschädigt', desc: 'Tiefe Kratzer, Risse auf der Rückseite oder Dellen am Rahmen.' }
    ];

    const brands = ['all', ...Array.from(new Set(valuation.apiDevices.map(d => d.brand).filter(Boolean)))];

    const filteredDevices = valuation.apiDevices.filter(device => {
        const matchSearch = (device.modelName?.toLowerCase() || '').includes(valuation.searchTerm.toLowerCase()) ||
            (device.brand?.toLowerCase() || '').includes(valuation.searchTerm.toLowerCase());
        const matchBrand = valuation.brandFilter === 'all' || device.brand === valuation.brandFilter;
        return matchSearch && matchBrand;
    });

    const popularModels = valuation.apiDevices.slice(0, 6).map(d => d.modelName);

    return (
        <div className="py-24 px-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-[#0a0f1c] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full point-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full point-events-none" />

            {/* LANDING UI */}
            {valuation.mode === 'landing' && (
                <ValuationLanding
                    {...valuation}
                    brands={brands}
                    filteredDevices={filteredDevices}
                    popularModels={popularModels}
                />
            )}

            {/* WIZARD UI */}
            {valuation.mode === 'wizard' && !valuation.quoteData && (
                <ValuationWizard
                    {...valuation}
                    screenConditions={screenConditions}
                    bodyConditions={bodyConditions}
                />
            )}

            {/* WIZARD RESULT */}
            {valuation.mode === 'wizard' && valuation.quoteData && (
                <ValuationResult {...valuation} />
            )}
        </div>
    );
};

