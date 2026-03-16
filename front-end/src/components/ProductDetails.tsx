import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Cpu, Battery, Smartphone, Shield, Truck, Star, ChevronRight, Check, X, Share2, ThumbsUp, HelpCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PhoneListing } from '../types';
import { SEO } from './SEO';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { Breadcrumbs } from './Breadcrumbs';
import { ConditionGuide } from './products/ConditionGuide';
import { TrustBadges } from './products/TrustBadges';

interface ProductDetailsProps {}

export const ProductDetails: React.FC<ProductDetailsProps> = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<PhoneListing | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<PhoneListing[]>([]);
    const [activeImage, setActiveImage] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'questions'>('overview');
    const [isConditionGuideOpen, setIsConditionGuideOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]); // New state for questions
    const [showReviewModal, setShowReviewModal] = useState(false); // Review modal state
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' }); // New review form
    const [newQuestion, setNewQuestion] = useState(''); // New question form

    // Hooks
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { t } = useTranslation();
    const { user } = useAuth(); // Safe to access now if context provides it

    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loadingWishlistId, setLoadingWishlistId] = useState<string | null>(null);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                if (!user) return;
                const res = await api.get<any>('/api/wishlist') as any;
                const products = res.data?.items || res.data?.products || res.products || res.items || [];
                setWishlist(products.map((p: any) => p.customId || p.product || p.id || p._id));
            } catch (error) {
                console.error("Failed to load wishlist", error);
            }
        };
        fetchWishlist();
    }, [user]);

    const toggleWishlist = async (targetId: string | undefined) => {
        if (!targetId || !user) {
            addToast("Please login to use wishlist", "error");
            return;
        }
        if (loadingWishlistId === targetId) return;
        setLoadingWishlistId(targetId);

        const isWishlisted = wishlist.includes(targetId);
        const method = isWishlisted ? 'delete' : 'post';
        const endpoint = isWishlisted ? `/api/wishlist/${targetId}` : '/api/wishlist';

        setWishlist(prev =>
            isWishlisted ? prev.filter(item => item !== targetId) : [...prev, targetId]
        );

        try {
            await api({
                method,
                url: endpoint,
                data: isWishlisted ? undefined : { productId: targetId }
            });
            addToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
        } catch (error) {
            console.error('Wishlist toggle failed:', error);
            setWishlist(prev =>
                isWishlisted ? [...prev, targetId] : prev.filter(item => item !== targetId)
            );
            addToast('Action failed. Please try again.', 'error');
        } finally {
            setLoadingWishlistId(null);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                window.scrollTo(0, 0);
                const data = await productService.getProductById(id || '');
                // productService returns { success, product } but check if data structure matches
                // actually getProductById returns { success: boolean; product: PhoneListing }
                // but the original fetch returned the product object directly? 
                // Let's check productService: return await api.get(`/api/products/${id}`);
                // api.get usually returns response.data.
                // If api.get returns the data directly, then:
                // Wait, api.ts snippet: response.use(response => response, error => ...)
                // But typically api.get<T> returns T.
                // In productService: return await api.get(...)
                // If the backend returns { product: ... }, then data.product is the product.

                // Let's assume productService.getProductById returns the response data which contains the product.
                // But wait, the original code did: const response = await fetch... const data = await response.json();
                // Then used data directly as the product (mostly).
                // Let's look at original code:
                // const formatted: PhoneListing = { ...data, ... }
                // This implies 'data' is the product object itself or contains fields of it.

                // If I use productService.getProductById(id), it returns what api.get returns.
                // Let's assume consistency with other services.

                let productData: any = data;
                if (data.product) {
                    productData = data.product;
                }

                const formatted: PhoneListing = {
                    ...productData,
                    id: productData.id || productData._id || id,
                    model: productData.name || productData.model,
                    specs: {
                        cpu: productData.processor || productData.specs?.cpu || 'Standard Chip',
                        battery: productData.battery || productData.specs?.battery || 'Standard Battery',
                        screen: productData.display || productData.specs?.screen || 'HD Display',
                        ram: productData.specs?.ram || 'N/A',
                        camera: productData.specs?.camera || 'Pro Camera System'
                    },
                    imageUrl: productData.image || productData.imageUrl || '',
                    images: productData.images?.length > 0 ? productData.images : [productData.image || productData.imageUrl]
                };
                setProduct(formatted);
                setActiveImage(formatted.images?.[0] || formatted.imageUrl || '');

                // Fetch Related
                const relatedData = await productService.getRelatedProducts(productData.id || id);
                const formattedRelated = relatedData.map((p: any) => ({
                    ...p,
                    model: p.name || p.model,
                    imageUrl: p.image || p.imageUrl || ''
                }));
                setRelatedProducts(formattedRelated);

                // Fetch Reviews
                const reviewsData = await productService.getProductReviews(productData.id || id);
                setReviews(reviewsData);

                // Fetch Questions
                const questionsData = await productService.getProductQuestions(productData.id || id);
                setQuestions(questionsData);

            } catch (error) {
                console.error("Failed to load product", error);
                addToast("Product not found", "error");
                navigate('/marketplace');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id, navigate, addToast]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            addToast("Please login to write a review", "error");
            navigate('/login');
            return;
        }
        if (!newReview.comment.trim()) return;

        try {
            const endpointId = product?.id || (product as any)?._id || id;
            const res = await api.post(`/api/products/${endpointId}/reviews`, newReview) as any;
            if (res.success || res.review) {
                addToast("Review submitted successfully!", "success");
                setShowReviewModal(false);
                setNewReview({ rating: 5, comment: '' });

                // Fetch reviews again to ensure data consistency
                const reviewsData = await productService.getProductReviews(endpointId as string);
                setReviews(reviewsData);
            }
        } catch (err: any) {
            addToast(err.response?.data?.message || err.message || "Failed to submit review", "error");
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            title: product.model,
            subtitle: `${product.storage} • ${product.color}`,
            price: product.price,
            image: activeImage,
            category: 'device',
            quantity: quantity,
            stock: product.stock ?? 0
        });
        addToast(`${quantity}x ${product.model} added to cart`, 'success');
    };

    if (loading) return <div className="min-h-screen pt-32 text-center text-slate-900 dark:text-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative">
            <SEO
                title={(product as any).seo?.metaTitle || `${product.model} - ${product.condition} | ${product.storage}`}
                description={(product as any).seo?.metaDescription || `Buy used, refurbished ${product.brand} ${product.model} - ${product.storage} - ${product.color} in ${product.condition} condition. Certified quality, warranty included.`}
                keywords={(product as any).seo?.keywords}
                canonical={(product as any).seo?.canonicalUrl || window.location.href}
                ogImage={(product as any).seo?.ogImage || getImageUrl(activeImage)}
            />
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto mb-6">
                <Breadcrumbs items={[
                    { label: 'Home', path: '/' },
                    { label: 'Marketplace', path: '/marketplace' },
                    { label: `${product.brand} ${product.model}` }
                ]} />
            </div>
            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button onClick={() => setIsLightboxOpen(false)} aria-label="Close lightbox" className="absolute top-8 right-8 text-white hover:text-brand-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={getImageUrl(activeImage)}
                        alt="Zoomed Product"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="max-w-7xl mx-auto">


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div
                            className="aspect-square bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden relative group cursor-zoom-in w-full text-left focus:outline-none focus:ring-2 focus:ring-brand-primary block shadow-sm"
                            onClick={() => setIsLightboxOpen(true)}
                            aria-label={`Enlarge image of ${product.model}`}
                        >
                            <img
                                src={getImageUrl(activeImage)}
                                alt={product.model}
                                className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-10">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsConditionGuideOpen(true);
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm active:scale-95 ${product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : (product.condition as string) === 'fair' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${product.condition === 'new' ? 'bg-emerald-500' : (product.condition as string) === 'fair' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                    {product.condition}
                                    <HelpCircle className="w-3.5 h-3.5 opacity-70 ml-0.5" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {product.images?.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    aria-label={`View image ${idx + 1}`}
                                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-brand-primary opacity-100' : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={getImageUrl(img)} alt={`View ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{product.model}</h1>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    addToast("Link copied to clipboard", "success");
                                }}
                                aria-label="Share product"
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-slate-400 dark:hover:text-white"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Urgency UI */}
                        {product.stock > 0 && product.stock < 10 && (
                            <div className="flex items-center gap-2 mb-4 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg w-fit animate-pulse">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                                <span className="text-sm font-bold">🔥 High Demand: {Math.floor(Math.random() * 5) + 3} people are looking at this right now</span>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-2 text-yellow-500">
                                <span className="font-bold text-slate-900 dark:text-white text-lg">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 5) ? 'fill-current' : 'text-slate-700'}`} />
                                    ))}
                                </div>
                            </div>
                            <span className="text-slate-400 text-sm">{product.numReviews || reviews.length} Reviews</span>
                        </div>

                        <div className="flex items-end gap-3 mb-8">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                                {product.price}{t('currency', '€')}
                            </div>
                            {/* Stock Indicator */}
                            <div className={`text-sm mb-2 font-medium ${product.stock > 0 ? (product.stock < 5 ? 'text-orange-400' : 'text-green-400') : 'text-red-500'}`}>
                                {product.stock > 0
                                    ? (product.stock < 5 ? `Only ${product.stock} left in stock!` : 'In Stock')
                                    : 'Out of Stock'
                                }
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <TrustBadges className="grid-cols-2 lg:grid-cols-4 gap-2" />
                        </div>

                        {/* Quick Specs */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Cpu className="w-5 h-5 text-brand-primary" />
                                <div>
                                    <div className="text-xs text-slate-500">Processor</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.specs?.cpu}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Battery className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Battery</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.specs?.battery}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Smartphone className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Storage</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.storage}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Warranty</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">12 Months</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quantity</span>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm dark:shadow-none">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white transition-colors dark:hover:bg-slate-800 rounded-l-lg"
                                        disabled={quantity <= 1}
                                    >-</button>
                                    <span className="w-12 text-center font-mono text-slate-900 dark:text-white">{quantity}</span>
                                    <button
                                        onClick={() => {
                                            if (quantity >= product.stock) {
                                                addToast(`Maximum available stock: ${product.stock}`, 'error');
                                            } else {
                                                setQuantity(q => q + 1);
                                            }
                                        }}
                                        className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white transition-colors dark:hover:bg-slate-800 rounded-r-lg"
                                        disabled={quantity >= product.stock}
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleWishlist(product.id || (product as any)._id)}
                                    disabled={loadingWishlistId === (product.id || (product as any)._id)}
                                    title={wishlist.includes(product.id || (product as any)._id) ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-label={wishlist.includes(product.id || (product as any)._id) ? "Remove from wishlist" : "Add to wishlist"}
                                    className={`p-4 rounded-xl border transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-wait ${wishlist.includes(product.id || (product as any)._id)
                                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/30'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${wishlist.includes(product.id || (product as any)._id) ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 
                                        ${product.stock > 0
                                            ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                            : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                            <div className="flex justify-center gap-6 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Shipping</span>
                                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Verified Authentic</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mb-16">
                    <div className="flex overflow-x-auto gap-8 border-b border-slate-200 dark:border-slate-800 mb-8 pb-px" role="tablist">
                        {['overview', 'specs', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                role="tab"
                                id={`tab-${tab}`}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === tab ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                            </button>
                        ))}
                        <button
                            role="tab"
                            id="tab-questions"
                            onClick={() => setActiveTab('questions')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === 'questions' ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                        >
                            Q&A
                            {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>}
                        </button>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 min-h-[300px]">
                        {activeTab === 'overview' && (
                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Product Overview</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                    {product.description || "The ultimate device for power users. Featuring a stunning display, all-day battery life, and a pro-grade camera system. Each unit is rigorously tested and certified by our technicians to ensure 100% functionality."}
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['Professional Inspection', 'New Battery Installed', 'Original Accessories', 'Sanitized & Cleaned'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                            <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center"><Check className="w-3 h-3" /></div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Performance</h3>
                                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                        <span className="text-slate-500">Processor</span>
                                        <span className="text-slate-900 dark:text-slate-200">{product.specs?.cpu}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                        <span className="text-slate-500">RAM</span>
                                        <span className="text-slate-900 dark:text-slate-200">{product.specs?.ram}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                        <span className="text-slate-500">Storage</span>
                                        <span className="text-slate-900 dark:text-slate-200">{product.storage}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Display & Battery</h3>
                                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                        <span className="text-slate-500">Screen Size</span>
                                        <span className="text-slate-900 dark:text-slate-200">{product.specs?.screen}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/50">
                                        <span className="text-slate-500">Battery Capacity</span>
                                        <span className="text-slate-900 dark:text-slate-200">{product.specs?.battery}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review: any) => (
                                            <div key={review._id} className="border-b border-slate-200 dark:border-slate-800 pb-6 last:border-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-slate-900 dark:text-white">{review.user?.name || 'Anonymous'}</div>
                                                        <span className="text-xs text-slate-500">• {new Date(review.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                            <Star className="w-8 h-8 text-yellow-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Reviews Yet</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6">Be the first to share your experience with this product!</p>
                                    </div>
                                )}
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg transition-colors"
                                    >
                                        Write a Review
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-900 pt-16">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">You Might Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <div key={related.id} onClick={() => navigate(`/products/${related.id}`)} className="group cursor-pointer bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all hover:-translate-y-2 hover:border-brand-primary/50">
                                    <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                                        <img src={getImageUrl(related.imageUrl)} alt={related.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{related.model}</h4>
                                    <div className="text-brand-primary font-bold">{related.price}{t('currency', '€')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Add to Cart Bar (Mobile Bottom, Desktop Top) */}
            <AnimatePresence>
                {product && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 md:top-0 md:bottom-auto left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t md:border-t-0 md:border-b border-slate-200 dark:border-slate-800 p-4 z-40 transform translate-y-full md:-translate-y-full transition-transform duration-300"
                        style={{ 
                            transform: `translateY(${window.scrollY > 600 ? '0' : (window.innerWidth < 768 ? '100%' : '-100%')})`
                        }}
                    >
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <img src={getImageUrl(product.imageUrl || product.images?.[0])} alt={product.model} className="w-12 h-12 object-cover rounded-md hidden sm:block bg-slate-100 dark:bg-slate-900" />
                                <div>
                                    <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white line-clamp-1">{product.model}</div>
                                    <div className="text-xs text-brand-primary font-bold">{formatPrice(product.price)}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className={`px-6 md:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap
                                    ${product.stock > 0
                                        ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                            >
                                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden sm:inline">{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                                <span className="sm:hidden">{product.stock > 0 ? 'Add' : 'Out'}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Write a Review</h3>
                            <button onClick={() => setShowReviewModal(false)} aria-label="Close review modal" title="Close review modal" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReview} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">Your Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            aria-label={`Rate ${star} stars`}
                                            title={`Rate ${star} stars`}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star className={`w-8 h-8 ${star <= newReview.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300 dark:text-slate-700'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Your Review</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newReview.comment}
                                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-brand-primary outline-none transition-colors"
                                    placeholder="What do you think about this product?"
                                />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 py-3 px-4 font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newReview.comment.trim()}
                                    className="flex-1 py-3 px-4 font-bold rounded-xl bg-brand-primary hover:bg-brand-primary text-white transition-colors disabled:opacity-50"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
