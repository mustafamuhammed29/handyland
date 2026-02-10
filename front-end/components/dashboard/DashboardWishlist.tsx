import React from 'react';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { PhoneListing } from '../../types';

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
            category: 'phone',
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
                    <h2 className="text-2xl font-bold text-white">My Wishlist</h2>
                    <p className="text-slate-400 text-sm">{wishlistItems.length} items saved</p>
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
                                    src={item.images[0]}
                                    alt={item.model}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <button
                                onClick={() => onRemove(item.id)}
                                className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-white mb-1">{item.model}</h3>
                            <p className="text-sm text-slate-400 mb-3">{item.brand} • {item.storage}</p>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl font-bold text-white">€{item.price}</span>
                                {item.stock > 0 ? (
                                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                                        Out of Stock
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
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => navigate(`/product/${item.id}`)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {wishlistItems.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-slate-500">
                        <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Your wishlist is empty</p>
                        <p className="text-sm mb-4">Browse the marketplace and save your favorite items</p>
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
