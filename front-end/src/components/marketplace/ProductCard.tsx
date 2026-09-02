import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Signal, Heart, ShoppingCart, Layers, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoneListing } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../utils/imageUrl';
import { cleanProductName, getConditionLabel } from '../../utils/cleanProductName';
import { generateWhatsAppLink } from '../../utils/whatsappHelper';


interface ProductCardProps {
    product: PhoneListing;
    viewMode: 'grid' | 'list';
    isWishlisted: boolean;
    loadingWishlist: boolean;
    onToggleWishlist: (e: React.MouseEvent, product: PhoneListing) => void;
    onAddToCart: (product: PhoneListing) => void;
    onSelect: (product: PhoneListing) => void;
    onQuickView?: (product: PhoneListing) => void;
    whatsappMode?: any;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
    product,
    viewMode,
    isWishlisted,
    loadingWishlist,
    onToggleWishlist,
    onAddToCart,
    onSelect,
    onQuickView,
    whatsappMode
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Known-bad Unsplash IDs from seed data (guitar, hotel, etc.)
    const BAD_IMAGE_IDS = ['photo-1510915361894', 'photo-1558098329', 'photo-1493225457124', 'photo-1588449668365', 'guitar', 'music', 'instrument'];

    // Reliable category-specific images
    const CATEGORY_IMAGES: Record<string, string> = {
        airpods: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600&auto=format&fit=crop',
        audio: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=600&auto=format&fit=crop',
        iphone: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600&auto=format&fit=crop',
        samsung: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop',
        laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop',
    };

    const getProductImage = (p: any) => {
        const brand = (p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const name = (p.model || p.name || '').toLowerCase();

        // PRIORITY 1: Force override for products whose DB images are known-unreliable
        if (name.includes('airpods') || cat.includes('audio') || cat.includes('headphone'))
            return CATEGORY_IMAGES.airpods;

        // PRIORITY 2: Try the DB image
        const raw = p.images?.[0] || p.imageUrl || p.image || '';
        const url = raw ? getImageUrl(raw) : '';

        // PRIORITY 3: Block known-bad images
        const isBad = !url || BAD_IMAGE_IDS.some(id => url.toLowerCase().includes(id));

        if (!isBad) return url;

        // PRIORITY 4: Category-appropriate fallback
        if (brand === 'apple' || name.includes('iphone')) return CATEGORY_IMAGES.iphone;
        if (brand === 'samsung' || name.includes('galaxy')) return CATEGORY_IMAGES.samsung;
        if (name.includes('thinkpad') || name.includes('laptop') || cat.includes('laptop')) return CATEGORY_IMAGES.laptop;
        return '/placeholder-device.svg';
    };

    /** Get the primary spec text (CPU chip, storage, etc.) */
    const getPrimarySpec = (p: any): string => {
        const processorFallback: Record<string, string> = {
            'Galaxy S24 Ultra':   'Snapdragon 8 Gen 3',
            'Galaxy S23':         'Snapdragon 8 Gen 2',
            'iPhone 15 Pro Max':  'Apple A17 Pro',
            'iPhone 15':          'Apple A15 Bionic',
            'Xiaomi 14':          'Dimensity 9300',
            'OnePlus 12':         'Snapdragon 8 Gen 3',
            'ThinkPad X1 Carbon': 'Intel Core i7-1365U',
        };

        let proc = p.specs?.cpu || p.processor;
        if (!proc || proc === 'Standard') {
            const name = p.model || p.name || '';
            const matchingKey = Object.keys(processorFallback).find(k => name.includes(k));
            if (matchingKey) proc = processorFallback[matchingKey];
        }

        if (proc && proc !== 'Standard') return proc;
        if (p.storage) return p.storage;
        if (p.ram) return p.ram;
        return p.brand || '';
    };

    /** Get the secondary spec text (connectivity, storage, etc.) — never hardcode '5G' */
    const getSecondarySpec = (p: any): string => {
        if (p.specs?.connectivity) return p.specs.connectivity;
        if (p.specs?.network) return p.specs.network;
        if (p.storage && p.specs?.cpu) return p.storage; // Show storage if CPU already shown
        const name = (p.model || p.name || '').toLowerCase();
        // Don't show 5G for accessories or laptops
        if (name.includes('airpods') || name.includes('thinkpad') || name.includes('laptop')) return '';
        // Phones without explicit connectivity — still likely 5G
        const brand = (p.brand || '').toLowerCase();
        if (['apple', 'samsung', 'google', 'xiaomi', 'huawei'].includes(brand)) return '5G';
        return '';
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
                        alt={`${cleanProductName(product.model || (product as any).name, product.brand)}${product.color ? ' - ' + product.color : ''}`}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/placeholder-device.svg'; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-xs text-brand-primary font-mono uppercase mb-1">
                                {(product.category as any)?.name || product.category || product.brand || 'Smartphone'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary cursor-pointer" onClick={() => onSelect(product)}>{cleanProductName(product.model || (product as any).name, product.brand)}</h3>
                        </div>
                        <div className="text-right pr-12">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(product.price)}</div>
                             {product.condition && product.condition.trim() !== '' && (
                                <div className={`text-xs font-black uppercase ${product.condition === 'new' ? 'text-emerald-700 dark:text-emerald-400' : 'text-purple-700 dark:text-purple-400'}`}>{getConditionLabel(product.condition)}</div>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex gap-3 mt-auto">
                        {(() => {
                            if (whatsappMode?.enabled && whatsappMode?.phoneNumber) {
                                const url = generateWhatsAppLink({
                                    phoneNumber: whatsappMode.phoneNumber,
                                    messageTemplate: whatsappMode.message,
                                    items: [{ name: product.model || (product as any).name, quantity: 1, price: product.price }],
                                    totalAmount: product.price
                                });
                                return (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-2 font-bold rounded-lg transition-all text-sm flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white"
                                    >
                                        {t('cart.inquiryWhatsapp', 'WhatsApp')}
                                    </a>
                                );
                            }
                            return (
                                <button
                                    disabled={product.stock === 0}
                                    onClick={() => onAddToCart(product)}
                                    className={`px-6 py-2 font-bold rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${product.stock > 0 ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
                                >
                                    {product.stock > 0 ? t('marketplace.addToCart') : t('marketplace.outOfStock')}
                                </button>
                            );
                        })()}
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
                        alt={`${cleanProductName(product.model || (product as any).name, product.brand)}${product.color ? ' - ' + product.color : ''}`}
                        onError={(e: any) => { e.target.onerror = null; e.target.src = '/placeholder-device.svg'; }}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                        {product.condition && product.condition.trim() !== '' && (
                        <span className={`text-[8px] md:text-[10px] font-extrabold px-2 py-0.5 rounded backdrop-blur-md border ${((product.condition as string) === 'new' || (product.condition as string) === 'neu') ? 'bg-emerald-500/10 dark:bg-emerald-500/25 text-emerald-700 dark:text-white border-emerald-500/30 dark:border-emerald-400/50' : 'bg-purple-500/10 dark:bg-purple-500/25 text-purple-700 dark:text-white border-purple-500/30 dark:border-purple-400/50'}`}>
                            {getConditionLabel(product.condition)}
                        </span>
                        )}
                    </div>

                    <div 
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
                        onClick={(e) => {
                            if (onQuickView) {
                                e.stopPropagation();
                                onQuickView(product);
                            }
                        }}
                    >
                        <span className="bg-white/10 border border-white/20 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm backdrop-blur-md flex items-center gap-1.5 md:gap-2">
                            <Layers className="w-3 h-3 md:w-4 md:h-4" /> {t('common.quickView', 'Ansehen')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-3 md:p-5 flex-1 flex flex-col">
                <div className="mb-2 md:mb-4">
                    <div className="text-[9px] md:text-[10px] text-brand-primary font-mono uppercase mb-0.5 md:mb-1 tracking-wider truncate">{product.brand || (product as any).category}</div>
                    <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white hover:text-brand-primary transition-colors cursor-pointer line-clamp-2" onClick={() => onSelect(product)}>{cleanProductName(product.model || (product as any).name, product.brand)}</h3>
                </div>
                <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3 md:mb-6">
                    {getPrimarySpec(product) && (
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                        <Cpu className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                        <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300 truncate">{getPrimarySpec(product)}</span>
                    </div>
                    )}
                    {getSecondarySpec(product) && (
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-md md:rounded-lg p-1.5 md:p-2 border border-slate-200 dark:border-slate-800 flex items-center gap-1 md:gap-2">
                        <Signal className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-500 dark:text-slate-400" />
                        <span className="text-[9px] md:text-xs text-slate-600 dark:text-slate-300">{getSecondarySpec(product)}</span>
                    </div>
                    )}
                </div>
                <div className="mt-auto flex flex-row items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatPrice(product.price)}
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 ml-auto">
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
                        {(() => {
                            if (whatsappMode?.enabled && whatsappMode?.phoneNumber) {
                                const url = generateWhatsAppLink({
                                    phoneNumber: whatsappMode.phoneNumber,
                                    messageTemplate: whatsappMode.message,
                                    items: [{ name: product.model || (product as any).name, quantity: 1, price: product.price }],
                                    totalAmount: product.price
                                });
                                return (
                                    <motion.a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl font-bold transition-all duration-300 group/btn border bg-brand-primary text-black hover:bg-brand-secondary dark:bg-brand-primary dark:text-black dark:border-transparent dark:hover:bg-brand-secondary"
                                    >
                                        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                                    </motion.a>
                                );
                            }
                            return (
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onAddToCart(product)}
                                    disabled={product.stock === 0}
                                    className={`p-2 flex-1 md:flex-none flex justify-center items-center md:p-3 rounded-lg md:rounded-xl font-bold transition-all duration-300 group/btn border disabled:opacity-50 disabled:cursor-not-allowed ${product.stock > 0 ? 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-brand-primary hover:text-white hover:border-brand-primary dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-brand-primary dark:hover:text-black dark:hover:border-brand-primary dark:text-white' : 'bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'}`}
                                >
                                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                                </motion.button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const ProductCard = React.memo(ProductCardComponent);
