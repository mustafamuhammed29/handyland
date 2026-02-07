import React, { useState, useEffect } from 'react';
import { calculateManualPrice, calculatePriceValue } from '../services/priceService';
import { ValuationRequest, LanguageCode } from '../types';
import {
    Cpu,
    Smartphone,
    HardDrive,
    Zap,
    Activity,
    ScanLine,
    CheckCircle2,
    ShieldAlert,
    RotateCcw,
    Binary,
    Wifi,
    ChevronLeft,
    Layers,
    Save,
    BadgeEuro,
    Battery,
    Gauge
} from 'lucide-react';
import { translations } from '../i18n';
import { useToast } from '../context/ToastContext';
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
}

// Data Structures
const BRANDS = [
    { id: 'apple', name: 'Apple', icon: '🍎' },
    { id: 'samsung', name: 'Samsung', icon: '🌌' },
    { id: 'google', name: 'Google', icon: 'G' },
    { id: 'xiaomi', name: 'Xiaomi', icon: 'mi' }
];

const MODELS = [
    // Apple
    { id: '15pm', name: 'iPhone 15 Pro Max', brand: 'apple' },
    { id: '15p', name: 'iPhone 15 Pro', brand: 'apple' },
    { id: '15', name: 'iPhone 15', brand: 'apple' },
    { id: '14pm', name: 'iPhone 14 Pro Max', brand: 'apple' },
    { id: '14p', name: 'iPhone 14 Pro', brand: 'apple' },
    { id: '13', name: 'iPhone 13', brand: 'apple' },

    // Samsung
    { id: 's24u', name: 'Galaxy S24 Ultra', brand: 'samsung' },
    { id: 's24', name: 'Galaxy S24', brand: 'samsung' },
    { id: 's23u', name: 'Galaxy S23 Ultra', brand: 'samsung' },
    { id: 'zflip5', name: 'Galaxy Z Flip 5', brand: 'samsung' },
    { id: 'zfold5', name: 'Galaxy Z Fold 5', brand: 'samsung' },

    // Google
    { id: 'p8p', name: 'Pixel 8 Pro', brand: 'google' },
    { id: 'p8', name: 'Pixel 8', brand: 'google' },
    { id: 'p7p', name: 'Pixel 7 Pro', brand: 'google' },
    { id: 'p7a', name: 'Pixel 7a', brand: 'google' },

    // Xiaomi
    { id: 'x14u', name: 'Xiaomi 14 Ultra', brand: 'xiaomi' },
    { id: 'x13t', name: 'Xiaomi 13T Pro', brand: 'xiaomi' },
    { id: 'rn13', name: 'Redmi Note 13', brand: 'xiaomi' }
];

// Fallbacks are now handled via context, but keeping structure for reference if needing to revert/debug default behavior
// Actual rendering uses active* variables below


export const Valuation: React.FC<ValuationProps> = ({ lang }) => {
    const t = translations[lang];
    const { settings } = useSettings();
    const { addToast } = useToast();
    const [step, setStep] = useState(1); // 1: Brand/Model, 2: Storage, 3: Battery, 4: Condition, 5: Result
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanLog, setScanLog] = useState<string[]>([]);
    const [result, setResult] = useState<string | null>(null);
    const [apiDevices, setApiDevices] = useState<DeviceBlueprint[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<DeviceBlueprint | null>(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/valuation/devices');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setApiDevices(data);
                }
            } catch (error) {
                console.error("Failed to fetch valuation devices", error);
            }
        };
        fetchDevices();
    }, []);

    const [formData, setFormData] = useState<ValuationRequest>({
        model: '',
        condition: '',
        storage: '',
        battery: '',
        color: 'Black',
        accessories: false
    });

    // Use dynamic data from settings if available, else fallback
    // Priority: API Devices > Settings > Hardcoded
    const derivedBrands = React.useMemo(() => {
        if (apiDevices.length > 0) {
            const uniqueBrands = Array.from(new Set(apiDevices.map((d: DeviceBlueprint) => d.brand)));
            return uniqueBrands.map((brandName: string) => {
                const known = BRANDS.find(b => b.name.toLowerCase() === brandName.toLowerCase());
                return {
                    id: brandName,
                    name: brandName,
                    icon: known ? known.icon : '📱'
                };
            });
        }
        return (settings.valuation?.brands && settings.valuation.brands.length > 0)
            ? settings.valuation.brands
            : BRANDS;
    }, [apiDevices, settings.valuation?.brands]);

    const activeBrands = derivedBrands;

    const activeModels = React.useMemo(() => {
        if (apiDevices.length > 0) {
            return apiDevices.map(d => ({
                id: d._id,
                name: d.modelName,
                brandId: d.brand, // Mapping brand name to ID for filter
                brand: d.brand
            }));
        }
        return (settings.valuation?.models && settings.valuation.models.length > 0)
            ? settings.valuation.models
            : MODELS;
    }, [apiDevices, settings.valuation?.models]);

    const activeStorage = React.useMemo(() => {
        if (selectedDevice && selectedDevice.validStorages && selectedDevice.validStorages.length > 0) {
            return selectedDevice.validStorages.map(s => ({ label: s, multiplier: 1 })); // Multiplier logic could be refined
        }
        return (settings.valuation?.storageOptions && settings.valuation.storageOptions.length > 0)
            ? settings.valuation.storageOptions
            : [{ label: '128GB', multiplier: 1 }];
    }, [selectedDevice, settings.valuation?.storageOptions]);

    const activeConditions = (settings.valuation?.conditionOptions && settings.valuation.conditionOptions.length > 0)
        ? settings.valuation.conditionOptions
        : [
            { id: 'new', label: 'New (Sealed)', multiplier: 1.0, color: 'emerald' },
            { id: 'like_new', label: 'Like New', multiplier: 0.9, color: 'blue' },
            { id: 'good', label: 'Good', multiplier: 0.75, color: 'yellow' },
            { id: 'fair', label: 'Fair (Scratched)', multiplier: 0.6, color: 'orange' },
            { id: 'broken', label: 'Broken / Damaged', multiplier: 0.3, color: 'red' }
        ];

    const activeBattery = (settings.valuation?.batteryOptions && settings.valuation.batteryOptions.length > 0)
        ? settings.valuation.batteryOptions
        : [{ id: 'new', label: 'New Battery', multiplier: 1 }];

    // Scanner Terminal Effect
    useEffect(() => {
        if (isScanning) {
            const logs = [
                t.connecting,
                "Handshake successful (Secure V4)",
                t.scanning,
                `Target Identified: ${formData.model}`,
                `Memory Config: ${formData.storage}`,
                `Battery Health: ${activeBattery.find(b => b.id === formData.battery)?.label || 'Unknown'}`,
                t.analyzing,
                "Querying Global Database...",
                "Adjusting for Berlin Market Trend...",
                "Calculation Complete."
            ];

            let currentLog = 0;
            const interval = setInterval(() => {
                if (currentLog < logs.length) {
                    setScanLog(prev => [...prev, logs[currentLog]]);
                    currentLog++;
                } else {
                    clearInterval(interval);
                    clearInterval(interval);
                    clearInterval(interval);
                    // Pass the base price explicitly if using API device
                    const basePriceOverride = selectedDevice ? selectedDevice.basePrice : undefined;
                    // Pass selectedDevice for advanced pricing config
                    const estimation = calculateManualPrice(formData, settings, basePriceOverride, selectedDevice);
                    setResult(estimation);
                    setIsScanning(false);
                    setStep(5); // Ensure it goes to result step (5), fixed locally if loop was 4
                }
            }, 600);
            return () => clearInterval(interval);
        }
    }, [isScanning, formData, t]);

    const handleBrandSelect = (brandId: string) => {
        setSelectedBrand(brandId);
        // We stay in step 1 effectively, but the view changes to model selection
    };

    const handleModelSelect = (modelName: string) => {
        const dev = apiDevices.find(d => d.modelName === modelName);
        setSelectedDevice(dev || null);
        setFormData({ ...formData, model: modelName });
        setTimeout(() => setStep(2), 300);
    };

    const handleStorageSelect = (storage: string) => {
        setFormData({ ...formData, storage: storage });
        setTimeout(() => setStep(3), 300);
    };

    const handleBatterySelect = (batteryId: string) => {
        setFormData({ ...formData, battery: batteryId });
        setTimeout(() => setStep(4), 300);
    };

    const startScan = () => {
        setIsScanning(true);
        setScanLog([]);
    };

    const resetScanner = () => {
        setStep(1);
        setSelectedBrand(null);
        setResult(null);
        setFormData({
            model: '',
            condition: '',
            storage: '',
            battery: '',
            color: 'Black',
            accessories: false
        });
    };

    const handleSaveQuote = () => {
        addToast("Valuation saved to your Dashboard", "success");
    };

    const handleSellDevice = () => {
        addToast("Redirecting to Seller Portal...", "info");
        // Logic to redirect or open sell form would go here
    };

    // --- VISUAL COMPONENTS ---

    const ScannerFrame = ({ children, title, icon }: { children: React.ReactNode, title: string, icon: React.ReactNode }) => (
        <div className="relative w-full max-w-4xl mx-auto min-h-[550px] bg-slate-950 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Scanner Line Animation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_20px_#06b6d4] z-10 animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400 animate-pulse">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wider uppercase">{title}</h2>
                        <div className="text-[10px] text-cyan-500 font-mono">SYSTEM_STATUS: ONLINE</div>
                    </div>
                </div>
                {step < 4 && !isScanning && (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-2 w-8 rounded-full transition-all ${step >= i ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="relative z-20 p-8 flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>

            {/* Footer Decoration */}
            <div className="relative z-20 h-8 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center px-6 text-[10px] text-slate-500 font-mono shrink-0">
                <span>ID: JAWWAL-AI-9000</span>
                <span>SECURE CONNECTION</span>
            </div>
        </div>
    );

    // --- STEP VIEWS ---

    if (isScanning) {
        return (
            <div className="py-20 px-4">
                <ScannerFrame title="PROCESSING..." icon={<Binary className="w-6 h-6" />}>
                    <div className="flex flex-col items-center justify-center h-full space-y-8 min-h-[400px]">
                        {/* Central Loader */}
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin"></div>
                            <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-500 animate-[spin_5s_linear_infinite_reverse]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Cpu className="w-16 h-16 text-cyan-400 animate-pulse" />
                            </div>
                        </div>

                        {/* Terminal Output */}
                        <div className="w-full max-w-lg bg-black/50 rounded-xl border border-slate-700 p-4 font-mono text-xs h-48 overflow-hidden flex flex-col justify-end shadow-inner">
                            {scanLog.map((log, i) => (
                                <div key={i} className="mb-1 text-green-400 animate-in slide-in-from-left-2 fade-in">
                                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {'>'} {log}
                                </div>
                            ))}
                            <div className="w-2 h-4 bg-green-500 animate-pulse inline-block"></div>
                        </div>
                    </div>
                </ScannerFrame>
            </div>
        );
    }

    if (step === 5 && result) {
        return (
            <div className="py-20 px-4 animate-in zoom-in duration-500">
                <ScannerFrame title={t.valResult} icon={<CheckCircle2 className="w-6 h-6" />}>
                    <div className="flex flex-col items-center text-center justify-center h-full">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Zap className="w-12 h-12 text-emerald-400" />
                        </div>

                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 max-w-lg w-full relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500"></div>

                            <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-4">Market Valuation Certificate</h3>

                            <div className="prose prose-invert mx-auto">
                                <p className="whitespace-pre-line text-xl md:text-2xl text-white font-bold leading-relaxed">
                                    {result}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
                                <span>VALID FOR: 48 HOURS</span>
                                <span>REF: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            <button
                                onClick={resetScanner}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                            >
                                <RotateCcw className="w-4 h-4" /> {settings.valuation?.resetBtn || 'Reset Scanner'}
                            </button>
                            <button
                                onClick={handleSaveQuote}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-900/50 hover:bg-blue-900 text-blue-300 border border-blue-500/30 transition-all"
                            >
                                <Save className="w-4 h-4" /> {settings.valuation?.saveBtn || 'Save Quote'}
                            </button>
                            <button
                                onClick={handleSellDevice}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-emerald-900/30 transition-all"
                            >
                                <BadgeEuro className="w-4 h-4" /> {settings.valuation?.sellBtn || 'Sell Device'}
                            </button>
                        </div>
                    </div>
                </ScannerFrame>
            </div>
        );
    }

    return (
        <div className="py-20 px-4">
            <ScannerFrame
                title={
                    step === 1
                        ? (selectedBrand ? (settings?.valuation?.step1ModelTitle || 'Select Model Blueprint') : (settings?.valuation?.step1Title || 'Select Manufacturer'))
                        : step === 2
                            ? (settings?.valuation?.step2Title || t.valuationStep2) // Storage
                            : step === 3
                                ? 'Select Battery Status' // Battery (New Step)
                                : (settings?.valuation?.step3Title || t.valuationStep3) // Condition
                }
                icon={<ScanLine className="w-6 h-6" />}
            >
                {/* STEP 1: BRAND SELECTION */}
                {step === 1 && !selectedBrand && (
                    <div className="h-full flex flex-col justify-center">
                        {settings?.valuation?.step1Subtitle && <p className="text-center text-slate-400 mb-6 font-mono text-sm">{settings.valuation.step1Subtitle}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right">
                            {activeBrands.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => handleBrandSelect(b.id)}
                                    className="group relative p-8 bg-slate-900/50 hover:bg-cyan-950/30 border border-slate-700 hover:border-cyan-500 rounded-3xl transition-all duration-300 flex flex-col items-center gap-4 overflow-hidden"
                                >
                                    <div className="text-5xl filter grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">{b.icon}</div>
                                    <div className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest">{b.name}</div>
                                    <div className="absolute inset-0 border-2 border-cyan-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 1.5: MODEL SELECTION (FILTERED) */}
                {step === 1 && selectedBrand && (
                    <div className="h-full flex flex-col">
                        <button
                            onClick={() => setSelectedBrand(null)}
                            className="self-start mb-6 flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <ChevronLeft className="w-4 h-4" /> Return to Brands
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right flex-1 content-start">
                            {activeModels.filter(m => m.brandId === selectedBrand || m.brand === selectedBrand).map((m) => ( // Fallback to 'brand' property for backward compatibility with hardcoded data if needed
                                <button
                                    key={m.id}
                                    onClick={() => handleModelSelect(m.name)}
                                    className="group relative p-6 bg-slate-900/50 hover:bg-cyan-950/30 border border-slate-700 hover:border-cyan-500 rounded-2xl transition-all duration-300 flex items-center gap-4 text-left overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl group-hover:bg-cyan-900/20 transition-colors">
                                        <Layers className="w-6 h-6 text-slate-500 group-hover:text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{m.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">BLUEPRINT_V1.0</div>
                                    </div>
                                    {/* Selection Indicator */}
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: STORAGE SELECTOR */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-right">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                                {activeStorage.map((s) => (
                                    <button
                                        key={s.label}
                                        onClick={() => handleStorageSelect(s.label)}
                                        className="relative group h-32 flex flex-col items-center justify-center bg-slate-900/50 border border-slate-700 hover:border-purple-500 rounded-2xl transition-all"
                                    >
                                        <HardDrive className="w-8 h-8 text-slate-600 group-hover:text-purple-400 mb-2 transition-colors" />
                                        <span className="text-xl font-bold text-white group-hover:text-purple-300">{s.label}</span>
                                        <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 animate-pulse"></div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} className="mt-12 flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors">
                                <ChevronLeft className="w-4 h-4" /> {t.back}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: BATTERY HEALTH SELECTOR */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-right w-full max-w-3xl mx-auto">
                        <div className="w-full bg-slate-900/50 p-8 rounded-3xl border border-slate-700">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Battery Health</h3>
                                    <p className="text-slate-400 text-sm">Check Maximum Capacity in Settings &gt; Battery</p>
                                </div>
                                <div className={`text-4xl font-mono font-bold ${(formData.batteryHealth || 100) > 85 ? 'text-emerald-400' :
                                    (formData.batteryHealth || 100) > 80 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {formData.batteryHealth || 100}%
                                </div>
                            </div>

                            <input
                                type="range"
                                min="50"
                                max="100"
                                step="1"
                                value={formData.batteryHealth || 100}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setFormData({ ...formData, batteryHealth: val, battery: val > 90 ? 'new' : 'old' });
                                }}
                                className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all mb-12"
                            />

                            <div className="grid grid-cols-3 gap-4 text-center text-xs font-mono text-slate-500">
                                <div>
                                    SERVICE REQUIRED
                                    <div className="h-1 w-full bg-red-900/30 mt-2 rounded"></div>
                                </div>
                                <div>
                                    DEGRADED
                                    <div className="h-1 w-full bg-yellow-900/30 mt-2 rounded"></div>
                                </div>
                                <div>
                                    PEAK PERFORMANCE
                                    <div className="h-1 w-full bg-emerald-900/30 mt-2 rounded"></div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setStep(4)} className="mt-8 w-full max-w-md py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2">
                            Confim Battery Health <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>

                        <button onClick={() => setStep(2)} className="mt-4 flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors">
                            <ChevronLeft className="w-4 h-4" /> {t.back}
                        </button>
                    </div>
                )}

                {/* STEP 4: CONDITION SELECTOR (Redesigned) */}
                {step === 4 && (
                    <div className="flex flex-col w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-right space-y-4">
                        {activeConditions.map((condition) => {
                            // Calculate price preview for this specific condition
                            const previewPrice = calculatePriceValue(
                                { ...formData, condition: condition.id },
                                settings,
                                selectedDevice?.basePrice,
                                selectedDevice
                            );

                            const description = selectedDevice?.priceConfig?.conditionDescriptions?.[condition.id]
                                || {
                                    'new': "Neu und unbenutzt. Du hast das Gerät weder verwendet noch ausgepackt.",
                                    'like_new': "Absolut makellos! Auch nach langem Suchen findest du nicht die kleinste Gebrauchsspur.",
                                    'good': "Einige leichte Gebrauchsspuren wie feine Kratzer auf dem Display.",
                                    'fair': "Deutliche Kratzer oder Kerben am Rahmen oder Display.",
                                    'broken': "Das Gerät hat schwere Schäden, Risse oder technische Defekte."
                                }[condition.id]
                                || "Standardzustand";

                            const isSelected = formData.condition === condition.id;

                            return (
                                <div
                                    key={condition.id}
                                    onClick={() => setFormData(prev => ({ ...prev, condition: condition.id }))}
                                    className={`relative p-6 border rounded-xl cursor-pointer transition-all duration-200 group
                                        ${isSelected
                                            ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            {/* Radio Indicator */}
                                            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0
                                                ${isSelected ? 'border-cyan-400' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                                            </div>

                                            {/* Text Content */}
                                            <div>
                                                <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                    {condition.label}
                                                </h3>
                                                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Price Preview */}
                                        <div className="text-right shrink-0">
                                            <div className="text-xl font-mono font-bold text-emerald-400">
                                                {previewPrice} €
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Accessories Toggle */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 flex items-center justify-between hover:border-slate-500 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-lg">Full Kit</span>
                                <span className="text-xs text-slate-500">Box, Cable & Manuals included</span>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, accessories: !formData.accessories })}
                                className={`w-16 h-9 rounded-full p-1 transition-all duration-300 ${formData.accessories ? 'bg-cyan-600 shadow-[0_0_15px_#0891b2]' : 'bg-slate-700'}`}
                            >
                                <div className={`w-7 h-7 bg-white rounded-full transition-transform duration-300 shadow-md ${formData.accessories ? 'translate-x-7' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold">
                                {t.back}
                            </button>
                            <button
                                onClick={startScan}
                                disabled={!formData.condition}
                                className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
                            >
                                <Zap className="w-5 h-5 fill-white" /> {t.submit}
                            </button>
                        </div>
                    </div>
                )}
            </ScannerFrame>
        </div>
    );
};
