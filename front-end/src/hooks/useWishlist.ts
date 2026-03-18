import { useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';
import { CartItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface UseWishlistReturn {
  wishlist: string[];
  isInWishlist: (id: string | number) => boolean;
  toggleWishlist: (item: Partial<CartItem>) => Promise<void>;
  loadingId: string | null;
}

export const useWishlist = (): UseWishlistReturn => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api.get<any>('/api/wishlist').then((res: any) => {
       const items = res.data?.items || res.data?.products || res.products || res.items || [];
       setWishlist(items.map((p: any) => String(p.customId || p.product || p.id || p._id)));
    }).catch(console.error);
  }, [user]);

  const isInWishlist = useCallback(
    (id: string | number) => wishlist.includes(String(id)),
    [wishlist]
  );

  const toggleWishlist = useCallback(async (item: Partial<CartItem>) => {
    if (!user) return;
    const id = String(item.id);
    const isCurrentlyInWishlist = wishlist.includes(id);

    // Optimistic update
    const newWishlist = isCurrentlyInWishlist
      ? wishlist.filter((w) => w !== id)
      : [...wishlist, id];

    setWishlist(newWishlist);
    setLoadingId(id);

    try {
      if (isCurrentlyInWishlist) {
        // Assume ID matches the product id, though backend might use customId.
        // The prompt says use ID string for wishlist endpoints directly.
        await api.delete(`/api/wishlist/${id}`);
      } else {
        await api.post('/api/wishlist', {
          productId: id,
          productType: item.category === 'device' ? 'Product' : 'Accessory',
        });
      }
    } catch (error) {
      // Rollback on error
      setWishlist(wishlist);
      console.error('Wishlist toggle failed:', error);
    } finally {
      setLoadingId(null);
    }
  }, [wishlist, user]);

  return { wishlist, isInWishlist, toggleWishlist, loadingId };
};
