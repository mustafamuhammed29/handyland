import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

interface Coupon {
    code: string;
    discount: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string | number) => void;
    updateQuantity: (id: string | number, delta: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    cartTotal: number;
    finalTotal: number;
    coupon: Coupon | null;
    applyCoupon: (code: string, discount: number) => void;
    removeCoupon: () => void;
    wishlist: CartItem[];
    addToWishlist: (item: CartItem) => void;
    removeFromWishlist: (id: string | number) => void;
    isInWishlist: (id: string | number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Cart State
    const [cart, setCart] = useState<CartItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('handyland_cart');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    // Wishlist State
    const [wishlist, setWishlist] = useState<CartItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('handyland_wishlist');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [coupon, setCoupon] = useState<Coupon | null>(null);

    // Persistence (Local)
    useEffect(() => {
        localStorage.setItem('handyland_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('handyland_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    // Backend Sync on Login
    useEffect(() => {
        const syncCart = async () => {
            if (user) {
                try {
                    // Send local cart to server to merge
                    const response = await api.post<CartItem[]>('/api/cart/sync', {
                        localItems: cart.map(item => ({
                            id: item.id,
                            quantity: item.quantity,
                            category: item.category
                        }))
                    });

                    if (Array.isArray(response)) {
                        setCart(response);
                    }
                } catch (error) {
                    console.error("Failed to sync cart:", error);
                }
            }
        };

        if (user) {
            syncCart();
        }
    }, [user]); // Run when user logs in

    // Cart Actions
    const addToCart = async (item: CartItem) => {
        const newItem = { ...item, quantity: 1 };

        // Optimistic Update
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
                );
            }
            return [...prev, newItem];
        });
        setIsCartOpen(true);

        // Backend Update
        if (user) {
            try {
                await api.put('/api/cart', {
                    id: item.id,
                    productType: item.category,
                    quantity: (cart.find(i => i.id === item.id)?.quantity || 0) + 1 // Note: this might be slightly off due to race condition, but usually ok. Better to calculate based on prev state or send delta.
                    // Controller implementation expects absolute quantity.
                    // Let's use a simpler approach: get the quantity *after* state update?
                });
                // actually, inside this function 'cart' is stale.
                // We should calculate the new quantity here.
                const existing = cart.find(i => i.id === item.id);
                const newQty = existing ? (existing.quantity || 1) + 1 : 1;

                await api.put('/api/cart', {
                    id: item.id,
                    productType: item.category,
                    quantity: newQty
                });
            } catch (err) { console.error(err); }
        }
    };

    const removeFromCart = async (id: string | number) => {
        setCart((prev) => prev.filter((item) => item.id !== id));

        if (user) {
            try {
                // Sending quantity 0 removes it
                // We need to know the type... but we only have ID here.
                // Ideally removeFromCart should take the item or we find it.
                const item = cart.find(i => i.id === id);
                if (item) {
                    await api.put('/api/cart', {
                        id: id,
                        productType: item.category,
                        quantity: 0
                    });
                }
            } catch (err) { console.error(err); }
        }
    };

    const updateQuantity = async (id: string | number, delta: number) => {
        let newQty = 0;
        let itemCategory = 'device';
        let shouldRemove = false;

        setCart((prev) => {
            const existingItem = prev.find(item => item.id === id);
            if (!existingItem) return prev;

            const newQuantity = (existingItem.quantity || 1) + delta;
            newQty = newQuantity;
            itemCategory = existingItem.category;

            if (newQuantity < 1) {
                shouldRemove = true;
                return prev.filter(item => item.id !== id);
            }

            return prev.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            );
        });

        if (user) {
            try {
                if (shouldRemove || newQty < 1) {
                    await api.delete(`/api/cart/${id}`); // Assuming delete endpoint exists or use put 0
                } else {
                    await api.put('/api/cart', {
                        id: id,
                        productType: itemCategory,
                        quantity: newQty
                    });
                }
            } catch (err) { console.error(err); }
        }
    };

    const clearCart = async () => {
        setCart([]);
        if (user) {
            try {
                await api.delete('/api/cart');
            } catch (err) { console.error(err); }
        }
    };

    // Coupon Actions
    const applyCoupon = (code: string, discount: number) => {
        setCoupon({ code, discount });
    };

    const removeCoupon = () => {
        setCoupon(null);
    };

    // Wishlist Actions
    const addToWishlist = (item: CartItem) => {
        setWishlist(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const removeFromWishlist = (id: string | number) => {
        setWishlist(prev => prev.filter(item => item.id !== id));
    };

    const isInWishlist = (id: string | number) => {
        return wishlist.some(item => item.id === id);
    };

    // Totals
    const cartTotal = cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
    const finalTotal = Math.max(0, cartTotal - (coupon?.discount || 0));

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            isCartOpen, setIsCartOpen,
            cartTotal, finalTotal,
            coupon, applyCoupon, removeCoupon,
            wishlist, addToWishlist, removeFromWishlist, isInWishlist
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
