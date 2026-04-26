import { useState, useEffect } from 'react';

export interface RecentlyViewedProduct {
    id: string;
    model: string;
    brand: string;
    price: number;
    imageUrl: string;
    condition: string;
}

const STORAGE_KEY = 'handyland_recently_viewed';
const MAX_ITEMS = 8;

export const useRecentlyViewed = () => {
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setRecentlyViewed(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recently viewed products', e);
            }
        }
    }, []);

    const addProduct = (product: RecentlyViewedProduct) => {
        setRecentlyViewed(prev => {
            // Remove if already exists to move it to the front
            const filtered = prev.filter(p => p.id !== product.id);
            const updated = [product, ...filtered].slice(0, MAX_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return { recentlyViewed, addProduct };
};
