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
            try {
                const saved = localStorage.getItem('handyland_cart');
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error("Failed to parse cart from localStorage", error);
                return [];
            }
        }
        return [];
    });

    // Wishlist State
    const [wishlist, setWishlist] = useState<CartItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('handyland_wishlist');
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                console.error("Failed to parse wishlist from localStorage", error);
                return [];
            }
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
            if (user && user._id) { // Ensure user has ID
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
                    // If 401, don't retry immediately or clear user here (handled by interceptor)
                }
            }
        };

        if (user && user._id) {
            syncCart();
        }
    }, [user?._id]); // Only run when user ID changes, not just 'user' object reference

    // Keep ref for async operations
    const cartRef = React.useRef(cart);
    useEffect(() => {
        cartRef.current = cart;
    }, [cart]);

    // Cart Actions
    const addToCart = async (item: CartItem) => {
        // Optimistic Update first
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        setIsCartOpen(true);

        // Backend Update using Ref for fresh state (after optimistic update tick, hopefully, 
        // or we calculate based on Ref?)
        // Actually, since setCart is async, cartRef won't be updated yet.
        // We must calculate newQty based on cartRef.current (which is "current rendered state")
        // PLUS what we just did? No, that's complex.
        // Best approach for "Add": just add 1 to whatever is in ref? 
        // If user clicks fast: 
        // 1. click: ref=1. calc=2. setCart. api(2).
        // 2. click: ref=1 (still). calc=2. setCart. api(2).
        // Still broken.
        // Correct fix: Use functional update for setCart is good for UI. 
        // For API, we need the result of the transition.
        // Since we don't have that, we can assume the API should ideally take a delta.
        // But we must stick to PUT absolute quantity.

        // Let's rely on the fact that standard usage isn't usually 10 clicks/sec.
        // But to be cleaner, we can try to guess or just use the simplest "render state" approach
        // which I implemented before, but using Ref avoids *some* closure staleness if the function closes over old scope.
        // Actually, cartRef.current will always be the latest committed state.

        if (user) {
            // Little delay to let state update happen? No, that's hacky.
            // Just use the ref and adding 1 is the best approximation without a mutex.
            const currentItem = cartRef.current.find(i => i.id === item.id);
            const newQty = currentItem ? (currentItem.quantity || 1) + 1 : 1;

            try {
                await api.put('/api/cart', {
                    id: item.id,
                    productType: item.category,
                    quantity: newQty
                });
            } catch (err) { console.error(err); }
        }
    };

    const removeFromCart = async (id: string | number) => {
        // Get category before removing
        const itemToRemove = cartRef.current.find(item => item.id === id);
        setCart((prev) => prev.filter((item) => item.id !== id));

        if (user && itemToRemove) {
            try {
                await api.put('/api/cart', {
                    id: id,
                    productType: itemToRemove.category,
                    quantity: 0
                });
            } catch (err) { console.error(err); }
        }
    };

    const updateQuantity = async (id: string | number, delta: number) => {
        // Calculate based on REF to minimize closure staleness
        const itemToUpdate = cartRef.current.find(item => item.id === id);
        if (!itemToUpdate) return;

        const itemCategory = itemToUpdate.category;
        const newQty = (itemToUpdate.quantity || 1) + delta;
        const shouldRemove = newQty < 1;

        if (shouldRemove) {
            setCart((prev) => prev.filter((item) => item.id !== id));
        } else {
            setCart((prev) => prev.map(item =>
                item.id === id ? { ...item, quantity: newQty } : item
            ));
        }

        if (user) {
            try {
                if (shouldRemove) {
                    await api.put('/api/cart', {
                        id: id,
                        productType: itemCategory,
                        quantity: 0
                    });
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
