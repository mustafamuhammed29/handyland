import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Plus, Search, Trash2, Edit, Save, X, Calculator, ClipboardList, Package, Banknote, TrendingUp, ChevronDown, ChevronUp, MessageSquare, Send, AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const PriceResearchManager = lazy(() => import('./PriceResearchManager'));

interface ScreenModifiers {
    hervorragend: number;
    sehr_gut: number;
    gut: number;
    beschadigt: number;
}

interface BodyModifiers {
    hervorragend: number;
    sehr_gut: number;
    gut: number;
    beschadigt: number;
}

interface DeviceBlueprint {
    _id: string;
    brand: string;
    modelName: string;
    basePrice: number;
    validStorages: string[];
    imageUrl?: string;
    storagePrices: Record<string, number>;
    screenModifiers: ScreenModifiers;
    bodyModifiers: BodyModifiers;
    functionalMultiplier: number;
    nonFunctionalMultiplier: number;
}

interface Quote {
    _id: string;
    quoteReference: string;
    device: string;
    estimatedValue: number;
    status: string;
    createdAt: string;
    contact?: { name?: string; email?: string; phone?: string };
    user?: { name?: string; email?: string; phone?: string; firstName?: string; lastName?: string };
    shippingAddress?: { address?: string; city?: string; postalCode?: string };
    paymentDetails?: { iban?: string; bankName?: string };
    specs?: string;
    condition?: string;
}

const BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'Other'];
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const CONDITION_LABELS: Record<string, string> = {
    hervorragend: '⭐ Hervorragend',
    sehr_gut: '✅ Sehr Gut',
    gut: '👍 Gut',
    beschadigt: '⚠️ Beschädigt'
};

const DEFAULT_FORM: Partial<DeviceBlueprint> = {
    brand: 'Apple',
    modelName: '',
    imageUrl: '',
    basePrice: 200,
    validStorages: ['128GB', '256GB'],
    storagePrices: { '128GB': 0, '256GB': 30 },
    screenModifiers: { hervorragend: 1.0, sehr_gut: 0.9, gut: 0.75, beschadigt: 0.5 },
    bodyModifiers: { hervorragend: 1.0, sehr_gut: 0.95, gut: 0.85, beschadigt: 0.6 },
    functionalMultiplier: 1.0,
    nonFunctionalMultiplier: 0.4,
};

const ValuationManager = () => {
    const [activeSection, setActiveSection] = useState<'blueprints' | 'quotes' | 'research'>('blueprints');

    // --- BLUEPRINTS STATE ---
    const [devices, setDevices] = useState<DeviceBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Blueprints Pagination & Search
    const [bpSearchTerm, setBpSearchTerm] = useState('');
    const debouncedBpSearch = useDebounce(bpSearchTerm, 500);
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [bpPage, setBpPage] = useState(1);
    const [bpTotalPages, setBpTotalPages] = useState(1);
    const bpLimit = 15;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<DeviceBlueprint | null>(null);
    const [formData, setFormData] = useState<Partial<DeviceBlueprint>>(DEFAULT_FORM);
    const [modalTab, setModalTab] = useState<'general' | 'storage' | 'screen' | 'body' | 'functionality' | 'simulator'>('general');

    // --- QUOTES STATE ---
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [quoteStats, setQuoteStats] = useState({ todayCount: 0, totalPaidValue: 0, pendingCount: 0, totalCount: 0 });
    
    // Quotes Pagination & Search
    const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
    const debouncedQuoteSearch = useDebounce(quoteSearchTerm, 500);
    const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('All');
    const [quotePage, setQuotePage] = useState(1);
    const [quoteTotalPages, setQuoteTotalPages] = useState(1);
    const quoteLimit = 20;

    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

    // Status Change Dialog State
    const [statusDialog, setStatusDialog] = useState<{ open: boolean; quoteId: string; newStatus: string; customerEmail: string; customerName: string; message: string } | null>(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

    // Purchase Dialog State
    const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; quote: any; deviceImei: string; digitalSignature: string } | null>(null);
    const [completingPurchase, setCompletingPurchase] = useState(false);

    // Selection & Bulk ops
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [reseeding, setReseeding] = useState(false);

    // Simulator
    const [simState, setSimState] = useState({
        storage: '128GB',
        screenCondition: 'hervorragend',
        bodyCondition: 'hervorragend',
        isFunctional: true
    });

    // Reset page on search or filter change
    useEffect(() => { setBpPage(1); }, [debouncedBpSearch, selectedBrand]);
    useEffect(() => { setQuotePage(1); }, [debouncedQuoteSearch, quoteFilterStatus]);

    // Fetch data based on active section
    useEffect(() => {
        if (activeSection === 'blueprints') fetchDevices();
    }, [activeSection, bpPage, debouncedBpSearch, selectedBrand]);

    useEffect(() => {
        if (activeSection === 'quotes') fetchQuotes();
    }, [activeSection, quotePage, debouncedQuoteSearch, quoteFilterStatus]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: bpPage.toString(),
                limit: bpLimit.toString(),
                search: debouncedBpSearch,
                brand: selectedBrand
            });
            const { data } = await api.get(`/api/valuation/devices?${queryParams.toString()}`);
            if (data.success) {
                setDevices(data.blueprints || []);
                setBpTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) {
                // Fallback for older format if backend not updated
                setDevices(data);
                setBpTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuotes = async () => {
        setQuotesLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: quotePage.toString(),
                limit: quoteLimit.toString(),
                search: debouncedQuoteSearch,
                status: quoteFilterStatus !== 'All' ? quoteFilterStatus : ''
            });
            const { data }: any = await api.get(`/api/valuation/admin/quotes?${queryParams.toString()}`);
            if (data.success) {
                setQuotes(data.quotes || []);
                setQuoteStats(data.stats || { todayCount: 0, totalPaidValue: 0, pendingCount: 0, totalCount: 0 });
                setQuoteTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching quotes:', error);
        } finally {
            setQuotesLoading(false);
        }
    };

    const STATUS_MESSAGES: Record<string, string> = {
        pending_shipment: 'Hallo {name},\n\nDein Angebot (Ref: {ref}) wurde erfolgreich geprüft. Bitte sende dein Gerät an die angegebene Adresse. Wir warten auf deinen Versand.\n\nMit freundlichen Grüßen,\nDas HandyLand Team',
        received: 'Hallo {name},\n\nWir haben dein Gerät ({device}) erfolgreich erhalten und prüfen es aktuell. Du wirst in Kürze eine Bestätigung und deinen Auszahlungsbetrag von €{value} erhalten.\n\nMit freundlichen Grüßen,\nDas HandyLand Team',
        paid: 'Hallo {name},\n\nWir freuen uns, dir mitteilen zu können, dass die Zahlung von €{value} für dein Gerät ({device}) erfolgreich auf dein Konto überwiesen wurde!\n\nVielen Dank für dein Vertrauen.\nDas HandyLand Team',
        active: 'Hallo {name},\n\nDein Angebot für {device} wurde aktualisiert. Bitte überprüfe deinen Status in deinem Kundenkonto.\n\nMit freundlichen Grüßen,\nDas HandyLand Team',
    };

    const openStatusDialog = (quote: Quote, newStatus: string) => {
        const email = quote.contact?.email || quote.user?.email || '';
        const name = quote.user?.firstName ? `${quote.user.firstName} ${quote.user.lastName || ''}`.trim() : (quote.contact?.name || quote.user?.name || 'Kunde');
        const templateMsg = (STATUS_MESSAGES[newStatus] || '')
            .replace('{name}', name)
            .replace(/{ref}/g, quote.quoteReference)
            .replace(/{device}/g, quote.device)
            .replace(/{value}/g, String(quote.estimatedValue));
        setStatusDialog({ open: true, quoteId: quote._id, newStatus, customerEmail: email, customerName: name, message: templateMsg });
    };

    const handleStatusChange = async (skipMessage = false) => {
        if (!statusDialog) return;
        const { quoteId, newStatus, message } = statusDialog;
        setUpdatingStatus(quoteId);
        setSendingMessage(true);
        try {
            await api.put(`/api/valuation/admin/quotes/${quoteId}/status`, {
                status: newStatus,
                adminMessage: skipMessage ? '' : message
            });
            setQuotes(prev => prev.map(q => q._id === quoteId ? { ...q, status: newStatus } : q));
            setStatusSuccess(`Status erfolgreich auf "${newStatus}" geändert!`);
            setTimeout(() => setStatusSuccess(null), 3000);
            fetchQuotes(); // Refresh to get updated stats
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingStatus(null);
            setSendingMessage(false);
            setStatusDialog(null);
        }
    };

    const handleCompletePurchase = async () => {
        if (!purchaseDialog) return;
        setCompletingPurchase(true);
        try {
            await api.post(`/api/valuation/admin/quotes/${purchaseDialog.quote._id}/complete-purchase`, {
                deviceImei: purchaseDialog.deviceImei,
                digitalSignature: purchaseDialog.digitalSignature
            });
            setQuotes(prev => prev.map(q => q._id === purchaseDialog.quote._id ? { ...q, status: 'paid' } : q));
            toast.success('Ankauf erfolgreich! Gerät wurde als "Gebraucht" zum Inventar hinzugefügt.');
            fetchQuotes();
            setPurchaseDialog(null);
        } catch (error) {
            console.error('Error completing purchase:', error);
            toast.error('Fehler beim Kaufabschluss.');
        } finally {
            setCompletingPurchase(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
            const data = await res.json();
            if (data.imageUrl) setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        } catch (error) { console.error('Error uploading image:', error); }
    };

    const handleSave = async () => {
        try {
            if (editingDevice?._id) {
                await api.put(`/api/valuation/devices/${editingDevice._id}`, formData);
            } else {
                await api.post('/api/valuation/devices', formData);
            }
            closeModal();
            fetchDevices();
            toast.success('Gerät erfolgreich gespeichert.');
        } catch (error) {
            console.error('Error saving device:', error);
            toast.error('Failed to save device. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this blueprint?')) return;
        try {
            await api.delete(`/api/valuation/devices/${id}`);
            setSelectedIds(prev => prev.filter(i => i !== id));
            fetchDevices();
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const handleBulkDelete = async (deleteAll = false) => {
        const count = deleteAll ? 'ALLE' : selectedIds.length;
        if (!window.confirm(`Wirklich ${count} Gerät(e) löschen? Dies kann nicht rückgängig gemacht werden!`)) return;
        try {
            await api.delete('/api/valuation/devices', {
                data: deleteAll ? { deleteAll: true } : { ids: selectedIds }
            });
            setSelectedIds([]);
            fetchDevices();
        } catch (error) {
            console.error('Error bulk deleting:', error);
        }
    };

    const handleReseed = async () => {
        if (!window.confirm('Alle Geräte mit aktuellen Marktpreisen aktualisieren? (seedDevices.js wird ausgeführt)')) return;
        setReseeding(true);
        try {
            await api.post('/api/valuation/devices/reseed', {});
            fetchDevices();
            toast.success('Geräte erfolgreich aktualisiert!');
        } catch (error) {
            console.error('Reseed failed:', error);
            toast.error('Reseed fehlgeschlagen.');
        } finally {
            setReseeding(false);
        }
    };

    const openEdit = (device: DeviceBlueprint) => {
        setEditingDevice(device);
        setFormData({ ...device });
        setModalTab('general');
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingDevice(null);
        setFormData({ ...DEFAULT_FORM });
        setModalTab('general');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDevice(null);
    };

    const toggleStorage = (storage: string) => {
        setFormData(prev => {
            const current = prev.validStorages || [];
            const next = current.includes(storage)
                ? current.filter(s => s !== storage)
                : [...current, storage];

            const newPrices = { ...(prev.storagePrices || {}) };
            if (!current.includes(storage)) newPrices[storage] = 0;

            return { ...prev, validStorages: next, storagePrices: newPrices };
        });
    };

    const setStoragePrice = (storage: string, price: number) => {
        setFormData(prev => ({
            ...prev,
            storagePrices: { ...(prev.storagePrices || {}), [storage]: price }
        }));
    };

    const setScreenMod = (key: keyof ScreenModifiers, val: number) => {
        setFormData(prev => ({
            ...prev,
            screenModifiers: { ...(prev.screenModifiers as ScreenModifiers), [key]: val }
        }));
    };

    const setBodyMod = (key: keyof BodyModifiers, val: number) => {
        setFormData(prev => ({
            ...prev,
            bodyModifiers: { ...(prev.bodyModifiers as BodyModifiers), [key]: val }
        }));
    };

    const calculateSimulatedPrice = (): number => {
        const base = formData.basePrice || 0;
        const storageAddon = (formData.storagePrices || {})[simState.storage] || 0;
        let price = base + storageAddon;

        const screenMult = (formData.screenModifiers as ScreenModifiers)?.[simState.screenCondition as keyof ScreenModifiers] ?? 0.75;
        price = price * screenMult;

        const bodyMult = (formData.bodyModifiers as BodyModifiers)?.[simState.bodyCondition as keyof BodyModifiers] ?? 0.85;
        price = price * bodyMult;

        if (simState.isFunctional) {
            price = price * (formData.functionalMultiplier ?? 1.0);
        } else {
            price = price * (formData.nonFunctionalMultiplier ?? 0.4);
        }

        const floor = base * 0.15;
        if (price < floor) price = floor;

        return Math.max(0, Math.round(price / 5) * 5);
    };

    const tabs = [
        { id: 'general', label: '📱 General' },
        { id: 'storage', label: '💾 Storage' },
        { id: 'screen', label: '🖥️ Screen' },
        { id: 'body', label: '🛡️ Body' },
        { id: 'functionality', label: '⚡ Function' },
        { id: 'simulator', label: '🧮 Simulator' },
    ] as const;

    return (
        <div className="p-6 max-w-7xl mx-auto text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                        Valuation Manager
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Gerätepreise (Blueprints) und Kundenangebote (Quotes) verwalten</p>
                </div>
                {activeSection === 'blueprints' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Reseed Button */}
                        <button
                            onClick={handleReseed}
                            disabled={reseeding}
                            title="Alle Geräte mit aktuellen Marktpreisen neu laden"
                            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            {reseeding ? '⏳' : '🔄'} {reseeding ? 'Updating...' : 'Update Preise'}
                        </button>
                        {/* Delete All */}
                        <button
                            onClick={() => handleBulkDelete(true)}
                            title="Alle Blueprints löschen"
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            <Trash2 size={16} /> Alle löschen
                        </button>
                        {/* Add New */}
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-900/40 transition-all text-white border border-white/10"
                        >
                            <Plus size={20} /> Neues Blueprint
                        </button>
                    </div>
                )}
            </div>

            {/* Top-level Section Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
                <button
                    onClick={() => setActiveSection('blueprints')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors ${activeSection === 'blueprints'
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5 rounded-t-lg'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Calculator size={16} /> Blueprints
                </button>
                <button
                    onClick={() => setActiveSection('quotes')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors ${activeSection === 'quotes'
                        ? 'border-blue-400 text-blue-400 bg-blue-400/5 rounded-t-lg'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <ClipboardList size={16} /> Angebote (Quotes)
                </button>
                <button
                    onClick={() => setActiveSection('research')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors ${activeSection === 'research'
                        ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5 rounded-t-lg'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <TrendingUp size={16} /> 📈 Preisrecherche
                </button>
            </div>

            {/* ── BLUEPRINTS SECTION ── */}
            {activeSection === 'blueprints' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-lg">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Suchen nach Modell oder Marke..."
                                value={bpSearchTerm}
                                onChange={(e) => setBpSearchTerm(e.target.value)}
                                aria-label="Search models"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-slate-900 transition-colors"
                            />
                        </div>
                        <select
                            aria-label="Filter by brand"
                            title="Filter by brand"
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="bg-slate-950/50 border border-slate-700/50 rounded-xl px-5 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold transition-colors cursor-pointer"
                        >
                            <option value="All">Alle Marken</option>
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Bulk Actions Bar */}
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="flex items-center justify-between gap-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                                    <span className="text-blue-300 font-bold">{selectedIds.length} Gerät(e) ausgewählt</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedIds([])} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-sm transition-all border border-slate-700">Abwählen</button>
                                        <button onClick={() => handleBulkDelete(false)} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-lg font-bold text-sm transition-all"><Trash2 size={14} /> Auswahl löschen</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Table */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="p-5 w-10">
                                            <input
                                                type="checkbox"
                                                aria-label="Alle auswählen"
                                                title="Alle auswählen"
                                                checked={selectedIds.length === devices.length && devices.length > 0}
                                                onChange={(e) => setSelectedIds(e.target.checked ? devices.map(d => d._id) : [])}
                                                className="w-4 h-4 accent-cyan-500 cursor-pointer rounded border-slate-700"
                                            />
                                        </th>
                                        <th className="p-5">Marke</th>
                                        <th className="p-5">Modell</th>
                                        <th className="p-5">Basispreis</th>
                                        <th className="p-5">Speichergrößen</th>
                                        <th className="p-5 text-right">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-500"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                    ) : devices.length === 0 ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-medium bg-slate-900/20">Keine Geräte gefunden.</td></tr>
                                    ) : (
                                        devices.map(device => (
                                            <tr key={device._id} className={`hover:bg-slate-800/40 transition-colors group ${selectedIds.includes(device._id) ? 'bg-cyan-900/10' : ''}`}>
                                                <td className="p-5">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${device.modelName}`}
                                                        checked={selectedIds.includes(device._id)}
                                                        onChange={(e) => setSelectedIds(prev =>
                                                            e.target.checked ? [...prev, device._id] : prev.filter(i => i !== device._id)
                                                        )}
                                                        className="w-4 h-4 accent-cyan-500 cursor-pointer rounded border-slate-700"
                                                    />
                                                </td>
                                                <td className="p-5"><span className="px-2.5 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-300 font-bold uppercase tracking-wider">{device.brand}</span></td>
                                                <td className="p-5 font-bold text-white text-base">{device.modelName}</td>
                                                <td className="p-5 text-emerald-400 font-mono font-black text-lg">€{device.basePrice}</td>
                                                <td className="p-5">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(device.validStorages || []).map(s => (
                                                            <span key={s} className="text-xs bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-medium">{s}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right space-x-2">
                                                    <button onClick={() => openEdit(device)} aria-label={`Edit ${device.modelName}`} className="p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(device._id)} aria-label={`Delete ${device.modelName}`} className="p-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/30 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination (Blueprints) */}
                    {bpTotalPages > 1 && !loading && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
                            <div className="text-sm font-medium text-slate-400">
                                Seite <span className="text-white">{bpPage}</span> von <span className="text-white">{bpTotalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="Previous Page"
                                    onClick={() => setBpPage(p => Math.max(1, p - 1))}
                                    disabled={bpPage === 1}
                                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    aria-label="Next Page"
                                    onClick={() => setBpPage(p => Math.min(bpTotalPages, p + 1))}
                                    disabled={bpPage === bpTotalPages}
                                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── QUOTES SECTION ── */}
            {activeSection === 'quotes' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Heute erstellt', value: quoteStats.todayCount, icon: <TrendingUp size={20} className="text-cyan-400" />, colors: 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400', blur: 'bg-cyan-500/10' },
                            { label: 'Versand ausstehend', value: quoteStats.pendingCount, icon: <Package size={20} className="text-amber-400" />, colors: 'bg-amber-500/5 border-amber-500/20 text-amber-400', blur: 'bg-amber-500/10' },
                            { label: 'Angebote Gesamt', value: quoteStats.totalCount, icon: <ClipboardList size={20} className="text-blue-400" />, colors: 'bg-blue-500/5 border-blue-500/20 text-blue-400', blur: 'bg-blue-500/10' },
                            { label: 'Gesamt Ausgezahlt', value: `€${quoteStats.totalPaidValue.toLocaleString('de-DE')}`, icon: <Banknote size={20} className="text-emerald-400" />, colors: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400', blur: 'bg-emerald-500/10' },
                        ].map(s => (
                            <div key={s.label} className={`backdrop-blur-xl border rounded-2xl p-5 relative overflow-hidden group transition-all hover:scale-[1.02] ${s.colors}`}>
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ${s.blur}`}></div>
                                <div className="flex items-center justify-between mb-2 relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">{s.label}</span>
                                    {s.icon}
                                </div>
                                <div className="text-3xl font-black relative z-10">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Controls (Search & Filter) */}
                    <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-lg">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Suchen nach Referenz (HV-...), Gerät, Kundenname oder E-Mail..."
                                value={quoteSearchTerm}
                                onChange={(e) => setQuoteSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900 transition-colors"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'All', label: 'Alle' },
                                { value: 'active', label: '⏳ Aktiv' },
                                { value: 'pending_shipment', label: '📦 Versand' },
                                { value: 'received', label: '✅ Erhalten' },
                                { value: 'paid', label: '💶 Bezahlt' }
                            ].map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => setQuoteFilterStatus(f.value)}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${quoteFilterStatus === f.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-950/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-900'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quotes Table */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-white/5">
                                    <tr>
                                        <th className="p-5 w-10"></th>
                                        <th className="p-5">Referenz</th>
                                        <th className="p-5">Gerät</th>
                                        <th className="p-5">Kunde</th>
                                        <th className="p-5">Angebotspreis</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5">Datum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {quotesLoading ? (
                                        <tr><td colSpan={7} className="p-12 text-center text-slate-500"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                    ) : quotes.length === 0 ? (
                                        <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-medium bg-slate-900/20">Keine Angebote gefunden.</td></tr>
                                    ) : (
                                        quotes.map((quote: any) => {
                                            const customerName = quote.user?.firstName ? `${quote.user.firstName} ${quote.user.lastName || ''}`.trim() : (quote.contact?.name || quote.user?.name || '—');
                                            const customerEmail = quote.user?.email || quote.contact?.email || '—';
                                            const isExpanded = expandedQuoteId === quote._id;

                                            return (
                                                <React.Fragment key={quote._id}>
                                                    <tr
                                                        onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                                                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-900/10' : ''}`}
                                                    >
                                                        <td className="p-5 text-slate-500 h-full flex items-center justify-center">
                                                            <div className="p-1.5 rounded-lg bg-slate-800/50 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <span className="font-mono text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md inline-block shadow-sm">
                                                                {quote.quoteReference}
                                                            </span>
                                                        </td>
                                                        <td className="p-5 font-bold text-white text-base">{quote.device}</td>
                                                        <td className="p-5">
                                                            <div className="text-sm font-bold text-slate-200">{customerName}</div>
                                                            <div className="text-xs text-slate-500 font-medium">{customerEmail}</div>
                                                        </td>
                                                        <td className="p-5 font-mono font-black text-emerald-400 text-lg">€{quote.estimatedValue}</td>
                                                        <td className="p-5" onClick={(e) => e.stopPropagation()}>
                                                            <div className="relative">
                                                                {updatingStatus === quote._id ? (
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                                                                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                                        Aktualisiert...
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        aria-label={`Status für ${quote.quoteReference}`}
                                                                        title={`Status: ${quote.status}`}
                                                                        value={quote.status}
                                                                        disabled={updatingStatus === quote._id}
                                                                        onChange={(e) => openStatusDialog(quote, e.target.value)}
                                                                        className={`text-xs font-bold px-3 py-2.5 rounded-lg border cursor-pointer appearance-none pr-8 outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all shadow-sm ${quote.status === 'active' ? 'text-slate-300 bg-slate-800/80 border-slate-600/50' :
                                                                            quote.status === 'pending_shipment' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                                                                                quote.status === 'received' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                                                                                    quote.status === 'paid' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                                                                        'text-slate-400 bg-slate-500/10 border-slate-500/20'
                                                                            }`}
                                                                    >
                                                                        <option value="active">⏳ Aktiv (Angebot)</option>
                                                                        <option value="pending_shipment">📦 Versand ausstehend</option>
                                                                        <option value="received">✅ Gerät erhalten</option>
                                                                        <option value="paid">💶 Bezahlt / Im Inventar</option>
                                                                    </select>
                                                                )}
                                                                {updatingStatus !== quote._id && <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />}
                                                            </div>
                                                        </td>
                                                        <td className="p-5 text-xs font-medium text-slate-400">
                                                            {new Date(quote.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                    </tr>

                                                    {/* Expandable Details Row */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={7} className="p-0 border-0">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                                                        className="overflow-hidden bg-slate-900/80 border-b border-white/5 shadow-inner"
                                                                    >
                                                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                                                                            {/* ── Konfiguration ── */}
                                                                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                                    <span className="text-purple-400 text-base">⚙️</span> Konfiguration
                                                                                </h4>
                                                                                <div className="space-y-3 text-sm">
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Variante</span>
                                                                                        <span className="font-bold text-white break-words">{quote.specs || 'N/A'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Zustand ermittelt als</span>
                                                                                        <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                                                                            {quote.condition === 'hervorragend' ? '⭐ Wie Neu' :
                                                                                                quote.condition === 'sehr_gut' ? '✅ Sehr Gut' :
                                                                                                    quote.condition === 'gut' ? '👍 Gut' :
                                                                                                        quote.condition === 'beschadigt' ? '⚠️ Beschädigt' :
                                                                                                            quote.condition || 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="pt-2 border-t border-slate-800">
                                                                                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Kalkulierter Preis</span>
                                                                                        <span className="font-black text-emerald-400 text-xl">€{quote.estimatedValue}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* ── Kontaktdaten ── */}
                                                                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                                    <span className="text-base">👤</span> Kundenprofil
                                                                                </h4>
                                                                                <div className="space-y-3 text-sm">
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Name</span>
                                                                                        <span className="font-bold text-white">{customerName}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">E-Mail</span>
                                                                                        <span className="font-bold text-blue-400 break-all">{customerEmail}</span>
                                                                                    </div>
                                                                                    {(quote.contact?.phone || quote.user?.phone) && (
                                                                                        <div>
                                                                                            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Telefon</span>
                                                                                            <span className="font-mono text-slate-300">{quote.contact?.phone || quote.user?.phone}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* ── Versandadresse ── */}
                                                                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                                                    <span className="text-amber-400 text-base">📦</span> Versandadresse
                                                                                </h4>
                                                                                {quote.shippingAddress?.address || quote.shippingAddress?.city ? (
                                                                                    <div className="text-sm font-medium text-slate-200 space-y-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                                                                        {quote.shippingAddress.address && <div>{quote.shippingAddress.address}</div>}
                                                                                        {(quote.shippingAddress.postalCode || quote.shippingAddress.city) && (
                                                                                            <div className="text-slate-400">{[quote.shippingAddress.postalCode, quote.shippingAddress.city].filter(Boolean).join(' ')}</div>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center justify-center h-20 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm font-medium italic bg-slate-900/50">
                                                                                        Noch nicht hinterlegt
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* ── Auszahlung & Ankauf ── */}
                                                                            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between relative overflow-hidden">
                                                                                {quote.status === 'paid' && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none z-0"></div>}
                                                                                
                                                                                <div className="relative z-10">
                                                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                                                                                        <span className="text-emerald-400 text-base">💶</span> Bankdaten
                                                                                    </h4>
                                                                                    {quote.paymentDetails?.iban ? (
                                                                                        <div className="space-y-3 text-sm">
                                                                                            <div>
                                                                                                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">IBAN</span>
                                                                                                <span className="font-mono text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg block text-slate-200 tracking-wider break-all shadow-inner">
                                                                                                    {quote.paymentDetails.iban.replace(/(.{4})/g, '$1 ').trim()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex justify-between">
                                                                                                <div>
                                                                                                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Bank</span>
                                                                                                    <span className="font-bold text-white">{quote.paymentDetails.bankName || <span className="text-slate-600 italic font-medium">Nicht angegeben</span>}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center justify-center h-20 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm font-medium italic bg-slate-900/50">
                                                                                            Keine Bankdaten
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Action Button for Purchase */}
                                                                                {quote.status !== 'paid' && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setPurchaseDialog({ open: true, quote, deviceImei: '', digitalSignature: '' }); }}
                                                                                        className="mt-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 relative z-10"
                                                                                    >
                                                                                        <Banknote size={16} /> Ankauf abschließen
                                                                                    </button>
                                                                                )}
                                                                                {quote.status === 'paid' && (
                                                                                     <div className="mt-2 w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 relative z-10">
                                                                                        <CheckCircle size={16} /> Erfolgreich angekauft
                                                                                     </div>
                                                                                )}
                                                                            </div>

                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination (Quotes) */}
                    {quoteTotalPages > 1 && !quotesLoading && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
                            <div className="text-sm font-medium text-slate-400">
                                Seite <span className="text-white">{quotePage}</span> von <span className="text-white">{quoteTotalPages}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    aria-label="Previous Page"
                                    onClick={() => setQuotePage(p => Math.max(1, p - 1))}
                                    disabled={quotePage === 1}
                                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    aria-label="Next Page"
                                    onClick={() => setQuotePage(p => Math.min(quoteTotalPages, p + 1))}
                                    disabled={quotePage === quoteTotalPages}
                                    className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Status Success Toast */}
            <AnimatePresence>
                {statusSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-6 left-1/2 z-[100] bg-emerald-900/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-bold"
                    >
                        <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400"><CheckCircle size={14} /></div>
                        {statusSuccess}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Change Dialog */}
            <AnimatePresence>
                {statusDialog?.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                        onClick={() => setStatusDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.35 }}
                            className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 ${statusDialog.newStatus === 'received' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                statusDialog.newStatus === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                    statusDialog.newStatus === 'pending_shipment' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                        'bg-gradient-to-r from-slate-500 to-slate-400'
                                }`}></div>
                                
                            {/* Dialog Header */}
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
                                            <MessageSquare size={18} className="text-blue-400" />
                                        </div>
                                        Status aktualisieren
                                    </h3>
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <span className="w-16">Kunde:</span> <span className="font-bold text-white">{statusDialog.customerEmail || 'Keine E-Mail hinterlegt'}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-2">
                                            <span className="w-16">Neuer Status:</span> 
                                            <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${statusDialog.newStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                statusDialog.newStatus === 'received' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                    statusDialog.newStatus === 'pending_shipment' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                        'bg-slate-800 text-slate-300 border border-slate-700'
                                                }`}>
                                                {statusDialog.newStatus === 'paid' ? '💶 Bezahlt' :
                                                    statusDialog.newStatus === 'received' ? '✅ Erhalten' :
                                                        statusDialog.newStatus === 'pending_shipment' ? '📦 Versand' :
                                                            '⏳ Aktiv'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setStatusDialog(null)} title="Dialog schließen" className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 self-start">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Message Editor */}
                            <div className="p-6 space-y-5 bg-slate-900/80">
                                {!statusDialog.customerEmail && (
                                    <div className="flex items-start gap-3 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 shadow-inner">
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span className="text-sm font-bold">Dieser Kunde hat keine E-Mail-Adresse. Die E-Mail-Benachrichtigung wird übersprungen.</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                        Benachrichtigung (optional bearbeiten):
                                    </label>
                                    <textarea
                                        value={statusDialog.message}
                                        onChange={(e) => setStatusDialog(prev => prev ? { ...prev, message: e.target.value } : null)}
                                        rows={7}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300 resize-none focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors placeholder:text-slate-600 font-mono leading-relaxed"
                                        placeholder="Nachricht an den Kunden..."
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                        onClick={() => handleStatusChange(false)}
                                        disabled={sendingMessage || !statusDialog.customerEmail}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-lg shadow-blue-900/20 border border-white/10"
                                    >
                                        {sendingMessage ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        Status ändern & E-Mail senden
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(true)}
                                        disabled={sendingMessage}
                                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-all text-sm border border-slate-700"
                                    >
                                        Nur Status ändern
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Complete Purchase Dialog */}
            <AnimatePresence>
                {purchaseDialog?.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
                        onClick={() => setPurchaseDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                            
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                        <Banknote size={20} className="text-emerald-400" />
                                    </div>
                                    Ankauf abschließen
                                </h3>
                                <button aria-label="Close dialog" title="Close" onClick={() => setPurchaseDialog(null)} className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700"><X size={20} /></button>
                            </div>

                            <div className="p-6 space-y-5 bg-slate-900/80">
                                <div className="bg-slate-950 border border-slate-800 shadow-inner rounded-xl p-4 text-sm text-slate-300 leading-relaxed">
                                    Du bestätigst den Ankauf für das <strong className="text-white">{purchaseDialog.quote.device}</strong> (Auszahlung: <strong className="text-emerald-400 font-mono text-base">€{purchaseDialog.quote.estimatedValue}</strong>).
                                    Das Gerät wird nach Abschluss automatisch als "Gebrauchtware" in dein Inventar übernommen.
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                        Geräte-IMEI / Seriennummer <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={purchaseDialog.deviceImei}
                                        onChange={e => setPurchaseDialog(prev => prev ? { ...prev, deviceImei: e.target.value } : null)}
                                        placeholder="IMEI scannen oder eingeben..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-mono focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors shadow-inner"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                        Digitale Signatur / Bestätigung <span className="text-red-400">*</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2 font-medium">Bitte gib deinen vollständigen Namen als elektronische Unterschrift des Kaufvertrags ein.</p>
                                    <input
                                        type="text"
                                        required
                                        value={purchaseDialog.digitalSignature}
                                        onChange={e => setPurchaseDialog(prev => prev ? { ...prev, digitalSignature: e.target.value } : null)}
                                        placeholder="Vor- und Nachname..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-colors shadow-inner"
                                    />
                                </div>

                                <button
                                    onClick={handleCompletePurchase}
                                    disabled={completingPurchase || !purchaseDialog.deviceImei || !purchaseDialog.digitalSignature}
                                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 border border-white/10"
                                >
                                    {completingPurchase ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : <Banknote size={18} />}
                                    Kaufvertrag bestätigen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Edit/Add Blueprint */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 z-10"></div>
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10">
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
                                        <Calculator className="text-cyan-400" size={20} />
                                    </div>
                                    {editingDevice ? 'Blueprint bearbeiten' : 'Neues Blueprint'}
                                </h2>
                                <button onClick={closeModal} aria-label="Close modal" title="Close" className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700"><X size={20} /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 flex-wrap border-b border-slate-800 px-6 py-3 shrink-0 relative bg-slate-900/80 z-10">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalTab(tab.id)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all relative z-10 ${modalTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                                    >
                                        {modalTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute inset-0 bg-cyan-500 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-lg -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="overflow-y-auto px-6 py-6 grow custom-scrollbar bg-slate-900/30">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={modalTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* ── GENERAL ── */}
                                        {modalTab === 'general' && (
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Marke</label>
                                                        <select
                                                            aria-label="Select brand" title="Select brand"
                                                            value={formData.brand}
                                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors shadow-inner"
                                                        >
                                                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Modellbezeichnung</label>
                                                        <input
                                                            aria-label="Model Name" value={formData.modelName}
                                                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors shadow-inner"
                                                            placeholder="z.B. iPhone 15 Pro"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Gerätebild</label>
                                                    <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                                                        {formData.imageUrl && (
                                                            <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center p-1 shadow-md">
                                                                <img src={formData.imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <input
                                                                type="file" aria-label="Upload device image" title="Upload device image"
                                                                onChange={handleImageUpload} accept="image/*"
                                                                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:cursor-pointer transition-all"
                                                            />
                                                            <input
                                                                type="text" aria-label="Image URL" placeholder="Oder Bild-URL einfügen..."
                                                                value={formData.imageUrl || ''}
                                                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                                className="w-full mt-2 bg-slate-900 outline-none focus:border-cyan-500 border border-slate-700 rounded-xl text-xs text-slate-300 px-3 py-2 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 block">Basispreis (€) <span className="normal-case text-[10px] font-normal text-slate-500 ml-1">— Für kleinsten Speicher & Wie Neu</span></label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                                                        <input
                                                            type="number" aria-label="Base Price" title="Base Price"
                                                            value={formData.basePrice}
                                                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-mono font-bold text-lg outline-none focus:border-cyan-500 transition-colors shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 block">Verfügbare Speichergrößen</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {STORAGE_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt} onClick={() => toggleStorage(opt)} type="button"
                                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${formData.validStorages?.includes(opt)
                                                                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                                                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── STORAGE PRICES ── */}
                                        {modalTab === 'storage' && (
                                            <div className="space-y-4">
                                                <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                                                    <Calculator size={18} />
                                                    Gib hier den Preis-ZUSCHLAG (€) für jede Speichergröße ein.
                                                </div>
                                                {(formData.validStorages || []).map(storage => (
                                                    <div key={storage} className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
                                                        <div>
                                                            <span className="text-base font-black text-white">{storage}</span>
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Aufpreis</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 font-bold">+€</span>
                                                            <input
                                                                type="number" aria-label={`Storage add-on for ${storage}`} title={`Price for ${storage}`}
                                                                value={(formData.storagePrices || {})[storage] ?? 0}
                                                                onChange={(e) => setStoragePrice(storage, Number(e.target.value))}
                                                                className="w-28 bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-xl px-4 py-2 text-base font-black text-right font-mono text-cyan-400 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {(formData.validStorages || []).length === 0 && (
                                                    <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                                                        <p className="text-slate-500 font-bold">← Bitte wähle zuerst Speichergrößen im "General" Tab aus.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── SCREEN MODIFIERS ── */}
                                        {modalTab === 'screen' && (
                                            <div className="space-y-4">
                                                <div className="bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm font-medium">
                                                    Multiplikator für den Displayzustand. <span className="text-cyan-400 font-bold">1.0 = 100% des Preises, 0.5 = 50%</span>
                                                </div>
                                                {(Object.keys(CONDITION_LABELS) as (keyof ScreenModifiers)[]).map(key => (
                                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800 shadow-inner gap-4">
                                                        <div className="flex-1">
                                                            <span className="text-sm font-bold text-white">{CONDITION_LABELS[key]}</span>
                                                            <div className="h-2 mt-2 rounded-full bg-slate-900 w-full overflow-hidden border border-slate-800">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${((formData.screenModifiers as ScreenModifiers)?.[key] ?? 0.75) * 100}%` }}
                                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                                            <span className="text-slate-500 font-black">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="1.5"
                                                                aria-label={`Screen multiplier for ${CONDITION_LABELS[key]}`}
                                                                value={(formData.screenModifiers as ScreenModifiers)?.[key] ?? 0.75}
                                                                onChange={(e) => setScreenMod(key, Number(e.target.value))}
                                                                className="w-24 bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-xl px-3 py-2 text-base font-black text-right font-mono text-white transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── BODY MODIFIERS ── */}
                                        {modalTab === 'body' && (
                                            <div className="space-y-4">
                                                <div className="bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm font-medium">
                                                    Multiplikator für den Gehäusezustand (Rückseite / Rahmen).
                                                </div>
                                                {(Object.keys(CONDITION_LABELS) as (keyof BodyModifiers)[]).map(key => (
                                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800 shadow-inner gap-4">
                                                        <div className="flex-1">
                                                            <span className="text-sm font-bold text-white">{CONDITION_LABELS[key]}</span>
                                                            <div className="h-2 mt-2 rounded-full bg-slate-900 w-full overflow-hidden border border-slate-800">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${((formData.bodyModifiers as BodyModifiers)?.[key] ?? 0.85) * 100}%` }}
                                                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                                            <span className="text-slate-500 font-black">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="1.5"
                                                                aria-label={`Body multiplier for ${CONDITION_LABELS[key]}`}
                                                                value={(formData.bodyModifiers as BodyModifiers)?.[key] ?? 0.85}
                                                                onChange={(e) => setBodyMod(key, Number(e.target.value))}
                                                                className="w-24 bg-slate-900 border border-slate-700 outline-none focus:border-blue-500 rounded-xl px-3 py-2 text-base font-black text-right font-mono text-white transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── FUNCTIONALITY ── */}
                                        {modalTab === 'functionality' && (
                                            <div className="space-y-5">
                                                <div className="bg-slate-800/50 border border-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm font-medium">
                                                    Multiplikator, falls das Gerät voll funktionsfähig (Ja) oder defekt (Nein) ist.
                                                </div>
                                                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-base font-black text-white flex items-center gap-2">✅ Voll Funktionsfähig (Ja)</span>
                                                            <p className="text-xs text-slate-500 mt-1 font-medium">Gerät lässt sich einschalten, alle Knöpfe & Kameras funktionieren.</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                                            <span className="text-slate-500 font-black">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="2"
                                                                aria-label="Functional multiplier" title="Functional multiplier"
                                                                value={formData.functionalMultiplier ?? 1.0}
                                                                onChange={(e) => setFormData({ ...formData, functionalMultiplier: Number(e.target.value) })}
                                                                className="w-24 bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-xl px-3 py-2 text-base font-black text-right font-mono text-emerald-400 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-base font-black text-white flex items-center gap-2">❌ Defekt (Nein)</span>
                                                            <p className="text-xs text-slate-500 mt-1 font-medium">Gerät geht nicht an, Wasserschaden, Touchscreen defekt etc.</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                                            <span className="text-slate-500 font-black">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.05" max="1"
                                                                aria-label="Non-functional multiplier" title="Non-functional multiplier"
                                                                value={formData.nonFunctionalMultiplier ?? 0.4}
                                                                onChange={(e) => setFormData({ ...formData, nonFunctionalMultiplier: Number(e.target.value) })}
                                                                className="w-24 bg-slate-900 border border-slate-700 outline-none focus:border-red-500 rounded-xl px-3 py-2 text-base font-black text-right font-mono text-red-400 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── SIMULATOR ── */}
                                        {modalTab === 'simulator' && (
                                            <div className="space-y-6">
                                                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                                                    <Calculator size={18} />
                                                    Test-Kalkulation (Simulator)
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Speicher</label>
                                                        <select
                                                            title="Speicher"
                                                            value={simState.storage}
                                                            onChange={(e) => setSimState({ ...simState, storage: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
                                                        >
                                                            {(formData.validStorages || []).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Funktionalität</label>
                                                        <select
                                                            title="Funktionalität"
                                                            value={simState.isFunctional ? 'true' : 'false'}
                                                            onChange={(e) => setSimState({ ...simState, isFunctional: e.target.value === 'true' })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
                                                        >
                                                            <option value="true">✅ Ja (Funktioniert)</option>
                                                            <option value="false">❌ Nein (Defekt)</option>
                                                        </select>
                                                    </div>
                                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Display Zustand</label>
                                                        <select
                                                            title="Display Zustand"
                                                            value={simState.screenCondition}
                                                            onChange={(e) => setSimState({ ...simState, screenCondition: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
                                                        >
                                                            {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">Gehäuse Zustand</label>
                                                        <select
                                                            title="Gehäuse Zustand"
                                                            value={simState.bodyCondition}
                                                            onChange={(e) => setSimState({ ...simState, bodyCondition: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors"
                                                        >
                                                            {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner text-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 pointer-events-none"></div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Kalkulierter Ankaufspreis</p>
                                                    <motion.div
                                                        key={`sim-price-${calculateSimulatedPrice()}`}
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="text-6xl font-mono font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] relative z-10"
                                                    >
                                                        €{calculateSimulatedPrice()}
                                                    </motion.div>
                                                    <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 relative z-10">
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            (€{formData.basePrice} + €{(formData.storagePrices || {})[simState.storage] || 0}) × {(formData.screenModifiers as ScreenModifiers)?.[simState.screenCondition as keyof ScreenModifiers]?.toFixed(2)} × {(formData.bodyModifiers as BodyModifiers)?.[simState.bodyCondition as keyof BodyModifiers]?.toFixed(2)} × {simState.isFunctional ? formData.functionalMultiplier : formData.nonFunctionalMultiplier}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Save Button */}
                            <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md relative z-10">
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 border border-white/10"
                                >
                                    <Save size={20} /> Blueprint speichern
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── PRICE RESEARCH SECTION ── */}
            {activeSection === 'research' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
                            <p className="font-bold tracking-wider uppercase text-sm">Preisrecherche wird geladen...</p>
                        </div>
                    }>
                        <PriceResearchManager />
                    </Suspense>
                </motion.div>
            )}
        </div>
    );
};

export default ValuationManager;
