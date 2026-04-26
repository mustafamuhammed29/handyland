import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RecentlyViewedProduct } from '../../hooks/useRecentlyViewed';
import { getImageUrl } from '../../utils/imageUrl';

interface RecentlyViewedProps {
    products: RecentlyViewedProduct[];
    currentProductId?: string;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ products, currentProductId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Filter out the current product from the list so we don't show the one we're currently looking at
    const displayProducts = products.filter(p => p.id !== currentProductId);

    if (displayProducts.length === 0) return null;

    return (
        <div className="border-t border-slate-200 dark:border-slate-900 pt-16 mt-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                {t('product.recentlyViewed', 'Zuletzt angesehen')}
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x hide-scrollbar">
                {displayProducts.map((product) => (
                    <div 
                        key={product.id} 
                        onClick={() => navigate(`/products/${product.id}`)} 
                        className="group cursor-pointer bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all hover:-translate-y-2 hover:border-brand-primary/50 min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] snap-start shrink-0 flex flex-col"
                    >
                        <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                            <img 
                                src={getImageUrl(product.imageUrl)} 
                                alt={product.model} 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                                onError={(e: any) => { e.target.onerror = null; e.target.src = '/placeholder-device.svg'; }}
                            />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate" title={product.model}>{product.model}</h4>
                        <div className="text-sm text-slate-500 mb-2 truncate">{product.condition} • {product.brand}</div>
                        <div className="text-brand-primary font-bold mt-auto">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(product.price)}
                        </div>
                    </div>
                ))}
            </div>
            
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
