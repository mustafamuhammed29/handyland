import React from 'react';
import { X, Cpu, Plus, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PhoneListing } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../utils/imageUrl';

interface ProductDetailModalProps {
    product: PhoneListing | null;
    onClose: () => void;
    onAddToCart: (product: PhoneListing) => void;
    onBuyNow: (product: PhoneListing) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
    product,
    onClose,
    onAddToCart,
    onBuyNow
}) => {
    const { t } = useTranslation();

    if (!product) return null;

    const getProductImage = (p: any) => {
        if (p.images && p.images.length > 0) return getImageUrl(p.images[0]);
        if (p.imageUrl) return getImageUrl(p.imageUrl);
        return '/images/placeholder.png';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-7xl max-h-[90vh] bg-white dark:bg-slate-900 border-4 border-blue-500/10 dark:border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                
                <button
                    onClick={onClose}
                    title="Close"
                    className="absolute top-4 right-4 z-50 p-2 bg-black/10 dark:bg-black/50 hover:bg-black/20 dark:hover:bg-white/10 rounded-full text-slate-800 dark:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-full md:w-1/2 relative bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-black p-8 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 tech-grid opacity-30"></div>
                    <img
                        src={getProductImage(product)}
                        alt={product.model}
                        onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                        className="relative z-10 w-3/4 max-w-sm drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-2">
                        <div className="bg-white/80 dark:bg-black/60 backdrop-blur border border-black/10 dark:border-white/10 p-3 rounded-xl">
                            <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                            <div className="text-[10px] text-slate-400 uppercase">Processor</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{product.specs?.cpu}</div>
                        </div>
                        <div className="bg-white/80 dark:bg-black/60 backdrop-blur border border-black/10 dark:border-white/10 p-3 rounded-xl">
                            <Layers className="w-4 h-4 text-cyan-400 mb-1" />
                            <div className="text-[10px] text-slate-400 uppercase">Display</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{product.specs?.screen}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${product.condition === 'new' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}`}>
                            {product.condition}
                        </span>
                    </div>

                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{product.model}</h2>
                    <div className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-brand-secondary font-bold mb-6">
                        {formatPrice(product.price)}
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-8 border-l-2 border-slate-800 pl-4">
                        {product.description || "Professional grade device, fully tested by our technicians. Includes 12-month warranty and free tech support."}
                    </p>

                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                            <span className="text-slate-500 text-sm">Status</span>
                            {product.stock > 0 ? (
                                <span className="text-emerald-500 dark:text-emerald-400 font-bold">{product.stock} In Stock</span>
                            ) : (
                                <span className="text-red-500 font-bold">Out of Stock</span>
                            )}
                        </div>
                        <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                            <span className="text-slate-500 text-sm">Color</span>
                            <span className="text-slate-900 dark:text-white font-medium">{product.color}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-black/10 dark:border-slate-800/50">
                            <span className="text-slate-500 text-sm">Storage</span>
                            <span className="text-slate-900 dark:text-white font-medium">{product.storage}</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock === 0}
                            className={`flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${product.stock > 0 ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                        >
                            <Plus className="w-5 h-5" /> {product.stock > 0 ? t('marketplace.addToCart') : t('marketplace.outOfStock')}
                        </button>
                        <button
                            onClick={() => onBuyNow(product)}
                            disabled={product.stock === 0}
                            className={`flex-1 border font-bold py-4 rounded-xl transition-all ${product.stock > 0 ? 'border-slate-300 hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed'}`}
                        >
                            {t('marketplace.buyNow')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
