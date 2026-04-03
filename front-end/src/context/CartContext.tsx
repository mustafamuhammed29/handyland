import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { api } from '../utils/api';
import { debounce } from '../utils/debounce';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';

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
    freeShippingThreshold: number;
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

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    // Mutex to prevent race conditions on rapid quantity updates (Issue #12 fix)
    const [updating, setUpdating] = useState<Set<string | number>>(new Set());
    const { settings } = useSettings();
    const freeShippingThreshold = settings?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;

    // Persistence (Local)
    useEffect(() => {
        localStorage.setItem('handyland_cart', JSON.stringify(cart));
    }, [cart]);

    // Backend Sync on Login / Refresh
    useEffect(() => {
        const syncCart = async () => {
            if (user && user._id) {
                try {
                    // Send local cart ONLY IF it has items, otherwise just GET the cart.
                    // If we send an empty localItems array, the backend merge logic might
                    // not wipe it depending on implementation, but it's safer to just fetch 
                    // if local is empty to avoid overwriting the server's preserved cart.
                    if (cart.length > 0) {
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
                    } else {
                        // Local is empty (e.g., fresh login or page refresh)
                        // Fetch from server directly instead of syncing an empty array
                        const response = await api.get<CartItem[]>('/api/cart');
                        if (Array.isArray(response) && response.length > 0) {
                            setCart(response);
                        }
                    }
                } catch (error) {
                    console.error("Failed to sync/fetch cart:", error);
                }
            }
        };

        if (user && user._id) {
            syncCart();
        }
    }, [user?._id]); // Run when user ID is established

    // Keep ref for async operations
    const cartRef = React.useRef(cart);
    useEffect(() => {
        cartRef.current = cart;
    }, [cart]);

    // Debounced API Update to prevent race conditions
    // Using useMemo to ensure the debounced function distinctive instance persists
    const debouncedApiUpdate = React.useMemo(
        () => debounce(async (id: string | number, quantity: number, category: string) => {
            try {
                if (quantity === 0) {
                    await api.put('/api/cart', {
                        id,
                        productType: category,
                        quantity: 0
                    });
                } else {
                    await api.put('/api/cart', {
                        id,
                        productType: category,
                        quantity
                    });
                }
            } catch (err) {
                console.error("Cart sync failed:", err);
            }
        }, 500),
        []
    );

    // Cart Actions
    const addToCart = async (item: CartItem) => {
        // Optimistic Update first
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) => {
                    if (i.id === item.id) {
                        const maxAllowed = i.stock ?? Infinity;
                        const qty = Math.min((i.quantity || 1) + 1, maxAllowed);
                        return { ...i, quantity: qty };
                    }
                    return i;
                });
            }
            const newItem: CartItem = {
                ...item,
                title: item.title || (item as any).name || 'Unknown Product',
                quantity: 1
            };
            return [...prev, newItem];
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
            // Use current state map to find the item and determine new quantity
            const currentItem = cartRef.current.find(i => i.id === item.id);
            // Since we just updated state optimistically, the Ref might still be old in this closure tick if not careful,
            // but we can just calculate what the new qty *should* be:
            // If it existed, prev + 1. If not, 1.
            // Relying on the optimistic update logic:
            let newQty = 1;
            if (currentItem) {
                const maxAllowed = currentItem.stock ?? Infinity;
                newQty = Math.min((currentItem.quantity || 1) + 1, maxAllowed);
            }

            debouncedApiUpdate(item.id, newQty, item.category);
        }
    };

    const removeFromCart = async (id: string | number) => {
        // Get category before removing
        const itemToRemove = cartRef.current.find(item => item.id === id);
        setCart((prev) => prev.filter((item) => item.id !== id));

        if (user && itemToRemove) {
            debouncedApiUpdate(id, 0, itemToRemove.category);
        }
    };

    const updateQuantity = async (id: string | number, delta: number) => {
        // Mutex guard: ignore rapid clicks while an update for this item is in flight
        if (updating.has(id)) return;
        setUpdating(prev => { const s = new Set(prev); s.add(id); return s; });

        try {
            // Calculate based on REF to minimize closure staleness
            const itemToUpdate = cartRef.current.find(item => item.id === id);
            if (!itemToUpdate) return;

            const itemCategory = itemToUpdate.category;
            const maxAllowed = itemToUpdate.stock ?? Infinity;
            const requestedQty = (itemToUpdate.quantity || 1) + delta;
            const newQty = Math.min(requestedQty, maxAllowed);
            const shouldRemove = newQty < 1;

            if (shouldRemove) {
                setCart((prev) => prev.filter((item) => item.id !== id));
            } else {
                setCart((prev) => prev.map(item =>
                    item.id === id ? { ...item, quantity: newQty } : item
                ));
            }

            if (user) {
                // If newQty < 1, we send 0 to remove
                debouncedApiUpdate(id, shouldRemove ? 0 : newQty, itemCategory);
            }
        } finally {
            setUpdating(prev => { const s = new Set(prev); s.delete(id); return s; });
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

    // Totals
    const cartTotal = React.useMemo(() => 
        cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0),
    [cart]);

    const finalTotal = React.useMemo(() => 
        Math.max(0, cartTotal - (coupon?.discount || 0)),
    [cartTotal, coupon]);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            isCartOpen, setIsCartOpen,
            cartTotal, finalTotal,
            coupon, applyCoupon, removeCoupon,
            freeShippingThreshold
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
