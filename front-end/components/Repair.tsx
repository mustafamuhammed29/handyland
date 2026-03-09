import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Search, Wrench, Clock, MessageSquare, Zap, Activity, ChevronRight, Cpu, Smartphone, AlertTriangle, Battery, Monitor, Cable, Camera, ScanLine, X, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { getRepairAdvice } from '../services/geminiService'; // Removed


import { translations } from '../i18n';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

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
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<RepairDevice | null>(null);
    const [repairCatalog, setRepairCatalog] = useState<RepairDevice[]>([]);
    const [loading, setLoading] = useState(true);

    // Ticket Modal State
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [selectedServiceForTicket, setSelectedServiceForTicket] = useState<{ device: string, service: string } | null>(null);
    const [ticketForm, setTicketForm] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadRepairs = async () => {
            try {
                const response = await api.get<RepairDevice[]>('/api/repairs');

                // Axios returns the data in the .data property, but interceptor already unwraps it
                // So 'response' IS the data (RepairDevice[])
                const repairsData = (Array.isArray(response) ? response : response['data']) || [];

                if (Array.isArray(repairsData)) {
                    setRepairCatalog(repairsData);
                } else {
                    setRepairCatalog([]);
                }
            } catch (err) {
                addToast('Failed to load repair catalog. Check console.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadRepairs();
    }, []);

    const handleGetAdvice = () => {
        navigate('/contact');
    };

    const filteredDevices = repairCatalog.filter(device =>
        device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleContactSupport = () => {
        navigate('/contact');
    };

    const handleOpenTicketModal = (deviceModel: string, serviceLabel?: string) => {
        setSelectedServiceForTicket({ device: deviceModel, service: serviceLabel || 'General Diagnostic' });
        setShowTicketModal(true);
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServiceForTicket) return;
        setSubmitting(true);
        try {
            const payload: any = {
                device: selectedServiceForTicket.device,
                issue: selectedServiceForTicket.service,
                notes: ticketForm.notes,
                serviceType: 'In-Store'
            };

            if (!isAuthenticated) {
                payload.guestContact = {
                    name: ticketForm.name,
                    email: ticketForm.email,
                    phone: ticketForm.phone
                };
            }

            const response = await api.post('/api/repairs/tickets', payload);
            if (response.data?.success) {
                addToast('Repair Ticket Created Successfully!', 'success');
                setShowTicketModal(false);
                setSelectedDevice(null);
                setTicketForm({ name: '', email: '', phone: '', notes: '' });
                // Redirect user to track repair with their new ticket ID
                setTimeout(() => {
                    navigate('/track-repair', { state: { ticketId: response.data.ticket.ticketId, email: ticketForm.email } });
                }, 1500);
            }
        } catch (error) {
            console.error('Ticket creation error', error);
            addToast('Failed to create repair ticket. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
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
                            type="button"
                            aria-label="Close Details"
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
                                {(selectedDevice.services || []).map((service, idx) => (
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
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <div className="text-xl font-bold text-blue-400">{service.price}{t.currency}</div>
                                                <button
                                                    onClick={() => handleOpenTicketModal(selectedDevice.model, service.label)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                                                >
                                                    <Wrench className="w-3 h-3" /> Book Repair
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
                            <Wrench className="w-6 h-6 text-blue-500" />
                            <span className="text-blue-500 font-mono text-sm tracking-widest uppercase">Repair Service</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white">
                            {settings?.content?.repairTitle || t.repairTitle}
                        </h2>
                        <p className="text-slate-400 mt-2 font-light border-l-2 border-blue-900 pl-4">
                            {settings?.content?.repairSubtitle || t.repairSubtitle}
                        </p>
                    </div>

                    {/* Contact Support / Create Custom Ticket */}
                    {searchTerm && (
                        <button
                            onClick={() => handleOpenTicketModal(searchTerm, 'Custom Diagnostics requested from Search')}
                            className="group relative px-6 py-3 bg-blue-900/20 border border-blue-500/30 rounded-xl overflow-hidden hover:bg-blue-900/40 transition-all"
                        >
                            <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center gap-2 text-blue-400 font-bold text-sm">
                                <Activity className="w-4 h-4" />
                                Request Custom Diagnostics
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

            {/* --- REPAIR TICKET MODAL --- */}
            {showTicketModal && selectedServiceForTicket && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
                        <button
                            onClick={() => setShowTicketModal(false)}
                            aria-label="Close form"
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-black text-white mb-2">Request Repair Ticket</h3>
                            <p className="text-slate-400 text-sm mb-6">You are booking a repair for <strong className="text-blue-400">{selectedServiceForTicket.device}</strong> ({selectedServiceForTicket.service}). Our team will review this request and contact you.</p>

                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                {!isAuthenticated && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={ticketForm.name}
                                                onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Email Address *</label>
                                            <input
                                                type="email"
                                                required
                                                value={ticketForm.email}
                                                onChange={e => setTicketForm({ ...ticketForm, email: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">We need your email so you can track your repair progress later online.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Phone Number</label>
                                            <input
                                                type="text"
                                                value={ticketForm.phone}
                                                onChange={e => setTicketForm({ ...ticketForm, phone: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Additional Notes <span className="font-normal normal-case opacity-50">(Optional)</span></label>
                                    <textarea
                                        rows={3}
                                        value={ticketForm.notes}
                                        onChange={e => setTicketForm({ ...ticketForm, notes: e.target.value })}
                                        placeholder="Describe the issue in more detail if needed..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex justify-center items-center"
                                >
                                    {submitting ? 'Creating Ticket...' : 'Confirm Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};