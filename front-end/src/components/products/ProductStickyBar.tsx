import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageUrl';
import { formatPrice } from '../../utils/formatPrice';

interface ProductStickyBarProps {
    product: any;
    handleAddToCart: () => void;
}

export const ProductStickyBar: React.FC<ProductStickyBarProps> = ({ product, handleAddToCart }) => {
    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 md:top-0 md:bottom-auto left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t md:border-t-0 md:border-b border-slate-200 dark:border-slate-800 p-4 z-40 transform translate-y-full md:-translate-y-full transition-transform duration-300"
                    style={{
                        transform: `translateY(${window.scrollY > 600 ? '0' : (window.innerWidth < 768 ? '100%' : '-100%')})`
                    }}
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <img src={getImageUrl(product.imageUrl || product.images?.[0])} alt={product.model} className="w-12 h-12 object-cover rounded-md hidden sm:block bg-slate-100 dark:bg-slate-900" />
                            <div>
                                <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white line-clamp-1">{product.model}</div>
                                <div className="text-xs text-brand-primary font-bold">{formatPrice(product.price)}</div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className={`px-6 md:px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap
                                ${product.stock > 0
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                    : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'}`}
                        >
                            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">{product.stock > 0 ? 'In den Warenkorb' : 'Nicht vorrätig'}</span>
                            <span className="sm:hidden">{product.stock > 0 ? 'Kaufen' : 'Aus'}</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
