import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { translations } from '../i18n';
import { Headphones, Zap, Shield, Watch, Plus, Sparkles, X, Layers, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

interface AccessoriesProps {
    lang: LanguageCode;
}

export const Accessories: React.FC<AccessoriesProps> = ({ lang }) => {
    const t = translations[lang];
    const { settings } = useSettings();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [activeCat, setActiveCat] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(15);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // State for dynamic accessories from database
    const [accessories, setAccessories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        fetch('/api/accessories')
            .then(res => res.json())
            .then(data => {
                setAccessories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load accessories", err);
                setLoading(false);
            });
    }, []);

    const handleAddToCart = (item: any) => {
        const imageUrl = getImageUrl(item.image || item.images?.[0]);
        addToCart({
            id: item._id || item.id,
            title: item.name,
            subtitle: item.category,
            price: item.price,
            image: imageUrl,
            category: 'accessory'
        });
        addToast(`${item.name} added to cart!`, 'success');
    };

    const categories = [
        { id: 'all', label: 'ALL GEAR', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'audio', label: t.catAudio, icon: <Headphones className="w-4 h-4" /> },
        { id: 'power', label: t.catPower, icon: <Zap className="w-4 h-4" /> },
        { id: 'protection', label: t.catProtection, icon: <Shield className="w-4 h-4" /> },
        { id: 'wearables', label: t.catWearables, icon: <Watch className="w-4 h-4" /> },
    ];

    const filteredItems = accessories.filter(item => {
        const matchesCategory = activeCat === 'all' || item.category === activeCat;
        const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Helper to get image URL
    const getImageUrl = (url: string) => {
        if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80'; // Default fallback
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:5000${url}`;
    };

    return (
        <section className="py-24 relative bg-slate-900 border-t border-slate-800 overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-black pointer-events-none"></div>

            {/* --- GEAR INSPECTOR MODAL --- */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-7xl max-h-[90vh] bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Left: Visual */}
                        <div className="w-full md:w-1/2 relative bg-gradient-to-br from-purple-900/20 to-black p-8 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-50"></div>
                            <img
                                src={getImageUrl(selectedItem.image)}
                                alt={selectedItem.name}
                                className="relative z-10 w-3/4 max-w-sm drop-shadow-[0_20px_50px_rgba(168,85,247,0.3)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Right: Specs */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-slate-950">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                    {selectedItem.tag}
                                </span>
                            </div>

                            <h2 className="text-3xl font-black text-white mb-2 leading-tight">{selectedItem.name}</h2>
                            <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-bold mb-6">
                                {selectedItem.price}{t.currency}
                            </div>

                            <p className="text-slate-400 leading-relaxed mb-8 border-l-2 border-purple-800 pl-4 text-sm">
                                {selectedItem.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {/* New Top-Level Specs */}
                                {selectedItem.color && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Color</div>
                                        <div className="text-white text-sm font-medium truncate">{selectedItem.color}</div>
                                    </div>
                                )}
                                {selectedItem.storage && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Storage</div>
                                        <div className="text-white text-sm font-medium truncate">{selectedItem.storage}</div>
                                    </div>
                                )}
                                {selectedItem.battery && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Battery</div>
                                        <div className="text-white text-sm font-medium truncate">{selectedItem.battery}</div>
                                    </div>
                                )}
                                {selectedItem.processor && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Processor</div>
                                        <div className="text-white text-sm font-medium truncate">{selectedItem.processor}</div>
                                    </div>
                                )}
                                {selectedItem.display && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Display</div>
                                        <div className="text-white text-sm font-medium truncate">{selectedItem.display}</div>
                                    </div>
                                )}

                                {/* Legacy Specs */}
                                {selectedItem.specs && Object.entries(selectedItem.specs).map(([key, value]) => (
                                    <div key={key} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{key}</div>
                                        {/* @ts-ignore */}
                                        <div className="text-white text-sm font-medium truncate">{value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedItem);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <Plus className="w-5 h-5" /> Equip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-white flex items-center gap-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                {settings?.content?.accessoriesTitle || t.accTitle}
                            </span>
                        </h2>
                        <p className="text-slate-400 mt-2 font-mono text-sm tracking-wider">
                            {settings?.content?.accessoriesSubtitle || t.accSubtitle} // SYSTEM_READY
                        </p>
                    </div>

                    {/* Search & Categories */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search Bar */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Gear..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600"
                            />
                        </div>

                        {/* Category Selector */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCat(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all uppercase tracking-wider ${activeCat === cat.id
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-white'
                                        }`}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.slice(0, visibleCount).map((item) => (
                        <div
                            key={item.id}
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="group relative bg-slate-900/30 rounded-2xl p-4 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col"
                        >
                            {/* Hover Border Glow */}
                            <div className={`absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>

                            {/* Image Container with Float Effect */}
                            <div
                                className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 mb-4 cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                            >
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${hoveredId === item.id ? 'scale-110' : 'scale-100'
                                        }`}
                                />

                                {/* Tag */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                                    {item.tag}
                                </div>

                                {/* Quick Inspect Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                                    <span className="bg-purple-500/80 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> Inspect
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1 flex-1">
                                <h3 className="text-white font-bold truncate hover:text-purple-400 cursor-pointer" onClick={() => setSelectedItem(item)}>{item.name}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-purple-400 font-mono font-bold text-lg">{item.price}{t.currency}</span>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-all text-xs font-bold uppercase"
                                        >
                                            <ShoppingCart className="w-3 h-3" />
                                            {t.equip}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More Button */}
                {
                    visibleCount < filteredItems.length && (
                        <div className="mt-12 text-center">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 15)}
                                className="px-8 py-3 bg-slate-800 hover:bg-purple-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 border border-slate-700 hover:border-purple-400"
                            >
                                Load More Gear
                            </button>
                        </div>
                    )
                }

                {/* Bottom Bar decoration */}
                <div className="mt-12 flex items-center justify-between text-xs font-mono text-slate-600 border-t border-slate-900 pt-4">
                    <span>ARMORY_STATUS: ONLINE</span>
                    <span>SECURE_CONNECTION_V4</span>
                </div>

            </div >
        </section >
    );
};
