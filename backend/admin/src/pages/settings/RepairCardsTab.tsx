import React, { useState } from 'react';
import {
    Wrench,
    Monitor,
    Battery,
    Smartphone,
    Camera,
    Zap,
    Shield,
    Headphones,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    AlertTriangle,
    Eye,
    Globe,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Toggle } from '../SettingsManager';

type Language = 'de' | 'en' | 'ar';

interface LocalizedText {
    de: string;
    en: string;
    ar: string;
}

type ServiceTerminalIcon =
    | 'monitor'
    | 'battery'
    | 'smartphone'
    | 'wrench'
    | 'camera'
    | 'zap'
    | 'shield'
    | 'headphones';

interface ServiceItem {
    id: string;
    enabled: boolean;
    title: LocalizedText;
    priceLabel: LocalizedText;
    icon: ServiceTerminalIcon;
    iconColor: string;
    cardBackground: string;
    order: number;
}

interface ServiceTerminalSettings {
    enabled: boolean;
    eyebrow: LocalizedText;
    title: LocalizedText;
    servicesLinkLabel: LocalizedText;
    servicesLinkUrl: string;
    services: ServiceItem[];
    cta: {
        enabled: boolean;
        title: LocalizedText;
        description: LocalizedText;
        buttonLabel: LocalizedText;
        buttonUrl: string;
    };
}

const DEFAULT_SERVICE_TERMINAL: ServiceTerminalSettings = {
    enabled: true,
    eyebrow: {
        de: 'SERVICE TERMINAL',
        en: 'SERVICE TERMINAL',
        ar: 'محطة الخدمات',
    },
    title: {
        de: 'Professionelle Reparaturen',
        en: 'Professional Repairs',
        ar: 'إصلاحات احترافية',
    },
    servicesLinkLabel: {
        de: 'Alle Services',
        en: 'All Services',
        ar: 'كل الخدمات',
    },
    servicesLinkUrl: '/repair',
    services: [
        {
            id: 'display',
            enabled: true,
            title: {
                de: 'Displayreparatur',
                en: 'Screen Repair',
                ar: 'إصلاح الشاشة',
            },
            priceLabel: {
                de: 'ab €149',
                en: 'from €149',
                ar: 'ابتداءً من 149€',
            },
            icon: 'monitor',
            iconColor: '#22d3ee',
            cardBackground: '#062033',
            order: 1,
        },
        {
            id: 'battery',
            enabled: true,
            title: {
                de: 'Akkutausch',
                en: 'Battery Replacement',
                ar: 'تبديل البطارية',
            },
            priceLabel: {
                de: 'ab €39',
                en: 'from €39',
                ar: 'ابتداءً من 39€',
            },
            icon: 'battery',
            iconColor: '#34d399',
            cardBackground: '#06252a',
            order: 2,
        },
        {
            id: 'charging-port',
            enabled: true,
            title: {
                de: 'Ladebuchse',
                en: 'Charging Port',
                ar: 'منفذ الشحن',
            },
            priceLabel: {
                de: 'ab €29',
                en: 'from €29',
                ar: 'ابتداءً من 29€',
            },
            icon: 'smartphone',
            iconColor: '#fbbf24',
            cardBackground: '#211817',
            order: 3,
        },
        {
            id: 'diagnosis',
            enabled: true,
            title: {
                de: 'Diagnose',
                en: 'Diagnostics',
                ar: 'تشخيص',
            },
            priceLabel: {
                de: 'Kostenlos',
                en: 'Free',
                ar: 'مجاناً',
            },
            icon: 'wrench',
            iconColor: '#c084fc',
            cardBackground: '#160d35',
            order: 4,
        },
    ],
    cta: {
        enabled: true,
        title: {
            de: 'Kostenlose Diagnose für dein Gerät',
            en: 'Free diagnosis for your device',
            ar: 'تشخيص مجاني لجهازك',
        },
        description: {
            de: 'Wir reparieren alle Marken – iPhone, Samsung, Huawei & mehr.',
            en: 'We repair all brands – iPhone, Samsung, Huawei & more.',
            ar: 'نصلح جميع العلامات التجارية – iPhone وSamsung وHuawei والمزيد.',
        },
        buttonLabel: {
            de: 'Jetzt buchen',
            en: 'Book now',
            ar: 'احجز الآن',
        },
        buttonUrl: '/repair',
    },
};

const ICON_OPTIONS: { value: ServiceTerminalIcon; label: string; icon: React.ElementType }[] = [
    { value: 'monitor', label: 'Monitor / Display', icon: Monitor },
    { value: 'battery', label: 'Battery / Akku', icon: Battery },
    { value: 'smartphone', label: 'Smartphone / Phone', icon: Smartphone },
    { value: 'wrench', label: 'Wrench / Repair', icon: Wrench },
    { value: 'camera', label: 'Camera / Sensor', icon: Camera },
    { value: 'zap', label: 'Zap / Power', icon: Zap },
    { value: 'shield', label: 'Shield / Security', icon: Shield },
    { value: 'headphones', label: 'Headphones / Audio', icon: Headphones },
];

const ICON_MAP: Record<ServiceTerminalIcon, React.ElementType> = {
    monitor: Monitor,
    battery: Battery,
    smartphone: Smartphone,
    wrench: Wrench,
    camera: Camera,
    zap: Zap,
    shield: Shield,
    headphones: Headphones,
};

interface Props {
    settings: any;
    handleChange: (section: any, key: string, value: any) => void;
}

export const RepairCardsTab: React.FC<Props> = ({ settings, handleChange }) => {
    const [selectedLang, setSelectedLang] = useState<Language>('de');
    const [ctaOpen, setCtaOpen] = useState(true);
    const [localNotice, setLocalNotice] = useState<string | null>(null);

    // Deep merge incoming serviceTerminal with defaults
    const currentSettings: ServiceTerminalSettings = React.useMemo(() => {
        const raw = settings?.serviceTerminal;
        if (!raw || typeof raw !== 'object') {
            return DEFAULT_SERVICE_TERMINAL;
        }

        const mergeLoc = (def: LocalizedText, inc?: any): LocalizedText => ({
            de: typeof inc?.de === 'string' ? inc.de : def.de,
            en: typeof inc?.en === 'string' ? inc.en : def.en,
            ar: typeof inc?.ar === 'string' ? inc.ar : def.ar,
        });

        const services: ServiceItem[] = Array.isArray(raw.services)
            ? raw.services.map((s: any, idx: number) => {
                const defItem = DEFAULT_SERVICE_TERMINAL.services[idx] || DEFAULT_SERVICE_TERMINAL.services[0];
                return {
                    id: typeof s?.id === 'string' && s.id.trim() ? s.id : `service-${idx + 1}`,
                    enabled: typeof s?.enabled === 'boolean' ? s.enabled : true,
                    title: mergeLoc(defItem.title, s?.title),
                    priceLabel: mergeLoc(defItem.priceLabel, s?.priceLabel),
                    icon: (['monitor', 'battery', 'smartphone', 'wrench', 'camera', 'zap', 'shield', 'headphones'].includes(s?.icon)
                        ? s.icon
                        : defItem.icon) as ServiceTerminalIcon,
                    iconColor: typeof s?.iconColor === 'string' && s.iconColor.trim() ? s.iconColor : defItem.iconColor,
                    cardBackground: typeof s?.cardBackground === 'string' && s.cardBackground.trim() ? s.cardBackground : defItem.cardBackground,
                    order: typeof s?.order === 'number' ? s.order : idx + 1,
                };
            })
            : DEFAULT_SERVICE_TERMINAL.services;

        return {
            enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SERVICE_TERMINAL.enabled,
            eyebrow: mergeLoc(DEFAULT_SERVICE_TERMINAL.eyebrow, raw.eyebrow),
            title: mergeLoc(DEFAULT_SERVICE_TERMINAL.title, raw.title),
            servicesLinkLabel: mergeLoc(DEFAULT_SERVICE_TERMINAL.servicesLinkLabel, raw.servicesLinkLabel),
            servicesLinkUrl: typeof raw.servicesLinkUrl === 'string' && raw.servicesLinkUrl.trim()
                ? raw.servicesLinkUrl
                : DEFAULT_SERVICE_TERMINAL.servicesLinkUrl,
            services: services.sort((a, b) => (a.order || 0) - (b.order || 0)),
            cta: {
                enabled: typeof raw.cta?.enabled === 'boolean' ? raw.cta.enabled : DEFAULT_SERVICE_TERMINAL.cta.enabled,
                title: mergeLoc(DEFAULT_SERVICE_TERMINAL.cta.title, raw.cta?.title),
                description: mergeLoc(DEFAULT_SERVICE_TERMINAL.cta.description, raw.cta?.description),
                buttonLabel: mergeLoc(DEFAULT_SERVICE_TERMINAL.cta.buttonLabel, raw.cta?.buttonLabel),
                buttonUrl: typeof raw.cta?.buttonUrl === 'string' && raw.cta.buttonUrl.trim()
                    ? raw.cta.buttonUrl
                    : DEFAULT_SERVICE_TERMINAL.cta.buttonUrl,
            },
        };
    }, [settings?.serviceTerminal]);

    const updateState = (updated: ServiceTerminalSettings) => {
        setLocalNotice(null);
        handleChange(null, 'serviceTerminal', updated);
    };

    // Validation checks
    const validationErrors: string[] = React.useMemo(() => {
        const errors: string[] = [];
        const ids = new Set<string>();

        if (currentSettings.services.length === 0) {
            errors.push('At least one service must be present.');
        }

        currentSettings.services.forEach((s, idx) => {
            if (!s.id || !s.id.trim()) {
                errors.push(`Service #${idx + 1} has an empty ID/slug.`);
            } else if (ids.has(s.id.trim())) {
                errors.push(`Duplicate service ID detected: "${s.id}". IDs must be unique.`);
            } else {
                ids.add(s.id.trim());
            }

            if (!s.title[selectedLang] || !s.title[selectedLang].trim()) {
                errors.push(`Service #${idx + 1} (${s.id || 'unnamed'}) is missing a title in ${selectedLang.toUpperCase()}.`);
            }

            if (s.iconColor && !s.iconColor.startsWith('#') && !s.iconColor.startsWith('rgb')) {
                errors.push(`Service #${idx + 1} has an invalid icon color format.`);
            }
            if (s.cardBackground && !s.cardBackground.startsWith('#') && !s.cardBackground.startsWith('rgb')) {
                errors.push(`Service #${idx + 1} has an invalid card background color format.`);
            }
        });

        const isUnsafeUrl = (url?: string) => {
            if (!url) return false;
            const lower = url.trim().toLowerCase();
            return lower.startsWith('javascript:') || lower.startsWith('data:');
        };

        if (isUnsafeUrl(currentSettings.servicesLinkUrl)) {
            errors.push('Services link URL contains an unsafe protocol (javascript:/data:).');
        }
        if (isUnsafeUrl(currentSettings.cta.buttonUrl)) {
            errors.push('CTA button URL contains an unsafe protocol (javascript:/data:).');
        }

        return errors;
    }, [currentSettings, selectedLang]);

    // Service item modifiers
    const handleHeaderChange = (field: 'eyebrow' | 'title' | 'servicesLinkLabel', val: string) => {
        updateState({
            ...currentSettings,
            [field]: {
                ...currentSettings[field],
                [selectedLang]: val,
            },
        });
    };

    const handleServiceChange = (index: number, field: keyof ServiceItem, value: any) => {
        const newServices = [...currentSettings.services];
        if (field === 'title' || field === 'priceLabel') {
            newServices[index] = {
                ...newServices[index],
                [field]: {
                    ...newServices[index][field],
                    [selectedLang]: value,
                },
            };
        } else {
            newServices[index] = {
                ...newServices[index],
                [field]: value,
            };
        }
        updateState({ ...currentSettings, services: newServices });
    };

    const addService = () => {
        if (currentSettings.services.length >= 8) {
            alert('A maximum of 8 services is allowed for the Service Terminal section.');
            return;
        }
        const nextOrder = currentSettings.services.length + 1;
        const newId = `service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const newService: ServiceItem = {
            id: newId,
            enabled: true,
            title: { de: 'Neuer Service', en: 'New Service', ar: 'خدمة جديدة' },
            priceLabel: { de: 'ab €49', en: 'from €49', ar: 'ابتداءً من 49€' },
            icon: 'wrench',
            iconColor: '#22d3ee',
            cardBackground: '#062033',
            order: nextOrder,
        };
        updateState({
            ...currentSettings,
            services: [...currentSettings.services, newService],
        });
    };

    const removeService = (index: number) => {
        if (currentSettings.services.length <= 1) {
            alert('You cannot delete the last service item. Disable it instead if not needed.');
            return;
        }
        const confirmed = window.confirm(`Are you sure you want to delete service "${currentSettings.services[index].title[selectedLang] || currentSettings.services[index].id}"?`);
        if (!confirmed) return;

        const filtered = currentSettings.services
            .filter((_, idx) => idx !== index)
            .map((s, idx) => ({ ...s, order: idx + 1 }));

        updateState({ ...currentSettings, services: filtered });
    };

    const moveService = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentSettings.services.length) return;

        const newServices = [...currentSettings.services];
        const temp = newServices[index];
        newServices[index] = newServices[targetIndex];
        newServices[targetIndex] = temp;

        // Reassign orders cleanly
        const reordered = newServices.map((s, idx) => ({ ...s, order: idx + 1 }));
        updateState({ ...currentSettings, services: reordered });
    };

    const handleCtaChange = (field: 'title' | 'description' | 'buttonLabel', val: string) => {
        updateState({
            ...currentSettings,
            cta: {
                ...currentSettings.cta,
                [field]: {
                    ...currentSettings.cta[field],
                    [selectedLang]: val,
                },
            },
        });
    };

    const handleResetDefaults = () => {
        const confirmed = window.confirm('Are you sure you want to reset Service Terminal settings to system defaults? Any unsaved changes will be replaced.');
        if (!confirmed) return;

        updateState(DEFAULT_SERVICE_TERMINAL);
        setLocalNotice('Defaults restored locally. Please click "Save Changes" at the top to commit.');
    };

    const activeServicesCount = currentSettings.services.filter(s => s.enabled).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Service Terminal Configuration
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Home Page Section
                            </span>
                        </h3>
                        <p className="text-slate-400 text-sm mt-0.5">
                            Manage multilingual texts, prices, icons, card colors, reordering, and CTA for the Service Terminal showcase.
                        </p>
                    </div>
                </div>

                {/* Reset to Defaults */}
                <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <RotateCcw size={16} /> Reset to defaults
                </button>
            </div>

            {/* Local Notice */}
            {localNotice && (
                <div className="p-4 bg-blue-900/30 border border-blue-500/40 rounded-xl text-sm text-blue-300 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span>{localNotice}</span>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="p-4 bg-amber-900/20 border border-amber-500/40 rounded-xl text-sm text-amber-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                        <AlertTriangle size={16} /> Configuration Warnings ({validationErrors.length})
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-200/90">
                        {validationErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Language Switcher Bar */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Globe size={16} className="text-cyan-400" />
                    <span>Active Editing Language:</span>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0" role="tablist" aria-label="Language selection">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={selectedLang === 'de'}
                        onClick={() => setSelectedLang('de')}
                        className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            selectedLang === 'de'
                                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        <span>🇩🇪</span> Deutsch (DE)
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={selectedLang === 'en'}
                        onClick={() => setSelectedLang('en')}
                        className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            selectedLang === 'en'
                                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        <span>🇬🇧</span> English (EN)
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={selectedLang === 'ar'}
                        onClick={() => setSelectedLang('ar')}
                        className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            selectedLang === 'ar'
                                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        <span>🇸🇦</span> العربية (AR)
                    </button>
                </div>
            </div>

            {/* Live Preview Container */}
            <div className="border border-slate-700/80 rounded-2xl bg-slate-950/60 p-5 md:p-6 overflow-hidden shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                        <Eye size={16} /> Live Preview ({selectedLang.toUpperCase()})
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Updates in real time — non-interactive mockup
                    </span>
                </div>

                <div
                    aria-label="Service Terminal preview"
                    dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative transition-all"
                >
                    {/* Header preview */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400 mb-1">
                                {currentSettings.eyebrow[selectedLang] || DEFAULT_SERVICE_TERMINAL.eyebrow[selectedLang]}
                            </p>
                            <h4 className="text-xl font-black text-white">
                                {currentSettings.title[selectedLang] || DEFAULT_SERVICE_TERMINAL.title[selectedLang]}
                            </h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-cyan-400">
                            <span>{currentSettings.servicesLinkLabel[selectedLang] || DEFAULT_SERVICE_TERMINAL.servicesLinkLabel[selectedLang]}</span>
                            <ExternalLink size={12} />
                        </div>
                    </div>

                    {/* Cards grid preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {currentSettings.services
                            .filter(s => s.enabled)
                            .slice(0, 8)
                            .map((s, idx) => {
                                const IconComp = ICON_MAP[s.icon] || Wrench;
                                return (
                                    <div
                                        key={s.id || `preview-service-${idx}`}
                                        style={{ backgroundColor: s.cardBackground || '#062033' }}
                                        className="flex flex-col items-center text-center p-4 rounded-xl border border-white/10 shadow-sm transition-all"
                                    >
                                        <div
                                            style={{ color: s.iconColor || '#22d3ee' }}
                                            className="mb-2 p-2 rounded-lg bg-black/20"
                                        >
                                            <IconComp size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-white mb-1 truncate w-full">
                                            {s.title[selectedLang] || s.id}
                                        </p>
                                        <p
                                            style={{ color: s.iconColor || '#22d3ee' }}
                                            className="text-[11px] font-mono font-bold"
                                        >
                                            {s.priceLabel[selectedLang] || 'ab €0'}
                                        </p>
                                    </div>
                                );
                            })}
                    </div>

                    {/* CTA preview */}
                    {currentSettings.cta.enabled && (
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
                            <div>
                                <h5 className="font-black text-sm md:text-base mb-0.5">
                                    {currentSettings.cta.title[selectedLang] || DEFAULT_SERVICE_TERMINAL.cta.title[selectedLang]}
                                </h5>
                                <p className="text-xs text-blue-100/80">
                                    {currentSettings.cta.description[selectedLang] || DEFAULT_SERVICE_TERMINAL.cta.description[selectedLang]}
                                </p>
                            </div>
                            <span className="shrink-0 bg-white text-blue-600 font-bold px-4 py-2 rounded-lg text-xs shadow">
                                {currentSettings.cta.buttonLabel[selectedLang] || DEFAULT_SERVICE_TERMINAL.cta.buttonLabel[selectedLang]}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. General Section Settings */}
            <div className="p-5 md:p-6 border border-slate-700 rounded-2xl bg-slate-900/60 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h4 className="text-white font-bold text-base">1. Section General Settings</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Enable or disable the section and edit the header text.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300">Section Enabled</span>
                        <Toggle
                            label=""
                            value={currentSettings.enabled}
                            onChange={(val: boolean) => updateState({ ...currentSettings, enabled: val })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-300 text-xs font-bold mb-1.5">
                            Eyebrow Tagline ({selectedLang.toUpperCase()})
                        </label>
                        <input
                            type="text"
                            dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                            value={currentSettings.eyebrow[selectedLang] || ''}
                            onChange={(e) => handleHeaderChange('eyebrow', e.target.value)}
                            placeholder="e.g. SERVICE TERMINAL"
                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-300 text-xs font-bold mb-1.5">
                            Main Heading Title ({selectedLang.toUpperCase()})
                        </label>
                        <input
                            type="text"
                            dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                            value={currentSettings.title[selectedLang] || ''}
                            onChange={(e) => handleHeaderChange('title', e.target.value)}
                            placeholder="e.g. Professionelle Reparaturen"
                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-slate-300 text-xs font-bold mb-1.5">
                            Services Link Label ({selectedLang.toUpperCase()})
                        </label>
                        <input
                            type="text"
                            dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                            value={currentSettings.servicesLinkLabel[selectedLang] || ''}
                            onChange={(e) => handleHeaderChange('servicesLinkLabel', e.target.value)}
                            placeholder="e.g. Alle Services"
                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-300 text-xs font-bold mb-1.5">
                            Services Link Target URL
                        </label>
                        <input
                            type="text"
                            value={currentSettings.servicesLinkUrl || ''}
                            onChange={(e) => updateState({ ...currentSettings, servicesLinkUrl: e.target.value })}
                            placeholder="/repair or https://..."
                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none text-sm"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Internal path (e.g. <code>/repair</code>) or external link (<code>https://...</code>)
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Services Cards Manager */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h4 className="text-white font-bold text-base flex items-center gap-2">
                            2. Service Cards
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                                {currentSettings.services.length} / 8 configured ({activeServicesCount} active)
                            </span>
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Add, reorder, edit titles, localized price labels, colors, and icons.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addService}
                        disabled={currentSettings.services.length >= 8}
                        className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs transition-all border focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                            currentSettings.services.length >= 8
                                ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                        }`}
                    >
                        <Plus size={16} /> Add Service Card
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSettings.services.map((service, index) => {
                        const IconComp = ICON_MAP[service.icon] || Wrench;
                        return (
                            <div
                                key={service.id || `invalid-service-${index}`}
                                className={`p-5 rounded-2xl border transition-all ${
                                    service.enabled
                                        ? 'bg-slate-900/80 border-slate-700/80'
                                        : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                                }`}
                            >
                                {/* Card Top Row: Order badge, Action buttons */}
                                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div
                                            style={{ color: service.iconColor || '#22d3ee' }}
                                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800"
                                        >
                                            <IconComp size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                                            {service.title[selectedLang] || service.id}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            title="Move Up"
                                            aria-label={`Move service ${index + 1} up`}
                                            disabled={index === 0}
                                            onClick={() => moveService(index, 'up')}
                                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Move Down"
                                            aria-label={`Move service ${index + 1} down`}
                                            disabled={index === currentSettings.services.length - 1}
                                            onClick={() => moveService(index, 'down')}
                                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete Service"
                                            aria-label={`Delete service ${service.id}`}
                                            onClick={() => removeService(index)}
                                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:ring-2 focus-visible:ring-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-3.5">
                                    {/* Enable toggle & ID field */}
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        <div>
                                            <label className="block text-slate-400 text-[11px] font-bold mb-1">
                                                ID / Slug
                                            </label>
                                            <input
                                                type="text"
                                                value={service.id}
                                                onChange={(e) => handleServiceChange(index, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                                                placeholder="e.g. display"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                                            />
                                        </div>
                                        <div className="pt-3">
                                            <Toggle
                                                label="Visible"
                                                value={service.enabled}
                                                onChange={(val: boolean) => handleServiceChange(index, 'enabled', val)}
                                            />
                                        </div>
                                    </div>

                                    {/* Title in active language */}
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold mb-1">
                                            Title ({selectedLang.toUpperCase()})
                                        </label>
                                        <input
                                            type="text"
                                            dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                                            value={service.title[selectedLang] || ''}
                                            onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                                            placeholder="e.g. Displayreparatur"
                                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                                        />
                                    </div>

                                    {/* Price label in active language */}
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold mb-1">
                                            Price Label ({selectedLang.toUpperCase()})
                                        </label>
                                        <input
                                            type="text"
                                            dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                                            value={service.priceLabel[selectedLang] || ''}
                                            onChange={(e) => handleServiceChange(index, 'priceLabel', e.target.value)}
                                            placeholder="e.g. ab €149 or Kostenlos"
                                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                                        />
                                    </div>

                                    {/* Icon Selector from allowlist */}
                                    <div>
                                        <label className="block text-slate-300 text-xs font-bold mb-1">
                                            Icon (Allowlist)
                                        </label>
                                        <select
                                            value={service.icon}
                                            onChange={(e) => handleServiceChange(index, 'icon', e.target.value as ServiceTerminalIcon)}
                                            aria-label={`Select icon for ${service.id}`}
                                            className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                                        >
                                            {ICON_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Color Pickers: Icon Color & Card Background */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="block text-slate-400 text-[11px] font-bold mb-1">
                                                Icon Color
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={service.iconColor || '#22d3ee'}
                                                    onChange={(e) => handleServiceChange(index, 'iconColor', e.target.value)}
                                                    className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5 shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={service.iconColor || '#22d3ee'}
                                                    onChange={(e) => handleServiceChange(index, 'iconColor', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-[11px] font-bold mb-1">
                                                Card Background
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={service.cardBackground || '#062033'}
                                                    onChange={(e) => handleServiceChange(index, 'cardBackground', e.target.value)}
                                                    className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5 shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={service.cardBackground || '#062033'}
                                                    onChange={(e) => handleServiceChange(index, 'cardBackground', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Call to Action Section (Collapsible) */}
            <div className="border border-slate-700 rounded-2xl bg-slate-900/60 overflow-hidden shadow-lg">
                <button
                    type="button"
                    aria-expanded={ctaOpen}
                    aria-controls="cta-settings-panel"
                    onClick={() => setCtaOpen(!ctaOpen)}
                    className="w-full p-5 md:p-6 flex items-center justify-between text-left transition-colors hover:bg-slate-800/40 min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-base">3. Call to Action Banner</h4>
                            <p className="text-slate-400 text-xs">Configure the bottom highlight banner and direct booking button.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            currentSettings.cta.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {currentSettings.cta.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {ctaOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                </button>

                {ctaOpen && (
                    <div id="cta-settings-panel" className="p-5 md:p-6 border-t border-slate-800 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <span className="text-sm font-bold text-slate-300">Enable CTA Banner</span>
                            <Toggle
                                label=""
                                value={currentSettings.cta.enabled}
                                onChange={(val: boolean) => updateState({
                                    ...currentSettings,
                                    cta: { ...currentSettings.cta, enabled: val },
                                })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-300 text-xs font-bold mb-1.5">
                                    CTA Title ({selectedLang.toUpperCase()})
                                </label>
                                <input
                                    type="text"
                                    dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                                    value={currentSettings.cta.title[selectedLang] || ''}
                                    onChange={(e) => handleCtaChange('title', e.target.value)}
                                    placeholder="e.g. Kostenlose Diagnose für dein Gerät"
                                    className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-300 text-xs font-bold mb-1.5">
                                    CTA Button Label ({selectedLang.toUpperCase()})
                                </label>
                                <input
                                    type="text"
                                    dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                                    value={currentSettings.cta.buttonLabel[selectedLang] || ''}
                                    onChange={(e) => handleCtaChange('buttonLabel', e.target.value)}
                                    placeholder="e.g. Jetzt buchen"
                                    className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-xs font-bold mb-1.5">
                                CTA Description ({selectedLang.toUpperCase()})
                            </label>
                            <textarea
                                dir={selectedLang === 'ar' ? 'rtl' : 'ltr'}
                                rows={2}
                                value={currentSettings.cta.description[selectedLang] || ''}
                                onChange={(e) => handleCtaChange('description', e.target.value)}
                                placeholder="e.g. Wir reparieren alle Marken – iPhone, Samsung, Huawei & mehr."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none text-sm resize-y"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-xs font-bold mb-1.5">
                                CTA Button URL
                            </label>
                            <input
                                type="text"
                                value={currentSettings.cta.buttonUrl || ''}
                                onChange={(e) => updateState({
                                    ...currentSettings,
                                    cta: { ...currentSettings.cta, buttonUrl: e.target.value },
                                })}
                                placeholder="/repair or https://..."
                                className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none text-sm"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Destination path for the CTA button (e.g. <code>/repair</code>)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
