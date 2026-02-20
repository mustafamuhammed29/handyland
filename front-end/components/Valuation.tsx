import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValuationRequest, LanguageCode } from '../types';
import {
    Cpu,
    CheckCircle2,
    ShieldAlert,
    RotateCcw,
    Zap,
    ScanLine,
    ChevronLeft,
    Layers,
    Save,
    BadgeEuro,
    HardDrive,
    Battery,
    Truck
} from 'lucide-react';
import { translations } from '../i18n';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
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
    const { settings } = useSettings();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Steps: 1=Model, 2=Specs (Storage/Battery), 3=Condition/Result
    const [step, setStep] = useState(1);
    const [apiDevices, setApiDevices] = useState<DeviceBlueprint[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceBlueprint | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewPrice, setPreviewPrice] = useState<number | null>(null);
    const [quoteData, setQuoteData] = useState<any | null>(null);

    const [formData, setFormData] = useState<ValuationRequest>({
        model: '',
        condition: '',
        storage: '',
        battery: '', // 'new' | 'old'
        batteryHealth: 100,
        color: 'Black',
        accessories: false
    });

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await api.get('/api/valuation/devices');
                if (Array.isArray(data)) setApiDevices(data);
                else if (data.data && Array.isArray(data.data)) setApiDevices(data.data);
            } catch (error) {
                console.error("Failed to fetch devices", error);
                addToast("Failed to load devices. Please refresh.", "error");
            }
        };
        fetchDevices();
    }, []);

    // Helper: Group devices by brand
    const brands = Array.from(new Set(apiDevices.map(d => d.brand)));

    // API Calculation for Preview
    useEffect(() => {
        if (selectedDevice && formData.storage && formData.condition) {
            const calculate = async () => {
                try {
                    const data = await api.post('/api/valuation/calculate', formData);
                    if (data.success) setPreviewPrice(data.estimatedValue);
                } catch (e) {
                    console.error("Calculation failed", e);
                }
            };
            // Debounce slightly
            const timer = setTimeout(calculate, 300);
            return () => clearTimeout(timer);
        }
    }, [formData, selectedDevice]);

    const handleModelSelect = (device: DeviceBlueprint) => {
        setSelectedDevice(device);
        setFormData({ ...formData, model: device.modelName });
        setStep(2);
    };

    const handleSpecsSubmit = () => {
        if (!formData.storage) {
            addToast("Please select storage capacity", "error");
            return;
        }
        setStep(3);
    };

    const handleSubmitQuote = async () => {
        if (!formData.condition) {
            addToast("Please select condition", "error");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                addToast("Please login to save your quote", "error");
                navigate('/login');
                return;
            }

            const data = await api.post('/api/valuations', formData);

            if (data.success || data.estimatedValue !== undefined) {
                addToast("Quote generated successfully!", "success");
                navigate('/dashboard/valuations');
            } else {
                addToast(data.message || "Failed to generate quote", "error");
            }

        } catch (error) {
            addToast("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSell = () => {
        if (quoteData?.redirectUrl) {
            navigate(quoteData.redirectUrl);
        }
    };

    // --- RENDER ---

    const ScannerFrame = ({ children, title, icon }: any) => (
        <div className="relative w-full max-w-4xl mx-auto min-h-[550px] bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="relative z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wider uppercase">{title}</h2>
                        <div className="text-[10px] text-cyan-500 font-mono">SYSTEM_STATUS: ONLINE</div>
                    </div>
                </div>
                {/* Progress Bar */}
                {!quoteData && (
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-2 w-8 rounded-full transition-all ${step >= i ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                )}
            </div>
            <div className="relative z-20 p-8 flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    );

    // RESULT SCREEN
    if (quoteData) {
        return (
            <div className="py-20 px-4 animate-in zoom-in duration-500">
                <ScannerFrame title="Valuation Certificate" icon={<CheckCircle2 className="w-6 h-6" />}>
                    <div className="flex flex-col items-center text-center justify-center h-full">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Zap className="w-12 h-12 text-emerald-400" />
                        </div>
                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 max-w-lg w-full relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500"></div>
                            <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-4">Confirmed Quote</h3>

                            <div className="text-5xl font-black text-white mb-2 tracking-tight">
                                {quoteData.estimatedValue}€
                            </div>
                            <p className="text-slate-500 mb-6">Quote Ref: {quoteData.quoteReference}</p>

                            <button
                                onClick={handleSell}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all font-mono text-lg"
                            >
                                SELL NOW & GET PAID
                            </button>
                        </div>
                        <button onClick={() => window.location.reload()} className="mt-8 text-slate-500 hover:text-white flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Start New Valuation
                        </button>
                    </div>
                </ScannerFrame>
            </div>
        );
    }

    return (
        <div className="py-20 px-4">
            <ScannerFrame
                title={step === 1 ? 'Select Device' : step === 2 ? 'Technical Specs' : 'Condition & Quote'}
                icon={<ScanLine className="w-6 h-6" />}
            >
                {/* STEP 1: MODEL SELECTION */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {apiDevices.map(device => (
                            <button
                                key={device._id}
                                onClick={() => handleModelSelect(device)}
                                className="group relative p-6 bg-slate-900/50 hover:bg-cyan-950/30 border border-slate-700 hover:border-cyan-500 rounded-2xl transition-all flex items-center gap-4 text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl overflow-hidden">
                                    {device.imageUrl ? (
                                        <img src={device.imageUrl} alt={device.modelName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{device.brand === 'Apple' ? '🍎' : device.brand === 'Samsung' ? '🌌' : '📱'}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:text-cyan-400">{device.modelName}</div>
                                    <div className="text-xs text-slate-500">{device.brand}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 2: SPECS (Storage & Battery) */}
                {step === 2 && (
                    <div className="flex flex-col gap-8">
                        {/* Storage */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-purple-400" /> Storage
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {(selectedDevice?.validStorages || ['128GB', '256GB', '512GB']).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFormData({ ...formData, storage: s })}
                                        className={`py-4 rounded-xl border font-bold transition-all ${formData.storage === s ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Battery (Simplified) */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Battery className="w-5 h-5 text-emerald-400" /> Battery Health
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        label: 'Like New (>90%)', value: 'new', health: 95,
                                        active: 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                    },
                                    {
                                        label: 'Good (80-90%)', value: 'good', health: 85,
                                        active: 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                                    },
                                    {
                                        label: 'Service (<80%)', value: 'old', health: 75,
                                        active: 'bg-red-500/20 border-red-500 text-red-300'
                                    }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFormData({ ...formData, battery: opt.value, batteryHealth: opt.health })}
                                        className={`py-4 rounded-xl border font-bold transition-all ${formData.battery === opt.value
                                            ? opt.active
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSpecsSubmit}
                                className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONDITION & PREVIEW */}
                {step === 3 && (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'new', label: 'New (Sealed)', desc: 'Unopened, original packaging.' },
                                { id: 'like_new', label: 'Like New', desc: 'No scratches, looks brand new.' },
                                { id: 'good', label: 'Good', desc: 'Minor scratches, barely visible.' },
                                { id: 'fair', label: 'Fair', desc: 'Visible scratches or dents.' },
                                { id: 'broken', label: 'Broken', desc: 'Cracked screen or other defects.' }
                            ].map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setFormData({ ...formData, condition: c.id })}
                                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${formData.condition === c.id ? 'bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                >
                                    <div>
                                        <div className={`font-bold ${formData.condition === c.id ? 'text-white' : 'text-slate-300'}`}>{c.label}</div>
                                        <div className="text-xs text-slate-500">{c.desc}</div>
                                    </div>
                                    {formData.condition === c.id && (
                                        <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Accessories Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                            <span className="text-slate-300 font-bold">Include Accessories? (+25€)</span>
                            <button
                                onClick={() => setFormData({ ...formData, accessories: !formData.accessories })}
                                className={`w-12 h-6 rounded-full p-1 transition-all ${formData.accessories ? 'bg-cyan-600' : 'bg-slate-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.accessories ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        {/* Live Preview */}
                        {previewPrice && (
                            <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                                <div className="text-slate-400 text-sm mb-1">Estimated Value</div>
                                <div className="text-3xl font-bold text-emerald-400">{previewPrice}€</div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleSubmitQuote}
                                disabled={loading || !formData.condition}
                                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Calculating...' : 'Get Official Quote'}
                            </button>
                        </div>
                    </div>
                )}

            </ScannerFrame>
        </div>
    );
};
