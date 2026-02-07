import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Cpu, Battery, Smartphone, Shield, Truck, Star } from 'lucide-react';
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
    const [product, setProduct] = useState<PhoneListing & { specs: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const t = translations[lang];

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) throw new Error('Product not found');
                const data = await response.json();

                const formatted = {
                    ...data,
                    model: data.name || data.model,
                    specs: {
                        cpu: data.processor || data.specs?.cpu || 'Standard Chip',
                        battery: data.battery || data.specs?.battery || 'Standard Battery',
                        screen: data.display || data.specs?.screen || 'HD Display'
                    },
                    imageUrl: data.image || data.imageUrl || ''
                };
                setProduct(formatted);
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
        const imageUrl = product.images?.[0] || product.imageUrl || '';
        addToCart({
            id: product.id,
            title: product.model,
            subtitle: `${product.storage} • ${product.color}`,
            price: product.price,
            image: imageUrl,
            category: 'device'
        });
        addToast(`${product.model} added to cart`, 'success');
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `http://127.0.0.1:5000${url}`;
    };

    const getProductImage = (product: any) => {
        if (product.images && product.images.length > 0) return getImageUrl(product.images[0]);
        if (product.imageUrl) return getImageUrl(product.imageUrl);
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
    };

    if (loading) return <div className="min-h-screen pt-32 text-center text-white">Loading...</div>;
    if (!product) return null;

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Marketplace
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
                        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8">
                            <img
                                src={getProductImage(product)}
                                alt={product.model}
                                loading="lazy"
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {/* Thumbnails placeholder */}
                            {[getProductImage(product)].map((img, idx) => (
                                <div key={idx} className="bg-slate-900 rounded-xl border border-slate-800 p-2 cursor-pointer hover:border-cyan-500 transition-all">
                                    <img src={img} alt="Thumbnail" loading="lazy" className="w-full h-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${product.condition === 'new' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                                    {product.condition} Condition
                                </span>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-slate-500 text-sm ml-2">(42 reviews)</span>
                                </div>
                            </div>
                            <h1 className="text-5xl font-black text-white mb-4">{product.model}</h1>
                            <div className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold">
                                {product.price}{t.currency}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <Cpu className="w-6 h-6 text-cyan-400 mb-2" />
                                <div className="text-sm text-slate-400">Processor</div>
                                <div className="font-bold text-white">{product.specs.cpu}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <Battery className="w-6 h-6 text-green-400 mb-2" />
                                <div className="text-sm text-slate-400">Battery</div>
                                <div className="font-bold text-white">{product.specs.battery}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <Smartphone className="w-6 h-6 text-purple-400 mb-2" />
                                <div className="text-sm text-slate-400">Display</div>
                                <div className="font-bold text-white">{product.specs.screen}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <Shield className="w-6 h-6 text-orange-400 mb-2" />
                                <div className="text-sm text-slate-400">Warranty</div>
                                <div className="font-bold text-white">12 Months</div>
                            </div>
                        </div>

                        <p className="text-slate-300 leading-relaxed text-lg">
                            {product.description || "Experience premium performance with this rigorously tested device. Each unit undergoes a 40-point inspection process to ensure flawless operation. Comes with original accessories and packaging."}
                        </p>

                        <div className="space-y-4 pt-8 border-t border-slate-800">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                                </button>
                                <button className="px-6 border border-slate-700 hover:border-cyan-500 rounded-xl text-slate-400 hover:text-white transition-all">
                                    ❤️
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                <Truck className="w-4 h-4" /> Free Express Shipping • 30-Day Money Back Guarantee
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
