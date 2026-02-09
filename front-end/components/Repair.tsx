import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Search, Wrench, Clock, MessageSquare, Zap, Activity, ChevronRight, Cpu, Smartphone, AlertTriangle, Battery, Monitor, Cable, Camera, ScanLine, X, ShieldCheck } from 'lucide-react';
// import { getRepairAdvice } from '../services/geminiService'; // Removed


import { translations } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { api } from '../utils/api';

// --- DATA STRUCTURES ---

type ServiceType = 'screen' | 'battery' | 'charging' | 'camera' | 'backglass' | 'faceid';

interface RepairServiceItem {
    type: ServiceType;
    label: string;
    price: number;
    duration: string;
    warranty: string;
}

interface RepairDevice {
    id: string;
    model: string;
    brand: string;
    image: string;
    services: RepairServiceItem[];
}



const getServiceIcon = (type: ServiceType) => {
    switch (type) {
        case 'screen': return <Monitor className="w-5 h-5" />;
        case 'battery': return <Battery className="w-5 h-5" />;
        case 'charging': return <Cable className="w-5 h-5" />;
        case 'camera': return <Camera className="w-5 h-5" />;
        case 'backglass': return <ScanLine className="w-5 h-5" />;
        case 'faceid': return <ShieldCheck className="w-5 h-5" />;
        default: return <Wrench className="w-5 h-5" />;
    }
};

interface RepairProps {
    lang: LanguageCode;
}

export const Repair: React.FC<RepairProps> = ({ lang }) => {
    const t = translations[lang];
    const { settings } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [loadingAdvice, setLoadingAdvice] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<RepairDevice | null>(null);
    const [repairCatalog, setRepairCatalog] = useState<RepairDevice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRepairs = async () => {
            try {
                const data = await api.get<RepairDevice[]>('/api/repairs');
                if (Array.isArray(data)) {
                    setRepairCatalog(data);
                } else {
                    console.error("Invalid repairs data format", data);
                    setRepairCatalog([]);
                }
            } catch (err) {
                console.error("Failed to load repairs", err);
            } finally {
                setLoading(false);
            }
        };
        loadRepairs();
    }, []);

    // Backend fetch removed as per cleanup request
    const fetchRepairCatalog = () => { };

    const filteredDevices = repairCatalog.filter(device =>
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleGetAdvice = async () => {
        if (!searchTerm) return;

        setLoadingAdvice(true);
        setAiAdvice('');

        // Mock Advice
        setTimeout(() => {
            setAiAdvice(`(Mock AI Advice) based on your search for ${searchTerm}: Ensure you back up your data locally. Diagnostic scan recommended.`);
            setLoadingAdvice(false);
        }, 1500);
    };

    // Helper to get image URL
    const getImageUrl = (url: string) => {
        if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:5000${url}`;
    };

    return (
        <div className="relative min-h-screen py-20 overflow-hidden bg-slate-900">

            {/* Abstract Background Tech Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

            {/* --- SERVICE DETAIL MODAL (BLUEPRINT STYLE) --- */}
            {selectedDevice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row max-h-[85vh]">

                        {/* Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                        <button
                            onClick={() => setSelectedDevice(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors border border-slate-700"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* LEFT: Device Visual & ID */}
                        <div className="w-full md:w-1/3 bg-slate-900/50 border-r border-slate-800 p-8 flex flex-col items-center justify-center relative">
                            <div className="text-xs font-mono text-blue-500 mb-4 tracking-widest uppercase">Target System</div>
                            <div className="relative w-48 h-64 mb-6 group">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <img
                                    src={getImageUrl(selectedDevice.image)}
                                    alt={selectedDevice.model}
                                    className="relative w-full h-full object-contain drop-shadow-2xl z-10"
                                />
                                {/* Scan Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-[scan_2s_linear_infinite] opacity-50 z-20"></div>
                            </div>
                            <h3 className="text-xl font-black text-white text-center mb-1">{selectedDevice.model}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-black/40 px-3 py-1 rounded-full border border-slate-800">
                                <Cpu className="w-3 h-3" />
                                <span>ID: {selectedDevice.id?.toUpperCase() || 'N/A'}</span>
                            </div>
                        </div>

                        {/* RIGHT: Service List */}
                        <div className="w-full md:w-2/3 p-8 overflow-y-auto bg-slate-950/80">
                            <div className="flex items-center gap-2 mb-6">
                                <Activity className="w-5 h-5 text-blue-400" />
                                <h4 className="text-lg font-bold text-white uppercase tracking-wider">Available Diagnostics & Repairs</h4>
                            </div>

                            <div className="space-y-3">
                                {selectedDevice.services.map((service, idx) => (
                                    <div
                                        key={idx}
                                        className="group relative bg-black/40 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 hover:bg-blue-900/5"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                                                    {getServiceIcon(service.type)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-blue-200 transition-colors">{service.label}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {service.duration}
                                                        </span>
                                                        <span className="text-xs text-slate-500 flex items-center gap-1 border-l border-slate-800 pl-3">
                                                            <ShieldCheck className="w-3 h-3" /> {service.warranty}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-blue-400">{service.price}{t.currency}</div>
                                                <button className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors shadow-lg shadow-blue-900/20">
                                                    Initialize
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 font-mono">
                                <p>NOTE: Prices include labor and premium parts. Diagnostic scan required before final repair confirmation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-6 h-6 text-blue-500 animate-spin-slow" />
                            <span className="text-blue-500 font-mono text-sm tracking-widest uppercase">Maintenance_Ops_V4</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white">
                            {settings?.content?.repairTitle || t.repairTitle}
                        </h2>
                        <p className="text-slate-400 mt-2 font-light border-l-2 border-blue-900 pl-4">
                            {settings?.content?.repairSubtitle || t.repairSubtitle}
                        </p>
                    </div>

                    {/* AI Diagnostic Button */}
                    {searchTerm && (
                        <button
                            onClick={handleGetAdvice}
                            disabled={loadingAdvice}
                            className="group relative px-6 py-3 bg-blue-900/20 border border-blue-500/30 rounded-xl overflow-hidden hover:bg-blue-900/40 transition-all"
                        >
                            <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center gap-2 text-blue-400 font-bold text-sm">
                                {loadingAdvice ? <Activity className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                {loadingAdvice ? 'ANALYZING_DATA...' : t.getAdvice}
                            </div>
                        </button>
                    )}
                </div>

                {/* Search & Interface Panel */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-3xl p-1 mb-10 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="SEARCH DEVICE MODEL (e.g. iPhone 15, S24)..."
                            className="w-full pl-14 pr-6 py-5 bg-black/50 border border-transparent rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-lg font-mono placeholder:text-slate-600 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-5 top-5 text-slate-500">
                            <Search className="w-6 h-6" />
                        </div>

                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-50 hidden md:flex">
                            <span className="text-[10px] text-blue-400 border border-blue-900 px-2 py-0.5 rounded bg-blue-900/20">CMD</span>
                            <span className="text-[10px] text-slate-500">SYSTEM_READY</span>
                        </div>
                    </div>
                </div>

                {/* AI Output Console */}
                {aiAdvice && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-black border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
                            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <span className="text-xs text-blue-400 font-mono ml-2">AI_TECHNICIAN_LOG</span>
                            </div>
                            <div className="p-6 font-mono text-sm leading-relaxed text-blue-100">
                                <div className="flex gap-2 text-blue-500 mb-2">
                                    <span>{'>'}</span>
                                    <span className="animate-pulse">_</span>
                                </div>
                                {aiAdvice}
                            </div>
                        </div>
                    </div>
                )}

                {/* DEVICE CATALOG GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDevices.length > 0 ? (
                        filteredDevices.map((device) => (
                            <button
                                key={device.id}
                                onClick={() => setSelectedDevice(device)}
                                className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:bg-slate-800/60 text-left w-full"
                            >
                                {/* Status Light */}
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-blue-400 transition-colors">
                                        {device.services?.length || 0} Services
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                                </div>

                                <div className="flex items-center gap-6 mb-6">
                                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                                        <img src={getImageUrl(device.image)} alt={device.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">{device.brand}</div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{device.model}</h3>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                        <span className="text-slate-500 text-xs flex items-center gap-2">
                                            <Monitor className="w-3 h-3" /> Screen Repair
                                        </span>
                                        <span className="text-white font-mono text-xs font-bold">{device.services?.find(s => s.type === 'screen')?.price || 'N/A'}{t.currency}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800/50 group-hover:border-blue-500/20 transition-colors">
                                        <span className="text-slate-500 text-xs flex items-center gap-2">
                                            <Battery className="w-3 h-3" /> Battery
                                        </span>
                                        <span className="text-white font-mono text-xs font-bold">{device.services?.find(s => s.type === 'battery')?.price || 'N/A'}{t.currency}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4 group-hover:border-blue-500/20">
                                    <span className="text-xs text-slate-500 font-mono">STATUS: SERVICEABLE</span>
                                    <div className="flex items-center gap-1 text-blue-500 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                        Open Diagnostics <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Devices Found</h3>
                            <p className="text-slate-500">Try adjusting your search parameters.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};