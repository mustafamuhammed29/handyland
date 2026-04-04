import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Grid, List, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { SEO } from './SEO';
import { useMarketplace } from '../hooks/useMarketplace';
import { useWishlist } from '../hooks/useWishlist';
import { FilterSidebar } from './marketplace/FilterSidebar';
import { ProductGrid } from './marketplace/ProductGrid';
import { LanguageCode, PhoneListing, CartItem } from '../types';
import { getImageUrl } from '../utils/imageUrl';

interface MarketplaceProps {
    lang: LanguageCode;
    hideSEO?: boolean;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ lang, hideSEO }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // Custom Hook handles all logic, URL syncing, and React Query fetching
    const mp = useMarketplace();
    const { wishlist, isInWishlist, toggleWishlist, loadingId: wishlistLoadingId } = useWishlist();

    const [showFilters, setShowFilters] = useState(false);
    const [features, setFeatures] = useState<any>(null);

    React.useEffect(() => {
        api.get('/api/settings').then((res: any) => {
            const data = res.data || res;
            setFeatures(data?.features);
        }).catch(err => console.error("Could not fetch settings", err));
    }, []);

    // Static options (could be moved to a config file/service)
    const ramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB'];
    const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Refurbished'];
    const brands = ['All', 'Apple', 'Samsung', 'Google', 'Huawei', 'Xiaomi']; // Simplified for now

    const handleAddToCart = React.useCallback((phone: PhoneListing) => {
        addToCart({
            id: phone.id,
            title: phone.model || (phone as any).name || 'Unknown Product',
            subtitle: `${phone.storage || ''} • ${phone.color || ''}`.replace(/^ • | • $/g, '') || '',
            price: phone.price || 0,
            image: getImageUrl(phone.images?.[0] || phone.imageUrl || ''),
            category: 'device',
            stock: phone.stock || 0
        });
        addToast(`${phone.model} added to cart`, 'success');
    }, [addToCart, addToast]);

    const handleBuyNow = React.useCallback((phone: PhoneListing) => {
        handleAddToCart(phone);
        navigate('/checkout');
    }, [handleAddToCart, navigate]);

    const handleToggleWishlist = React.useCallback((e: React.MouseEvent, product: PhoneListing) => {
        e.stopPropagation();
        toggleWishlist({
            id: product.id || String((product as any)._id),
            title: product.model || (product as any).title || (product as any).name || 'Unknown',
            price: product.price || 0,
            image: getImageUrl(product.images?.[0] || product.imageUrl || ''),
            category: 'device',
            quantity: 1,
            stock: product.stock || 0
        });
    }, [toggleWishlist]);

    // Optimized mouse handler for spotlight effect (CSS variable based)
    const handleMouseMove = (e: React.MouseEvent) => {
        const container = e.currentTarget as HTMLElement;
        const rect = container.getBoundingClientRect();
        container.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        container.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    return (
        <div 
            className="relative z-10 pt-[120px] pb-16 min-h-screen" 
            onMouseMove={handleMouseMove}
        >
            {!hideSEO && (
                <SEO
                    title="Marketplace - Buy & Sell Refurbished Phones"
                    description="Browse our wide selection of certified refurbished smartphones. Best prices, warranty included, and thoroughly tested."
                    canonical="https://handyland.com/marketplace"
                />
            )}

            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 lg:gap-8">
                
                <FilterSidebar
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    selectedCondition={mp.selectedCondition}
                    setSelectedCondition={mp.setSelectedCondition}
                    minPrice={mp.minPrice}
                    setMinPrice={mp.setMinPrice}
                    maxPrice={mp.maxPrice}
                    setMaxPrice={mp.setMaxPrice}
                    filterBrand={mp.filterBrand}
                    setFilterBrand={mp.setFilterBrand}
                    brands={brands}
                    selectedRam={mp.selectedRam}
                    setSelectedRam={mp.setSelectedRam}
                    selectedStorage={mp.selectedStorage}
                    setSelectedStorage={mp.setSelectedStorage}
                    ramOptions={ramOptions}
                    storageOptions={storageOptions}
                    conditions={conditions}
                />

                <div className="flex-1 flex flex-col gap-6 md:gap-8">
                    {/* Header Controls */}
                    <div className="flex flex-col gap-4 sticky md:relative top-0 z-[60] bg-slate-100/95 dark:bg-slate-950/95 md:bg-transparent dark:md:bg-transparent backdrop-blur-xl -mx-4 px-4 py-3 md:py-0 md:mx-0 md:px-0 md:backdrop-blur-none transition-colors border-b border-black/5 dark:border-white/5 md:border-transparent">
                        <div className="hidden md:flex justify-between items-end gap-4 mb-2">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">MARKT<span className="text-brand-primary">PLATZ</span></h2>
                                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                            </div>
                        </div>

                        <div className="glass-modern p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-black/10 dark:border-white/10 shadow-sm">
                            <div className="relative flex-1 w-full sm:max-w-md">
                                <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder={t('marketplace.search')} 
                                    value={mp.searchTerm} 
                                    onChange={(e) => mp.setSearchTerm(e.target.value)} 
                                    className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-brand-primary outline-none border border-transparent placeholder-slate-500 font-medium" 
                                />
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <select 
                                    aria-label="Sort products" 
                                    value={mp.sort} 
                                    onChange={(e) => mp.setSort(e.target.value)} 
                                    className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-4 py-3 md:py-2 text-sm border-none focus:ring-1 focus:ring-brand-primary outline-none cursor-pointer font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    <option value="newest">{t('marketplace.sortNewest', 'Sortieren - Neueste')}</option>
                                    <option value="price_asc">{t('marketplace.sortPriceLow', 'Preis: Aufsteigend')}</option>
                                    <option value="price_desc">{t('marketplace.sortPriceHigh', 'Preis: Absteigend')}</option>
                                </select>
                                <div className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-2">
                                    {(!features || features.comparisonEngine !== false) && (
                                        <button 
                                            aria-label="Compare Devices" 
                                            title="Compare Devices"
                                            onClick={() => navigate('/compare')} 
                                            className="px-3 md:px-4 py-2 flex items-center justify-center gap-2 rounded-xl md:rounded-lg transition-all bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-black font-bold mr-1"
                                        >
                                            <Layers className="w-4 h-4" />
                                            <span className="hidden md:inline text-sm">{t('marketplace.compare', 'Vergleichen')}</span>
                                        </button>
                                    )}
                                    <button 
                                        aria-label="Grid View" 
                                        onClick={() => mp.setViewMode('grid')} 
                                        className={`p-3 md:p-2 w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl md:rounded-lg transition-all ${mp.viewMode === 'grid' ? 'bg-black/5 dark:bg-white/5 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <Grid className="w-5 h-5 md:w-4 md:h-4" />
                                    </button>
                                    <button 
                                        aria-label="List View" 
                                        onClick={() => mp.setViewMode('list')} 
                                        className={`p-3 md:p-2 w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl md:rounded-lg transition-all ${mp.viewMode === 'list' ? 'bg-black/5 dark:bg-white/5 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <List className="w-5 h-5 md:w-4 md:h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ProductGrid
                        products={mp.products}
                        loading={mp.isLoading}
                        viewMode={mp.viewMode}
                        itemsPerPage={12}
                        wishlist={wishlist}
                        loadingWishlistId={wishlistLoadingId}
                        onToggleWishlist={handleToggleWishlist}
                        onAddToCart={handleAddToCart}
                        onSelect={(product) => navigate(`/marketplace/${product.id || (product as any)._id}`)}
                        onClearFilters={() => {
                            mp.setSearchTerm('');
                            mp.setFilterBrand('All');
                            mp.setSelectedRam('');
                            mp.setSelectedStorage('');
                            mp.setSelectedCondition('');
                        }}
                    />

                    {/* Pagination Controls */}
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <button
                            onClick={() => mp.setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={mp.currentPage === 1}
                            className="px-6 py-3 bg-white disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-all border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                            {t('common.back')}
                        </button>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                            {t('common.page', 'Seite')} <span className="text-slate-900 dark:text-white font-bold">{mp.currentPage}</span> {t('common.of', 'von')} {mp.totalPages}
                        </span>
                        <button
                            onClick={() => mp.setCurrentPage(prev => Math.min(prev + 1, mp.totalPages))}
                            disabled={mp.currentPage === mp.totalPages}
                            className="px-6 py-3 bg-white disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-all border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
