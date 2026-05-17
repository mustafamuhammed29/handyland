import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Zap, Share2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';

import { CompareSlot } from './Compare/CompareSlot';
import { CompareTable } from './Compare/CompareTable';

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

    const handleAddToCart = (product: any) => {
        const imageUrl = product.images?.length ? product.images[0] : (product.image || product.imageUrl || product.thumbnail);
        addToCart({
            id: product.id || product._id,
            title: product.name || product.model || 'Unknown Product',
            subtitle: product.storage ? `${product.storage} • ${product.color}` : '',
            price: product.pricing?.basePrice || product.price,
            image: getImageUrl(imageUrl),
            category: 'device',
            stock: product.stock ?? 0
        });
    };

    const slots = [0, 1, 2];
    const safeProducts = Array.isArray(products) ? products : [];
    
    const filteredSearch = safeProducts.filter(p => {
        const matchesSearch = (p.name || p.model || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = brandFilter === '' || (p.brand || '').toLowerCase() === brandFilter.toLowerCase();
        return matchesSearch && matchesBrand;
    });

    const activeProducts = selectedProducts.filter(Boolean);
    
    const suggestedProducts = safeProducts
        .filter(p => !activeProducts.find(ap => (ap._id || ap.id) === (p._id || p.id)))
        .slice(0, 4);

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 pt-32 pb-24 text-slate-900 dark:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="mb-12 text-center">
                    <p className="text-sm font-mono text-brand-primary uppercase tracking-widest mb-3">
                        {t('compare.subtitle', 'Side-by-side Vergleich')}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                        {t('compare.title', 'Compare Devices')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-6">
                        {t('compare.description', 'Wähle bis zu 3 Geräte aus und vergleiche Spezifikationen, Preise und Leistung auf einen Blick.')}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                        <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-700 hover:border-brand-primary/50 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-brand-primary/20"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />} 
                            {copied ? 'Link Copied!' : 'Share Compare'}
                        </button>
                        
                        {activeProducts.length > 1 && (
                            <button
                                onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                                className={`flex items-center gap-2 px-5 py-2.5 border rounded-full font-bold text-sm transition-all shadow-lg ${showDifferencesOnly ? 'bg-brand-primary border-brand-primary text-black' : 'bg-slate-900 border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary/50 hover:shadow-brand-primary/20'}`}
                            >
                                <Zap className="w-4 h-4" /> 
                                {showDifferencesOnly ? 'Showing Differences' : 'Show Differences Only'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {slots.map((slotIndex) => (
                        <CompareSlot 
                            key={slotIndex}
                            slotIndex={slotIndex}
                            product={selectedProducts[slotIndex]}
                            isSearching={isSearching?.slotIndex === slotIndex}
                            searchTerm={searchTerm}
                            brandFilter={brandFilter}
                            filteredSearch={filteredSearch}
                            onSetIsSearching={setIsSearching}
                            onSetSearchTerm={setSearchTerm}
                            onSetBrandFilter={setBrandFilter}
                            onSelectProduct={handleSelectProduct}
                            onRemoveProduct={handleRemoveProduct}
                            onNavigate={navigate}
                            onAddToCart={handleAddToCart}
                            t={t}
                        />
                    ))}
                </div>

                {activeProducts.length === 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 text-center mb-6">Popular Devices to Compare</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            {suggestedProducts.map(p => (
                                <button
                                    key={p._id || p.id}
                                    onClick={() => handleSelectProduct(p, 0)}
                                    className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-brand-primary/50 px-4 py-2 rounded-2xl transition-colors"
                                >
                                    <img src={getImageUrl(p.images?.[0] || p.image || p.thumbnail)} alt={p.name} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} className="w-8 h-8 object-contain bg-white rounded-md p-1" />
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{p.name || p.model}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeProducts.length > 0 && (
                    <CompareTable 
                        slots={slots}
                        selectedProducts={selectedProducts}
                        activeProducts={activeProducts}
                        showDifferencesOnly={showDifferencesOnly}
                    />
                )}
            </div>
        </div>
    );
};
