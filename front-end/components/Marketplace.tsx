import React, { useState, MouseEvent, useEffect } from 'react';
import { PhoneListing, LanguageCode } from '../types';
import { productService } from '../services/productService';
import { api } from '../utils/api';
import { Search, ShoppingCart, Cpu, Signal, X, Layers, ChevronRight, Plus, Grid, List, Filter, Heart } from 'lucide-react';
import { translations } from '../i18n';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SkeletonProductCard } from './SkeletonProductCard';
import { SEO } from './SEO';

interface MarketplaceProps {
    lang: LanguageCode;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ lang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterBrand, setFilterBrand] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState<PhoneListing | null>(null);
    const [products, setProducts] = useState<PhoneListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 12;

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('newest');
    const [selectedRam, setSelectedRam] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');

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
            } catch (error) {
                console.error("Failed to load wishlist", error);
                // Graceful degradation, don't crash
            }
        };
        fetchWishlist();
    }, []);

    // Dropdown options
    const ramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB'];
    const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];
    const conditions = ['new', 'like-new', 'good', 'fair'];

    const { addToCart } = useCart();
    const { addToast } = useToast();
    const t = translations[lang];

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
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

                console.log('🛒 Marketplace API Response:', data); // DEBUG log

                if (data && data.products) {
                    console.log(`✅ Loaded ${data.products.length} products`);
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
                } else {
                    console.warn('⚠️ Marketplace API returned no products or invalid format', data);
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
            } catch (error) {
                console.error("Failed to load products", error);
                addToast('Failed to load marketplace data. Check console.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, debouncedSearchTerm, filterBrand, sort, minPrice, maxPrice, selectedRam, selectedStorage, selectedCondition]);

    const handleAddToCart = (phone: any) => {
        const imageUrl = phone.images?.[0] || phone.imageUrl || '';
        addToCart({
            id: phone.id,
            title: phone.model,
            subtitle: `${phone.storage} • ${phone.color}`,
            price: phone.price,
            image: imageUrl,
            category: 'device'
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

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:5000${url}`;
    };

    const getProductImage = (product: any) => {
        if (product.images && product.images.length > 0) return getImageUrl(product.images[0]);
        if (product.imageUrl) return getImageUrl(product.imageUrl);
        return '/images/placeholder.png';
    };

    return (
        <div className="relative z-10 py-16 min-h-screen" onMouseMove={handleMouseMove}>
            <SEO
                title="Marketplace - Buy & Sell Refurbished Phones"
                description="Browse our wide selection of certified refurbished smartphones. Best prices, warranty included, and thoroughly tested."
                canonical="https://handyland.com/marketplace"
            />

            {/* --- PRODUCT INSPECTOR MODAL --- */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-7xl max-h-[90vh] bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedProduct(null)}
                            aria-label="Close details"
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Left: Holographic Visual */}
                        <div className="w-full md:w-1/2 relative bg-gradient-to-br from-slate-900 to-black p-8 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 tech-grid opacity-30"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_#06b6d4] animate-[scan_2s_linear_infinite]"></div>
                            <img
                                src={getProductImage(selectedProduct)}
                                alt={selectedProduct.model}
                                onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                loading="lazy"
                                className="relative z-10 w-3/4 max-w-sm drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />

                            {/* Floating Specs */}
                            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-2">
                                <div className="bg-black/60 backdrop-blur border border-white/10 p-3 rounded-xl">
                                    <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                                    <div className="text-[10px] text-slate-400 uppercase">Processor</div>
                                    <div className="text-sm font-bold text-white">{selectedProduct.specs?.cpu}</div>
                                </div>
                                <div className="bg-black/60 backdrop-blur border border-white/10 p-3 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase">Battery</div>
                                    <div className="text-sm font-bold text-white">{selectedProduct.specs?.battery}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Data & Actions */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-slate-950">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${selectedProduct.condition === 'new' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                                    {selectedProduct.condition}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">ID: {selectedProduct.id.substring(0, 8)}</span>
                            </div>

                            <h2 className="text-4xl font-black text-white mb-2 leading-tight">{selectedProduct.model}</h2>
                            <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold mb-6">
                                {selectedProduct.price}{t.currency}
                            </div>

                            <p className="text-slate-400 leading-relaxed mb-8 border-l-2 border-slate-800 pl-4">
                                {selectedProduct.description || "Professional grade device, fully tested by our technicians. Includes 12-month warranty and free tech support."}
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between py-2 border-b border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Color</span>
                                    <span className="text-white font-medium">{selectedProduct.color}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Storage</span>
                                    <span className="text-white font-medium">{selectedProduct.storage}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-800/50">
                                    <span className="text-slate-500 text-sm">Display</span>
                                    <span className="text-white font-medium">{selectedProduct.specs?.screen}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct);
                                        setSelectedProduct(null);
                                    }}
                                    className="flex-1 bg-white hover:bg-slate-200 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <Plus className="w-5 h-5" /> Add to Cart
                                </button>
                                <button
                                    onClick={() => {
                                        handleAddToCart(selectedProduct);
                                        setSelectedProduct(null);
                                        // Slight delay to allow toast to show and state to update
                                        setTimeout(() => window.location.href = '/checkout', 100);
                                    }}
                                    className="flex-1 border border-slate-700 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all"
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header & Controls */}
                <div className="flex flex-col gap-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div>
                            <h2 className="text-5xl font-black text-white mb-2 tracking-tight">MARKET<span className="text-cyan-500">PLACE</span></h2>
                            <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewMode('grid')} aria-label="Grid view" className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}><Grid className="w-5 h-5" /></button>
                            <button onClick={() => setViewMode('list')} aria-label="List view" className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}><List className="w-5 h-5" /></button>
                            <button onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters" className={`p-2 rounded-lg ${showFilters ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'} md:hidden`}><Filter className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Search & Main Filter Bar */}
                    <div className="glass-modern p-2 rounded-2xl flex flex-col md:flex-row items-center gap-4 border border-slate-800">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Devices (e.g. iPhone 13 Pro)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900/50 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-cyan-500 outline-none border border-transparent placeholder-slate-600"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <select
                                value={selectedCondition}
                                onChange={(e) => setSelectedCondition(e.target.value)}
                                aria-label="Filter by condition"
                                className="bg-slate-900 text-white rounded-xl px-3 py-2 text-sm border border-slate-800 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="">All Conditions</option>
                                {conditions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                            </select>

                            <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-2 border border-slate-800">
                                <input
                                    type="number"
                                    placeholder="Min €"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-16 bg-transparent text-white text-sm py-2 focus:outline-none"
                                />
                                <span className="text-slate-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max €"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-16 bg-transparent text-white text-sm py-2 focus:outline-none"
                                />
                            </div>

                            {['All', 'Apple', 'Samsung', 'Google', 'Xiaomi'].map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => setFilterBrand(brand)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterBrand === brand
                                        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                        : 'bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-800'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            aria-label="Sort products"
                            className="bg-slate-900/50 text-white rounded-xl px-4 py-2.5 text-sm border-none focus:ring-1 focus:ring-cyan-500 outline-none min-w-[150px]"
                        >
                            <option value="newest">Newest Arrivals</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>

                    {/* Expanded Filters */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300 ${showFilters || window.innerWidth >= 768 ? 'block' : 'hidden md:grid'}`}>
                        <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none" />
                        <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none" />
                        <select value={selectedRam} onChange={(e) => setSelectedRam(e.target.value)} aria-label="Filter by RAM" className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none">
                            <option value="">RAM: Any</option>
                            {ramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select value={selectedStorage} onChange={(e) => setSelectedStorage(e.target.value)} aria-label="Filter by storage" className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none">
                            <option value="">Storage: Any</option>
                            {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                {/* Product Grid / List */}
                {loading ? (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {[...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className={viewMode === 'list' ? 'h-48' : 'h-96'}>
                                <SkeletonProductCard />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {products.map((phone) => (
                            viewMode === 'grid' ? (
                                // GRID CARD
                                <div key={phone.id} className="spotlight-card rounded-3xl h-full flex flex-col border border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-sm group">
                                    <div className="spotlight-border"></div>
                                    <div className="relative p-1">
                                        <div className="relative h-72 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 cursor-pointer" onClick={() => setSelectedProduct(phone)}>
                                            <img
                                                src={getProductImage(phone)}
                                                alt={phone.model}
                                                onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                                loading="lazy"
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                            />
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border ${phone.condition === 'new' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                                    {(phone.condition || 'Used').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                                                <span className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md flex items-center gap-2">
                                                    <Layers className="w-4 h-4" /> Inspect
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-3">
                                            <div className="text-[10px] text-cyan-500 font-mono uppercase mb-1 tracking-wider">{phone.brand}</div>
                                            <h3 className="text-xl font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => setSelectedProduct(phone)}>{phone.model}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-6">
                                            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800 flex items-center gap-2">
                                                <Cpu className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-300 truncate">{phone.specs?.cpu}</span>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800 flex items-center gap-2">
                                                <Signal className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-300">5G Ready</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto flex items-center justify-between gap-3">
                                            <div className="text-xl font-bold text-white">{phone.price}{t.currency}</div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => toggleWishlist(e, phone.id)}
                                                    disabled={loadingWishlistId === phone.id}
                                                    aria-label="Wishlist"
                                                    className={`p-3 rounded-xl transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-wait ${wishlist.includes(phone.id) ? 'bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'}`}
                                                >
                                                    <Heart className={`w-5 h-5 group-hover/btn:scale-110 transition-transform ${wishlist.includes(phone.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <button onClick={() => handleAddToCart(phone)} aria-label="Add to cart" className="bg-slate-800 border border-slate-700 hover:bg-cyan-600 hover:text-black hover:border-cyan-500 text-white p-3 rounded-xl font-bold transition-all duration-300 group/btn">
                                                    <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // LIST CARD
                                <div key={phone.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex gap-6 hover:border-cyan-500/30 transition-all group relative">

                                    <div className="w-32 h-32 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setSelectedProduct(phone)}>
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
                                                <div className="text-xs text-cyan-500 font-mono uppercase mb-1">{phone.brand}</div>
                                                <h3 className="text-xl font-bold text-white hover:text-cyan-400 cursor-pointer" onClick={() => setSelectedProduct(phone)}>{phone.model}</h3>
                                            </div>
                                            <div className="text-right pr-12">
                                                <div className="text-2xl font-bold text-white">{phone.price}{t.currency}</div>
                                                <div className={`text-xs font-bold uppercase ${phone.condition === 'new' ? 'text-emerald-400' : 'text-purple-400'}`}>{(phone.condition || 'Used').toUpperCase()}</div>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{phone.description}</p>
                                        <div className="flex gap-3 mt-auto">
                                            <button aria-label="Add to cart" title="Add to cart" onClick={() => handleAddToCart(phone)} className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4" /> Add to Cart
                                            </button>
                                            <button
                                                onClick={(e) => toggleWishlist(e, phone.id)}
                                                disabled={loadingWishlistId === phone.id}
                                                title={wishlist.includes(phone.id) ? "Remove from wishlist" : "Add to wishlist"}
                                                aria-label={wishlist.includes(phone.id) ? "Remove from wishlist" : "Add to wishlist"}
                                                className={`px-4 py-2 border rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait ${wishlist.includes(phone.id) ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                            >
                                                <Heart className={`w-4 h-4 ${wishlist.includes(phone.id) ? 'fill-current' : ''}`} />
                                            </button>
                                            <button onClick={() => setSelectedProduct(phone)} className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-sm">
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-3 bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all border border-slate-700 hover:bg-slate-700"
                    >
                        Previous
                    </button>
                    <span className="text-slate-400 font-mono">
                        Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-6 py-3 bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all border border-slate-700 hover:bg-slate-700"
                    >
                        Next
                    </button>
                </div>

            </div>
        </div>
    );
};
