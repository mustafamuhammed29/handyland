import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValuationRequest, LanguageCode } from '../types';
import {
    ChevronLeft,
    CheckCircle2,
    ShieldCheck,
    Truck,
    Wallet,
    TrendingDown,
    Search,
    RotateCcw,
    BadgeEuro,
    Smartphone,
    Laptop,
    Watch,
    Headphones,
    ScanLine,
    Zap
} from 'lucide-react';
import { translations } from '../i18n';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

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
    const t = translations[lang];
    const { addToast } = useToast();
    const navigate = useNavigate();

    // The two main modes: 'landing' or 'wizard'
    const [mode, setMode] = useState<'landing' | 'wizard'>('landing');

    // Wizard Steps: 1=Storage, 2=Screen, 3=Body, 4=Functionality, 5=Result
    const [step, setStep] = useState(1);
    const [apiDevices, setApiDevices] = useState<DeviceBlueprint[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceBlueprint | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewPrice, setPreviewPrice] = useState<number | null>(null);
    const [quoteData, setQuoteData] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
                if (Array.isArray(data)) setApiDevices(data);
                else if (data.data && Array.isArray(data.data)) setApiDevices(data.data);
            } catch (error) {
                console.error("Failed to fetch devices", error);
                addToast("Failed to load devices", "error");
            }
        };
        fetchDevices();
    }, []);

    // Filter devices based on search
    const filteredDevices = apiDevices.filter(device =>
        (device.modelName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (device.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Helper: Map the UI selections to backend condition keys
    const getBackendCondition = () => {
        if (!formData.isFunctional) return 'broken';
        if (formData.screenCondition === 'hervorragend' && formData.bodyCondition === 'hervorragend') return 'like_new';
        if (formData.screenCondition === 'gut' || formData.bodyCondition === 'gut') return 'good';
        if (formData.screenCondition === 'beschadigt' || formData.bodyCondition === 'beschadigt') return 'fair';
        return 'good';
    };

    // Auto-calculate preview price on the fly
    useEffect(() => {
        if (selectedDevice && formData.storage && formData.screenCondition && formData.bodyCondition) {
            const calculate = async () => {
                try {
                    const payload = {
                        model: formData.model,
                        storage: formData.storage,
                        screenCondition: formData.screenCondition,
                        bodyCondition: formData.bodyCondition,
                        isFunctional: formData.isFunctional
                    };
                    const data: any = await api.post('/api/valuation/calculate', payload);
                    if (data.success) setPreviewPrice(data.estimatedValue);
                } catch (e) {
                    console.error("Calculation failed", e);
                }
            };
            const timer = setTimeout(calculate, 300);
            return () => clearTimeout(timer);
        }
    }, [formData, selectedDevice]);

    const startWizard = (device: DeviceBlueprint) => {
        setSelectedDevice(device);
        setFormData({ ...formData, model: device.modelName });
        setMode('wizard');
        setStep(1); // Start at Storage
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

    // Step 4 → show the calculated offer (public, no login needed)
    const handleCalculateOffer = async (functional: boolean) => {
        setLoading(true);
        try {
            const payload = {
                model: formData.model,
                storage: formData.storage,
                screenCondition: formData.screenCondition,
                bodyCondition: formData.bodyCondition,
                isFunctional: functional   // use the value directly, avoid state race
            };
            const data: any = await api.post('/api/valuation/calculate', payload);
            if (data.success || data.estimatedValue !== undefined) {
                setFormData(prev => ({ ...prev, isFunctional: functional }));
                setQuoteData({ estimatedValue: data.estimatedValue, ...payload });
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

    // Step 5 "Akzeptieren" → save the quote (requires login)
    const handleSubmitQuote = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            addToast("Bitte melde dich an, um das Angebot zu bestätigen", "info");
            navigate('/login');
            return;
        }
        setLoading(true);
        try {
            // Use quoteData which was set by handleCalculateOffer — avoids stale formData
            const payload = {
                model: quoteData?.model || formData.model,
                storage: quoteData?.storage || formData.storage,
                screenCondition: quoteData?.screenCondition || formData.screenCondition,
                bodyCondition: quoteData?.bodyCondition || formData.bodyCondition,
                isFunctional: quoteData?.isFunctional ?? formData.isFunctional
            };
            console.log('💾 Saving valuation:', payload);
            const data: any = await api.post('/api/valuation/saved', payload);
            console.log('✅ Save response:', data);
            if (data.success || data.quoteReference) {
                addToast("Angebot erfolgreich gespeichert!", "success");
                navigate('/dashboard/valuations');
            } else {
                addToast(data.message || "Fehler beim Speichern", "error");
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || "Netzwerkfehler";
            console.error('❌ Save error:', msg);
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };


    const handleSell = () => {
        if (quoteData?.redirectUrl) {
            navigate(quoteData.redirectUrl);
        } else {
            navigate('/dashboard/valuations');
        }
    };

    // --- RENDER ---

    // Custom Handyland Wrapper Frame
    const AppFrame = ({ children, title, subtitle, icon }: any) => (
        <div className="relative w-full max-w-5xl mx-auto min-h-[600px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {mode === 'wizard' && !quoteData ? (
                        <button
                            onClick={handlePrevStep}
                            aria-label="Zurück zum vorherigen Schritt"
                            title="Zurück zum vorherigen Schritt"
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                    ) : (
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{title}</h2>
                        {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
                    </div>
                </div>

                {/* Wizard Progress Indication */}
                {mode === 'wizard' && !quoteData && (
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-slate-400">Schritt {step} von 4</div>
                        <div className="flex gap-1 ml-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${step >= i ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="relative z-20 p-6 md:p-10 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
                {children}
            </div>
        </div>
    );

    return (
        <div className="py-20 px-4 min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1c]">

            {/* ========================================== */}
            {/* LANDING UI (MODE: 'landing')               */}
            {/* ========================================== */}
            {mode === 'landing' && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="max-w-5xl mx-auto mb-10 text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold rounded-full text-sm mb-2">
                            <BadgeEuro size={16} /> Bestpreis Garantie
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                            Verkaufe dein Gerät an <span className="text-blue-600">Handyland</span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Ermittle den Wert deines Smartphones, Tablets oder MacBooks in wenigen Klicks. Schnelle Auszahlung und kostenloser Versand inklusive.
                        </p>
                    </div>

                    <AppFrame title="Gerät suchen" subtitle="Wähle dein Modell aus, um zu starten" icon={<ScanLine className="w-6 h-6" />}>

                        {/* Search Bar */}
                        <div className="relative mb-10 max-w-2xl mx-auto">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="text"
                                placeholder="Z.B. iPhone 13 Pro..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-4 text-lg focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                            />
                        </div>

                        {/* Device Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredDevices.map(device => (
                                <button
                                    key={device._id}
                                    onClick={() => startWizard(device)}
                                    className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:-translate-y-1 text-left flex flex-col items-center justify-center gap-4"
                                >
                                    <div className="w-24 h-24 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-2">
                                        {device.imageUrl ? (
                                            <img src={device.imageUrl} alt={device.modelName} className="object-contain w-full h-full drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <Smartphone className="w-10 h-10 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="text-center w-full">
                                        <div className="font-bold text-slate-900 dark:text-white truncate" title={device.modelName}>{device.modelName}</div>
                                        <div className="text-xs text-slate-500 mt-1">{device.brand}</div>
                                    </div>
                                </button>
                            ))}
                            {filteredDevices.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500">
                                    Keine Geräte gefunden für "{searchTerm}"
                                </div>
                            )}
                        </div>

                    </AppFrame>
                </div>
            )}


            {/* ========================================== */}
            {/* WIZARD UI (MODE: 'wizard')                 */}
            {/* ========================================== */}
            {mode === 'wizard' && !quoteData && (
                <div className="w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                    <AppFrame
                        title={selectedDevice?.modelName || 'Bewertung'}
                        subtitle="Beantworte ein paar Fragen zum Zustand"
                    >

                        {/* WIZARD CONTENT AREA */}
                        <div className="max-w-3xl mx-auto">

                            {/* STEP 1: STORAGE */}
                            {step === 1 && (
                                <div className="animate-in slide-in-from-right-8 duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 dark:text-white text-center">Welche Speicherkapazität hat dein Gerät?</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(selectedDevice?.validStorages || ['128 GB', '256 GB', '512 GB']).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setFormData({ ...formData, storage: s }); handleNextStep(); }}
                                                className={`p-6 md:p-8 rounded-2xl border-2 text-center text-xl font-bold transition-all ${formData.storage === s
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950'
                                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: SCREEN CONDITION */}
                            {step === 2 && (
                                <div className="animate-in slide-in-from-right-8 duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 dark:text-white text-center">In welchem Zustand befindet sich der Bildschirm?</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'hervorragend', title: 'Hervorragend', desc: 'Keine sichtbaren Kratzer. Wie neu.' },
                                            { id: 'sehr_gut', title: 'Sehr Gut', desc: 'Leichte Gebrauchsspuren, nicht sichtbar aus 20 cm.' },
                                            { id: 'gut', title: 'Gut', desc: 'Sichtbare Kratzer, kein Riss.' },
                                            { id: 'beschadigt', title: 'Beschädigt', desc: 'Risse, gebrochenes Glas oder defekte Pixel.' }
                                        ].map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setFormData({ ...formData, screenCondition: c.id }); handleNextStep(); }}
                                                className={`p-5 rounded-2xl border-2 text-left bg-white dark:bg-slate-900 transition-all transform hover:-translate-y-0.5 ${formData.screenCondition === c.id ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                            >
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                                                    {c.title}
                                                    {formData.screenCondition === c.id && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{c.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: BODY CONDITION */}
                            {step === 3 && (
                                <div className="animate-in slide-in-from-right-8 duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 dark:text-white text-center">Wie ist der Zustand des Gehäuses?</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'hervorragend', title: 'Hervorragend', desc: 'Keine sichtbaren Gebrauchsspuren, wie neu aus der Box.' },
                                            { id: 'sehr_gut', title: 'Sehr Gut', desc: 'Leichte Spuren die bei normalem Abstand nicht sichtbar sind.' },
                                            { id: 'gut', title: 'Gut', desc: 'Sichtbare Kratzer oder leichte Gebrauchsspuren, keine Dellen.' },
                                            { id: 'beschadigt', title: 'Beschädigt', desc: 'Tiefe Kratzer, Risse auf der Rückseite oder Dellen am Rahmen.' }
                                        ].map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setFormData({ ...formData, bodyCondition: c.id }); handleNextStep(); }}
                                                className={`p-5 rounded-2xl border-2 text-left bg-white dark:bg-slate-900 transition-all flex items-center justify-between group ${formData.bodyCondition === c.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                            >
                                                <div>
                                                    <h3 className={`font-bold text-xl mb-1 ${formData.bodyCondition === c.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>{c.title}</h3>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm">{c.desc}</p>
                                                </div>
                                                {formData.bodyCondition === c.id ? (
                                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 ml-4">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0 ml-4 group-hover:border-blue-400 transition-colors" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: FUNCTIONALITY */}
                            {step === 4 && (
                                <div className="animate-in slide-in-from-right-8 duration-300">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white text-center">Funktioniert dein Gerät einwandfrei?</h2>
                                    <p className="text-slate-600 dark:text-slate-400 mb-8 text-center max-w-xl mx-auto">
                                        Damit es voll funktionsfähig ist, müssen Kameras, Lautsprecher, Mikrofone und alle Tasten fehlerfrei funktionieren. Zudem muss das Gerät auf Werkseinstellungen zurückgesetzt sein (keine iCloud/Google Sperre).
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <button
                                            onClick={() => handleCalculateOffer(true)}
                                            disabled={loading}
                                            className="p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-center transition-all group disabled:opacity-50"
                                        >
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                                                <CheckCircle2 className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ja</h3>
                                            <p className="text-sm text-slate-500 mt-2">Alles funktioniert top.</p>
                                        </button>
                                        <button
                                            onClick={() => handleCalculateOffer(false)}
                                            disabled={loading}
                                            className="p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-center transition-all group disabled:opacity-50"
                                        >
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                                                <Zap className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nein</h3>
                                            <p className="text-sm text-slate-500 mt-2">Teildefekt oder gesperrt.</p>
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
                <div className="w-full max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
                    <AppFrame
                        title="Dein Angebot ist da!"
                        subtitle={`Referenznummer: ${quoteData.quoteReference}`}
                        icon={<BadgeEuro className="w-6 h-6" />}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Left Col: Device Summary */}
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-6">
                                    <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center shrink-0 p-2 shadow-sm border border-slate-100 dark:border-slate-800">
                                        {selectedDevice?.imageUrl ? (
                                            <img src={selectedDevice.imageUrl} alt={selectedDevice.modelName} className="object-contain w-full h-full" />
                                        ) : (
                                            <Smartphone className="w-8 h-8 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{formData.model}</h3>
                                        <p className="text-slate-500 font-medium">{formData.storage}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <span className="text-slate-500 font-medium text-sm w-32 shrink-0">Bildschirm</span>
                                        <span className="font-bold text-slate-900 dark:text-white capitalize truncate">{formData.screenCondition}</span>
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <span className="text-slate-500 font-medium text-sm w-32 shrink-0">Gehäuse</span>
                                        <span className="font-bold text-slate-900 dark:text-white capitalize truncate">{formData.bodyCondition}</span>
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <span className="text-slate-500 font-medium text-sm w-32 shrink-0">Funktionalität</span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white w-max">
                                            {formData.isFunctional ? <div className="w-2 h-2 rounded-full bg-emerald-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                            {formData.isFunctional ? 'Voll funktionsfähig' : 'Teildefekt'}
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => window.location.reload()} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" /> Neues Gerät bewerten
                                </button>
                            </div>

                            {/* Right Col: Price & Action */}
                            <div className="flex flex-col">
                                <div className="bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-3xl p-8 border-2 border-blue-100 dark:border-slate-800 text-center relative overflow-hidden flex-1 flex flex-col justify-center shadow-inner">
                                    <span className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6 mx-auto shadow-sm">
                                        <CheckCircle2 size={14} /> Garantiertes Angebot
                                    </span>

                                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Dein Auszahlungsbetrag</p>
                                    <div className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                                        {quoteData.estimatedValue} €
                                    </div>

                                    <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <Wallet size={16} /> Keine Gebühren
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <Truck size={16} /> Gratis Label
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="py-4 rounded-xl font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-800 transition-colors"
                                    >
                                        Nein, danke
                                    </button>
                                    <button
                                        onClick={handleSubmitQuote}
                                        disabled={loading}
                                        className="py-4 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 flex flex-col items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <span>{loading ? 'Speichern...' : 'Angebot annehmen'}</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </AppFrame>
                </div>
            )}

        </div>
    );
};
