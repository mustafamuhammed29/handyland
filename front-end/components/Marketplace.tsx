import React, { useState, MouseEvent } from 'react';
import { PhoneListing, LanguageCode } from '../types';
import { Search, ShoppingCart, Cpu, Signal, X, Layers, ChevronRight, Plus } from 'lucide-react';
import { translations } from '../i18n';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface MarketplaceProps {
    lang: LanguageCode;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ lang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterBrand, setFilterBrand] = useState('All');
    const [visibleCount, setVisibleCount] = useState(15);
    const [selectedProduct, setSelectedProduct] = useState<PhoneListing & { specs: any } | null>(null);
    const [products, setProducts] = useState<(PhoneListing & { specs: any })[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 12;

    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('newest');
    const [selectedRam, setSelectedRam] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');

    // Dropdown options
    const ramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB'];
    const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];

    const { addToCart } = useCart();
    const { addToast } = useToast();
    const t = translations[lang];

    // Debounce search term
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString(),
                    search: debouncedSearchTerm,
                    brand: filterBrand,
                    sort,
                    minPrice,
                    maxPrice,
                    ram: selectedRam,
                    storage: selectedStorage,
                    condition: selectedCondition
                });

                const response = await fetch(`/api/products?${queryParams.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();

                if (data.products) {
                    const formatted = data.products.map((p: any) => ({
                        ...p,
                        model: p.name || p.model, // Backend uses 'name', frontend uses 'model'
                        // Map top-level backend fields to specs object if specs is missing or incomplete
                        specs: {
                            cpu: p.processor || p.specs?.cpu || 'Standard Chip',
                            battery: p.battery || p.specs?.battery || 'Standard Battery',
                            screen: p.display || p.specs?.screen || 'HD Display'
                        },
                        imageUrl: p.image || p.imageUrl || '' // Handle naming difference
                    }));
                    setProducts(formatted);
                    setTotalPages(data.totalPages);
                } else {
                    // Fallback for old API structure (array)
                    const formatted = (Array.isArray(data) ? data : []).map((p: any) => ({
                        ...p,
                        model: p.name || p.model,
                        specs: {
                            cpu: p.processor || p.specs?.cpu || 'Standard Chip',
                            battery: p.battery || p.specs?.battery || 'Standard Battery',
                            screen: p.display || p.specs?.screen || 'HD Display'
                        },
                        imageUrl: p.image || p.imageUrl || ''
                    }));
                    setProducts(formatted);
                }
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        fetchProducts();
        fetchProducts();
    }, [currentPage, debouncedSearchTerm, filterBrand, sort, minPrice, maxPrice, selectedRam, selectedStorage, selectedCondition]);

    // Logic to add to global cart
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

    // Spotlight Effect
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

    // Helper to get image from product (handles both images array and imageUrl)
    const getProductImage = (product: any) => {
        // Try images array first (from DB)
        if (product.images && product.images.length > 0) {
            return getImageUrl(product.images[0]);
        }
        // Fallback to imageUrl (for compatibility)
        if (product.imageUrl) {
            return getImageUrl(product.imageUrl);
        }
        // Default fallback
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
    };

    // Filter logic moved to backend
    const filteredPhones = products;

    if (loading) {
        return <div className="min-h-screen pt-32 text-center text-white">Loading Marketplace...</div>;
    }

    return (
        <div className="relative z-10 py-16 min-h-screen" onMouseMove={handleMouseMove}>

            {/* --- PRODUCT INSPECTOR MODAL --- */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-7xl max-h-[90vh] bg-slate-900 border-4 border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/50 flex flex-col md:flex-row">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedProduct(null)}
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
                                loading="lazy"
                                className="relative z-10 w-3/4 max-w-sm drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />

                            {/* Floating Specs */}
                            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-2">
                                <div className="bg-black/60 backdrop-blur border border-white/10 p-3 rounded-xl">
                                    <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                                    <div className="text-[10px] text-slate-400 uppercase">Processor</div>
                                    <div className="text-sm font-bold text-white">{selectedProduct.specs.cpu}</div>
                                </div>
                                <div className="bg-black/60 backdrop-blur border border-white/10 p-3 rounded-xl">
                                    <div className="text-[10px] text-slate-400 uppercase">Battery</div>
                                    <div className="text-sm font-bold text-white">{selectedProduct.specs.battery}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Data & Actions */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-slate-950">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${selectedProduct.condition === 'new' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                                    {selectedProduct.condition}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">ID: {selectedProduct.id}-XJ9</span>
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
                                    <span className="text-white font-medium">{selectedProduct.specs.screen}</span>
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
                                <button className="flex-1 border border-slate-700 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all">
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Futuristic Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-green-500 font-mono uppercase tracking-widest">System Online</span>
                        </div>
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">
                            MARKET<span className="text-cyan-500">PLACE</span>
                        </h2>
                        <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
                    </div>

                    {/* Control Panel Filter */}
                    {/* Control Panel Filter */}
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <div className="glass-modern p-2 rounded-2xl flex items-center gap-2 w-full overflow-x-auto border border-slate-800">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search Database..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900/80 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-cyan-500 outline-none border border-transparent placeholder-slate-600"
                                />
                            </div>
                            <div className="h-8 w-px bg-slate-800 mx-1"></div>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="bg-slate-900/80 text-white rounded-xl px-4 py-2 text-sm border-none focus:ring-1 focus:ring-cyan-500 outline-none"
                            >
                                <option value="newest">Newest</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name_asc">Name: A-Z</option>
                            </select>
                        </div>

                        {/* Advanced Filters */}
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="number"
                                placeholder="Min Price"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-24 bg-slate-900/80 text-white rounded-xl px-3 py-2 text-sm border border-slate-800 focus:border-cyan-500 outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Max Price"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-24 bg-slate-900/80 text-white rounded-xl px-3 py-2 text-sm border border-slate-800 focus:border-cyan-500 outline-none"
                            />
                            <select
                                value={selectedRam}
                                onChange={(e) => setSelectedRam(e.target.value)}
                                className="bg-slate-900/80 text-white rounded-xl px-3 py-2 text-sm border border-slate-800 focus:border-cyan-500 outline-none"
                            >
                                <option value="">RAM: Any</option>
                                {ramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <select
                                value={selectedStorage}
                                onChange={(e) => setSelectedStorage(e.target.value)}
                                className="bg-slate-900/80 text-white rounded-xl px-3 py-2 text-sm border border-slate-800 focus:border-cyan-500 outline-none"
                            >
                                <option value="">Storage: Any</option>
                                {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
                            {['All', 'Apple', 'Samsung', 'Google', 'Xiaomi'].map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => setFilterBrand(brand)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterBrand === brand
                                        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                        : 'bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-800'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 group perspective-container">
                    {filteredPhones.slice(0, visibleCount).map((phone) => (
                        <div
                            key={phone.id}
                            className="spotlight-card rounded-3xl h-full flex flex-col border border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-sm"
                        >
                            <div className="spotlight-border"></div>

                            {/* Image Area */}
                            <div className="relative p-1">
                                <div
                                    className="relative h-72 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 cursor-pointer group/image"
                                    onClick={() => setSelectedProduct(phone)}
                                >
                                    <img
                                        src={getProductImage(phone)}
                                        alt={phone.model}
                                        loading="lazy"
                                        className="w-full h-full object-cover opacity-90 group-hover/image:opacity-100 group-hover/image:scale-110 transition-all duration-700"
                                    />

                                    {/* Overlay Badges */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border ${phone.condition === 'new'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                            }`}>
                                            {phone.condition.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Quick View Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                                        <span className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Inspect
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-[10px] text-cyan-500 font-mono uppercase mb-1 tracking-wider">{phone.brand}</div>
                                        <h3 className="text-xl font-bold text-white leading-tight hover:text-cyan-400 transition-colors cursor-pointer" onClick={() => setSelectedProduct(phone)}>
                                            {phone.model}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white">
                                            {phone.price}{t.currency}
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Specs Mini Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800 flex items-center gap-2">
                                        <Cpu className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs text-slate-300 truncate">{phone.specs.cpu}</span>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800 flex items-center gap-2">
                                        <Signal className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs text-slate-300">5G Ready</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex gap-3">
                                    <button
                                        onClick={() => handleAddToCart(phone)}
                                        className="flex-1 bg-slate-800 hover:bg-cyan-600 hover:text-black text-white py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        <span className="group-hover/btn:hidden">{t.buyNow}</span>
                                        <span className="hidden group-hover/btn:inline">Add +</span>
                                    </button>
                                    <button
                                        onClick={() => setSelectedProduct(phone)}
                                        className="px-4 py-3 border border-slate-700 hover:border-cyan-500 rounded-xl text-slate-400 hover:text-cyan-400 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More Button */}
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
