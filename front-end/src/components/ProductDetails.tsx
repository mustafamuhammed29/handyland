import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Cpu, Battery, Smartphone, Shield, Truck, Star, ChevronRight, Check, X, Share2, ThumbsUp, HelpCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../hooks/useWishlist';
import { PhoneListing } from '../types';
import { SEO } from './SEO';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { Breadcrumbs } from './Breadcrumbs';
import { cleanProductName } from '../utils/cleanProductName';
import { ConditionGuide } from './products/ConditionGuide';
import { TrustBadges } from './products/TrustBadges';
import { ProductGallery } from './products/ProductGallery';
import { ProductTabs } from './products/ProductTabs';
import { ProductStickyBar } from './products/ProductStickyBar';
import { ReviewModal } from './products/ReviewModal';

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

    const { isInWishlist, toggleWishlist, loadingId: wishlistLoadingId } = useWishlist();


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
                        cpu: productData.processor || productData.chipset || 'See full specs',
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
            title: cleanProductName(product.model, product.brand),
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
                title={(product as any).seo?.metaTitle || `${cleanProductName(product.model, product.brand)} - ${product.condition} | ${product.storage}`}
                description={(product as any).seo?.metaDescription || `Gebrauchtes ${cleanProductName(product.model, product.brand)} kaufen - ${product.storage} - ${product.color} im Zustand ${product.condition}. Zertifizierte Qualität, Garantie inklusive.`}
                keywords={(product as any).seo?.keywords}
                canonical={(product as any).seo?.canonicalUrl || window.location.href}
                ogImage={(product as any).seo?.ogImage || getImageUrl(activeImage)}
            />
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto mb-6">
                <Breadcrumbs items={[
                    { label: t('product.breadcrumbHome', 'Startseite'), path: '/' },
                    { label: t('product.breadcrumbMarketplace', 'Marktplatz'), path: '/marketplace' },
                    { label: cleanProductName(product.model, product.brand) }
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
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/placeholder-phone.png'; }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    <ProductGallery 
                        product={product} 
                        activeImage={activeImage} 
                        setActiveImage={setActiveImage} 
                        setIsLightboxOpen={setIsLightboxOpen} 
                        setIsConditionGuideOpen={setIsConditionGuideOpen} 
                    />

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{cleanProductName(product.model, product.brand)}</h1>
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
                        {((product.stock || 0) > 0) && ((product.stock || 0) < 10) && (
                            <div className="flex items-center gap-2 mb-4 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg w-fit animate-pulse">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                                <span className="text-sm font-bold">🔥 {t('product.highDemand', 'Hohe Nachfrage: {{count}} Personen sehen sich dieses Produkt gerade an', { count: Math.floor(Math.random() * 5) + 3 })}</span>
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
                            <span className="text-slate-400 text-sm">{product.numReviews || reviews?.length || 0} {t('product.reviews', 'Bewertungen')}</span>
                        </div>

                        <div className="flex items-end gap-3 mb-8">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(product.price)}
                            </div>
                            {/* Stock Indicator */}
                            <div className={`text-sm mb-2 font-medium ${(product.stock || 0) > 0 ? ((product.stock || 0) < 5 ? 'text-orange-400' : 'text-green-400') : 'text-red-500'}`}>
                                {(product.stock || 0) > 0
                                    ? ((product.stock || 0) < 5 ? t('product.onlyLeft', 'Nur noch {{count}} auf Lager!', { count: product.stock }) : t('product.inStock', 'Auf Lager'))
                                    : t('product.outOfStock', 'Nicht vorrätig')
                                }
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <TrustBadges className="!grid-cols-2 gap-3" />
                        </div>

                        {/* Quick Specs */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Cpu className="w-5 h-5 text-brand-primary" />
                                <div>
                                    <div className="text-xs text-slate-500">{t('product.processor', 'Prozessor')}</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.specs?.cpu || t('product.unknown', 'Unbekannt')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Battery className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-xs text-slate-500">{t('product.battery', 'Akku')}</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.specs?.battery}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Smartphone className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="text-xs text-slate-500">{t('product.storage', 'Speicher')}</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{product.storage}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <div>
                                    <div className="text-xs text-slate-500">{t('product.warranty', 'Garantie')}</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{t('product.warrantyValue', '12 Monate')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('product.quantity', 'Menge')}</span>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm dark:shadow-none">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white transition-colors dark:hover:bg-slate-800 rounded-l-lg"
                                        disabled={quantity <= 1}
                                    >-</button>
                                    <span className="w-12 text-center font-mono text-slate-900 dark:text-white">{quantity}</span>
                                    <button
                                        onClick={() => {
                                            if (quantity >= (product.stock || 0)) {
                                                addToast(`Maximal verfügbarer Bestand: ${product.stock || 0}`, 'error');
                                            } else {
                                                setQuantity(q => q + 1);
                                            }
                                        }}
                                        className="px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white transition-colors dark:hover:bg-slate-800 rounded-r-lg"
                                        disabled={quantity >= (product.stock || 0)}
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleWishlist({
                                        id: product.id || (product as any)._id,
                                        title: cleanProductName(product.model || (product as any).title, product.brand),
                                        price: product.price,
                                        image: activeImage,
                                        category: 'device',
                                        quantity: 1,
                                        stock: product.stock
                                    })}
                                    disabled={wishlistLoadingId === String(product.id || (product as any)._id)}
                                    title={isInWishlist(product.id || (product as any)._id) ? t('product.removeWishlist', 'Von Wunschliste entfernen') : t('product.addWishlist', 'Zur Wunschliste')}
                                    aria-label={isInWishlist(product.id || (product as any)._id) ? t('product.removeWishlist', 'Von Wunschliste entfernen') : t('product.addWishlist', 'Zur Wunschliste')}
                                    className={`p-4 rounded-xl border transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-wait ${isInWishlist(product.id || (product as any)._id)
                                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/30'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isInWishlist(product.id || (product as any)._id) ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.stock || product.stock <= 0}
                                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 
                                        ${(product.stock || 0) > 0
                                            ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                            : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {((product.stock || 0) > 0) ? t('product.addToCart', 'In den Warenkorb') : t('product.outOfStock', 'Nicht vorrätig')}
                                </button>
                            </div>
                            <div className="flex justify-center gap-6 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {t('product.freeShipping', 'Kostenloser Versand')}</span>
                                <span className="flex items-center gap-1"><Check className="w-3 h-3" /> {t('product.verifiedAuthentic', 'Verifiziert Original')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <ProductTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    product={product}
                    reviews={reviews}
                    setShowReviewModal={setShowReviewModal}
                />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-900 pt-16">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">{t('product.youMightAlsoLike', 'Das könnte dir gefallen')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <div key={related.id} onClick={() => navigate(`/products/${related.id}`)} className="group cursor-pointer bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all hover:-translate-y-2 hover:border-brand-primary/50">
                                    <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                                        <img src={getImageUrl(related.imageUrl)} alt={related.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{related.model}</h4>
                                    <div className="text-brand-primary font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(related.price)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ProductStickyBar product={product} handleAddToCart={handleAddToCart} />

            <ReviewModal 
                showReviewModal={showReviewModal}
                setShowReviewModal={setShowReviewModal}
                newReview={newReview}
                setNewReview={setNewReview}
                handleSubmitReview={handleSubmitReview}
            />
        </div>
    );
};
