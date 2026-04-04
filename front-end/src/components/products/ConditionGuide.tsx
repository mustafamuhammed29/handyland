import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShieldCheck, Wrench, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConditionGuideProps {
    isOpen: boolean;
    onClose: () => void;
    currentCondition?: string; // Optional: highlight the selected product's condition
}

export const ConditionGuide: React.FC<ConditionGuideProps> = ({ isOpen, onClose, currentCondition }) => {
    const { t } = useTranslation();

    const conditions = [
        {
            id: 'excellent',
            title: t('marketplace.condition.excellent', 'Excellent'),
            icon: Sparkles,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            description: t('condition.excellent.desc', 'Wie-neu-Zustand. Bildschirm und Gehäuse sind makellos, keine sichtbaren Kratzer aus 20 cm Entfernung.'),
            battery: "> 85%",
            highlights: [t('condition.excellent.h1', 'Makelloser Bildschirm'), t('condition.excellent.h2', 'Einwandfreies Gehäuse'), t('condition.excellent.h3', 'Vollständig geprüft')]
        },
        {
            id: 'good',
            title: t('marketplace.condition.good', 'Good'),
            icon: ShieldCheck,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            description: t('condition.good.desc', 'Leichte Gebrauchsspuren. Mögliche Mikrokratzer auf Gehäuse oder Bildschirm, unsichtbar bei eingeschaltetem Display.'),
            battery: "> 80%",
            highlights: [t('condition.good.h1', 'Nur Mikrokratzer'), t('condition.good.h2', 'Unsichtbar bei AN'), t('condition.good.h3', 'Vollständig geprüft')]
        },
        {
            id: 'fair',
            title: t('marketplace.condition.used', 'Fair'),
            icon: Wrench,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/30',
            description: t('condition.fair.desc', 'Sichtbare Gebrauchsspuren. Erkennbare Kratzer oder kleine Dellen, aber 100% voll funktionsfähig.'),
            battery: "> 80%",
            highlights: [t('condition.fair.h1', 'Sichtbare Gebrauchsspuren'), t('condition.fair.h2', 'Bestes Preis-Leistungs-Verhältnis'), t('condition.fair.h3', 'Vollständig geprüft')]
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl md:rounded-3xl w-full max-w-2xl overflow-hidden relative z-10"
                    >
                        <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-primary/10 to-transparent blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 sm:p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
                                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t('condition.guideTitle', 'Zustandsübersicht')}</h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t('condition.guideSubtitle', 'Was bedeuten unsere Zustandsstufen?')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close Condition Guide"
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 relative z-10"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <p className="text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 text-sm sm:text-base leading-relaxed">
                                {t('condition.guideIntro', 'Jedes Gerät, das wir verkaufen, durchläuft eine strenge 40-Punkte-Inspektion. Die folgenden Zustandsstufen beziehen sich')} <strong>{t('condition.guideIntroStrong', 'ausschließlich auf das kosmetische Erscheinungsbild')}</strong>{t('condition.guideIntroEnd', ' des Geräts. Alle Geräte sind 100% voll funktionsfähig.')}
                            </p>

                            <div className="space-y-4 sm:space-y-6">
                                {conditions.map((cond) => {
                                    const Icon = cond.icon;
                                    const isCurrent = currentCondition?.toLowerCase() === cond.id;
                                    
                                    return (
                                        <div 
                                            key={cond.id} 
                                            className={`relative p-5 sm:p-6 rounded-2xl border transition-all ${
                                                isCurrent 
                                                ? `bg-slate-50 dark:bg-slate-800/50 ${cond.border} shadow-lg ring-1 ring-${cond.color.split('-')[1]}-500/50`
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            {isCurrent && (
                                                <div className={`absolute -top-3 sm:-top-4 right-4 sm:right-6 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-gradient-to-r ${cond.bg} border ${cond.border} ${cond.color} shadow-sm backdrop-blur-md`}>
                                                    {t('condition.thisDevice', 'Dieses Gerät')}
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cond.bg} ${cond.color} border ${cond.border}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{cond.title}</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">{cond.description}</p>
                                                    
                                                    <div className="flex flex-wrap gap-2">
                                                        {cond.highlights.map((highlight, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${cond.color.replace('text-', 'bg-')}`} />
                                                                {highlight}
                                                            </span>
                                                        ))}
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                {t('condition.battery', 'Akku')}: {cond.battery}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
                             <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-brand-primary/25"
                            >
                                {t('condition.gotIt', 'Verstanden, danke!')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
