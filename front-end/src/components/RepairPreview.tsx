import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

export const RepairPreview: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { settings } = useSettings();

    // Fallback to defaults if not present
    const repairTypes = settings?.repairPreviewCards || [
        {
            iconName: 'Monitor',
            label: 'Displayreparatur',
            price: 'ab €49',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
        },
        {
            iconName: 'Battery',
            label: 'Akkutausch',
            price: 'ab €39',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
        {
            iconName: 'Smartphone',
            label: 'Ladebuchse',
            price: 'ab €29',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
        },
        {
            iconName: 'Wrench',
            label: 'Diagnose',
            price: 'Kostenlos',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
        },
    ];

    const getIcon = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Monitor;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <section className="py-12 md:py-16 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400 mb-1">
                            {t('repair.previewTagline', 'Service Terminal')}
                        </p>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                            {t('repair.previewTitle', 'Professionelle Reparaturen')}
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/repair')}
                        className="flex items-center gap-1.5 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors group shrink-0 ml-4"
                    >
                        {t('repair.seeAll', 'Alle Services')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Repair Types Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {repairTypes.map((r, i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center text-center p-4 md:p-5 rounded-2xl ${r.bg} border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all`}
                        >
                            <span className={`${r.color} mb-3`}>{getIcon(r.iconName)}</span>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-1">{r.label}</p>
                            <p className={`text-xs font-mono font-bold ${r.color}`}>{r.price}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Banner */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-white mb-1">
                                {t('repair.ctaTitle', 'Kostenlose Diagnose für dein Gerät')}
                            </h3>
                            <p className="text-sm text-blue-200">
                                {t('repair.ctaDesc', 'Wir reparieren alle Marken — iPhone, Samsung, Huawei & mehr.')}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/repair')}
                            className="shrink-0 flex items-center gap-2 bg-white text-blue-600 font-black px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg min-h-[44px] text-sm"
                        >
                            {t('repair.bookNow', 'Jetzt buchen')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
