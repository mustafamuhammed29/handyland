import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, CheckCircle2, Zap, ShoppingCart, Share2 } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export const ComparePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [isSearching, setIsSearching] = useState<{ slotIndex: number } | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
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
            } else if (deviceIds.length === 0 && selectedProducts.length === 0) {
                setSelectedProducts([null, null, null]);
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
        setBrandFilter('');
    };

    const handleRemoveProduct = (slotIndex: number) => {
        const newSelected = [...selectedProducts];
        newSelected[slotIndex] = null;
        setSelectedProducts(newSelected);
        updateUrlParams(newSelected);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success(t('compare.copied', 'Link copied to clipboard!'));
        setTimeout(() => setCopied(false), 2000);
    };

    const slots = [0, 1, 2];
    const safeProducts = Array.isArray(products) ? products : [];
    
    const filteredSearch = safeProducts.filter(p => {
        const matchesSearch = (p.name || p.model || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = brandFilter === '' || (p.brand || '').toLowerCase() === brandFilter.toLowerCase();
        return matchesSearch && matchesBrand;
    });

    const activeProducts = selectedProducts.filter(Boolean);
    
    // Suggested products to fill empty slots
    const suggestedProducts = safeProducts
        .filter(p => !activeProducts.find(ap => (ap._id || ap.id) === (p._id || p.id)))
        .slice(0, 4);

    // Number extraction for Winner Logic
    const extractNumber = (val: any) => {
        if (!val) return -1;
        const parse = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(parse) ? -1 : parse;
    };

    const getWinnerIndices = (values: any[], metricKey: string): number[] => {
        // We only highlight if there's at least 2 products
        if (activeProducts.length < 2) return [];
        
        const nums = values.map(extractNumber);
        // Exclude empty or non-numeric
        const validIndices = nums.map((n, i) => ({ n, i })).filter(item => item.n !== -1);
        if (validIndices.length <= 1) return []; 
        
        let target: number;
        
        // Logic: Lower is better for price or weight. Otherwise higher is better.
        const isLowerBetter = metricKey.toLowerCase().includes('price') || metricKey.toLowerCase().includes('gewicht');
        
        if (isLowerBetter) {
            target = Math.min(...validIndices.map(v => v.n));
        } else {
            target = Math.max(...validIndices.map(v => v.n));
        }

        return validIndices.filter(v => v.n === target).map(v => v.i);
    };

    const getDynamicSpecs = () => {
        const specMap: Record<string, Set<string>> = {};
        
        selectedProducts.forEach(product => {
            if (!product) return;
            
            if (!specMap['Stammdaten']) specMap['Stammdaten'] = new Set();
            if (product.brand) specMap['Stammdaten'].add('Marke');
            if (product.model || product.name) specMap['Stammdaten'].add('Modell');
            if (product.color) specMap['Stammdaten'].add('Farbe');
            if (product.storage) specMap['Stammdaten'].add('Speicher');
            if (product.condition) specMap['Stammdaten'].add('Zustand');
            
            if (product.processor) {
                if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                specMap['Hauptmerkmale'].add('Processor');
            }
            if (product.display) {
                if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                specMap['Hauptmerkmale'].add('Display');
            }
            if (product.battery) {
                if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                specMap['Hauptmerkmale'].add('Battery');
            }

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
                    const lowerKey = category.toLowerCase();
                    const isHaupt = ['processor', 'display', 'camera', 'battery', 'ram', 'os'].includes(lowerKey);
                    
                    let normalizedKey = category.charAt(0).toUpperCase() + category.slice(1);
                    if (lowerKey === 'os') normalizedKey = 'OS';
                    if (lowerKey === 'ram') normalizedKey = 'RAM';

                    if (isHaupt) {
                        if (!specMap['Hauptmerkmale']) specMap['Hauptmerkmale'] = new Set();
                        specMap['Hauptmerkmale'].add(normalizedKey);
                    } else {
                        if (!specMap['Weitere Details']) specMap['Weitere Details'] = new Set();
                        specMap['Weitere Details'].add(normalizedKey);
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
            
        return finalized.sort((a, b) => {
            if (a.category === 'Stammdaten') return -1;
            if (b.category === 'Stammdaten') return 1;
            if (a.category === 'Hauptmerkmale') return -1;
            if (b.category === 'Hauptmerkmale') return 1;
            return 0;
        });
    };

    return (
        <div className="min-h-[100dvh] bg-slate-950 pt-32 pb-24 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                        {t('compare.title', 'Compare Devices')}
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                        <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-700 hover:border-brand-primary/50 text-slate-300 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-brand-primary/20"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />} 
                            {copied ? 'Link Copied!' : 'Share Compare'}
                        </button>
                        
                        {activeProducts.length > 1 && (
                            <button
                                onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                                className={`flex items-center gap-2 px-5 py-2.5 border rounded-full font-bold text-sm transition-all shadow-lg ${showDifferencesOnly ? 'bg-brand-primary border-brand-primary text-black' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-brand-primary/50 hover:shadow-brand-primary/20'}`}
                            >
                                <Zap className="w-4 h-4" /> 
                                {showDifferencesOnly ? 'Showing Differences' : 'Show Differences Only'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {slots.map((slotIndex) => {
                        const product = selectedProducts[slotIndex];
                        
                        return (
                            <div key={slotIndex} className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 min-h-[360px] flex flex-col items-center justify-center group overflow-hidden transition-all hover:border-brand-primary/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                
                                {isSearching?.slotIndex === slotIndex ? (
                                    <div className="absolute inset-0 bg-slate-900 z-20 flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-slate-300">{t('compare.selectDevice', 'Gerät auswählen')}</h3>
                                            <button onClick={() => setIsSearching(null)} title={t('common.close', 'Schließen')} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <select 
                                                title="Brand Filter"
                                                aria-label="Filter by Brand"
                                                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                                                value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}
                                            >
                                                <option value="">All Brands</option>
                                                <option value="Apple">Apple</option>
                                                <option value="Samsung">Samsung</option>
                                                <option value="Google">Google</option>
                                                <option value="Xiaomi">Xiaomi</option>
                                                <option value="Sony">Sony</option>
                                            </select>
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    placeholder="Search..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                            {filteredSearch.map(p => (
                                                <button 
                                                    key={p._id || p.id} 
                                                    onClick={() => handleSelectProduct(p, slotIndex)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                                >
                                                    <img src={getImageUrl(p.images?.[0] || p.image || p.thumbnail)} alt={p.name} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-10 h-10 object-contain bg-white rounded-md p-1" />
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm truncate">{p.name || p.model}</div>
                                                        <div className="text-xs text-slate-400">{p.price} €</div>
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredSearch.length === 0 && <div className="text-center text-slate-500 mt-8 text-sm">{t('compare.noDevicesFound', 'Keine Geräte gefunden.')}</div>}
                                        </div>
                                    </div>
                                ) : product ? (
                                    <>
                                        <button 
                                            onClick={() => handleRemoveProduct(slotIndex)}
                                            title={t('common.remove', 'Entfernen')}
                                            className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors z-10"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="h-40 w-full mb-6 relative flex items-center justify-center">
                                            <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-brand-primary/20 transition-all"></div>
                                            <img src={getImageUrl(product.images?.[0] || product.image || product.thumbnail)} alt={product.name || product.model} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-auto h-full max-w-full rounded-2xl object-cover mb-4 shadow-xl group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-center mb-2 line-clamp-1">{product.name || product.model}</h3>
                                        
                                        <div className="flex flex-col items-center justify-center gap-1 mb-4">
                                            {product.specs?.globalPrice && (
                                                <div className="text-slate-400 text-sm line-through decoration-red-500/50">{t('compare.marketAverage', 'Markt Ø')} €{product.specs.globalPrice}</div>
                                            )}
                                            <div className="text-brand-primary font-black text-2xl flex items-center gap-2">
                                                €{product.pricing?.basePrice || product.price}
                                                {product.specs?.globalPrice && Number(product.specs.globalPrice) > Number(product.price) && (
                                                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {t('compare.save', 'Spare')} €{Number(product.specs.globalPrice) - Number(product.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex w-full gap-2 mt-auto">
                                            <button 
                                                onClick={() => navigate(`/products/${product.id || product._id}`)}
                                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors text-center"
                                            >
                                                Details
                                            </button>
                                            <button 
                                                onClick={() => addToCart(product)}
                                                className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-secondary text-black rounded-xl text-sm font-bold transition-colors shadow-[0_0_15px_rgba(var(--brand-primary),0.3)] flex items-center justify-center gap-1"
                                            >
                                                <ShoppingCart className="w-4 h-4" /> Add
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setIsSearching({ slotIndex })}
                                        className="flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-brand-primary transition-colors h-full w-full"
                                    >
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 group-hover:border-brand-primary flex items-center justify-center transition-colors">
                                            <Plus className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold">{t('compare.addDevice', 'Add Device')}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Suggestions for Empty Slots */}
                {activeProducts.length === 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h3 className="text-xl font-bold text-slate-300 text-center mb-6">Popular Devices to Compare</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {suggestedProducts.map(p => (
                                <button
                                    key={p._id || p.id}
                                    onClick={() => handleSelectProduct(p, 0)}
                                    className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-brand-primary/50 px-4 py-2 rounded-2xl transition-colors"
                                >
                                    <img src={getImageUrl(p.images?.[0] || p.image || p.thumbnail)} alt={p.name} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-8 h-8 object-contain bg-white rounded-md p-1" />
                                    <span className="font-bold text-sm text-slate-300">{p.name || p.model}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comparison Details Table */}
                {activeProducts.length > 0 && (
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr>
                                        <th className="w-1/4 p-4"></th>
                                        {slots.map(i => (
                                            <th key={i} className="w-1/4 p-4 text-center">
                                                {selectedProducts[i] && (
                                                    <span className="text-sm font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
                                                        {selectedProducts[i].name || selectedProducts[i].model}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-slate-950/80">
                                        <td className="p-4 md:p-6 text-emerald-400 font-bold border-b border-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                                            <Zap className="w-4 h-4" /> Performance
                                        </td>
                                        {slots.map((_, i) => <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>)}
                                    </tr>

                                    {/* Handle Benchmark Score Special Logic */}
                                    {(() => {
                                        const values = slots.map(i => selectedProducts[i]?.specs?.benchmarkScore || '-');
                                        const isAllSame = activeProducts.length > 1 && values.every(v => v === values[0] && v !== '-');
                                        if (showDifferencesOnly && isAllSame) return null;

                                        const winners = getWinnerIndices(values, 'benchmark');

                                        return (
                                            <tr className="hover:bg-slate-800/20 transition-colors bg-slate-900/20">
                                                <td className="p-4 md:p-5 text-slate-400 font-medium border-b border-slate-800 pl-8">Antutu / Geekbench</td>
                                                {slots.map(i => {
                                                    const isWinner = winners.includes(i);
                                                    return (
                                                        <td key={i} className={`p-4 md:p-5 border-b border-slate-800 border-l border-slate-800/50 font-black text-lg transition-colors ${isWinner ? 'text-emerald-400 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-300'}`}>
                                                            {values[i]}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })()}

                                    {/* Dynamic Specifications Rendered */}
                                    {getDynamicSpecs().map(({ category, keys }) => (
                                        <React.Fragment key={category}>
                                            <tr className="bg-slate-950/80">
                                                <td className="p-4 md:p-6 font-bold text-emerald-400 border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4"/> {category}
                                                </td>
                                                {slots.map(i => <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>)}
                                            </tr>
                                            {keys.map(specKey => {
                                                const rawValues = slots.map(i => {
                                                    const p = selectedProducts[i];
                                                    if (!p) return undefined;
                                                    
                                                    if (category === 'Stammdaten') {
                                                        if (specKey === 'Marke') return p.brand;
                                                        if (specKey === 'Modell') return p.model || p.name;
                                                        if (specKey === 'Farbe') return p.color || p.farbe;
                                                        if (specKey === 'Speicher') return p.storage || p.speicher;
                                                        if (specKey === 'Zustand') return p.condition;
                                                    } else if (category === 'Hauptmerkmale' || category === 'Weitere Details') {
                                                        const lowerKey = specKey.toLowerCase();
                                                        if (lowerKey === 'processor') return p.processor || p.specs?.processor || p.specs?.Processor;
                                                        if (lowerKey === 'display') return p.display || p.specs?.display || p.specs?.Display;
                                                        if (lowerKey === 'battery') return p.battery || p.specs?.battery || p.specs?.Battery;
                                                        if (lowerKey === 'os') return p.specs?.os || p.specs?.OS || p.specs?.Os;
                                                        if (lowerKey === 'ram') return p.specs?.ram || p.specs?.RAM || p.specs?.Ram;
                                                        
                                                        return p.specs?.[lowerKey] || p.specs?.[specKey] || p.specs?.[specKey.toLowerCase()];
                                                    } else {
                                                        return p.specs?.[category]?.[specKey];
                                                    }
                                                });

                                                const renderedValues = rawValues.map(specValue => {
                                                    if (specValue !== undefined && specValue !== null && specValue !== '') {
                                                        if (typeof specValue === 'boolean') return specValue ? 'Ja' : 'Nein';
                                                        return String(specValue);
                                                    }
                                                    return '-';
                                                });

                                                const isAllSame = activeProducts.length > 1 && renderedValues.every(v => v === renderedValues[0] && v !== '-');
                                                if (showDifferencesOnly && isAllSame) return null;

                                                const winners = getWinnerIndices(renderedValues, specKey);

                                                return (
                                                    <tr key={specKey} className="hover:bg-slate-800/20 transition-colors group">
                                                        <td className="p-4 md:p-5 text-slate-400 font-medium border-b border-slate-800 pl-8 group-hover:text-slate-300 transition-colors">{specKey}</td>
                                                        {slots.map(i => {
                                                            const isWinner = winners.includes(i) && renderedValues[i] !== '-';
                                                            return (
                                                                <td key={i} className={`p-4 md:p-5 border-b border-slate-800 border-l border-slate-800/50 text-sm leading-relaxed transition-colors ${isWinner ? 'text-emerald-400 font-bold bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'text-slate-300 font-medium'}`}>
                                                                    {renderedValues[i]}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
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
