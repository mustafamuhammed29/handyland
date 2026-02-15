import { useState, useEffect } from 'react';
import { ShoppingCart, User, Clock, Package, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    category: string;
}

interface UserCart {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    items: {
        product: any; // Dynamic ref
        productType: string;
        quantity: number;
    }[];
    itemsPopulated?: CartItem[];
    updatedAt: string;
}

export const ActiveCarts = () => {
    const [carts, setCarts] = useState<UserCart[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCarts();
    }, []);

    const fetchCarts = async () => {
        try {
            console.log('🛒 Fetching active carts...');
            // Use the configured API utility which handles Proxy, Auth, and Errors
            const response = await api.get('/api/cart/all');

            if (Array.isArray(response.data)) {
                setCarts(response.data);
                console.log(`✅ Loaded ${response.data.length} active carts`);
            } else {
                console.error('❌ Expected array of carts, got:', response.data);
                setCarts([]); // Safe fallback
            }
        } catch (error) {
            console.error('❌ Failed to fetch carts:', error);
            setCarts([]); // Safe fallback on error
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading active carts...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-blue-500" /> Active Carts
            </h1>

            <div className="grid gap-4">
                {carts.map((cart) => (
                    <div key={cart._id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">{cart.user?.name || 'Unknown User'}</div>
                                    <div className="text-sm text-slate-400">{cart.user?.email}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                                    <Clock className="w-3 h-3" />
                                    Last updated: {new Date(cart.updatedAt).toLocaleString()}
                                </div>
                                <div className="font-bold text-emerald-400">
                                    {cart.items.length} Items
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {cart.items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-slate-900/50 p-3 rounded-lg flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-slate-500" />
                                        <span className="text-slate-300">
                                            {item.product?.name || item.product || 'Item'}
                                            <span className="text-slate-500 ml-2 text-xs">({item.productType})</span>
                                        </span>
                                    </div>
                                    <div className="font-bold text-white">x{item.quantity}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {carts.length === 0 && (
                    <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No active carts found.
                    </div>
                )}
            </div>
        </div>
    );
};
