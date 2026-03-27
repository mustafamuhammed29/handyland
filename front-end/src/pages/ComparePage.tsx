import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, Smartphone, CheckCircle2, Battery, Cpu, Camera, Monitor, Zap } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { useNavigate } from 'react-router-dom';

export const ComparePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState<{ slotIndex: number } | null>(null);

    useEffect(() => {
        // Fetch products list for search
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setProducts(data);
                    } else if (data && Array.isArray(data.data)) {
                        setProducts(data.data);
                    } else if (data && Array.isArray(data.products)) {
                        setProducts(data.products);
                    } else {
                        setProducts([]);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProducts();
    }, []);

    const handleSelectProduct = (product: any, slotIndex: number) => {
        const newSelected = [...selectedProducts];
        newSelected[slotIndex] = product;
        setSelectedProducts(newSelected);
        setIsSearching(null);
        setSearchTerm('');
    };

    const handleRemoveProduct = (slotIndex: number) => {
        const newSelected = [...selectedProducts];
        newSelected.splice(slotIndex, 1);
        setSelectedProducts(newSelected);
    };

    // Prepare exactly 3 slots for UI layout
    const slots = [0, 1, 2];

    const safeProducts = Array.isArray(products) ? products : [];
    const filteredSearch = safeProducts.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

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
                                            <h3 className="font-bold text-slate-300">Select a device</h3>
                                            <button onClick={() => setIsSearching(null)} title="Close search" className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                                        </div>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <input 
                                                autoFocus
                                                type="text" 
                                                placeholder="Search products..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                            {filteredSearch.map(p => (
                                                <button 
                                                    key={p._id} 
                                                    onClick={() => handleSelectProduct(p, slotIndex)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
                                                >
                                                    <img src={getImageUrl(p.images?.[0])} alt={p.name} className="w-10 h-10 object-contain bg-white rounded-md p-1" />
                                                    <span className="font-bold text-sm truncate">{p.name}</span>
                                                </button>
                                            ))}
                                            {filteredSearch.length === 0 && <div className="text-center text-slate-500 mt-8 text-sm">No devices found.</div>}
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
                                        <div className="h-40 w-full mb-6 relative">
                                            <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[40px] -z-10 group-hover:bg-brand-primary/20 transition-all"></div>
                                            <img src={getImageUrl(product.images?.[0])} alt={product.name} className="w-full h-full object-contain mb-4 filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-center mb-2">{product.name}</h3>
                                        <div className="text-brand-primary font-bold text-xl mb-4">€{product.pricing?.basePrice || product.price}</div>
                                        <button 
                                            onClick={() => navigate(`/products/${product._id}`)}
                                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm font-bold transition-colors"
                                        >
                                            View Details
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
                                        <span className="font-bold">Add Device to Compare</span>
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
                                    {/* Specifications Section */}
                                    <tr className="bg-slate-950/80">
                                        <td className="w-1/4 p-4 md:p-6 font-bold text-brand-secondary border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Cpu className="w-4 h-4"/> Hardware 
                                        </td>
                                        {slots.map(i => (
                                            <td key={i} className="w-1/4 p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 md:p-6 text-slate-400 font-medium border-b border-slate-800">Processor</td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50 font-bold">
                                                {selectedProducts[i]?.specifications?.processor || selectedProducts[i]?.processor || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 md:p-6 text-slate-400 font-medium border-b border-slate-800">Storage Options</td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50 text-sm">
                                                {selectedProducts[i]?.pricing?.storage?.map((s:any) => s.capacity).join(', ') || '-'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Display Section */}
                                    <tr className="bg-slate-950/80">
                                        <td className="p-4 md:p-6 font-bold text-brand-secondary border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Monitor className="w-4 h-4"/> Display
                                        </td>
                                        {slots.map(i => (
                                            <td key={i} className="w-1/4 p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 md:p-6 text-slate-400 font-medium border-b border-slate-800">Screen Size</td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50 font-bold">
                                                {selectedProducts[i]?.specifications?.display || selectedProducts[i]?.display || '-'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Camera Section */}
                                    <tr className="bg-slate-950/80">
                                        <td className="p-4 md:p-6 font-bold text-brand-secondary border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Camera className="w-4 h-4"/> Camera
                                        </td>
                                        {slots.map(i => (
                                            <td key={i} className="w-1/4 p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 md:p-6 text-slate-400 font-medium border-b border-slate-800">Main Camera</td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50 text-sm leading-relaxed">
                                                {selectedProducts[i]?.specifications?.camera || selectedProducts[i]?.camera || '-'}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* General Section */}
                                    <tr className="bg-slate-950/80">
                                        <td className="p-4 md:p-6 font-bold text-brand-secondary border-b border-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                                            <Zap className="w-4 h-4"/> General
                                        </td>
                                        {slots.map(i => (
                                            <td key={i} className="w-1/4 p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50"></td>
                                        ))}
                                    </tr>
                                    <tr className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4 md:p-6 text-slate-400 font-medium border-b border-slate-800">Colors</td>
                                        {slots.map(i => (
                                            <td key={i} className="p-4 md:p-6 border-b border-slate-800 border-l border-slate-800/50">
                                                <div className="flex gap-2 flex-wrap">
                                                    {selectedProducts[i]?.pricing?.colors?.map((c:any) => (
                                                        <div key={c.name} title={c.name} className="w-5 h-5 rounded-full border border-slate-600" style={{backgroundColor: c.hex}}></div>
                                                    ))}
                                                    {!selectedProducts[i]?.pricing?.colors && '-'}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
