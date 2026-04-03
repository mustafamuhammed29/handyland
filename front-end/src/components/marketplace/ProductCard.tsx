import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Signal, Heart, ShoppingCart, Layers, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoneListing } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../utils/imageUrl';

interface ProductCardProps {
    product: PhoneListing;
    viewMode: 'grid' | 'list';
    isWishlisted: boolean;
    loadingWishlist: boolean;
    onToggleWishlist: (e: React.MouseEvent, product: PhoneListing) => void;
    onAddToCart: (product: PhoneListing) => void;
    onSelect: (product: PhoneListing) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
    product,
    viewMode,
    isWishlisted,
    loadingWishlist,
    onToggleWishlist,
    onAddToCart,
    onSelect
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getProductImage = (p: any) => {
        if (p.images && p.images.length > 0) return getImageUrl(p.images[0]);
        if (p.imageUrl) return getImageUrl(p.imageUrl);
        return '/images/placeholder.png';
    };

    if (viewMode === 'list') {
        return (
            <motion.div
                variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0, transition: { type: "spring" } }
                }}
                className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-6 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group relative"
            >
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => onSelect(product)}>
                    <img
                        src={getProductImage(product)}
                        alt={product.model}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-xs text-brand-primary font-mono uppercase mb-1">
                                {(product.category as any)?.name || product.category || product.brand || 'Smartphone'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary cursor-pointer" onClick={() => onSelect(product)}>{product.model || (product as any).name}</h3>
                        </div>
                        <div className="text-right pr-12">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(product.price)}</div>
                            <div className={`text-xs font-bold uppercase ${product.condition === 'new' ? 'text-emerald-400' : 'text-purple-400'}`}>{(product.condition || 'Used').toUpperCase()}</div>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex gap-3 mt-auto">
                        <button
                            disabled={product.stock === 0}
                            onClick={() => onAddToCart(product)}
                            className={`px-6 py-2 font-bold rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${product.stock > 0 ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                        >
                            {product.stock > 0 ? t('marketplace.addToCart') : t('marketplace.outOfStock')}
                        </button>
                        <button
                            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            disabled={loadingWishlist}
                            onClick={(e) => onToggleWishlist(e, product)}
                            className={`px-4 py-2 border rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait ${isWishlisted ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:bg-red-500/20 dark:border-red-500/50 dark:text-red-500' : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'}`}
                        >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                        </button>
                        <button
                            title={t('compare.addDevice', 'Add to compare')}
                            onClick={(e) => { e.stopPropagation(); navigate(`/compare?devices=${(product as any)._id || product.id}`); }}
                            className="px-4 py-2 border rounded-lg transition-all text-sm flex items-center gap-2 border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
                        >
                            <BarChart2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onSelect(product)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white font-bold rounded-lg transition-all text-sm">
                            {t('common.learnMore')}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
            }}
            whileHover={{ y: -5, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
            className="spotlight-card rounded-2xl md:rounded-3xl h-full flex flex-col border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md group shadow-sm hover:shadow-xl dark:hover:shadow-brand-primary/10 transition-shadow duration-300"
        >
            <div className="spotlight-border"></div>
            <div className="relative p-1">
                <div className="relative h-40 md:h-60 overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-950 cursor-pointer border border-slate-200/50 dark:border-slate-800/50" onClick={() => onSelect(product)}>
                    <motion.img
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        src={getProductImage(product)}
                        alt={product.model || (product as any).name || 'Product'}
                        onError={(e: any) => { e.target.src = '/placeholder-device.svg'; }}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                        <span className={`text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md border ${product.condition === 'new' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                            {(product.condition || t('marketplace.condition.used')).toUpperCase()}
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
                    <div className="text-[9px] md:text-[10px] text-brand-primary font-mono uppercase mb-0.5 md:mb-1 tracking-wider truncate">{product.brand || (product as any).category}</div>
                    <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary transition-colors cursor-pointer line-clamp-2" onClick={() => onSelect(product)}>{product.model || (product as any).name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3 md:mb-6">
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                        <Cpu className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                        <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300 truncate">{product.specs?.cpu}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                        <Signal className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                        <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300">5G</span>
                    </div>
                </div>
                <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                    <div className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-0">{formatPrice(product.price)}</div>
                    <div className="flex items-center gap-1.5 md:gap-2 w-full md:w-auto">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => onToggleWishlist(e, product)}
                            disabled={loadingWishlist}
                            className={`p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-wait ${isWishlisted ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/30 hover:bg-red-500/20 dark:hover:bg-red-500/30' : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white dark:hover:bg-slate-700'}`}
                        >
                            <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${isWishlisted ? 'fill-current' : ''}`} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            title={t('compare.addDevice', 'Add to compare')}
                            onClick={(e) => { e.stopPropagation(); navigate(`/compare?devices=${(product as any)._id || product.id}`); }}
                            className="p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl transition-all duration-300 group/btn border bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white dark:hover:bg-slate-700"
                        >
                            <BarChart2 className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock === 0}
                            className={`p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl font-bold transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-not-allowed ${product.stock > 0 ? 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-brand-primary hover:text-white hover:border-brand-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-brand-primary dark:hover:text-black dark:hover:border-brand-primary dark:text-white' : 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'}`}
                        >
                            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);
