import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageCode } from '../types';
import { useTranslation } from 'react-i18next';
import { Headphones, Zap, Shield, Watch, Plus, Sparkles, X, Layers, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

interface AccessoriesProps {
    lang: LanguageCode;
}

export const Accessories: React.FC<AccessoriesProps> = ({ lang }) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const navigate = useNavigate();
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
        api.get<any>('/api/accessories')
            .then((data: any) => {
                setAccessories(Array.isArray(data) ? data : (data?.accessories || []));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Removed selectedItem modal effect


    const handleAddToCart = (item: any) => {
        const imageUrl = getImageUrl(item.image || item.images?.[0]);
        addToCart({
            id: item._id || item.id,
            title: item.name,
            subtitle: item.category,
            price: item.price,
            image: imageUrl,
            category: 'accessory',
            stock: item.stock ?? 0
        });
        addToast(`${item.name} wurde zum Warenkorb hinzugefügt!`, 'success');
    };

    const categories = [
        { id: 'all', label: t('accessories.catAll', 'ALLE PRODUKTE'), icon: <Sparkles className="w-4 h-4" /> },
        { id: 'audio', label: t('accessories.catAudio', 'Audio'), icon: <Headphones className="w-4 h-4" /> },
        { id: 'power', label: t('accessories.catPower', 'Energie'), icon: <Zap className="w-4 h-4" /> },
        { id: 'protection', label: t('accessories.catProtection', 'Schutz'), icon: <Shield className="w-4 h-4" /> },
        { id: 'wearables', label: t('accessories.catWearables', 'Wearables'), icon: <Watch className="w-4 h-4" /> },
    ];

    const filteredItems = accessories.filter(item => {
        const matchesCategory = activeCat === 'all' || item.category === activeCat;
        const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });


    return (
        <>



        <section className="py-24 relative bg-brand-surface-light dark:bg-brand-surface-dark border-t border-slate-200 dark:border-slate-800/50 transition-colors duration-300">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/30 dark:from-purple-900/20 via-white dark:via-slate-950 to-slate-50 dark:to-black pointer-events-none"></div>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                {settings?.content?.accessoriesTitle || t('accessories.accTitle', 'Premium Zubehör')}
                            </span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-mono text-sm tracking-wider">
                            {settings?.content?.accessoriesSubtitle || t('accessories.accSubtitle', 'Schütze dein Gerät mit Stil')}
                        </p>
                    </div>

                    {/* Search & Categories */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search Bar */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('accessories.search', 'Zubehör suchen...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                            />
                        </div>

                        {/* Category Selector */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCat(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all uppercase tracking-wider ${activeCat === cat.id
                                        ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-brand-primary/30 dark:hover:border-slate-700 hover:text-brand-primary dark:hover:text-white'
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
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {filteredItems.slice(0, visibleCount).map((item) => (
                        <div
                            key={item.id}
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="group relative bg-white/80 dark:bg-slate-900/30 rounded-2xl p-2 md:p-4 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col"
                        >
                            {/* Hover Border Glow */}
                            <div className={`absolute inset-0 rounded-2xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>

                            {/* Image Container with Float Effect */}
                            <div
                                className="relative h-32 md:h-48 rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 dark:from-slate-800 to-slate-200 dark:to-slate-900 mb-2 md:mb-4 cursor-pointer"
                                onClick={() => navigate(`/accessories/${item.id || item._id}`)}
                            >
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${hoveredId === item.id ? 'scale-110' : 'scale-100'
                                        }`}
                                />

                                {/* Tag */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border border-white/10 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest">
                                    {item.tag}
                                </div>

                                {/* Quick Inspect Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                                    <span className="bg-purple-500/80 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1">
                                        <Layers className="w-3 h-3" /> {t('accessories.inspect', 'Ansehen')}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1 flex-1 flex flex-col justify-between">
                                <h3 className="text-slate-900 dark:text-white font-bold text-sm md:text-base line-clamp-2 hover:text-purple-500 dark:hover:text-purple-400 cursor-pointer" onClick={() => navigate(`/accessories/${item.id || item._id}`)}>{item.name}</h3>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-2">
                                    <span className="text-purple-400 font-mono font-bold text-base md:text-lg">{item.price}{t('common.currency')}</span>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleAddToCart(item)}
                                            disabled={item.stock === 0}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-2 py-1.5 md:px-3 md:py-1.5 rounded-lg transition-all text-[10px] md:text-xs font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed ${item.stock > 0 ? 'bg-slate-200 dark:bg-slate-800 hover:bg-purple-600 text-slate-600 dark:text-slate-300 hover:text-white' : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-600'}`}
                                        >
                                            <ShoppingCart className="w-3 h-3" />
                                            <span className="hidden min-[380px]:inline">{item.stock > 0 ? t('accessories.equip', 'In den Warenkorb') : t('accessories.out', 'Ausverkauft')}</span>
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
                                className="px-8 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-purple-600 text-slate-800 dark:text-white hover:text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/20 border border-slate-300 dark:border-slate-700 hover:border-purple-400"
                            >
                                {t('accessories.loadMore', 'Mehr Produkte laden')}
                            </button>
                        </div>
                    )
                }

                {/* Bottom Bar decoration */}
                <div className="mt-12 flex items-center justify-between text-xs font-mono text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-900 pt-4">
                    <span className="opacity-0">.</span>
                </div>

            </div>
        </section>
        </>
    );
};
