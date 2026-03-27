import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Share2, Star, Truck, Check, Heart, HelpCircle, Package, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../hooks/useWishlist';
import { SEO } from './SEO';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { Breadcrumbs } from './Breadcrumbs';
import { TrustBadges } from './products/TrustBadges';
import { ProductGallery } from './products/ProductGallery';
import { ProductTabs } from './products/ProductTabs';
import { ReviewModal } from './products/ReviewModal';

export const AccessoryDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [accessory, setAccessory] = useState<any>(null);
    const [activeImage, setActiveImage] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'questions'>('overview');
    const [reviews, setReviews] = useState<any[]>([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isInWishlist, toggleWishlist, loadingId: wishlistLoadingId } = useWishlist();

    useEffect(() => {
        const fetchAccessory = async () => {
            try {
                setLoading(true);
                window.scrollTo(0, 0);
                const response = await api.get(`/api/accessories/${id}`);
                const data = (response as any).data || response;
                
                const formatted = {
                    ...data,
                    id: data.id || data._id,
                    model: data.name || 'Accessory',
                    brand: data.brand || 'HandyLand',
                    imageUrl: data.image || '/images/placeholder.png',
                    images: data.image ? [data.image] : ['/images/placeholder.png']
                };
                
                setAccessory(formatted);
                setActiveImage(formatted.imageUrl);
            } catch (error) {
                console.error("Failed to load accessory", error);
                addToast("Accessory not found", "error");
                navigate('/accessories'); // or marketplace
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAccessory();
    }, [id, navigate, addToast]);

    const handleAddToCart = () => {
        if (!accessory) return;
        addToCart({
            id: accessory.id,
            title: accessory.name,
            subtitle: accessory.type || accessory.category || 'Accessory',
            price: accessory.price,
            image: activeImage,
            category: 'accessory',
            quantity: quantity,
            stock: accessory.stock ?? 0
        });
        addToast(`${quantity}x ${accessory.name} added to cart`, 'success');
    };

    if (loading) return <div className="min-h-screen pt-32 text-center text-slate-900 dark:text-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
    if (!accessory) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 relative">
            <SEO
                title={`${accessory.name} | Accessories`}
                description={accessory.description || `Buy ${accessory.name} accessory.`}
                ogImage={getImageUrl(activeImage)}
            />
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto mb-6">
                <Breadcrumbs items={[
                    { label: 'Home', path: '/' },
                    { label: 'Accessories', path: '/accessories' },
                    { label: accessory.name }
                ]} />
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button onClick={() => setIsLightboxOpen(false)} title="Close lightbox" aria-label="Close lightbox" className="absolute top-8 right-8 text-white hover:text-brand-primary">
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={getImageUrl(activeImage)}
                        alt="Zoomed"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    <ProductGallery 
                        product={accessory as any} 
                        activeImage={activeImage} 
                        setActiveImage={setActiveImage} 
                        setIsLightboxOpen={setIsLightboxOpen} 
                        setIsConditionGuideOpen={() => {}} 
                    />

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{accessory.name}</h1>
                            <button
                                title="Share product"
                                aria-label="Share product"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    addToast("Link copied to clipboard", "success");
                                }}
                                className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {accessory.stock > 0 && accessory.stock < 5 && (
                            <div className="text-orange-500 font-bold mb-4 text-sm animate-pulse">
                                🔥 Limited Stock: Only {accessory.stock} left!
                            </div>
                        )}

                        <div className="flex items-end gap-3 mb-8">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                                {accessory.price}{t('currency', '€')}
                            </div>
                            <div className={`text-sm mb-2 font-medium ${accessory.stock > 0 ? 'text-green-400' : 'text-red-500'}`}>
                                {accessory.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </div>
                        </div>

                        {/* Quick Specs for Category */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <Package className="w-5 h-5 text-brand-primary" />
                                <div>
                                    <div className="text-xs text-slate-500">Category</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200 capitalize">{accessory.category || 'Accessory'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Brand</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{accessory.brand || 'Generic'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <TrustBadges className="grid-cols-2 lg:grid-cols-4 gap-2" />
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quantity</span>
                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                    <button
                                        title="Decrease quantity" 
                                        aria-label="Decrease quantity"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg"
                                        disabled={quantity <= 1}
                                    >-</button>
                                    <span className="w-12 text-center font-mono text-slate-900 dark:text-white">{quantity}</span>
                                    <button
                                        title="Increase quantity" 
                                        aria-label="Increase quantity"
                                        onClick={() => {
                                            if (quantity >= accessory.stock) {
                                                addToast(`Maximum stock: ${accessory.stock}`, 'error');
                                            } else {
                                                setQuantity(q => q + 1);
                                            }
                                        }}
                                        className="px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg"
                                        disabled={quantity >= accessory.stock}
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    title={isInWishlist(accessory.id) ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-label={isInWishlist(accessory.id) ? "Remove from wishlist" : "Add to wishlist"}
                                    onClick={() => toggleWishlist({
                                        id: accessory.id,
                                        title: accessory.name,
                                        price: accessory.price,
                                        image: activeImage,
                                        category: 'accessory',
                                        quantity: 1,
                                        stock: accessory.stock
                                    })}
                                    disabled={wishlistLoadingId === String(accessory.id)}
                                    className={`p-4 rounded-xl border transition-all flex items-center justify-center ${isInWishlist(accessory.id)
                                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                        : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isInWishlist(accessory.id) ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={accessory.stock === 0}
                                    className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                        ${accessory.stock > 0
                                            ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-lg shadow-brand-primary/20 hover:shadow-brand-secondary/40'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {accessory.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <ProductTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    product={{
                        ...accessory,
                        description: accessory.description || 'High quality accessory designed for maximum compatibility and durability.',
                        features: ['Premium Quality', 'Durable Materials', 'Guaranteed Compatibility', 'Fast Shipping'],
                        specs: {
                            cpu: 'N/A',
                            battery: accessory.battery || 'N/A',
                            screen: accessory.display || 'N/A',
                            ram: 'N/A',
                            camera: 'N/A'
                        }
                    }}
                    reviews={reviews}
                    setShowReviewModal={setShowReviewModal}
                />
            </div>

            <ReviewModal 
                showReviewModal={showReviewModal}
                setShowReviewModal={setShowReviewModal}
                newReview={newReview}
                setNewReview={setNewReview}
                handleSubmitReview={async (e) => { e.preventDefault(); addToast("Review submitted!", "success"); setShowReviewModal(false); }}
            />
        </div>
    );
};
