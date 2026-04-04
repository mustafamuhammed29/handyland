import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, Smartphone, CheckCircle2, Battery, Cpu, Camera, Monitor, Zap } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';

export const ComparePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState<{ slotIndex: number } | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        // Fetch products list for search
        const fetchProducts = async () => {
            try {
                const data: any = await api.get('/api/products');
                if (Array.isArray(data)) {
                    setProducts(data);
                } else if (data && Array.isArray(data.data)) {
                    setProducts(data.data);
                } else if (data && Array.isArray(data.products)) {
                    setProducts(data.products);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProducts();
    }, []);

    // Effect to sync URL params to selectedProducts once products are loaded
    useEffect(() => {
        if (products.length > 0) {
            const deviceIds = searchParams.get('devices')?.split(',') || [];
            if (deviceIds.length > 0 && selectedProducts.length === 0) {
                const initialSelected = [null, null, null];
                deviceIds.forEach((id, index) => {
                    if (index < 3) {
                        const found = products.find(p => p._id === id || p.id === id);
                        if (found) initialSelected[index] = found;
                    }
                });
                setSelectedProducts(initialSelected);
            }
        }
    }, [products, searchParams]);

    const updateUrlParams = (newSelected: any[]) => {
        const ids = newSelected.filter(Boolean).map(p => p._id || p.id).join(',');
        if (ids) {
            setSearchParams({ devices: ids });
        } else {
            setSearchParams({});
        }
    };

    const handleSelectProduct = (product: any, slotIndex: number) => {
        const newSelected = [...selectedProducts];
        newSelected[slotIndex] = product;
        setSelectedProducts(newSelected);
        updateUrlParams(newSelected);
        setIsSearching(null);
        setSearchTerm('');
    };

    const handleRemoveProduct = (slotIndex: number) => {
        const newSelected = [...selectedProducts];
        newSelected[slotIndex] = undefined; // Set to undefined instead of splicing to keep the slot
        setSelectedProducts(newSelected);
        updateUrlParams(newSelected);
    };

    // Prepare exactly 3 slots for UI layout
    const slots = [0, 1, 2];

    const safeProducts = Array.isArray(products) ? products : [];
    const filteredSearch = safeProducts.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const getDynamicSpecs = () => {
        const specMap: Record<string, Set<string>> = {};
        
        selectedProducts.forEach(product => {
            if (!product) return;
            
            // Map core fields to "Stammdaten" (Master Data) like the screenshot
            if (!specMap['Stammdaten']) specMap['Stammdaten'] = new Set();
            if (product.brand) specMap['Stammdaten'].add('Marke');
            if (product.model || product.name) specMap['Stammdaten'].add('Modell');
            if (product.color) specMap['Stammdaten'].add('Farbe');
            if (product.storage) specMap['Stammdaten'].add('Speicher');
            if (product.condition) specMap['Stammdaten'].add('Zustand');
            
            if (!product.specs) return;
            
            Object.keys(product.specs).forEach(category => {
                const categoryValue = product.specs[category];
                if (category === 'globalPrice' || category === 'benchmarkScore') return;

                if (
                    categoryValue && 
                    typeof categoryValue === 'object' && 
                    !Array.isArray(categoryValue)
                ) {
                    if (!specMap[category]) specMap[category] = new Set();
                    Object.keys(categoryValue).forEach(key => specMap[category].add(key));
                } else if (typeof categoryValue === 'string' || typeof categoryValue === 'number' || typeof categoryValue === 'boolean') {
                    // Legacy flat specs (processor, display) mapped to Hauptmerkmale
                    const keyName = category.charAt(0).toUpperCase() + category.slice(1);
                    if (['Processor', 'Display', 'Camera', 'Battery'].includes(keyName)) {
                        if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                        specMap['Hauptmerkmale'].add(keyName);
                    } else {
                        if (!specMap['Weitere Details']) specMap['Weitere Details'] = new Set();
                        specMap['Weitere Details'].add(keyName);
                    }
                }
            });
        });

        const finalized = Object.entries(specMap)
            .filter(([_, keysSet]) => keysSet.size > 0)
            .map(([category, keysSet]) => ({
                category,
                keys: Array.from(keysSet)
            }));
            
        // Order categories for optimal visualization
        return finalized.sort((a, b) => {
            if (a.category === 'Stammdaten') return -1;
            if (b.category === 'Stammdaten') return 1;
            if (a.category === 'Hauptmerkmale') return -1;
            if (b.category === 'Hauptmerkmale') return 1;
            return 0;
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-32 pb-24 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                        {t('compare.title', 'Compare Devices')}
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        {t('compare.subtitle', 'Side-by-side technical specifications and pricing to help you make the perfect choice.')}
                    </p>
                </div>

                {/* Selection Slots */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {slots.map((slotIndex) => {
                        const product = selectedProducts[slotIndex];
                        
                        return (
                            <div key={slotIndex} className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 min-h-[320px] flex flex-col items-center justify-center group overflow-hidden transition-all hover:border-brand-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                
                                {isSearching?.slotIndex === slotIndex ? (
                                    <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-300">{t('compare.selectDevice', 'Select a device')}</h3>
                                            <button onClick={() => setIsSearching(null)} title="Close search" className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                                        </div>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <input 
                                                autoFocus
                                                type="text" 
                                                placeholder={t('compare.searchProducts', 'Search products...')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                            {filteredSearch.map(p => (
                                                <button 
                                                    key={p._id || p.id} 
                                                    onClick={() => handleSelectProduct(p, slotIndex)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                                >
                                                    <img src={getImageUrl(p.images?.[0] || p.image || p.thumbnail)} alt={p.name} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-10 h-10 object-contain bg-white rounded-md p-1" />
                                                    <span className="font-bold text-sm truncate">{p.name || p.model}</span>
                                                </button>
                                            ))}
                                            {filteredSearch.length === 0 && <div className="text-center text-slate-500 mt-8 text-sm">{t('compare.noDevicesFound', 'No devices found.')}</div>}
                                        </div>
                                    </div>
                                ) : product ? (
                                    <>
                                        <button 
                                            onClick={() => handleRemoveProduct(slotIndex)}
                                            title="Remove device"
                                            className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors z-10"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="h-40 w-full mb-6 relative flex items-center justify-center">
                                            <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-brand-primary/20 transition-all"></div>
                                            <img src={getImageUrl(product.images?.[0] || product.image || product.thumbnail)} alt={product.name || product.model} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-auto h-full max-w-full rounded-2xl object-cover mb-4 shadow-xl group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-center mb-2">{product.name || product.model}</h3>
                                        
                                        <div className="flex flex-col items-center justify-center gap-1 mb-4">
                                            {product.specs?.globalPrice && (
                                                <div className="text-slate-400 text-sm line-through decoration-red-500/50">{t('compare.marketAverage', 'Market Ø')} €{product.specs.globalPrice}</div>
                                            )}
                                            <div className="text-brand-primary font-black text-2xl flex items-center gap-2">
                                                €{product.pricing?.basePrice || product.price}
                                                {product.specs?.globalPrice && Number(product.specs.globalPrice) > Number(product.price) && (
                                                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {t('compare.save', 'Save')} €{Number(product.specs.globalPrice) - Number(product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/products/${product.id || product._id}`)}
                                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm font-bold transition-colors"
                                        >
                                            {t('compare.viewDetails', 'View Details')}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setIsSearching({ slotIndex })}
                                        className="flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-brand-primary transition-colors"
                                    >
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 hover:border-brand-primary flex items-center justify-center transition-colors">
                                            <Plus className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold">{t('compare.addDevice', 'Add Device to Compare')}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Details Table */}
                {selectedProducts.filter(Boolean).length > 0 && (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    <tr className="hover:bg-slate-800/20 transition-colors bg-slate-900/40">
                                        <td className="p-4 md:p-6 text-slate-300 font-bold border-b border-slate-800 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" /> {t('compare.benchmarkScore', 'Benchmark Score')}
                                        </td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50 font-black text-amber-500 text-lg">
                                                {selectedProducts[i]?.specs?.benchmarkScore || '-'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* ── Dynamic Specifications Rendered ── */}
                                    {getDynamicSpecs().map(({ category, keys }) => (
                                        <React.Fragment key={category}>
                                            <tr className="bg-slate-950/80">
                                                <td className="p-4 md:p-6 font-bold text-emerald-400 border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4"/> {category}
                                                </td>
                                                {slots.map(i => <td key={i} className="w-1/4 p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>)}
                                            </tr>
                                            {keys.map(specKey => (
                                                <tr key={specKey} className="hover:bg-slate-800/20 transition-colors group">
                                                    <td className="p-4 md:p-5 text-slate-400 font-medium border-b border-slate-800 group-hover:text-slate-300 transition-colors">{specKey}</td>
                                                    {slots.map(i => {
                                                        const p = selectedProducts[i];
                                                        let specValue: any = undefined;
                                                        
                                                        if (p) {
                                                            if (category === 'Stammdaten') {
                                                                if (specKey === 'Marke') specValue = p.brand;
                                                                if (specKey === 'Modell') specValue = p.model || p.name;
                                                                if (specKey === 'Farbe') specValue = p.color || p.farbe;
                                                                if (specKey === 'Speicher') specValue = p.storage || p.speicher;
                                                                if (specKey === 'Zustand') specValue = p.condition;
                                                            } else if (category === 'Hauptmerkmale' || category === 'Weitere Details') {
                                                                const lowerKey = specKey.toLowerCase();
                                                                specValue = p.specs?.[lowerKey] || p.specs?.[specKey];
                                                            } else {
                                                                specValue = p.specs?.[category]?.[specKey];
                                                            }
                                                        }
                                                        
                                                        let renderedValue: React.ReactNode = '-';
                                                        if (specValue !== undefined && specValue !== null && specValue !== '') {
                                                            if (typeof specValue === 'boolean') {
                                                                renderedValue = specValue ? 'Ja' : 'Nein';
                                                            } else {
                                                                renderedValue = String(specValue);
                                                            }
                                                        }
                                                        
                                                        return (
                                                            <td key={i} className="p-4 md:p-5 border-b border-slate-800 border-l border-slate-800/50 text-sm leading-relaxed text-slate-300 font-medium">
                                                                {renderedValue}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
