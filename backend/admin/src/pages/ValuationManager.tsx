import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Save, X, Calculator, ClipboardList, Package, Banknote, TrendingUp, ChevronDown, ChevronUp, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';

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
    user?: { name?: string; email?: string; phone?: string };
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
    const [activeSection, setActiveSection] = useState<'blueprints' | 'quotes'>('blueprints');

    // --- BLUEPRINTS STATE ---
    const [devices, setDevices] = useState<DeviceBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<DeviceBlueprint | null>(null);
    const [formData, setFormData] = useState<Partial<DeviceBlueprint>>(DEFAULT_FORM);
    const [modalTab, setModalTab] = useState<'general' | 'storage' | 'screen' | 'body' | 'functionality' | 'simulator'>('general');

    // --- QUOTES STATE ---
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [quoteStats, setQuoteStats] = useState({ todayCount: 0, totalPaidValue: 0, pendingCount: 0, totalCount: 0 });
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

    // Status Change Dialog State
    const [statusDialog, setStatusDialog] = useState<{ open: boolean; quoteId: string; newStatus: string; customerEmail: string; customerName: string; message: string } | null>(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

    // Purchase Dialog State
    const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; quote: any; deviceImei: string; digitalSignature: string } | null>(null);
    const [completingPurchase, setCompletingPurchase] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof DeviceBlueprint, direction: 'asc' | 'desc' } | null>(null);
    const [quoteSortConfig, setQuoteSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

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

    useEffect(() => { fetchDevices(); }, []);
    useEffect(() => { if (activeSection === 'quotes') fetchQuotes(); }, [activeSection]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/valuation/devices');
            setDevices(response.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQuotes = async () => {
        setQuotesLoading(true);
        try {
            const { data }: any = await api.get('/api/valuation/admin/quotes');
            if (data.success) {
                setQuotes(data.quotes);
                setQuoteStats(data.stats);
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
        const name = quote.contact?.name || quote.user?.name || 'Kunde';
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
            fetchQuotes();
            setStatusSuccess(`Status erfolgreich auf "${newStatus}" geändert!`);
            setTimeout(() => setStatusSuccess(null), 3000);
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
            setStatusSuccess('Ankauf erfolgreich! Gerät wurde als "Gebraucht" zum Inventar hinzugefügt.');
            setTimeout(() => setStatusSuccess(null), 4000);
            setQuotes(prev => prev.map(q => q._id === purchaseDialog.quote._id ? { ...q, status: 'paid' } : q));
            fetchQuotes();
            setPurchaseDialog(null);
        } catch (error) {
            console.error('Error completing purchase:', error);
            alert('Fehler beim Kaufabschluss.');
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
        } catch (error) {
            console.error('Error saving device:', error);
            alert('Failed to save device. Please try again.');
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
        const count = deleteAll ? devices.length : selectedIds.length;
        if (!window.confirm(`Wirklich ${deleteAll ? 'ALLE' : count} Gerät(e) löschen? Dies kann nicht rückgängig gemacht werden!`)) return;
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
            alert('✅ Geräte erfolgreich aktualisiert!');
        } catch (error) {
            console.error('Reseed failed:', error);
            alert('❌ Reseed fehlgeschlagen.');
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

        return Math.max(0, Math.round(price / 5) * 5);
    };

    // --- SORTING LOGIC ---
    const handleSort = (key: keyof DeviceBlueprint) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedDevices = [...devices].sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredDevices = sortedDevices.filter(d =>
        (selectedBrand === 'All' || d.brand === selectedBrand) &&
        (d.modelName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleQuoteSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (quoteSortConfig && quoteSortConfig.key === key && quoteSortConfig.direction === 'asc') direction = 'desc';
        setQuoteSortConfig({ key, direction });
    };

    const sortedQuotes = [...quotes].sort((a: any, b: any) => {
        if (!quoteSortConfig) return 0;

        let aVal = a[quoteSortConfig.key];
        let bVal = b[quoteSortConfig.key];

        // Handle nested or derived sort values
        if (quoteSortConfig.key === 'customer') {
            aVal = a.user ? (a.user.name || '') : a.contact?.name || '';
            bVal = b.user ? (b.user.name || '') : b.contact?.name || '';
        } else if (quoteSortConfig.key === 'estimatedValue') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
        } else if (quoteSortConfig.key === 'createdAt') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return quoteSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return quoteSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Valuation Manager
                    </h1>
                    <p className="text-slate-400 mt-2">Gerätepreise und Kundenangebote verwalten</p>
                </div>
                {activeSection === 'blueprints' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Reseed Button */}
                        <button
                            onClick={handleReseed}
                            disabled={reseeding}
                            title="Alle Geräte mit aktuellen Marktpreisen neu laden"
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            {reseeding ? '⏳' : '🔄'} {reseeding ? 'Updating...' : 'Update Preise'}
                        </button>
                        {/* Delete All */}
                        <button
                            onClick={() => handleBulkDelete(true)}
                            title="Alle Blueprints löschen"
                            className="flex items-center gap-2 bg-red-700 hover:bg-red-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        >
                            <Trash2 size={16} /> Alle löschen
                        </button>
                        {/* Add New */}
                        <button
                            onClick={openNew}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-900/20 transition-all"
                        >
                            <Plus size={20} /> Neues Blueprint
                        </button>
                    </div>
                )}
            </div>

            {/* Top-level Section Tabs */}
            <div className="flex gap-2 mb-8 border-b border-slate-700 pb-0">
                <button
                    onClick={() => setActiveSection('blueprints')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors ${activeSection === 'blueprints'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Calculator size={16} /> Blueprints ({devices.length})
                </button>
                <button
                    onClick={() => setActiveSection('quotes')}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 -mb-px transition-colors ${activeSection === 'quotes'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <ClipboardList size={16} /> Angebote {quoteStats.totalCount > 0 ? `(${quoteStats.totalCount})` : ''}
                </button>
            </div>

            {/* ── BLUEPRINTS SECTION ── */}
            {activeSection === 'blueprints' && (
                <>
                    {/* Filters */}
                    <div className="flex gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                aria-label="Search models"
                                className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <select
                            aria-label="Filter by brand"
                            title="Filter by brand"
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="bg-slate-800 rounded-lg px-4 py-2 text-white border-none outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="All">All Brands</option>
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center justify-between gap-4 mb-4 px-4 py-3 bg-blue-900/30 border border-blue-700 rounded-xl">
                            <span className="text-blue-300 font-bold text-sm">{selectedIds.length} Gerät(e) ausgewählt</span>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedIds([])} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-all">Abwählen</button>
                                <button onClick={() => handleBulkDelete(false)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg font-bold transition-all"><Trash2 size={13} /> Auswahl löschen</button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-400">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input
                                                type="checkbox"
                                                aria-label="Alle auswählen"
                                                title="Alle auswählen"
                                                checked={selectedIds.length === filteredDevices.length && filteredDevices.length > 0}
                                                onChange={(e) => setSelectedIds(e.target.checked ? filteredDevices.map(d => d._id) : [])}
                                                className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('brand')}>
                                            <div className="flex items-center gap-2">Brand {sortConfig?.key === 'brand' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('modelName')}>
                                            <div className="flex items-center gap-2">Model {sortConfig?.key === 'modelName' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('basePrice')}>
                                            <div className="flex items-center gap-2">Base Price {sortConfig?.key === 'basePrice' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4">Storages</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
                                    ) : filteredDevices.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No devices found.</td></tr>
                                    ) : (
                                        filteredDevices.map(device => (
                                            <tr key={device._id} className={`hover:bg-slate-800/50 transition-colors ${selectedIds.includes(device._id) ? 'bg-blue-900/20' : ''}`}>
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${device.modelName}`}
                                                        title={`Select ${device.modelName}`}
                                                        checked={selectedIds.includes(device._id)}
                                                        onChange={(e) => setSelectedIds(prev =>
                                                            e.target.checked ? [...prev, device._id] : prev.filter(i => i !== device._id)
                                                        )}
                                                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-300 font-medium">{device.brand}</span></td>
                                                <td className="p-4 font-bold text-white">{device.modelName}</td>
                                                <td className="p-4 text-emerald-400 font-mono font-bold">€{device.basePrice}</td>
                                                <td className="p-4 text-sm text-slate-400">{(device.validStorages || []).join(', ')}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button onClick={() => openEdit(device)} aria-label={`Edit ${device.modelName}`} title="Edit" className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(device._id)} aria-label={`Delete ${device.modelName}`} title="Delete" className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── QUOTES SECTION ── */}
            {activeSection === 'quotes' && (
                <div className="space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Heute', value: quoteStats.todayCount, icon: <TrendingUp size={18} className="text-cyan-400" />, color: 'text-cyan-400' },
                            { label: 'Ausstehend', value: quoteStats.pendingCount, icon: <Package size={18} className="text-amber-400" />, color: 'text-amber-400' },
                            { label: 'Gesamt', value: quoteStats.totalCount, icon: <ClipboardList size={18} className="text-blue-400" />, color: 'text-blue-400' },
                            { label: 'Ausgezahlt', value: `€${quoteStats.totalPaidValue}`, icon: <Banknote size={18} className="text-emerald-400" />, color: 'text-emerald-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 transition-transform hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</span>
                                    {s.icon}
                                </div>
                                <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quotes Table */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 w-10"></th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('quoteReference')}>
                                            <div className="flex items-center gap-2">Referenz {quoteSortConfig?.key === 'quoteReference' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('device')}>
                                            <div className="flex items-center gap-2">Gerät {quoteSortConfig?.key === 'device' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('customer')}>
                                            <div className="flex items-center gap-2">Kunde {quoteSortConfig?.key === 'customer' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('estimatedValue')}>
                                            <div className="flex items-center gap-2">Preis {quoteSortConfig?.key === 'estimatedValue' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('status')}>
                                            <div className="flex items-center gap-2">Status {quoteSortConfig?.key === 'status' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleQuoteSort('createdAt')}>
                                            <div className="flex items-center gap-2">Datum {quoteSortConfig?.key === 'createdAt' && (quoteSortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {quotesLoading ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">Lädt...</td></tr>
                                    ) : sortedQuotes.length === 0 ? (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">Keine Angebote vorhanden.</td></tr>
                                    ) : (
                                        sortedQuotes.map((quote: any) => {
                                            const customerName = quote.user?.name || quote.contact?.name || '—';
                                            const customerEmail = quote.user?.email || quote.contact?.email || '—';


                                            const isExpanded = expandedQuoteId === quote._id;

                                            return (
                                                <React.Fragment key={quote._id}>
                                                    <tr
                                                        onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                                                        className={`hover:bg-slate-800/80 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/40' : ''}`}
                                                    >
                                                        <td className="p-4 text-slate-500 h-full flex items-center justify-center">
                                                            <div className="p-1 rounded-md hover:bg-slate-700/50 transition-colors">
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="font-mono text-xs font-medium text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded inline-block">{quote.quoteReference}</span>
                                                        </td>
                                                        <td className="p-4 font-bold text-white">{quote.device}</td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-medium text-slate-200">{customerName}</div>
                                                            <div className="text-xs text-slate-500">{customerEmail}</div>
                                                        </td>
                                                        <td className="p-4 font-mono font-black text-emerald-400 text-lg">€{quote.estimatedValue}</td>
                                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="relative">
                                                                {updatingStatus === quote._id ? (
                                                                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                                                                        <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                                                        Wird aktualisiert...
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        aria-label={`Status für ${quote.quoteReference}`}
                                                                        title={`Status: ${quote.status}`}
                                                                        value={quote.status}
                                                                        disabled={updatingStatus === quote._id}
                                                                        onChange={(e) => openStatusDialog(quote, e.target.value)}
                                                                        className={`text-xs font-bold px-3 py-2 rounded-lg border cursor-pointer appearance-none pr-8 outline-none focus:ring-2 focus:ring-cyan-500 w-full transition-all ${quote.status === 'active' ? 'text-slate-300 bg-slate-700/50 border-slate-600' :
                                                                            quote.status === 'pending_shipment' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                                                                                quote.status === 'received' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
                                                                                    quote.status === 'paid' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                                                                                        'text-slate-400 bg-slate-500/10 border-slate-500/20'
                                                                            }`}
                                                                    >
                                                                        <option value="active">⏳ Aktiv (Angebot läuft)</option>
                                                                        <option value="pending_shipment">📦 Versand ausstehend</option>
                                                                        <option value="received">✅ Gerät erhalten</option>
                                                                        <option value="paid">💶 Bezahlt</option>
                                                                    </select>
                                                                )}
                                                                {updatingStatus !== quote._id && <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-xs font-medium text-slate-400">
                                                            {new Date(quote.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </td>
                                                    </tr>

                                                    {/* Expandable Details Row */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr>
                                                                <td colSpan={7} className="p-0 border-t-0">
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                                                        className="overflow-hidden bg-slate-800/30"
                                                                    >
                                                                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                                                                            {/* ── Konfiguration ── */}
                                                                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <span className="text-purple-400">⚙️</span> Konfiguration
                                                                                </h4>
                                                                                <div className="space-y-2.5 text-sm">
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-0.5">Variante</span>
                                                                                        <span className="font-semibold text-white break-words">{quote.specs || 'N/A'}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-0.5">Display / Gehäuse</span>
                                                                                        <span className="font-semibold text-white">
                                                                                            {quote.condition === 'hervorragend' ? '⭐ Wie Neu' :
                                                                                                quote.condition === 'sehr_gut' ? '✅ Sehr Gut' :
                                                                                                    quote.condition === 'gut' ? '👍 Gut' :
                                                                                                        quote.condition === 'beschadigt' ? '⚠️ Beschädigt' :
                                                                                                            quote.condition || 'N/A'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-0.5">Angebotspreis</span>
                                                                                        <span className="font-black text-emerald-400 text-base">€{quote.estimatedValue}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* ── Kontaktdaten ── */}
                                                                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <span>👤</span> Kontaktdaten
                                                                                </h4>
                                                                                <div className="space-y-2.5 text-sm">
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-0.5">Name</span>
                                                                                        <span className="font-semibold text-white">{customerName}</span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-slate-500 text-xs block mb-0.5">E-Mail</span>
                                                                                        <span className="font-medium text-blue-400 break-all">{customerEmail}</span>
                                                                                    </div>
                                                                                    {(quote.contact?.phone || quote.user?.phone) && (
                                                                                        <div>
                                                                                            <span className="text-slate-500 text-xs block mb-0.5">Telefon</span>
                                                                                            <span className="font-medium text-slate-300">{quote.contact?.phone || quote.user?.phone}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* ── Versandadresse ── */}
                                                                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3">
                                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                                    <span>📦</span> Versandadresse
                                                                                </h4>
                                                                                {quote.shippingAddress?.address || quote.shippingAddress?.city ? (
                                                                                    <div className="text-sm text-slate-200 space-y-1 leading-relaxed">
                                                                                        {quote.shippingAddress.address && <div className="font-medium">{quote.shippingAddress.address}</div>}
                                                                                        {(quote.shippingAddress.postalCode || quote.shippingAddress.city) && (
                                                                                            <div className="text-slate-400">{[quote.shippingAddress.postalCode, quote.shippingAddress.city].filter(Boolean).join(' ')}</div>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                                                                                        <span>—</span> Keine Adresse hinterlegt
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* ── Auszahlung & Ankauf ── */}
                                                                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                                                                                <div>
                                                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                                                                                        <span className="text-emerald-400">💶</span> Auszahlung
                                                                                    </h4>
                                                                                    {quote.paymentDetails?.iban ? (
                                                                                        <div className="space-y-2.5 text-sm">
                                                                                            <div>
                                                                                                <span className="text-slate-500 text-xs block mb-1">IBAN</span>
                                                                                                <span className="font-mono text-xs bg-slate-800 px-2 py-1.5 rounded-lg block text-slate-200 tracking-wider break-all">
                                                                                                    {quote.paymentDetails.iban.replace(/(.{4})/g, '$1 ').trim()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-slate-500 text-xs block mb-0.5">Bank</span>
                                                                                                <span className="font-semibold text-white">{quote.paymentDetails.bankName || <span className="text-slate-500 italic font-normal">Nicht angegeben</span>}</span>
                                                                                            </div>
                                                                                            <div>
                                                                                                <span className="text-slate-500 text-xs block mb-0.5">Kontoinhaber</span>
                                                                                                <span className="font-semibold text-slate-200">{customerName}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center gap-2 text-slate-500 text-sm italic">
                                                                                            <span>—</span> Keine Bankdaten hinterlegt
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Action Button for Purchase */}
                                                                                {quote.status !== 'paid' && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setPurchaseDialog({ open: true, quote, deviceImei: '', digitalSignature: '' }); }}
                                                                                        className="mt-4 w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                                                                    >
                                                                                        <Banknote size={16} /> Ankauf & Inventarisierung
                                                                                    </button>
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
                </div>
            )}

            {/* Status Success Toast */}
            <AnimatePresence>
                {statusSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-[100] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xl"
                    >
                        ✅ {statusSuccess}
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                        onClick={() => setStatusDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', duration: 0.35 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Dialog Header */}
                            <div className={`p-5 border-b border-slate-700/50 flex items-center justify-between ${statusDialog.newStatus === 'received' ? 'bg-blue-500/10' :
                                statusDialog.newStatus === 'paid' ? 'bg-emerald-500/10' :
                                    statusDialog.newStatus === 'pending_shipment' ? 'bg-amber-500/10' :
                                        'bg-slate-800/50'
                                }`}>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <MessageSquare size={18} className="text-cyan-400" />
                                        Status ändern + Nachricht
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        An: <span className="text-cyan-400 font-medium">{statusDialog.customerEmail || 'Keine E-Mail'}</span>
                                        {' · '}Neuer Status:{' '}
                                        <span className={`font-bold ${statusDialog.newStatus === 'paid' ? 'text-emerald-400' :
                                            statusDialog.newStatus === 'received' ? 'text-blue-400' :
                                                statusDialog.newStatus === 'pending_shipment' ? 'text-amber-400' :
                                                    'text-slate-300'
                                            }`}>
                                            {statusDialog.newStatus === 'paid' ? '💶 Bezahlt' :
                                                statusDialog.newStatus === 'received' ? '✅ Gerät erhalten' :
                                                    statusDialog.newStatus === 'pending_shipment' ? '📦 Versand ausstehend' :
                                                        '⏳ Aktiv'}
                                        </span>
                                    </p>
                                </div>
                                <button onClick={() => setStatusDialog(null)} title="Dialog schließen" className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Message Editor */}
                            <div className="p-5 space-y-4">
                                {!statusDialog.customerEmail && (
                                    <div className="flex items-start gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span>Dieser Kunde hat keine E-Mail-Adresse. Die Nachricht kann nicht gesendet werden.</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Nachricht an Kunden (optional bearbeiten):
                                    </label>
                                    <textarea
                                        value={statusDialog.message}
                                        onChange={(e) => setStatusDialog(prev => prev ? { ...prev, message: e.target.value } : null)}
                                        rows={7}
                                        className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-600 font-mono leading-relaxed"
                                        placeholder="Nachricht an den Kunden..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleStatusChange(false)}
                                        disabled={sendingMessage || !statusDialog.customerEmail}
                                        className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
                                    >
                                        {sendingMessage ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={15} />
                                        )}
                                        Status ändern & E-Mail senden
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(true)}
                                        disabled={sendingMessage}
                                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm whitespace-nowrap"
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
                        onClick={() => setPurchaseDialog(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                    <Banknote size={20} />
                                    Ankauf abschließen
                                </h3>
                                <button aria-label="Close dialog" title="Close" onClick={() => setPurchaseDialog(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-300">
                                    Du bist dabei, den Ankauf für das <strong>{purchaseDialog.quote.device}</strong> zu bestätigen (Auszahlung: <strong>€{purchaseDialog.quote.estimatedValue}</strong>).
                                    Das Gerät wird danach automatisch als Gebrauchtware in den Produkten gelistet.
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Geräte-IMEI / Seriennummer <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={purchaseDialog.deviceImei}
                                        onChange={e => setPurchaseDialog(prev => prev ? { ...prev, deviceImei: e.target.value } : null)}
                                        placeholder="IMEI eingeben..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Digitale Signatur / Bestätigung <span className="text-red-400">*</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mb-2">Bitte gib deinen vollständigen Namen als elektronische Unterschrift des Kaufvertrags ein.</p>
                                    <input
                                        type="text"
                                        required
                                        value={purchaseDialog.digitalSignature}
                                        onChange={e => setPurchaseDialog(prev => prev ? { ...prev, digitalSignature: e.target.value } : null)}
                                        placeholder="Vor- und Nachname..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <button
                                    onClick={handleCompletePurchase}
                                    disabled={completingPurchase || !purchaseDialog.deviceImei || !purchaseDialog.digitalSignature}
                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                                >
                                    {completingPurchase ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : <Banknote size={18} />}
                                    Kaufvertrag bestätigen & Schließen
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Calculator className="text-cyan-400" />
                                    {editingDevice ? 'Edit Blueprint' : 'New Blueprint'}
                                </h2>
                                <button onClick={closeModal} aria-label="Close modal" title="Close" className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 flex-wrap border-b border-slate-700 pb-2 mb-4 shrink-0 relative">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalTab(tab.id)}
                                        className={`pb-1 px-3 text-xs rounded-lg transition-all relative z-10 ${modalTab === tab.id ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {modalTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute inset-0 bg-cyan-500/20 rounded-lg -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="overflow-y-auto pr-2 grow custom-scrollbar">

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
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Brand</label>
                                                        <select
                                                            aria-label="Select brand" title="Select brand"
                                                            value={formData.brand}
                                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                        >
                                                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Model Name</label>
                                                        <input
                                                            aria-label="Model Name" value={formData.modelName}
                                                            onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                            placeholder="e.g. iPhone 15"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Device Image</label>
                                                    <div className="flex items-center gap-4">
                                                        {formData.imageUrl && (
                                                            <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <input
                                                                type="file" aria-label="Upload device image" title="Upload device image"
                                                                onChange={handleImageUpload} accept="image/*"
                                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:cursor-pointer p-0"
                                                            />
                                                            <input
                                                                type="text" aria-label="Image URL" placeholder="Or paste image URL..."
                                                                value={formData.imageUrl || ''}
                                                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                                className="w-full mt-2 bg-slate-900/50 outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700 rounded-lg text-xs text-slate-400 px-3 py-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Base Price (€) — for lowest storage, perfect condition</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                                                        <input
                                                            type="number" aria-label="Base Price" title="Base Price"
                                                            value={formData.basePrice}
                                                            onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono outline-none focus:ring-2 focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs text-slate-400 mb-2 block">Supported Storage Options</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {STORAGE_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt} onClick={() => toggleStorage(opt)} type="button"
                                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${formData.validStorages?.includes(opt)
                                                                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'}`}
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
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-400">Enter the price ADD-ON (€) for each storage tier. The base price is added on top.</p>
                                                {(formData.validStorages || []).map(storage => (
                                                    <div key={storage} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                                        <div>
                                                            <span className="text-sm font-bold text-white">{storage}</span>
                                                            <span className="text-xs text-slate-500 ml-2">add-on</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 text-sm">+€</span>
                                                            <input
                                                                type="number" aria-label={`Storage add-on for ${storage}`} title={`Price for ${storage}`}
                                                                value={(formData.storagePrices || {})[storage] ?? 0}
                                                                onChange={(e) => setStoragePrice(storage, Number(e.target.value))}
                                                                className="w-24 bg-slate-900 border border-slate-600 outline-none focus:border-cyan-500 rounded-lg px-3 py-1.5 text-sm text-right font-mono text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {(formData.validStorages || []).length === 0 && (
                                                    <p className="text-slate-500 text-sm text-center py-4">← Add storage options in the General tab first</p>
                                                )}
                                            </div>
                                        )}

                                        {/* ── SCREEN MODIFIERS ── */}
                                        {modalTab === 'screen' && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-400">Set the price multiplier for each screen condition. <span className="text-cyan-400">1.0 = 100% of price, 0.5 = 50%</span></p>
                                                {(Object.keys(CONDITION_LABELS) as (keyof ScreenModifiers)[]).map(key => (
                                                    <div key={key} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                                        <div>
                                                            <span className="text-sm font-bold text-white">{CONDITION_LABELS[key]}</span>
                                                            <div className="h-1 mt-1 rounded-full bg-slate-700 w-32 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${((formData.screenModifiers as ScreenModifiers)?.[key] ?? 0.75) * 100}%` }}
                                                                    className="h-full rounded-full bg-cyan-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 text-sm">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="1.5"
                                                                aria-label={`Screen multiplier for ${CONDITION_LABELS[key]}`}
                                                                title={`Screen multiplier for ${CONDITION_LABELS[key]}`}
                                                                value={(formData.screenModifiers as ScreenModifiers)?.[key] ?? 0.75}
                                                                onChange={(e) => setScreenMod(key, Number(e.target.value))}
                                                                className="w-20 bg-slate-900 border border-slate-600 outline-none focus:border-cyan-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── BODY MODIFIERS ── */}
                                        {modalTab === 'body' && (
                                            <div className="space-y-3">
                                                <p className="text-xs text-slate-400">Set the price multiplier for each body (Gehäuse) condition.</p>
                                                {(Object.keys(CONDITION_LABELS) as (keyof BodyModifiers)[]).map(key => (
                                                    <div key={key} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                                        <div>
                                                            <span className="text-sm font-bold text-white">{CONDITION_LABELS[key]}</span>
                                                            <div className="h-1 mt-1 rounded-full bg-slate-700 w-32 overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${((formData.bodyModifiers as BodyModifiers)?.[key] ?? 0.85) * 100}%` }}
                                                                    className="h-full rounded-full bg-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 text-sm">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="1.5"
                                                                aria-label={`Body multiplier for ${CONDITION_LABELS[key]}`}
                                                                title={`Body multiplier for ${CONDITION_LABELS[key]}`}
                                                                value={(formData.bodyModifiers as BodyModifiers)?.[key] ?? 0.85}
                                                                onChange={(e) => setBodyMod(key, Number(e.target.value))}
                                                                className="w-20 bg-slate-900 border border-slate-600 outline-none focus:border-cyan-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* ── FUNCTIONALITY ── */}
                                        {modalTab === 'functionality' && (
                                            <div className="space-y-4">
                                                <p className="text-xs text-slate-400">Set multipliers for functional (Ja) vs. non-functional (Nein) devices.</p>
                                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-sm font-bold text-white">✅ Functional (Ja)</span>
                                                            <p className="text-xs text-slate-400 mt-0.5">Device works perfectly</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 text-sm">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.1" max="2"
                                                                aria-label="Functional multiplier" title="Functional multiplier"
                                                                value={formData.functionalMultiplier ?? 1.0}
                                                                onChange={(e) => setFormData({ ...formData, functionalMultiplier: Number(e.target.value) })}
                                                                className="w-20 bg-slate-900 border border-slate-600 outline-none focus:border-cyan-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-sm font-bold text-white">❌ Non-Functional (Nein)</span>
                                                            <p className="text-xs text-slate-400 mt-0.5">Broken or locked device</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 text-sm">×</span>
                                                            <input
                                                                type="number" step="0.05" min="0.05" max="1"
                                                                aria-label="Non-functional multiplier" title="Non-functional multiplier"
                                                                value={formData.nonFunctionalMultiplier ?? 0.4}
                                                                onChange={(e) => setFormData({ ...formData, nonFunctionalMultiplier: Number(e.target.value) })}
                                                                className="w-20 bg-slate-900 border border-slate-600 outline-none focus:border-cyan-500 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── SIMULATOR ── */}
                                        {modalTab === 'simulator' && (
                                            <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                                <p className="text-xs text-slate-500 text-center">Preview the calculated offer based on the current settings.</p>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">Storage</label>
                                                        <select
                                                            aria-label="Simulator storage" title="Simulator storage"
                                                            value={simState.storage}
                                                            onChange={(e) => setSimState({ ...simState, storage: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-2 py-2 text-sm text-white"
                                                        >
                                                            {(formData.validStorages || []).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">Screen Condition</label>
                                                        <select
                                                            aria-label="Simulator screen condition" title="Simulator screen condition"
                                                            value={simState.screenCondition}
                                                            onChange={(e) => setSimState({ ...simState, screenCondition: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-2 py-2 text-sm text-white"
                                                        >
                                                            {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">Body Condition</label>
                                                        <select
                                                            aria-label="Simulator body condition" title="Simulator body condition"
                                                            value={simState.bodyCondition}
                                                            onChange={(e) => setSimState({ ...simState, bodyCondition: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-2 py-2 text-sm text-white"
                                                        >
                                                            {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">Functionality</label>
                                                        <select
                                                            aria-label="Simulator functionality" title="Simulator functionality"
                                                            value={simState.isFunctional ? 'true' : 'false'}
                                                            onChange={(e) => setSimState({ ...simState, isFunctional: e.target.value === 'true' })}
                                                            className="w-full bg-slate-900 border border-slate-700 outline-none focus:border-cyan-500 rounded-lg px-2 py-2 text-sm text-white"
                                                        >
                                                            <option value="true">✅ Ja (Functional)</option>
                                                            <option value="false">❌ Nein (Broken)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="text-center pt-4 border-t border-slate-800">
                                                    <p className="text-sm text-slate-400 mb-1">Estimated Offer</p>
                                                    <motion.div
                                                        key={`sim-price-${calculateSimulatedPrice()}`}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="text-5xl font-mono font-black text-emerald-400"
                                                    >
                                                        €{calculateSimulatedPrice()}
                                                    </motion.div>
                                                    <p className="text-xs text-slate-600 mt-2">
                                                        (€{formData.basePrice} + €{(formData.storagePrices || {})[simState.storage] || 0}) × {(formData.screenModifiers as ScreenModifiers)?.[simState.screenCondition as keyof ScreenModifiers]?.toFixed(2)} × {(formData.bodyModifiers as BodyModifiers)?.[simState.bodyCondition as keyof BodyModifiers]?.toFixed(2)} × {simState.isFunctional ? formData.functionalMultiplier : formData.nonFunctionalMultiplier}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                <Save size={18} /> Save Blueprint
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ValuationManager;
