import React, { useState, MouseEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneListing, LanguageCode } from '../types';
import { productService } from '../services/productService';
import { api } from '../utils/api';
import { Search, ShoppingCart, Cpu, Signal, X, Layers, ChevronRight, Plus, Grid, List, Filter, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SkeletonProductCard } from './SkeletonProductCard';
import { SEO } from './SEO';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketplaceProps {
    lang: LanguageCode;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ lang }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const initialBrand = searchParams.get('brand') || 'All';
    const initialMinPrice = searchParams.get('minPrice') || '';
    const initialMaxPrice = searchParams.get('maxPrice') || '';
    const initialCondition = searchParams.get('condition') || '';
    const initialRam = searchParams.get('ram') || '';
    const initialStorage = searchParams.get('storage') || '';
    const initialSort = searchParams.get('sort') || 'newest';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
    const [filterBrand, setFilterBrand] = useState(initialBrand);
    const [selectedProduct, setSelectedProduct] = useState<PhoneListing | null>(null);
    const [products, setProducts] = useState<PhoneListing[]>([]);
    // FIXED: Dynamically build brand list from fetched products instead of hardcoding
    const [brands, setBrands] = useState<string[]>(['All']);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 12;

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
    const [sort, setSort] = useState(initialSort);
    const [selectedRam, setSelectedRam] = useState(initialRam);
    const [selectedStorage, setSelectedStorage] = useState(initialStorage);
    const [selectedCondition, setSelectedCondition] = useState(initialCondition);

    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loadingWishlistId, setLoadingWishlistId] = useState<string | null>(null);

    // Fetch user wishlist on component mount
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const res = await api.get<any>('/api/wishlist') as any;
                const products = res.data?.items || res.data?.products || res.products || res.items || [];
                // Store array of IDs. Backend stores the actual product reference string in `customId`.
                setWishlist(products.map((p: any) => p.customId || p.product || p.id || p._id));
            } catch {
                // Graceful degradation — user just won't see heart state pre-filled
            }
        };
        fetchWishlist();
    }, []);

    // Dropdown options
    const ramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB'];
    const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Refurbished']; // Match DB values exactly

    const { addToCart } = useCart();
    const { addToast } = useToast();

    // Debounce search term and map ALL FILTERS to URL param
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search/filter

            // Sync with URL silently
            if (searchTerm) searchParams.set('search', searchTerm); else searchParams.delete('search');
            if (filterBrand !== 'All') searchParams.set('brand', filterBrand); else searchParams.delete('brand');
            if (minPrice) searchParams.set('minPrice', minPrice); else searchParams.delete('minPrice');
            if (maxPrice) searchParams.set('maxPrice', maxPrice); else searchParams.delete('maxPrice');
            if (selectedCondition) searchParams.set('condition', selectedCondition); else searchParams.delete('condition');
            if (selectedRam) searchParams.set('ram', selectedRam); else searchParams.delete('ram');
            if (selectedStorage) searchParams.set('storage', selectedStorage); else searchParams.delete('storage');
            if (sort !== 'newest') searchParams.set('sort', sort); else searchParams.delete('sort');

            setSearchParams(searchParams, { replace: true });

        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterBrand, minPrice, maxPrice, selectedCondition, selectedRam, selectedStorage, sort, searchParams, setSearchParams]);

    // Sync external URL changes into the state (e.g if user shares link)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
            setDebouncedSearchTerm(urlSearch);
        }

        // Also sync other params if navigated back/forward
        const urlBrand = searchParams.get('brand');
        if (urlBrand && urlBrand !== filterBrand) setFilterBrand(urlBrand);
    }, [searchParams]);

    const toggleWishlist = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        if (loadingWishlistId === id) return; // Prevent double clicks
        setLoadingWishlistId(id);

        const isWishlisted = wishlist.includes(id);
        const method = isWishlisted ? 'delete' : 'post';
        const endpoint = isWishlisted ? `/api/wishlist/${id}` : '/api/wishlist';

        // Optimistic UI update
        setWishlist(prev =>
            isWishlisted ? prev.filter(item => item !== id) : [...prev, id]
        );

        try {
            await api({
                method,
                url: endpoint,
                data: isWishlisted ? undefined : { productId: id }
            });
            // Update the user's dashboard data so it reflects immediately
            addToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
        } catch {
            // Revert on failure
            setWishlist(prev =>
                isWishlisted ? [...prev, id] : prev.filter(item => item !== id)
            );
            addToast('Action failed. Please try again.', 'error');
        } finally {
            setLoadingWishlistId(null);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await productService.getAllProducts({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearchTerm,
                    brand: filterBrand,
                    sort,
                    minPrice,
                    maxPrice,
                    ram: selectedRam,
                    storage: selectedStorage,
                    condition: selectedCondition
                });

                if (data && data.products) {
                    const formatted = data.products.map((p: any) => ({
                        ...p,
                        model: p.name || p.model,
                        specs: {
                            cpu: p.processor || p.specs?.cpu || 'Standard Chip',
                            battery: p.battery || p.specs?.battery || 'Standard Battery',
                            screen: p.display || p.specs?.screen || 'HD Display',
                            ram: p.specs?.ram || 'N/A'
                        },
                        imageUrl: p.image || p.imageUrl || '',
                        images: p.images || [p.image || p.imageUrl]
                    }));
                    setProducts(formatted);
                    setTotalPages(data.totalPages);
                    // FIXED: Dynamically build brand list from fetched products
                    const uniqueBrands = ['All', ...new Set(data.products.map((p: any) => p.brand).filter(Boolean))];
                    setBrands(uniqueBrands);
                } else {
                    // Fallback mechanism (keeping existing logic just in case, though service should handle it)
                    const formatted = (Array.isArray(data) ? data : []).map((p: any) => ({
                        ...p,
                        model: p.name || p.model,
                        specs: {
                            cpu: p.processor || p.specs?.cpu || 'Standard Chip',
                            battery: p.battery || p.specs?.battery || 'Standard Battery',
                            screen: p.display || p.specs?.screen || 'HD Display',
                            ram: p.specs?.ram || 'N/A'
                        },
                        imageUrl: p.image || p.imageUrl || '',
                        images: p.images || [p.image || p.imageUrl]
                    }));
                    setProducts(formatted);
                }
            } catch {
                addToast('Failed to load marketplace data.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, debouncedSearchTerm, filterBrand, sort, minPrice, maxPrice, selectedRam, selectedStorage, selectedCondition]);

    const handleAddToCart = (phone: any) => {
        const imageUrl = phone.images?.[0] || phone.imageUrl || '';
        addToCart({
            id: phone._id || phone.id,
            title: phone.model,
            subtitle: `${phone.storage} • ${phone.color}`,
            price: phone.price,
            image: imageUrl,
            category: 'device',
            stock: phone.stock ?? 0
        });
        addToast(`${phone.model} added to cart`, 'success');
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const cards = document.getElementsByClassName("spotlight-card");
        for (const card of cards) {
            const rect = (card as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
            (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
        }
    };

    const getProductImage = (product: any) => {
        if (product.images && product.images.length > 0) return getImageUrl(product.images[0]);
        if (product.imageUrl) return getImageUrl(product.imageUrl);
        return '/images/placeholder.png';
    };

    return (
        <div className="relative z-10 pt-[120px] pb-16 min-h-screen" onMouseMove={handleMouseMove}>
            <SEO
                title="Marketplace - Buy & Sell Refurbished Phones"
                description="Browse our wide selection of certified refurbished smartphones. Best prices, warranty included, and thoroughly tested."
                canonical="https://handyland.com/marketplace"
            />

            {/* --- PRODUCT INSPECTOR MODAL --- */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-7xl max-h-[90vh] bg-white dark:bg-slate-900 border-4 border-blue-500/10 dark:border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/50 flex flex-col md:flex-row">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedProduct(null)}
                            aria-label="Close details"
                            className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-black/50 hover:bg-black/20 dark:hover:bg-white/10 rounded-full text-slate-800 dark:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Left: Holographic Visual */}
                        <div className="w-full md:w-1/2 relative bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-black p-8 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 tech-grid opacity-30"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/50 shadow-[0_0_15px_#06b6d4] animate-[scan_2s_linear_infinite]"></div>
                            <img
                                src={getProductImage(selectedProduct)}
                                alt={selectedProduct.model}
                                onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                loading="lazy"
                                className="relative z-10 w-3/4 max-w-sm drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />

                            {/* Floating Specs */}
                            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-2">
                                <div className="bg-white/80 dark:bg-black/60 backdrop-blur border border-black/10 dark:border-white/10 p-3 rounded-xl">
                                    <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                                    <div className="text-[10px] text-slate-400 uppercase">Processor</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedProduct.specs?.cpu}</div>
                                </div>
                                <div className="bg-white/80 dark:bg-black/60 backdrop-blur border border-black/10 dark:border-white/10 p-3 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase">Battery</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedProduct.specs?.battery}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Data & Actions */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                            {/* FIXED: Removed raw product ID display */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${selectedProduct.condition === 'new' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                                    {selectedProduct.condition}
                                </span>
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{selectedProduct.model}</h2>
                            <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-brand-secondary font-bold mb-6">
                                {/* FIXED: Use formatPrice for consistent currency display */}
                                {formatPrice(selectedProduct.price)}
                            </div>

                            <p className="text-slate-400 leading-relaxed mb-8 border-l-2 border-slate-800 pl-4">
                                {selectedProduct.description || "Professional grade device, fully tested by our technicians. Includes 12-month warranty and free tech support."}
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Status</span>
                                    {selectedProduct.stock > 0 ? (
                                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">{selectedProduct.stock} In Stock</span>
                                    ) : (
                                        <span className="text-red-500 font-bold">Out of Stock</span>
                                    )}
                                </div>
                                <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Color</span>
                                    <span className="text-slate-900 dark:text-white font-medium">{selectedProduct.color}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Storage</span>
                                    <span className="text-slate-900 dark:text-white font-medium">{selectedProduct.storage}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Display</span>
                                    <span className="text-slate-900 dark:text-white font-medium">{selectedProduct.specs?.screen}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct);
                                        setSelectedProduct(null);
                                    }}
                                    disabled={selectedProduct.stock === 0}
                                    className={`flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${selectedProduct.stock > 0 ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                                >
                                    <Plus className="w-5 h-5" /> {selectedProduct.stock > 0 ? t('marketplace.addToCart') : t('marketplace.outOfStock')}
                                </button>
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct);
                                        setSelectedProduct(null);
                                        // FIXED: Use React Router navigate instead of hard reload
                                        navigate('/checkout');
                                    }}
                                    disabled={selectedProduct.stock === 0}
                                    className={`flex-1 border font-bold py-4 rounded-xl transition-all ${selectedProduct.stock > 0 ? 'border-slate-300 hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed'}`}
                                >
                                    {t('marketplace.buyNow')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 lg:gap-8">
                {/* Sticky Sidebar for Desktop */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                    <div className="sticky top-24 flex flex-col gap-4">
                        <div className="flex justify-between items-end gap-4 md:hidden">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">MARKET<span className="text-brand-primary">PLACE</span></h2>
                                <div className="h-1 w-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters" className={`p-2 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showFilters ? 'bg-black/5 dark:bg-white/5 text-brand-primary border border-black/10 dark:border-white/10' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white glass-modern'}`}><Filter className="w-5 h-5" /></button>
                        </div>

                        <div className={`glass-modern p-5 rounded-3xl border border-black/10 dark:border-white/10 flex-col gap-5 transition-all duration-300 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Filter className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Filters</h3>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</label>
                                <select aria-label="Filter by Condition" value={selectedCondition} onChange={(e) => setSelectedCondition(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors">
                                    <option value="">All Conditions</option>
                                    {conditions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors" />
                                    <span className="text-slate-400">-</span>
                                    <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors" />
                                </div>
                            </div>

                            <div className="w-full h-px bg-black/5 dark:bg-white/10"></div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</label>
                                <div className="flex flex-wrap gap-2">
                                    {brands.map(brand => (
                                        <button key={brand} onClick={() => setFilterBrand(brand)} className={`px-4 py-2 md:py-1.5 rounded-xl md:rounded-lg text-xs md:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterBrand === brand ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full h-px bg-black/5 dark:bg-white/10"></div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specs</label>
                                <select aria-label="Filter by RAM" value={selectedRam} onChange={(e) => setSelectedRam(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors mb-2">
                                    <option value="">Any RAM</option>
                                    {ramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select aria-label="Filter by Storage" value={selectedStorage} onChange={(e) => setSelectedStorage(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm border border-transparent focus:border-brand-primary outline-none transition-colors">
                                    <option value="">Any Storage</option>
                                    {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-6 md:gap-8">
                    {/* Desktop Title & Search Bar */}
                    <div className="flex flex-col gap-4 sticky md:relative top-0 z-[60] bg-slate-100/95 dark:bg-slate-950/95 md:bg-transparent dark:md:bg-transparent backdrop-blur-xl -mx-4 px-4 py-3 md:py-0 md:mx-0 md:px-0 md:backdrop-blur-none transition-colors border-b border-black/5 dark:border-white/5 md:border-transparent">
                        <div className="hidden md:flex justify-between items-end gap-4 mb-2">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">MARKET<span className="text-brand-primary">PLACE</span></h2>
                                <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"></div>
                            </div>
                        </div>

                        <div className="glass-modern p-2 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-black/10 dark:border-white/10 shadow-sm">
                            <div className="relative flex-1 w-full sm:max-w-md">
                                <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-brand-primary transition-colors" />
                                <input type="text" placeholder={t('marketplace.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-brand-primary outline-none border border-transparent placeholder-slate-500 gap-2 font-medium" />
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)} className="bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl px-4 py-3 md:py-2 text-sm border-none focus:ring-1 focus:ring-brand-primary outline-none cursor-pointer font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                    <option value="newest">{t('marketplace.sort')} - Newest</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                                <div className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-2">
                                    <button aria-label="Grid View" onClick={() => setViewMode('grid')} className={`p-3 md:p-2 w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl md:rounded-lg transition-all ${viewMode === 'grid' ? 'bg-black/5 dark:bg-white/5 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}><Grid className="w-5 h-5 md:w-4 md:h-4" /></button>
                                    <button aria-label="List View" onClick={() => setViewMode('list')} className={`p-3 md:p-2 w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl md:rounded-lg transition-all ${viewMode === 'list' ? 'bg-black/5 dark:bg-white/5 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}><List className="w-5 h-5 md:w-4 md:h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Product Grid / List */}
                {loading ? (
                    <div className={`grid gap-3 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {[...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className={viewMode === 'list' ? 'h-48' : 'h-72 md:h-96'}>
                                <SkeletonProductCard />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className={`grid gap-3 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                    >
                        {products.map((phone) => (
                            viewMode === 'grid' ? (
                                // GRID CARD
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                                    }}
                                    whileHover={{ y: -5, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                                    key={phone.id} 
                                    className="spotlight-card rounded-2xl md:rounded-3xl h-full flex flex-col border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md group shadow-sm hover:shadow-xl dark:hover:shadow-brand-primary/10 transition-shadow duration-300"
                                >
                                    <div className="spotlight-border"></div>
                                    <div className="relative p-1">
                                        <div className="relative h-40 md:h-60 overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-950 cursor-pointer border border-slate-200/50 dark:border-slate-800/50" onClick={() => setSelectedProduct(phone)}>
                                            <motion.img
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.4 }}
                                                src={getProductImage(phone)}
                                                alt={phone.model}
                                                onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                                loading="lazy"
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                                            />
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md border ${phone.condition === 'new' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                                    {(phone.condition || t('marketplace.condition.used')).toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]">
                                                <span className="bg-white/10 border border-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm backdrop-blur-md flex items-center gap-1.5 md:gap-2">
                                                    <Layers className="w-3 h-3 md:w-4 md:h-4" /> {t('common.viewAll')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                                        <div className="mb-2 md:mb-4">
                                            <div className="text-[9px] md:text-[10px] text-brand-primary font-mono uppercase mb-0.5 md:mb-1 tracking-wider truncate">{phone.brand}</div>
                                            <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary transition-colors cursor-pointer line-clamp-2" onClick={() => setSelectedProduct(phone)}>{phone.model}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3 md:mb-6">
                                            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                                                <Cpu className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                                                <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300 truncate">{phone.specs?.cpu}</span>
                                            </div>
                                            <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                                                <Signal className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                                                <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300">5G</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                                            {/* FIXED: Use formatPrice for consistent currency display */}
                                            <div className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-0">{formatPrice(phone.price)}</div>
                                            <div className="flex items-center gap-1.5 md:gap-2 w-full md:w-auto">
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => toggleWishlist(e, phone.id)}
                                                    disabled={loadingWishlistId === phone.id}
                                                    aria-label="Wishlist"
                                                    className={`p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-wait ${wishlist.includes(phone.id) ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/30 hover:bg-red-500/20 dark:hover:bg-red-500/30' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white dark:hover:bg-slate-700'}`}
                                                >
                                                    <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${wishlist.includes(phone.id) ? 'fill-current' : ''}`} />
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleAddToCart(phone)}
                                                    disabled={phone.stock === 0}
                                                    aria-label="Add to cart"
                                                    className={`p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl font-bold transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-not-allowed ${phone.stock > 0 ? 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-brand-primary hover:text-white hover:border-brand-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-brand-primary dark:hover:text-black dark:hover:border-brand-primary dark:text-white' : 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'}`}
                                                >
                                                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                // LIST CARD
                                <motion.div 
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        visible: { opacity: 1, x: 0, transition: { type: "spring" } }
                                    }}
                                    key={phone.id} 
                                    className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-6 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group relative"
                                >

                                    <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setSelectedProduct(phone)}>
                                        <img
                                            src={getProductImage(phone)}
                                            alt={phone.model}
                                            onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-brand-primary font-mono uppercase mb-1">{phone.brand}</div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary cursor-pointer" onClick={() => setSelectedProduct(phone)}>{phone.model}</h3>
                                            </div>
                                            <div className="text-right pr-12">
                                                {/* FIXED: Use formatPrice for consistent currency display */}
                                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(phone.price)}</div>
                                                <div className={`text-xs font-bold uppercase ${phone.condition === 'new' ? 'text-emerald-400' : 'text-purple-400'}`}>{(phone.condition || 'Used').toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{phone.description}</p>
                                        <div className="flex gap-3 mt-auto">
                                            <button
                                                aria-label="Add to cart"
                                                title={phone.stock > 0 ? "Add to cart" : "Out of stock"}
                                                disabled={phone.stock === 0}
                                                onClick={() => handleAddToCart(phone)}
                                                className={`px-6 py-2 font-bold rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${phone.stock > 0 ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                                            >
                                                {phone.stock > 0 ? t('marketplace.addToCart') : t('marketplace.outOfStock')}
                                            </button>
                                            <button
                                                onClick={(e) => toggleWishlist(e, phone.id)}
                                                disabled={loadingWishlistId === phone.id}
                                                title={wishlist.includes(phone.id) ? "Remove from wishlist" : "Add to wishlist"}
                                                aria-label={wishlist.includes(phone.id) ? "Remove from wishlist" : "Add to wishlist"}
                                                className={`px-4 py-2 border rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait ${wishlist.includes(phone.id) ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-500' : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'}`}
                                            >
                                                <Heart className={`w-4 h-4 ${wishlist.includes(phone.id) ? 'fill-current' : ''}`} />
                                            </button>
                                            <button onClick={() => setSelectedProduct(phone)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white font-bold rounded-lg transition-all text-sm">
                                                {t('common.learnMore')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        ))}
                        {products.length === 0 && !loading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/5 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800"
                            >
                                <div className="w-32 h-32 mb-6 relative">
                                    <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl"></div>
                                    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg border border-slate-100 dark:border-slate-800">
                                        <span className="flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-secondary"></span>
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No products found</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                                    We couldn't find any products matching your current filters. Try adjusting your search criteria or clearing filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterCategory('All');
                                        setFilterBrand('');
                                        setSelectedRam('');
                                        setSelectedStorage('');
                                    }}
                                    className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 active:scale-95 overflow-hidden"
                                >
                                    <span className="relative z-10">Clear all filters</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Pagination Controls */}
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-3 bg-white disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-all border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700"
                    >
                        {t('common.back')}
                    </button>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                        Page <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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
