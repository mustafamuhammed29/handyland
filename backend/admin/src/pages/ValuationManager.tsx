import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, Save, X, Calculator } from 'lucide-react';
import { api } from '../utils/api';

interface DeviceBlueprint {
    _id: string;
    brand: string;
    modelName: string;
    basePrice: number;
    validStorages: string[];
    marketingName?: string;
    description?: string;
    imageUrl?: string;
    priceConfig?: {
        batteryPenalty?: {
            threshold: number;
            deductionPerPercent: number;
        };
        conditionModifiers?: Record<string, number>;
        conditionDescriptions?: Record<string, string>;
        storagePrices?: Record<string, number>;
    };
}

const BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'Other'];
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const ValuationManager = () => {
    const [devices, setDevices] = useState<DeviceBlueprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<DeviceBlueprint | null>(null);
    const [formData, setFormData] = useState<Partial<DeviceBlueprint>>({
        brand: 'Apple',
        modelName: '',
        imageUrl: '',
        basePrice: 0,
        validStorages: ['128GB', '256GB']
    });
    const [modalTab, setModalTab] = useState<'general' | 'pricing' | 'simulator'>('general');

    // Simulator State
    const [simState, setSimState] = useState({
        storage: '128GB',
        condition: 'good',
        batteryHealth: 100
    });

    useEffect(() => {
        fetchDevices();
    }, []);

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

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.imageUrl) {
                setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (editingDevice) {
                await api.put(`/api/valuation/devices/${editingDevice._id}`, formData);
            } else {
                await api.post('/api/valuation/devices', formData);
            }

            setIsModalOpen(false);
            setEditingDevice(null);
            setFormData({ brand: 'Apple', modelName: '', imageUrl: '', basePrice: 0, validStorages: ['128GB', '256GB'], priceConfig: { storagePrices: {} } });
            fetchDevices();
        } catch (error) {
            console.error('Error saving device:', error);
            alert('Failed to save device. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/api/valuation/devices/${id}`);
            fetchDevices();
        } catch (error) {
            console.error('Error deleting device:', error);
            alert('Failed to delete device. Please try again.');
        }
    };

    const openEdit = (device: DeviceBlueprint) => {
        setEditingDevice(device);
        setFormData(device);
        setIsModalOpen(true);
    };

    const toggleStorage = (storage: string) => {
        setFormData(prev => {
            const current = prev.validStorages || [];
            if (current.includes(storage)) {
                return { ...prev, validStorages: current.filter(s => s !== storage) };
            } else {
                return { ...prev, validStorages: [...current, storage] };
            }
        });
    };

    const filteredDevices = devices.filter(d =>
        (selectedBrand === 'All' || d.brand === selectedBrand) &&
        (d.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.marketingName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const calculateSimulatedPrice = () => {
        const base = formData.basePrice || 0;

        // 1. Storage
        const storagePrice = formData.priceConfig?.storagePrices?.[simState.storage] || 0;
        let current = base + storagePrice;

        // 2. Condition
        const condMult = formData.priceConfig?.conditionModifiers?.[simState.condition] || 0.75;
        current = current * condMult;

        // 3. Battery
        if (simState.batteryHealth < (formData.priceConfig?.batteryPenalty?.threshold || 85)) {
            const diff = (formData.priceConfig?.batteryPenalty?.threshold || 85) - simState.batteryHealth;
            const penalty = 50 + (diff * (formData.priceConfig?.batteryPenalty?.deductionPerPercent || 5));
            current -= penalty;
        }

        return Math.max(0, Math.round(current / 5) * 5); // Round to nearest 5
    };

    return (
        <div className="p-6 max-w-7xl mx-auto text-slate-100">
            {/* Header & Simulator Button */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Valuation Database
                    </h1>
                    <p className="text-slate-400 mt-2">Manage device blueprints and base prices</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDevice(null);
                        setFormData({ brand: 'Apple', modelName: '', imageUrl: '', basePrice: 0, validStorages: ['128GB', '256GB'], priceConfig: { storagePrices: {} } });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-900/20 transition-all"
                >
                    <Plus size={20} /> Add New Blueprint
                </button>
            </div>

            {/* Filters - keep existing */}
            <div className="flex gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-slate-800 rounded-lg px-4 py-2 text-white border-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="All">All Brands</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {/* Table - keep existing */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800 text-slate-400">
                            <tr>
                                <th className="p-4">Brand</th>
                                <th className="p-4">Model</th>
                                <th className="p-4">Base Price</th>
                                <th className="p-4">Storage Configs</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading Database...</td></tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No devices found.</td></tr>
                            ) : (
                                filteredDevices.map(device => (
                                    <tr key={device._id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded text-sm">{device.brand}</span></td>
                                        <td className="p-4 font-bold text-white">{device.modelName}</td>
                                        <td className="p-4 text-green-400 font-mono">€{device.basePrice}</td>
                                        <td className="p-4 text-sm text-slate-400">{device.validStorages.join(', ')}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => openEdit(device)} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(device._id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calculator className="text-cyan-400" />
                                {editingDevice ? 'Edit Blueprint' : 'New Blueprint'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex gap-4 border-b border-slate-700 pb-2 mb-4 shrink-0">
                            <button onClick={() => setModalTab('general')} className={`pb-2 px-3 ${modalTab === 'general' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'}`}>General Info</button>
                            <button onClick={() => setModalTab('pricing')} className={`pb-2 px-3 ${modalTab === 'pricing' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400'}`}>Pricing Rules</button>
                            <button onClick={() => setModalTab('simulator')} className={`pb-2 px-3 ${modalTab === 'simulator' ? 'text-purple-400 border-b-2 border-purple-400 font-bold' : 'text-slate-400'}`}>⚡ Simulator</button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar grow">
                            {modalTab === 'general' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Brand</label>
                                            <select
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
                                                value={formData.modelName}
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
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.imageUrl || ''}
                                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                                    placeholder="Or paste image URL..."
                                                    className="w-full mt-2 bg-slate-900/50 border-none rounded text-xs text-slate-400 px-2 py-1"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Base Price (€) (Mint Condition, Base Storage)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                                            <input
                                                type="number"
                                                value={formData.basePrice}
                                                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 mb-2 block">Supported Storage Configs</label>
                                        <div className="flex flex-wrap gap-2">
                                            {STORAGE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => toggleStorage(opt)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${formData.validStorages?.includes(opt)
                                                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                                                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : modalTab === 'pricing' ? (
                                <div className="space-y-6">
                                    {/* Storage Prices */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-400"></div> Storage Add-ons
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {formData.validStorages?.map(storage => (
                                                <div key={storage} className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-300">{storage}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">+€</span>
                                                        <input
                                                            type="number"
                                                            value={formData.priceConfig?.storagePrices?.[storage] || 0}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                priceConfig: {
                                                                    ...formData.priceConfig,
                                                                    storagePrices: {
                                                                        ...formData.priceConfig?.storagePrices,
                                                                        [storage]: Number(e.target.value)
                                                                    }
                                                                }
                                                            })}
                                                            className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-right"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div> Condition Rules
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { id: 'new', label: 'New (Sealed)' },
                                                { id: 'like_new', label: 'Like New' },
                                                { id: 'good', label: 'Good' },
                                                { id: 'fair', label: 'Fair' },
                                                { id: 'broken', label: 'Broken' }
                                            ].map((cond) => (
                                                <div key={cond.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-slate-200">{cond.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-500">Multiplier:</span>
                                                            <input
                                                                type="number"
                                                                step="0.05"
                                                                max="1.5"
                                                                min="0.1"
                                                                value={formData.priceConfig?.conditionModifiers?.[cond.id] ?? (cond.id === 'new' ? 1.0 : 0.7)}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    priceConfig: {
                                                                        ...formData.priceConfig,
                                                                        conditionModifiers: {
                                                                            ...formData.priceConfig?.conditionModifiers,
                                                                            [cond.id]: Number(e.target.value)
                                                                        }
                                                                    }
                                                                })}
                                                                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right"
                                                            />
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Description (e.g., No scratches...)"
                                                        value={formData.priceConfig?.conditionDescriptions?.[cond.id] || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            priceConfig: {
                                                                ...formData.priceConfig,
                                                                conditionDescriptions: {
                                                                    ...formData.priceConfig?.conditionDescriptions,
                                                                    [cond.id]: e.target.value
                                                                }
                                                            }
                                                        })}
                                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400 focus:text-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Battery */}
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div> Battery Health Logic
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">Penalty Threshold (%)</label>
                                                <input
                                                    type="number"
                                                    value={formData.priceConfig?.batteryPenalty?.threshold ?? 85}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        priceConfig: {
                                                            ...formData.priceConfig,
                                                            batteryPenalty: {
                                                                threshold: Number(e.target.value),
                                                                deductionPerPercent: formData.priceConfig?.batteryPenalty?.deductionPerPercent ?? 5
                                                            }
                                                        }
                                                    })}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">Deduction per 1% (€)</label>
                                                <input
                                                    type="number"
                                                    value={formData.priceConfig?.batteryPenalty?.deductionPerPercent ?? 5}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        priceConfig: {
                                                            ...formData.priceConfig,
                                                            batteryPenalty: {
                                                                threshold: formData.priceConfig?.batteryPenalty?.threshold ?? 85,
                                                                deductionPerPercent: Number(e.target.value)
                                                            }
                                                        }
                                                    })}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* SIMULATOR TAB */
                                <div className="space-y-6 flex flex-col items-center justify-center p-4">
                                    <div className="w-full bg-slate-950 p-6 rounded-2xl border border-slate-800">

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div>
                                                <label className="text-xs text-slate-500 mb-1 block">Storage</label>
                                                <select
                                                    value={simState.storage}
                                                    onChange={(e) => setSimState({ ...simState, storage: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                                                >
                                                    {formData.validStorages?.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 mb-1 block">Condition</label>
                                                <select
                                                    value={simState.condition}
                                                    onChange={(e) => setSimState({ ...simState, condition: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm"
                                                >
                                                    <option value="new">New (Sealed)</option>
                                                    <option value="like_new">Like New</option>
                                                    <option value="good">Good</option>
                                                    <option value="fair">Fair</option>
                                                    <option value="broken">Broken</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-slate-500 mb-1 block">Battery Health: {simState.batteryHealth}%</label>
                                                <input
                                                    type="range"
                                                    min="50" max="100"
                                                    value={simState.batteryHealth}
                                                    onChange={(e) => setSimState({ ...simState, batteryHealth: Number(e.target.value) })}
                                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-slate-400 mb-2">Simulated Offer Value</p>
                                            <div className="text-5xl font-mono font-bold text-emerald-400">
                                                €{calculateSimulatedPrice()}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center max-w-xs">
                                        This calculates the price based on the rules you set in the "Pricing Rules" tab.
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 shrink-0"
                        >
                            <Save size={18} /> Save Configuration
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValuationManager;
