import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Save, X, Calculator } from 'lucide-react';
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
    const [devices, setDevices] = useState<DeviceBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<DeviceBlueprint | null>(null);
    const [formData, setFormData] = useState<Partial<DeviceBlueprint>>(DEFAULT_FORM);
    const [modalTab, setModalTab] = useState<'general' | 'storage' | 'screen' | 'body' | 'functionality' | 'simulator'>('general');

    // Simulator
    const [simState, setSimState] = useState({
        storage: '128GB',
        screenCondition: 'hervorragend',
        bodyCondition: 'hervorragend',
        isFunctional: true
    });

    useEffect(() => { fetchDevices(); }, []);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        try {
            const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadFormData });
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
            fetchDevices();
        } catch (error) {
            console.error('Error deleting device:', error);
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

            // Also init price for new storage
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

    const filteredDevices = devices.filter(d =>
        (selectedBrand === 'All' || d.brand === selectedBrand) &&
        (d.modelName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Valuation Database
                    </h1>
                    <p className="text-slate-400 mt-2">Manage device blueprints and pricing config</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-900/20 transition-all"
                >
                    <Plus size={20} /> Add New Blueprint
                </button>
            </div>

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
                        className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <select
                    aria-label="Filter by brand"
                    title="Filter by brand"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-slate-800 rounded-lg px-4 py-2 text-white border-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="All">All Brands</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400">
                            <tr>
                                <th className="p-4">Brand</th>
                                <th className="p-4">Model</th>
                                <th className="p-4">Base Price</th>
                                <th className="p-4">Storages</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No devices found.</td></tr>
                            ) : (
                                filteredDevices.map(device => (
                                    <tr key={device._id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-sm">{device.brand}</span></td>
                                        <td className="p-4 font-bold text-white">{device.modelName}</td>
                                        <td className="p-4 text-green-400 font-mono">€{device.basePrice}</td>
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calculator className="text-cyan-400" />
                                {editingDevice ? 'Edit Blueprint' : 'New Blueprint'}
                            </h2>
                            <button onClick={closeModal} aria-label="Close modal" title="Close" className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 flex-wrap border-b border-slate-700 pb-2 mb-4 shrink-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setModalTab(tab.id)}
                                    className={`pb-1 px-3 text-xs rounded-lg transition-all ${modalTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="overflow-y-auto pr-2 grow custom-scrollbar">

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
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                            >
                                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Model Name</label>
                                            <input
                                                aria-label="Model Name" value={formData.modelName}
                                                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
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
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                                                />
                                                <input
                                                    type="text" aria-label="Image URL" placeholder="Or paste image URL..."
                                                    value={formData.imageUrl || ''}
                                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                    className="w-full mt-2 bg-slate-900/50 border-none rounded text-xs text-slate-400 px-2 py-1"
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
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono"
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
                                                    className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-right font-mono text-white"
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
                                                <div className="h-1 mt-1 rounded-full bg-slate-700 w-32">
                                                    <div className="h-1 rounded-full bg-cyan-500" style={{ width: `${((formData.screenModifiers as ScreenModifiers)?.[key] ?? 0.75) * 100}%` }} />
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
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
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
                                                <div className="h-1 mt-1 rounded-full bg-slate-700 w-32">
                                                    <div className="h-1 rounded-full bg-blue-500" style={{ width: `${((formData.bodyModifiers as BodyModifiers)?.[key] ?? 0.85) * 100}%` }} />
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
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
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
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
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
                                                    className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-right font-mono text-white"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
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
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                                            >
                                                <option value="true">✅ Ja (Functional)</option>
                                                <option value="false">❌ Nein (Broken)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="text-center pt-4 border-t border-slate-800">
                                        <p className="text-sm text-slate-400 mb-1">Estimated Offer</p>
                                        <div className="text-5xl font-mono font-black text-emerald-400">€{calculateSimulatedPrice()}</div>
                                        <p className="text-xs text-slate-600 mt-2">
                                            (€{formData.basePrice} + €{(formData.storagePrices || {})[simState.storage] || 0}) × {(formData.screenModifiers as ScreenModifiers)?.[simState.screenCondition as keyof ScreenModifiers]?.toFixed(2)} × {(formData.bodyModifiers as BodyModifiers)?.[simState.bodyCondition as keyof BodyModifiers]?.toFixed(2)} × {simState.isFunctional ? formData.functionalMultiplier : formData.nonFunctionalMultiplier}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            <Save size={18} /> Save Blueprint
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValuationManager;
