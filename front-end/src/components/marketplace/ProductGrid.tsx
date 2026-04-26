import React from 'react';
import { motion } from 'framer-motion';
import { PhoneListing } from '../../types';
import { ProductCard } from './ProductCard';
import { SkeletonProductCard } from '../SkeletonProductCard';
import { Search } from 'lucide-react';

interface ProductGridProps {
    products: PhoneListing[];
    loading: boolean;
    viewMode: 'grid' | 'list';
    itemsPerPage: number;
    wishlist: string[];
    loadingWishlistId: string | null;
    onToggleWishlist: (e: React.MouseEvent, product: PhoneListing) => void;
    onAddToCart: (product: PhoneListing) => void;
    onSelect: (product: PhoneListing) => void;
    onQuickView: (product: PhoneListing) => void;
    onClearFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
    products,
    loading,
    viewMode,
    itemsPerPage,
    wishlist,
    loadingWishlistId,
    onToggleWishlist,
    onAddToCart,
    onSelect,
    onQuickView,
    onClearFilters
}) => {
    if (loading) {
        return (
            <div className={`grid gap-3 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(itemsPerPage)].map((_, i) => (
                    <div key={i} className={viewMode === 'list' ? 'h-48' : 'h-72 md:h-96'}>
                        <SkeletonProductCard />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/5 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800"
            >
                <div className="w-32 h-32 mb-6 relative">
                    <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl"></div>
                    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No products found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
                    We couldn't find any products matching your current filters.
                </p>
                <button
                    onClick={onClearFilters}
                    className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:scale-105"
                >
                    Clear all filters
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                }
            }}
            className={`grid gap-3 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
        >
            {products.map((phone) => (
                <ProductCard
                    key={phone.id}
                    product={phone}
                    viewMode={viewMode}
                    isWishlisted={wishlist.includes(String(phone.id))}
                    loadingWishlist={loadingWishlistId === String(phone.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onSelect={onSelect}
                    onQuickView={onQuickView}
                />
            ))}
        </motion.div>
    );
};
