import React from 'react';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { PhoneListing } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../utils/imageUrl';
import { useTranslation } from 'react-i18next';

interface DashboardWishlistProps {
    wishlistItems: PhoneListing[];
    isLoading: boolean;
    onRemove: (itemId: string) => void;
}

export const DashboardWishlist: React.FC<DashboardWishlistProps> = ({
    wishlistItems,
    isLoading,
    onRemove
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const handleAddToCart = (item: PhoneListing) => {
        // Convert PhoneListing to CartItem format
        const cartItem: any = {
            id: item.id,
            title: item.model,
            subtitle: item.brand,
            image: item.images?.[0] || item.imageUrl,
            price: item.price,
            category: 'device',
            quantity: 1
        };
        addToCart(cartItem);
    };

    if (isLoading) {
        return (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-slate-800/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t('wishlist.title', 'Mein Wunschzettel')}</h2>
                    <p className="text-slate-400 text-sm">{t('wishlist.saved', { count: wishlistItems.length })}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {wishlistItems.map(item => (
                    <div
                        key={item.id}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group"
                    >
                        <div className="relative">
                            {item.images && item.images.length > 0 && (
                                <img
                                    src={getImageUrl(item.images[0])}
                                    alt={item.model}
                                    className="w-full h-48 object-cover"
                                    onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/placeholder-phone.png'; }}
                                />
                            )}
                            <button
                                onClick={() => onRemove(item.id)}
                                aria-label={t('wishlist.actions.remove', 'Remove item from wishlist')}
                                title={t('wishlist.actions.remove', 'Remove from wishlist')}
                                className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-white mb-1">{item.model}</h3>
                            <p className="text-sm text-slate-400 mb-3">
                                {item.brand}
                                {item.storage ? ` • ${item.storage}` : ''}
                            </p>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xl font-bold text-white">{formatPrice(item.price)}</span>
                                {item.stock > 0 ? (
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                        {t('wishlist.in_stock', 'Auf Lager')}
                                    </span>
                                ) : (
                                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                        {t('common.outOfStock', 'Out of Stock')}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddToCart(item)}
                                    disabled={item.stock === 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {t('wishlist.add_to_cart', 'In den Warenkorb')}
                                </button>
                                <button
                                    onClick={() => navigate(`/product/${item.id}`)}
                                    aria-label={t('wishlist.actions.view', 'View product details')}
                                    title={t('wishlist.actions.view', 'View product')}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {wishlistItems.length === 0 && (
                    <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-16">
                        <div className="w-32 h-32 mb-6 relative">
                            <div className="absolute inset-0 bg-pink-500/10 rounded-full blur-2xl"></div>
                            <div className="relative w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg border border-slate-100 dark:border-slate-800">
                                <span className="flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                                </span>
                            </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t('wishlist.empty.title', 'Your wishlist is empty')}</h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[280px] leading-relaxed">
                            {t('wishlist.empty.subtitle', "Save items you love and keep track of price drops. Let's find your next favorite device!")}
                        </p>
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 active:scale-95 overflow-hidden"
                        >
                            <span className="relative z-10">{t('wishlist.empty.cta', 'Browse Marketplace')}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
