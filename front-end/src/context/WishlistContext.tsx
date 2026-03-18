import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

interface WishlistContextType {
    wishlist: CartItem[];
    addToWishlist: (item: CartItem) => void;
    removeFromWishlist: (id: string | number) => void;
    isInWishlist: (id: string | number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

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

    useEffect(() => {
        localStorage.setItem('handyland_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    useEffect(() => {
        const syncWishlist = async () => {
            if (user && user._id) {
                try {
                    const response: any = await api.get('/api/wishlist');
                    const data = response.data || response;
                    if (data && data.success && data.products) {
                        const mappedWishlist = data.products.map((p: any) => ({
                            id: p.customId || p.product,
                            title: p.name,
                            price: p.price,
                            image: p.image,
                            category: p.productType || 'Product',
                            quantity: 1
                        }));
                        setWishlist(mappedWishlist);
                    }
                } catch (error) {
                    console.error("Failed to fetch wishlist:", error);
                }
            }
        };

        if (user && user._id) {
            syncWishlist();
        } else {
            setWishlist([]);
        }
    }, [user?._id]);

    const addToWishlist = async (item: CartItem) => {
        setWishlist(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            return [...prev, item];
        });

        if (user) {
            try {
                await api.post('/api/wishlist', {
                    productId: item.id,
                    productType: item.category || 'Product'
                });
            } catch (error) {
                console.error("Failed to add to wishlist backend", error);
            }
        }
    };

    const removeFromWishlist = async (id: string | number) => {
        setWishlist(prev => prev.filter(item => item.id !== id));
        if (user) {
            try {
                await api.delete(`/api/wishlist/${id}`);
            } catch (error) {
                console.error("Failed to remove from wishlist backend", error);
            }
        }
    };

    const isInWishlist = (id: string | number) => {
        return wishlist.some(item => item.id === id);
    };

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
