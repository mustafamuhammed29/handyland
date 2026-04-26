import { useState, useEffect } from 'react';
import { ShoppingCart, User, Clock, Package, Mail, Trash2, Loader2, Euro, Activity, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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
    lastReminderSentAt?: string;
}

export const ActiveCarts = () => {
    const [carts, setCarts] = useState<UserCart[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState<string | null>(null);

    useEffect(() => {
        fetchCarts();
        const interval = setInterval(fetchCarts, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchCarts = async () => {
        try {
            const response = await api.get('/api/cart/all');
            const data = response.data || response;

            if (Array.isArray(data)) {
                setCarts(data);
            } else {
                setCarts([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch carts:', error);
            setCarts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async (cartId: string) => {
        if (!window.confirm("Are you sure you want to send a manual reminder email to this customer?")) return;
        
        setSendingReminder(cartId);
        try {
            const res = await api.post(`/api/cart/admin/${cartId}/remind`);
            toast.success(res.data?.message || 'Reminder sent successfully!');
            // Optimistically update the cart's lastReminderSentAt
            setCarts(prev => prev.map(c => c._id === cartId ? { ...c, lastReminderSentAt: new Date().toISOString() } : c));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send reminder');
        } finally {
            setSendingReminder(null);
        }
    };

    const handleClearCart = async (cartId: string) => {
        if (!window.confirm("Are you sure you want to FORCE CLEAR this cart? This action cannot be undone.")) return;
        
        setClearingCart(cartId);
        try {
            const res = await api.delete(`/api/cart/admin/${cartId}/clear`);
            toast.success(res.data?.message || 'Cart cleared successfully');
            setCarts(prev => prev.filter(c => c._id !== cartId));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to clear cart');
        } finally {
            setClearingCart(null);
        }
    };

    const getCartTotal = (cart: UserCart) => {
        return cart.items.reduce((total, item) => {
            const price = item.product?.price || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const getCartStatus = (updatedAt: string) => {
        const diffHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);
        if (diffHours < 2) return { label: 'Active Now', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
        if (diffHours > 72) return { label: 'Stale', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
        return { label: 'Abandoned', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
    };

    const totalRevenue = carts.reduce((sum, cart) => sum + getCartTotal(cart), 0);
    const totalItems = carts.reduce((sum, cart) => sum + cart.items.reduce((acc, item) => acc + item.quantity, 0), 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p>Loading active carts...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" /> Active Carts
                    </h1>
                    <p className="text-slate-400 mt-1">Monitor real-time customer shopping carts and recover abandoned ones.</p>
                </div>
            </div>

            {/* Analytics Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <ShoppingCart className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">Total Active Carts</div>
                        <div className="text-2xl font-bold text-white">{carts.length}</div>
                    </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Euro className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">Potential Revenue</div>
                        <div className="text-2xl font-bold text-white">€{totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">Total Items in Carts</div>
                        <div className="text-2xl font-bold text-white">{totalItems}</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {carts.map((cart) => {
                    const cartTotal = getCartTotal(cart);
                    const status = getCartStatus(cart.updatedAt);
                    
                    return (
                        <div key={cart._id} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
                            {/* Status Indicator */}
                            <div className="absolute top-0 right-0">
                                <div className={`px-3 py-1 rounded-bl-xl border-l border-b text-xs font-bold flex items-center gap-1.5 ${status.color}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                    {status.label}
                                </div>
                            </div>

                            <div className="flex justify-between items-start mb-6 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center shadow-inner">
                                        <User className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">
                                            {cart.user?.name ? (
                                                <Link to={`/users?search=${cart.user.email}`} className="hover:text-blue-400 transition-colors">
                                                    {cart.user.name}
                                                </Link>
                                            ) : 'Unknown User'}
                                        </div>
                                        <div className="text-sm text-slate-400">{cart.user?.email}</div>
                                    </div>
                                </div>
                                <div className="text-right mt-4 pr-32 md:pr-0">
                                    <div className="text-2xl font-black text-emerald-400 tracking-tight">
                                        €{cartTotal.toFixed(2)}
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-slate-400 text-xs mt-1">
                                        <Clock className="w-3 h-3" />
                                        Updated: {new Date(cart.updatedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                                {cart.items.map((item: any, idx: number) => {
                                    const itemPrice = item.product?.price || 0;
                                    return (
                                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-800 last:border-0">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                                                    {item.product?.image ? (
                                                        <img src={item.product.image} alt="Product" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-4 h-4 text-slate-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-slate-200 font-medium">
                                                        {item.product?.name || item.product || 'Unknown Item'}
                                                    </div>
                                                    <div className="text-slate-500 text-xs flex gap-2">
                                                        <span className="uppercase text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">{item.productType}</span>
                                                        {item.product?.subtitle && <span>{item.product.subtitle}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white font-medium">x{item.quantity}</div>
                                                <div className="text-slate-400 text-xs">€{(itemPrice * item.quantity).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    {cart.lastReminderSentAt ? (
                                        <span className="flex items-center gap-1 text-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Reminder sent: {new Date(cart.lastReminderSentAt).toLocaleString()}
                                        </span>
                                    ) : (
                                        "No manual reminder sent yet."
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleClearCart(cart._id)}
                                        disabled={clearingCart === cart._id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-500 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {clearingCart === cart._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        Clear Cart
                                    </button>
                                    <button
                                        onClick={() => handleSendReminder(cart._id)}
                                        disabled={sendingReminder === cart._id}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                                    >
                                        {sendingReminder === cart._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                        Send Reminder
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {carts.length === 0 && (
                    <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <ShoppingCart className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No Active Carts</h3>
                        <p className="text-sm">When customers add items to their cart, they will appear here in real-time.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
