import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageUrl';
import { SkeletonProductCard } from './SkeletonProductCard';

interface FeaturedProductsProps {
    type?: 'marketplace' | 'accessories';
    title: string;
    seeAllLabel: string;
    seeAllRoute: string;
    apiEndpoint: string;
    isComingSoon?: boolean;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
    type = 'marketplace',
    title,
    seeAllLabel,
    seeAllRoute,
    apiEndpoint,
    isComingSoon = false,
}) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const language = (i18n.language || 'de').split('-')[0];
    const isRtl = language === 'ar' || language === 'fa';
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    const { addToCart } = useCart();
    const { addToast } = useToast();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api.get<any>(apiEndpoint)
            .then((data: any) => {
                if (cancelled) return;
                let raw: any[] = [];
                if (Array.isArray(data)) raw = data;
                else if (Array.isArray(data?.products)) raw = data.products;
                else if (Array.isArray(data?.accessories)) raw = data.accessories;
                else if (Array.isArray(data?.data)) raw = data.data;
                // Deduplicate by name and take first 4
                const seen = new Set<string>();
                const unique = raw.filter(p => {
                    const key = (p.name || p.title || '').toLowerCase().trim();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setItems(unique.slice(0, 4));
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [apiEndpoint]);

    const handleAddToCart = (item: any) => {
        const name = item.name || item.title || 'Product';
        const imageUrl = getImageUrl(item.image || item.images?.[0]);
        addToCart({
            id: item._id || item.id,
            title: name,
            subtitle: item.category || item.brand || '',
            price: item.price,
            image: imageUrl,
            category: (type === 'marketplace' ? 'device' : 'accessory') as 'device' | 'accessory',
            stock: item.stock ?? 1,
        });
        addToast(`${name} ${t('cart.added', 'wurde hinzugefügt!')}`, 'success');
    };

    return (
        <section dir={isRtl ? 'rtl' : 'ltr'} className="py-12 md:py-16 bg-slate-50 dark:bg-slate-950/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        onClick={() => navigate(seeAllRoute)}
                        className="flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors group shrink-0 ml-4 rtl:ml-0 rtl:mr-4 cursor-pointer"
                    >
                        {seeAllLabel}
                        <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {[...Array(4)].map((_, i) => <SkeletonProductCard key={i} />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                        <p className="text-sm">{t('featuredProducts.noProducts', 'Keine Produkte verfügbar')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                        {items.map((item) => {
                            const name = item.name || item.title || '';
                            const price = item.price;
                            const imageUrl = getImageUrl(item.image || item.images?.[0]);
                            const rating = item.rating || item.averageRating;
                            const detailRoute = type === 'marketplace'
                                ? `/marketplace/${item._id || item.id}`
                                : `/accessories/${item._id || item.id}`;
                            return (
                                <div
                                    key={item._id || item.id}
                                    className="group bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-primary/40 transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden"
                                >
                                    {/* Image */}
                                    <div
                                        className="relative h-36 sm:h-44 md:h-52 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                                        onClick={() => navigate(detailRoute)}
                                    >
                                        <img
                                            src={imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'}
                                            alt={name}
                                            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'; }}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 md:p-4 flex flex-col flex-1 gap-2">
                                        <h3
                                            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white line-clamp-2 cursor-pointer hover:text-brand-primary transition-colors leading-snug"
                                            onClick={() => navigate(detailRoute)}
                                        >
                                            {name}
                                        </h3>

                                        {rating && (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">{Number(rating).toFixed(1)}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-auto pt-1 gap-2">
                                            <span className="text-sm md:text-base font-black text-brand-primary">
                                                {price != null ? `€${Number(price).toFixed(2)}` : '—'}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isComingSoon ? navigate(detailRoute) : handleAddToCart(item);
                                                }}
                                                disabled={item.stock === 0 && !isComingSoon}
                                                aria-label={isComingSoon ? t('featuredProducts.comingSoon', 'Bald verfügbar') : `${name} ${t('featuredProducts.addToCart', 'in den Warenkorb')}`}
                                                className="flex items-center justify-center gap-1 px-2 py-1.5 md:px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-primary text-slate-600 dark:text-slate-300 hover:text-black transition-all text-[10px] md:text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed min-w-[36px] min-h-[36px] cursor-pointer"
                                            >
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">
                                                    {isComingSoon ? t('featuredProducts.comingSoon', 'Bald verfügbar') : (item.stock === 0 ? t('accessories.out', 'Ausverkauft') : t('cart.add', 'Kaufen'))}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* See All Button (mobile-friendly) */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(seeAllRoute)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-sm hover:border-brand-primary/50 hover:text-brand-primary transition-all hover:shadow-md cursor-pointer"
                    >
                        {seeAllLabel}
                        <ArrowIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};
