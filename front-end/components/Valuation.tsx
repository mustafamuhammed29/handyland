import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageCode } from '../types';
import {
    ChevronLeft,
    CheckCircle2,
    ShieldCheck,
    Truck,
    Wallet,
    Search,
    RotateCcw,
    BadgeEuro,
    Smartphone,
    Zap,
    Sparkles,
    ArrowRight,
    ScanLine
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { useSettings } from '../context/SettingsContext';

interface ValuationProps {
    lang: LanguageCode;
}

interface DeviceBlueprint {
    _id: string;
    brand: string;
    modelName: string;
    basePrice: number;
    validStorages: string[];
    imageUrl?: string;
}

export const Valuation: React.FC<ValuationProps> = ({ lang }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const navigate = useNavigate();
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

    const [mode, setMode] = useState<'landing' | 'wizard'>('landing');
    const [step, setStep] = useState(1);
    const [apiDevices, setApiDevices] = useState<DeviceBlueprint[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceBlueprint | null>(null);
    const [loading, setLoading] = useState(false);
    const [brandFilter, setBrandFilter] = useState<string>('all');

    // Smooth interpolated price display
    const [previewPrice, setPreviewPrice] = useState<number>(0);
    const [displayPrice, setDisplayPrice] = useState<number>(0);

    const [quoteData, setQuoteData] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [countdown, setCountdown] = useState<string>('');
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [formData, setFormData] = useState({
        model: '',
        storage: '',
        screenCondition: '',
        bodyCondition: '',
        isFunctional: true
    });

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await api.get('/api/valuation/devices');
                let devices: DeviceBlueprint[] = [];
                if (Array.isArray(data)) devices = data;
                else if (data.data && Array.isArray(data.data)) devices = data.data;

                // Clean out broken image URLs (Samsung CDN links return 404)
                const cleaned = devices.map(d => ({
                    ...d,
                    imageUrl: d.imageUrl && !d.imageUrl.includes('images.samsung.com') ? d.imageUrl : undefined
                }));
                setApiDevices(cleaned);
            } catch (error) {
                console.error("Failed to fetch devices", error);
                addToast("Failed to load devices", "error");
            }
        };
        fetchDevices();
    }, []);

    const brands = ['all', ...Array.from(new Set(apiDevices.map(d => d.brand).filter(Boolean)))];

    const filteredDevices = apiDevices.filter(device => {
        const matchSearch = (device.modelName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (device.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchBrand = brandFilter === 'all' || device.brand === brandFilter;
        return matchSearch && matchBrand;
    });

    const popularModels = apiDevices.slice(0, 6).map(d => d.modelName);

    useEffect(() => {
        if (!quoteData) {
            setCountdown('');
            if (countdownRef.current) clearInterval(countdownRef.current);
            return;
        }
        const expiresAt = quoteData.expiresAt || (Date.now() + 48 * 60 * 60 * 1000);
        const updateCountdown = () => {
            const remaining = expiresAt - Date.now();
            if (remaining <= 0) {
                setCountdown('Abgelaufen');
                if (countdownRef.current) clearInterval(countdownRef.current);
                return;
            }
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${h}h ${m}m ${s}s`);
        };
        updateCountdown();
        countdownRef.current = setInterval(updateCountdown, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [quoteData]);

    // Animate price tallying effect
    useEffect(() => {
        if (displayPrice === previewPrice) return;

        const step = (previewPrice - displayPrice) * 0.1;
        const diff = Math.abs(previewPrice - displayPrice);

        if (diff < 1) {
            setDisplayPrice(previewPrice);
            return;
        }

        const timer = setTimeout(() => {
            setDisplayPrice(prev => prev + step);
        }, 30);

        return () => clearTimeout(timer);
    }, [previewPrice, displayPrice]);

    // Auto-calculate preview price on the fly
    useEffect(() => {
        if (selectedDevice && formData.model) {
            const calculate = async () => {
                try {
                    const payload = {
                        model: formData.model,
                        storage: formData.storage || selectedDevice.validStorages[0], // fallback
                        screenCondition: formData.screenCondition || 'hervorragend', // best case scenario assumption
                        bodyCondition: formData.bodyCondition || 'hervorragend', // best case scenario assumption
                        isFunctional: formData.isFunctional
                    };
                    const data: any = await api.post('/api/valuation/calculate', payload);
                    if (data.success) {
                        setPreviewPrice(data.estimatedValue);
                    }
                } catch (e) {
                    console.error("Calculation failed", e);
                }
            };
            const timer = setTimeout(calculate, 200); // debounce slightly faster for UI responsiveness
            return () => clearTimeout(timer);
        }
    }, [formData, selectedDevice]);

    const startWizard = (device: DeviceBlueprint) => {
        setSelectedDevice(device);
        setFormData({ ...formData, model: device.modelName });
        // Set an initial preview price instantly based on just the base price and best assumptions
        setPreviewPrice(device.basePrice || 200);
        setDisplayPrice(device.basePrice || 200);
        setMode('wizard');
        setStep(1);
    };

    const handleNextStep = () => {
        setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step === 1) {
            setMode('landing');
            setSelectedDevice(null);
            setFormData({ model: '', storage: '', screenCondition: '', bodyCondition: '', isFunctional: true });
        } else {
            setStep(step - 1);
        }
    };

    const handleCalculateOffer = async (functional: boolean) => {
        setLoading(true);
        try {
            const payload = {
                model: formData.model,
                storage: formData.storage,
                screenCondition: formData.screenCondition,
                bodyCondition: formData.bodyCondition,
                isFunctional: functional
            };
            const data: any = await api.post('/api/valuation/calculate', payload);
            if (data.success || data.estimatedValue !== undefined) {
                setFormData(prev => ({ ...prev, isFunctional: functional }));

                // Final calculation push
                setPreviewPrice(data.estimatedValue);
                setDisplayPrice(data.estimatedValue);

                setQuoteData({
                    estimatedValue: data.estimatedValue,
                    quoteReference: data.quoteReference,
                    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
                    ...payload
                });
                setStep(5);
            } else {
                addToast(data.message || "Fehler bei der Preisberechnung", "error");
            }
        } catch (error) {
            addToast("Netzwerkfehler bei der Berechnung", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitQuote = async () => {
        // Save to sessionStorage FIRST as a safety net (for post-login redirect)
        sessionStorage.setItem('pendingValuationQuote', JSON.stringify({ quoteData, formData }));

        setLoading(true);
        try {
            // Try to save to DB (relies on HTTP-Only cookies for auth)
            const payload = {
                model: quoteData?.model || formData.model,
                storage: quoteData?.storage || formData.storage,
                screenCondition: quoteData?.screenCondition || formData.screenCondition,
                bodyCondition: quoteData?.bodyCondition || formData.bodyCondition,
                isFunctional: quoteData?.isFunctional ?? formData.isFunctional
            };
            const data: any = await api.post('/api/valuation/saved', payload);
            if (data.success || data.quoteReference) {
                // DB save succeeded → clean up sessionStorage, use real reference
                sessionStorage.removeItem('pendingValuationQuote');
                addToast("Angebot erfolgreich gespeichert!", "success");
                navigate(`/sell/${data.quoteReference}`);
                return;
            }
            addToast(data.message || "Fehler beim Speichern", "error");
        } catch (error: any) {
            // If 401 → api interceptor will redirect to /login automatically
            // sessionStorage is already set, so after login the user can resume
            const msg = error?.response?.data?.message || error?.message || "Netzwerkfehler";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    // View component building blocks

    const AppFrame = ({ children, title, subtitle, icon }: any) => (
        <div className="relative w-full max-w-5xl mx-auto min-h-[650px] bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500">
            {/* Header */}
            <div className="relative z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-6 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    {mode === 'wizard' && !quoteData ? (
                        <button
                            onClick={handlePrevStep}
                            aria-label="Zurück"
                            title="Zurück"
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                    ) : (
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
                    </div>
                </div>

                {/* Progress & Live Price Snippet */}
                {mode === 'wizard' && !quoteData && (
                    <div className="flex flex-row md:flex-col items-end gap-3 justify-between">
                        {/* Live Price Badge */}
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2 rounded-full shadow-inner">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Bis zu</span>
                            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                                {Math.round(displayPrice)} €
                            </span>
                        </div>

                        {/* Progress Tracker */}
                        <div className="flex items-center gap-1.5 hidden sm:flex">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="relative">
                                    <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                                    {step === i && (
                                        <div className="absolute -top-1 -bottom-1 -left-1 -right-1 bg-blue-400/30 rounded-full blur-[2px]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="relative z-20 p-6 md:p-12 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
                {children}
            </div>
        </div>
    );

    return (
        <div className="py-24 px-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-[#0a0f1c] relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full point-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full point-events-none" />

            {/* ========================================== */}
            {/* LANDING UI (MODE: 'landing')               */}
            {/* ========================================== */}
            {mode === 'landing' && (
                <div className="w-full relative z-10 duration-700">
                    {/* HERO */}
                    <div className="max-w-5xl mx-auto mb-8 text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-sm mb-2 shadow-sm">
                            <Sparkles size={16} /> Maximiere deinen Gerätewert
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                            {t('valuation.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">HandyLand</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                            {t('valuation.subtitle') || 'Ermittle den Wert in wenigen Sekunden. Faire Preise, schnelle Auszahlung, kostenloser Versand.'}
                        </p>
                    </div>

                    {/* TRUST BAR */}
                    <div className="max-w-3xl mx-auto mb-10 flex flex-wrap items-center justify-center gap-6">
                        {[{ icon: '⭐', label: '4.8/5 von 2.000+ Bewertungen' }, { icon: '📦', label: 'Kostenloser Versand' }, { icon: '⚡', label: 'Auszahlung in 24h' }, { icon: '🔒', label: '100% Sicher & Seriös' }].map(item => (
                            <div key={item.label} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <span className="text-base">{item.icon}</span>{item.label}
                            </div>
                        ))}
                    </div>

                    <div>
                        <AppFrame title="Gerät finden" subtitle="Wähle dein Modell aus, um sofort zu starten" icon={<ScanLine className="w-7 h-7" />}>
                            {/* Search Bar */}
                            <div className="relative mb-6 max-w-3xl mx-auto group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-2 shadow-sm transition-all focus-within:border-blue-500 dark:focus-within:border-blue-500">
                                    <div className="pl-4 pr-2"><Search className="text-blue-500" size={24} /></div>
                                    <input
                                        type="text"
                                        placeholder="Z.B. iPhone 15 Pro, Samsung Galaxy S24..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent py-4 text-xl focus:outline-none font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal"
                                    />
                                </div>
                            </div>

                            {/* Popular Searches */}
                            {!searchTerm && popularModels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6 max-w-3xl mx-auto">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center">Beliebt:</span>
                                    {popularModels.map(m => (
                                        <button key={m} onClick={() => setSearchTerm(m)}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700">
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Brand Filter */}
                            {brands.length > 2 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {brands.map(b => (
                                        <button key={b} onClick={() => setBrandFilter(b)}
                                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${brandFilter === b
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'
                                                }`}>
                                            {b === 'all' ? 'Alle' : b}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Device Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredDevices.map(device => (
                                    <button
                                        key={device._id}
                                        onClick={() => startWizard(device)}
                                        className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 transition-all shadow-sm hover:shadow-xl text-left flex flex-col items-center justify-center gap-4 overflow-hidden hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-600"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-800/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {/* Price Badge */}
                                        <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                            bis {device.basePrice}€
                                        </div>
                                        <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-3 shadow-inner group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                            {device.imageUrl ? (
                                                <img src={device.imageUrl} alt={device.modelName}
                                                    className="object-contain w-full h-full drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                                />
                                            ) : null}
                                            <Smartphone className={`w-12 h-12 text-slate-400 group-hover:text-blue-500 transition-colors ${device.imageUrl ? 'hidden' : ''}`} />
                                        </div>
                                        <div className="text-center w-full z-10">
                                            <div className="font-extrabold text-base text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={device.modelName}>{device.modelName}</div>
                                            <div className="text-xs font-medium text-slate-400 mt-0.5">{device.brand}</div>
                                        </div>
                                    </button>
                                ))}
                                {filteredDevices.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-slate-500 font-medium text-lg">
                                        Keine Geräte gefunden für &quot;{searchTerm}&quot;
                                    </div>
                                )}
                            </div>
                        </AppFrame>
                    </div>
                </div>
            )}


            {/* ========================================== */}
            {/* WIZARD UI (MODE: 'wizard')                 */}
            {/* ========================================== */}
            {mode === 'wizard' && !quoteData && (
                <div className="w-full max-w-5xl mx-auto z-10">
                    <AppFrame
                        title={selectedDevice?.modelName || 'Bewertung'}
                        subtitle="Ermittle deinen Preis in Sekunden"
                    >
                        {/* WIZARD CONTENT AREA */}
                        <div className="max-w-4xl mx-auto duration-200">

                            {/* STEP 1: STORAGE */}
                            {step === 1 && (
                                <div className="py-4">
                                    <h2 className="text-3xl md:text-4xl font-black mb-10 text-slate-900 dark:text-white text-center tracking-tight">
                                        {t('valuation.step2')}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                        {(selectedDevice?.validStorages || ['128 GB', '256 GB', '512 GB']).map(s => (
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

                            {/* STEP 2: SCREEN CONDITION */}
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

                            {/* STEP 3: BODY CONDITION */}
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

                            {/* STEP 4: FUNCTIONALITY */}
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
            )}

            {/* ========================================== */}
            {/* STEP 5: FINAL RESULT (MODE: 'wizard')      */}
            {/* ========================================== */}
            {mode === 'wizard' && quoteData && (
                <div className="w-full max-w-5xl mx-auto z-10 duration-500">
                    <div>
                        <AppFrame
                            title={t('valuation.result') || 'Dein Angebot ist da!'}
                            subtitle={`${t('valuation.yourOffer') || 'Exklusives Angebot für dich'} (Ref: ${quoteData.quoteReference || '…'})`}
                            icon={<BadgeEuro className="w-7 h-7" />}
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                                {/* Left Col: Device Summary (Spans 2 cols on lg) */}
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

                                {/* Right Col: Price & Action (Spans 3 cols on lg) */}
                                <div className="flex flex-col lg:col-span-3">
                                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-8 md:p-12 text-center relative overflow-hidden flex-1 flex flex-col justify-center shadow-xl">
                                        {/* Background flares */}
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

                                        {/* Countdown Timer */}
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

                                    {/* Action Buttons */}
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

                                    {/* HOW IT WORKS */}
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
                </div>
            )}

        </div>
    );
};
