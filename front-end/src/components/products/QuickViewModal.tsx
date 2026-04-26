import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart, Cpu, Battery, Smartphone, Shield, Star, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PhoneListing } from '../../types';
import { getImageUrl } from '../../utils/imageUrl';
import { formatPrice } from '../../utils/formatPrice';
import { cleanProductName } from '../../utils/cleanProductName';
import { useSettings } from '../../context/SettingsContext';
import { generateWhatsAppLink } from '../../utils/whatsappHelper';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../hooks/useWishlist';

interface QuickViewModalProps {
    product: PhoneListing | null;
    isOpen: boolean;
    onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { addToCart } = useCart();
    const { addToast } = useToast();
    const { isInWishlist, toggleWishlist, loadingId: wishlistLoadingId } = useWishlist();

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !product || !mounted) return null;

    const images = product.images?.length ? product.images : (product.imageUrl ? [product.imageUrl] : ((product as any).image ? [(product as any).image] : []));
    const activeImage = images[activeImageIndex] || '/placeholder-device.svg';
    const isWishlisted = isInWishlist(product.id || (product as any)._id);

    const handleAction = () => {
        const whatsappMode = settings?.features?.whatsappOrders;
        if (whatsappMode?.enabled && whatsappMode?.phoneNumber) {
            const url = generateWhatsAppLink({
                phoneNumber: whatsappMode.phoneNumber,
                messageTemplate: whatsappMode.message,
                items: [{ name: product.model, quantity: 1, price: product.price }],
                totalAmount: product.price
            });
            window.open(url, '_blank');
            onClose();
            return;
        }

        addToCart({
            id: product.id || (product as any)._id,
            title: cleanProductName(product.model, product.brand),
            subtitle: `${product.storage} • ${product.color}`,
            price: product.price,
            image: activeImage,
            category: 'device',
            quantity: 1,
            stock: product.stock ?? 0
        });
        addToast(`1x ${product.model} ${t('cart.added', 'added to cart')}`, 'success');
        onClose();
    };

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-0 md:p-4 pb-0 md:pb-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 50 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
                >
                    <button
                        onClick={onClose}
                        title={t('common.close', 'Close')}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-slate-900 dark:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Image Section */}
                    <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950 p-4 md:p-6 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                        <div className="relative w-full h-64 sm:h-80 md:h-auto md:aspect-square md:max-h-[450px] mb-4 bg-white dark:bg-slate-900 rounded-2xl shadow-inner flex items-center justify-center p-2 md:p-4">
                            <img
                                src={getImageUrl(activeImage)}
                                alt={product.model}
                                className="w-full h-full object-contain drop-shadow-xl"
                                onError={(e: any) => { e.target.onerror = null; e.target.src = '/placeholder-device.svg'; }}
                            />
                            {product.condition && (
                                <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                    {product.condition}
                                </div>
                            )}
                        </div>
                        
                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-2 max-w-full hide-scrollbar">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        title={`View image ${idx + 1}`}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${activeImageIndex === idx ? 'border-brand-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col overflow-y-visible md:overflow-y-auto">
                        <div className="text-xs text-brand-primary font-mono uppercase tracking-widest mb-2">
                            {product.brand || 'Smartphone'}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                            {cleanProductName(product.model, product.brand)}
                        </h2>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold text-sm">{product.rating || '5.0'}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <span className="text-slate-500 dark:text-slate-400 text-sm">
                                {product.storage} • {product.color}
                            </span>
                        </div>

                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-6">
                            {formatPrice(product.price)}
                        </div>

                        {/* Quick Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-slate-400" />
                                <div className="text-xs">
                                    <div className="text-slate-500 dark:text-slate-400">{t('product.processor', 'Processor')}</div>
                                    <div className="font-bold text-slate-900 dark:text-slate-200 truncate">{product.specs?.cpu || 'Standard'}</div>
                                </div>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-3">
                                <Battery className="w-5 h-5 text-slate-400" />
                                <div className="text-xs">
                                    <div className="text-slate-500 dark:text-slate-400">{t('product.battery', 'Battery')}</div>
                                    <div className="font-bold text-slate-900 dark:text-slate-200 truncate">{product.specs?.battery || 'Good'}</div>
                                </div>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-3">
                                <Shield className="w-5 h-5 text-slate-400" />
                                <div className="text-xs">
                                    <div className="text-slate-500 dark:text-slate-400">{t('product.warranty', 'Warranty')}</div>
                                    <div className="font-bold text-slate-900 dark:text-slate-200">12 {t('product.months', 'Months')}</div>
                                </div>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-slate-400" />
                                <div className="text-xs">
                                    <div className="text-slate-500 dark:text-slate-400">{t('product.condition', 'Condition')}</div>
                                    <div className="font-bold text-slate-900 dark:text-slate-200">{product.condition}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className={`text-sm font-medium text-center ${(product.stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {(product.stock || 0) > 0 ? t('product.inStock', 'In Stock') : t('product.outOfStock', 'Out of Stock')}
                            </div>
                            
                            <button
                                onClick={handleAction}
                                disabled={!settings?.features?.whatsappOrders?.enabled && (!product.stock || product.stock <= 0)}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 
                                    ${(product.stock || 0) > 0 || settings?.features?.whatsappOrders?.enabled
                                        ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 shadow-xl'
                                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'}`}
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {settings?.features?.whatsappOrders?.enabled 
                                    ? t('product.reserveWhatsapp', 'احجز عبر الواتساب') 
                                    : (((product.stock || 0) > 0) ? t('product.addToCart', 'Add to Cart') : t('product.outOfStock', 'Out of Stock'))}
                            </button>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate(`/products/${product.id || (product as any)._id}`);
                                    }}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('common.viewDetails', 'View Full Details')}
                                </button>
                                <button
                                    onClick={(e) => toggleWishlist({
                                        id: product.id || (product as any)._id,
                                        title: cleanProductName(product.model, product.brand),
                                        price: product.price,
                                        image: activeImage,
                                        category: 'device',
                                        quantity: 1,
                                        stock: product.stock
                                    })}
                                    disabled={wishlistLoadingId === String(product.id || (product as any)._id)}
                                    title={isWishlisted ? t('common.removeFromWishlist', 'Remove from Wishlist') : t('common.addToWishlist', 'Add to Wishlist')}
                                    className={`p-3 rounded-xl border transition-all disabled:opacity-50 ${isWishlisted ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'}`}
                                >
                                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
