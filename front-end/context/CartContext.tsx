import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';

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

    // Persistence
    useEffect(() => {
        localStorage.setItem('handyland_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('handyland_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    // Cart Actions
    const addToCart = (item: CartItem) => {
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
    };

    const removeFromCart = (id: string | number) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id: string | number, delta: number) => {
        setCart((prev) => prev.map((item) => {
            if (item.id === id) {
                const newQuantity = (item.quantity || 1) + delta;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

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
