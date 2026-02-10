import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Cpu, Battery, Smartphone, Shield, Truck, Star, ChevronRight, Check, X, Share2, ThumbsUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Added
import { api } from '../utils/api'; // Added
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { translations } from '../i18n';
import { PhoneListing, LanguageCode } from '../types';

interface ProductDetailsProps {
    lang: LanguageCode;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ lang }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<PhoneListing | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<PhoneListing[]>([]);
    const [activeImage, setActiveImage] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews' | 'questions'>('overview');
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
    const t = translations[lang];
    const { user } = useAuth(); // Safe to access now if context provides it

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                window.scrollTo(0, 0);
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) throw new Error('Product not found');
                const data = await response.json();

                const formatted: PhoneListing = {
                    ...data,
                    model: data.name || data.model,
                    specs: {
                        cpu: data.processor || data.specs?.cpu || 'Standard Chip',
                        battery: data.battery || data.specs?.battery || 'Standard Battery',
                        screen: data.display || data.specs?.screen || 'HD Display',
                        ram: data.specs?.ram || 'N/A',
                        camera: data.specs?.camera || 'Pro Camera System'
                    },
                    imageUrl: data.image || data.imageUrl || '',
                    images: data.images?.length > 0 ? data.images : [data.image || data.imageUrl]
                };
                setProduct(formatted);
                setActiveImage(formatted.images?.[0] || formatted.imageUrl || '');

                // Fetch Related
                const relatedRes = await fetch(`/api/products/${data.id}/related`);
                if (relatedRes.ok) {
                    const relatedData = await relatedRes.json();
                    const formattedRelated = relatedData.map((p: any) => ({
                        ...p,
                        model: p.name || p.model,
                        imageUrl: p.image || p.imageUrl || ''
                    }));
                    setRelatedProducts(formattedRelated);
                }

                // Fetch Reviews
                try {
                    const reviewsRes = await fetch(`/api/products/${data.id}/reviews`);
                    if (reviewsRes.ok) {
                        const reviewsData = await reviewsRes.json();
                        setReviews(reviewsData);
                    }
                } catch (err) {
                    console.error("Failed to load reviews", err);
                }

                // Fetch Questions
                try {
                    const questionsRes = await fetch(`/api/products/${data.id}/questions`);
                    if (questionsRes.ok) {
                        const questionsData = await questionsRes.json();
                        setQuestions(questionsData);
                    }
                } catch (err) {
                    console.error("Failed to load questions", err);
                }

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

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({
            id: product.id,
            title: product.model,
            subtitle: `${product.storage} • ${product.color}`,
            price: product.price,
            image: activeImage,
            category: 'device',
            quantity: quantity // Assuming addToCart handles quantity, if not it will add 1 by default usually, but context should be updated if needed.
        });
        addToast(`${quantity}x ${product.model} added to cart`, 'success');
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:5000${url}`;
    };

    if (loading) return <div className="min-h-screen pt-32 text-center text-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!product) return null;

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 relative">
            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button className="absolute top-8 right-8 text-white hover:text-cyan-400 transition-colors">
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
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                    <button onClick={() => navigate('/marketplace')} className="hover:text-cyan-400 transition-colors">Marketplace</button>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-slate-300">{product.brand || 'Brand'}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white font-medium">{product.model}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div
                            className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-zoom-in"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <img
                                src={getImageUrl(activeImage)}
                                alt={product.model}
                                className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${product.condition === 'new' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                                    {product.condition}
                                </span>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur">
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
                                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${activeImage === img ? 'border-cyan-500 opacity-100' : 'border-slate-800 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={getImageUrl(img)} alt={`View ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{product.model}</h1>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    addToast("Link copied to clipboard", "success");
                                }}
                                className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating || 5) ? 'fill-current' : 'text-slate-700'}`} />
                                ))}
                            </div>
                            <span className="text-slate-400 text-sm">{product.numReviews} Reviews</span>
                        </div>

                        <div className="flex items-end gap-3 mb-8">
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                {product.price}{t.currency}
                            </div>
                            {/* Stock Indicator */}
                            <div className={`text-sm mb-2 font-medium ${product.stock > 0 ? (product.stock < 5 ? 'text-orange-400' : 'text-green-400') : 'text-red-500'}`}>
                                {product.stock > 0
                                    ? (product.stock < 5 ? `Only ${product.stock} left in stock!` : 'In Stock')
                                    : 'Out of Stock'
                                }
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                <Cpu className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Processor</div>
                                    <div className="text-sm font-bold text-slate-200">{product.specs?.cpu}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                <Battery className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Battery</div>
                                    <div className="text-sm font-bold text-slate-200">{product.specs?.battery}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                <Smartphone className="w-5 h-5 text-purple-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Storage</div>
                                    <div className="text-sm font-bold text-slate-200">{product.storage}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                                <Shield className="w-5 h-5 text-orange-400" />
                                <div>
                                    <div className="text-xs text-slate-500">Warranty</div>
                                    <div className="text-sm font-bold text-slate-200">12 Months</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-slate-400 text-sm font-medium">Quantity</span>
                                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-3 py-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-l-lg"
                                        disabled={quantity <= 1}
                                    >-</button>
                                    <span className="w-12 text-center font-mono text-white">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                        className="px-3 py-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-r-lg"
                                        disabled={quantity >= product.stock}
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 
                                        ${product.stock > 0
                                            ? 'bg-white hover:bg-slate-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
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
                    <div className="flex overflow-x-auto gap-8 border-b border-slate-800 mb-8 pb-px">
                        {['overview', 'specs', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === tab ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                            </button>
                        ))}
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap px-2 ${activeTab === 'questions' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Q&A
                            {activeTab === 'questions' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                        </button>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 min-h-[300px]">
                        {activeTab === 'overview' && (
                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-xl font-bold text-white mb-4">Product Overview</h3>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    {product.description || "The ultimate device for power users. Featuring a stunning display, all-day battery life, and a pro-grade camera system. Each unit is rigorously tested and certified by our technicians to ensure 100% functionality."}
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['Professional Inspection', 'New Battery Installed', 'Original Accessories', 'Sanitized & Cleaned'].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Check className="w-3 h-3" /></div>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activeTab === 'specs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Performance</h3>
                                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-slate-500">Processor</span>
                                        <span className="text-slate-200">{product.specs?.cpu}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-slate-500">RAM</span>
                                        <span className="text-slate-200">{product.specs?.ram}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-slate-500">Storage</span>
                                        <span className="text-slate-200">{product.storage}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Display & Battery</h3>
                                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-slate-500">Screen Size</span>
                                        <span className="text-slate-200">{product.specs?.screen}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800/50">
                                        <span className="text-slate-500">Battery Capacity</span>
                                        <span className="text-slate-200">{product.specs?.battery}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review: any) => (
                                            <div key={review._id} className="border-b border-slate-800 pb-6 last:border-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-white">{review.user?.name || 'Anonymous'}</div>
                                                        <span className="text-xs text-slate-500">• {new Date(review.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex text-yellow-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-300">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                                            <Star className="w-8 h-8 text-yellow-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">No Reviews Yet</h3>
                                        <p className="text-slate-400 mb-6">Be the first to share your experience with this product!</p>
                                    </div>
                                )}
                                <div className="mt-8 text-center">
                                    <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">
                                        Write a Review
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="border-t border-slate-900 pt-16">
                        <h2 className="text-2xl font-bold text-white mb-8">You Might Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <div key={related.id} onClick={() => navigate(`/products/${related.id}`)} className="group cursor-pointer bg-slate-900/40 border border-slate-800 rounded-2xl p-4 transition-all hover:-translate-y-2 hover:border-cyan-500/50">
                                    <div className="aspect-[4/5] bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                                        <img src={getImageUrl(related.imageUrl)} alt={related.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="font-bold text-white mb-1 truncate">{related.model}</h4>
                                    <div className="text-cyan-400 font-bold">{related.price}{t.currency}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
