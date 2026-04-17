import { useState, useEffect } from 'react';
import { Search, Globe, TrendingUp, Save, Zap, Database } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function CompareManager() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [researching, setResearching] = useState(false);
    const [globalStats, setGlobalStats] = useState<any>(null);
    const [advancedSpecsJson, setAdvancedSpecsJson] = useState('');
    const [fetchingSpecs, setFetchingSpecs] = useState(false);
    
    // Bulk Sync State
    const [bulkSyncState, setBulkSyncState] = useState({
        active: false,
        total: 0,
        current: 0,
        currentModel: ''
    });

    const [specsForm, setSpecsForm] = useState({
        ram: '',
        os: '',
        processor: '',
        display: '',
        camera: '',
        battery: '',
        benchmarkScore: '',
        globalPrice: ''
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/api/products');
            const data = Array.isArray(res.data) ? res.data : (res.data.products || []);
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setGlobalStats(null);
        setSpecsForm({
            ram: product.specs?.ram || '',
            os: product.specs?.os || '',
            processor: product.specs?.processor || product.processor || '',
            display: product.specs?.display || product.display || '',
            camera: product.specs?.camera || '',
            battery: product.specs?.battery || product.battery || '',
            benchmarkScore: product.specs?.benchmarkScore || '',
            globalPrice: product.specs?.globalPrice || ''
        });

        const deepSpecs = { ...product.specs };
        delete deepSpecs.ram;
        delete deepSpecs.os;
        delete deepSpecs.processor;
        delete deepSpecs.display;
        delete deepSpecs.camera;
        delete deepSpecs.battery;
        delete deepSpecs.benchmarkScore;
        delete deepSpecs.globalPrice;
        
        setAdvancedSpecsJson(Object.keys(deepSpecs).length > 0 ? JSON.stringify(deepSpecs, null, 2) : '');
    };

    const handleResearchEbay = async () => {
        if (!editingProduct) return;
        setResearching(true);
        try {
            const model = editingProduct.name || editingProduct.model;
            // Use existing research endpoint from Valuation tool
            const res = await api.get(`/api/price-research/ebay?model=${model}&storage=${editingProduct.storage || '128GB'}`);
            if (res.data?.success && res.data.data) {
                const avg = res.data.data.avg;
                setGlobalStats(res.data.data);
                if (avg) {
                    setSpecsForm(prev => ({ ...prev, globalPrice: String(avg) }));
                    toast.success('Market Average Applied');
                }
            } else {
                toast.error(res.data?.message || 'Failed to fetch eBay prices');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Error fetching eBay data');
        } finally {
            setResearching(false);
        }
    };

    const handleFetchEbaySpecs = async () => {
        if (!editingProduct) return;
        setFetchingSpecs(true);
        try {
            const model = editingProduct.name || editingProduct.model;
            const res = await api.get(`/api/price-research/ebay-specs?model=${encodeURIComponent(model)}`);
            if (res.data?.success && res.data.data) {
                setAdvancedSpecsJson(JSON.stringify(res.data.data, null, 2));
                toast.success('eBay Deep Specs Extracted & Injected!');
            } else {
                toast.error(res.data?.message || 'Failed to extract specs');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'Error fetching specs. Make sure eBay App ID is set.');
        } finally {
            setFetchingSpecs(false);
        }
    };

    const handleBulkSync = async () => {
        // Find devices that lack technical details or root specifications
        const targets = products.filter(p => !p.specs || (!p.specs.Processor && !p.specs['Technische Details']));
        
        if (targets.length === 0) {
            return toast.success('All devices already have technical specifications!');
        }

        if (!confirm(`Found ${targets.length} devices missing technical specifications.\nDo you want to automatically fetch them from eBay?\nThis will take approximately ${targets.length * 1.5} seconds.`)) {
            return;
        }

        setBulkSyncState({ active: true, total: targets.length, current: 0, currentModel: '' });
        let successCount = 0;

        for (let i = 0; i < targets.length; i++) {
            const prod = targets[i];
            const modelName = prod.name || prod.model;
            setBulkSyncState(prev => ({ ...prev, current: i + 1, currentModel: modelName }));

            try {
                const res = await api.get(`/api/price-research/ebay-specs?model=${encodeURIComponent(modelName)}`);
                if (res.data?.success && res.data.data) {
                    const newSpecs = {
                        ...(prod.specs || {}),
                        ...res.data.data
                    };
                    
                    // Update in database
                    await api.put(`/api/products/${prod._id || prod.id}`, { specs: newSpecs });
                    successCount++;
                }
            } catch (err) {
                console.warn(`Skipped ${modelName} - not found or error.`);
            }

            // Respect API rate limits (1 second delay)
            await new Promise(r => setTimeout(r, 1000));
        }

        toast.success(`Bulk Sync Complete! Successfully updated ${successCount} out of ${targets.length} devices.`);
        setBulkSyncState({ active: false, total: 0, current: 0, currentModel: '' });
        fetchProducts(); // Refresh the list
    };

    const handleSaveSpecs = async () => {
        let parsedAdvanced = {};
        if (advancedSpecsJson.trim()) {
            try {
                parsedAdvanced = JSON.parse(advancedSpecsJson);
            } catch (err) {
                toast.error('Invalid JSON format in Advanced Specs.');
                return;
            }
        }

        try {
            const updatedProduct = {
                ...editingProduct,
                specs: {
                    ...parsedAdvanced,
                    ram: specsForm.ram,
                    os: specsForm.os,
                    processor: specsForm.processor,
                    display: specsForm.display,
                    camera: specsForm.camera,
                    battery: specsForm.battery,
                    benchmarkScore: specsForm.benchmarkScore,
                    globalPrice: specsForm.globalPrice
                }
            };
            await api.put(`/api/products/${editingProduct.id || editingProduct._id}`, updatedProduct);
            toast.success('Global Specs saved successfully.');
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save specs.');
        }
    };

    const filteredProducts = products.filter(p => 
        (p.name || p.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        <Globe className="text-blue-400" /> Global Compare Manager
                    </h2>
                    <p className="text-slate-400">Curate "World-Class" comparison data & global market prices for your store</p>
                </div>
                
                {/* Bulk Sync Section */}
                <div className="flex items-center gap-4">
                    {bulkSyncState.active ? (
                        <div className="flex items-center gap-4 bg-slate-900 border border-brand-primary/30 py-2 px-4 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Syncing: {bulkSyncState.currentModel}</span>
                                <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-primary transition-all duration-300"
                                        style={{ width: `${(bulkSyncState.current / bulkSyncState.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-brand-primary font-bold text-sm">
                                {bulkSyncState.current} / {bulkSyncState.total}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={handleBulkSync}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-brand-primary hover:text-brand-primary text-slate-300 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            <Database className="w-4 h-4" />
                            Bulk Sync Empty Devices
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product List */}
                <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col h-[75vh]">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center p-4 text-slate-500">Loading...</div>
                        ) : filteredProducts.map(p => (
                            <button
                                key={p._id || p.id}
                                onClick={() => handleEdit(p)}
                                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                                    editingProduct?._id === (p._id || p.id) 
                                        ? 'bg-blue-900/40 border-blue-500' 
                                        : 'bg-slate-800/50 border-transparent hover:border-slate-600'
                                }`}
                            >
                                <div className="font-bold text-white text-sm">{p.name || p.model}</div>
                                <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                    <span>{p.condition} • {p.storage || 'N/A'}</span>
                                    {p.specs?.globalPrice && (
                                        <span className="text-emerald-400 font-bold">€{p.specs.globalPrice}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2">
                    {editingProduct ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-4">
                                    {editingProduct.image && (
                                        <img src={editingProduct.image} alt={editingProduct.name} className="w-16 h-16 rounded-xl object-contain bg-white/5 p-1" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{editingProduct.name || editingProduct.model}</h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">
                                            HandyLand Price: €{editingProduct.price}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleResearchEbay}
                                        disabled={researching}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-emerald-400 transition-colors"
                                    >
                                        <Globe size={16} /> {researching ? 'Fetching...' : 'Fetch Global Price'}
                                    </button>
                                    <button
                                        onClick={handleSaveSpecs}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Save size={16} /> Save Specs
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider mb-2">Market Intelligence</h4>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Global Average Market Price (€)</label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                                                placeholder="e.g. 550"
                                                value={specsForm.globalPrice}
                                                onChange={e => setSpecsForm({...specsForm, globalPrice: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    {globalStats && (
                                        <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl text-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-emerald-400/80 font-bold">eBay DE Market Status</span>
                                                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-bold">Live Data</span>
                                            </div>
                                            <div className="flex items-end gap-4 mt-2">
                                                <div>
                                                    <span className="block text-xs text-emerald-400/60 uppercase tracking-widest mb-1">Average</span>
                                                    <span className="text-2xl font-black text-emerald-400">€{globalStats.avg}</span>
                                                </div>
                                                <div className="pb-1">
                                                    <span className="text-emerald-400/60 text-xs">Min: €{globalStats.min} • Max: €{globalStats.max}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-emerald-400/60 mt-3 pt-3 border-t border-emerald-500/20">
                                                Based on {globalStats.count} recent completed sales for "{editingProduct.name || editingProduct.model}".
                                            </p>
                                        </div>
                                    )}

                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider mb-2">World-Class Specifications</h4>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Processor / Hardware</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="Apple A17 Pro (3nm)"
                                            value={specsForm.processor}
                                            onChange={e => setSpecsForm({...specsForm, processor: e.target.value})}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">RAM</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="8GB"
                                                value={specsForm.ram}
                                                onChange={e => setSpecsForm({...specsForm, ram: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">OS</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="iOS 17"
                                                value={specsForm.os}
                                                onChange={e => setSpecsForm({...specsForm, os: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Display Tech</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="6.7&quot; Super Retina XDR OLED, 120Hz"
                                            value={specsForm.display}
                                            onChange={e => setSpecsForm({...specsForm, display: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-400">Main Camera System</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="48 MP, f/1.8, 24mm (wide), 1/1.28&quot;"
                                            value={specsForm.camera}
                                            onChange={e => setSpecsForm({...specsForm, camera: e.target.value})}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">Battery & Scan</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="4422 mAh, 100% Health"
                                                value={specsForm.battery}
                                                onChange={e => setSpecsForm({...specsForm, battery: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">Performance (Antutu/Geekbench)</label>
                                            <div className="relative">
                                                <Zap className="absolute left-2.5 top-1/2 -translate-y-1/2 text-yellow-500 w-3.5 h-3.5" />
                                                <input
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="Score: ~1,532,000"
                                                    value={specsForm.benchmarkScore}
                                                    onChange={e => setSpecsForm({...specsForm, benchmarkScore: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1 mt-4 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 block">Advanced: Raw Specs JSON (Grouped Data)</label>
                                                <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded">Deep specifications injected here</span>
                                            </div>
                                            <button
                                                onClick={handleFetchEbaySpecs}
                                                disabled={fetchingSpecs || !editingProduct}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[11px] font-bold rounded-lg transition-colors border border-brand-primary/30"
                                            >
                                                <Database className="w-3.5 h-3.5" />
                                                {fetchingSpecs ? 'Extracting...' : 'Auto-Fetch from eBay'}
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-[11px] font-mono focus:outline-none focus:border-blue-500 h-28 custom-scrollbar resize-none"
                                            placeholder='{"Hardware": {"RAM": "8GB CPU"}, "Kamera": {"Video": "8K"}}'
                                            value={advancedSpecsJson}
                                            onChange={e => setAdvancedSpecsJson(e.target.value)}
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl h-[75vh] flex flex-col items-center justify-center text-center p-8">
                            <Globe className="w-16 h-16 text-slate-700 mb-4" />
                            <h3 className="text-2xl font-bold text-slate-300 mb-2">Select a Device to Compare</h3>
                            <p className="text-slate-500 max-w-sm">Choose a product from the list to fetch global market pricing from eBay and enrich its technical specifications for the unified Compare page.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
